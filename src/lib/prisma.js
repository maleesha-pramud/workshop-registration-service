import { PrismaClient, Prisma } from '@prisma/client';
import { ServiceBusyError } from './errors.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

const RETRYABLE_CODES = new Set([
  'P2034', // write conflict or deadlock
  'P2028', // transaction API error (e.g. could not start within maxWait)
]);

/**
 * Runs `fn` in an interactive transaction tuned for short, contended writes.
 *
 * - READ COMMITTED: after taking a row lock, plain reads see the latest
 *   committed data instead of a stale REPEATABLE READ snapshot.
 * - Generous maxWait/timeout so that a burst of requests queueing behind the same
 *   workshop lock (the Saturday-morning rush) waits its turn rather than erroring.
 * - Deadlocks and lock timeouts are retried a few times with jitter; after that the
 *   caller gets a clear 503 "try again" instead of a 500.
 */
export async function withTransaction(fn, { retries = 3 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 15_000,
      });
    } catch (err) {
      const retryable = err instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_CODES.has(err.code);
      if (!retryable) throw err;
      if (attempt > retries) throw new ServiceBusyError();
      await new Promise((r) => setTimeout(r, 20 * attempt + Math.random() * 50));
    }
  }
}
