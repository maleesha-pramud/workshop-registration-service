import { NotFoundError } from '../../lib/errors.js';

/**
 * Takes an exclusive row lock on a workshop for the rest of the transaction and
 * returns its current state.
 *
 * This is the heart of the capacity guarantee. Every operation that changes how
 * many seats a workshop has (or how many are taken) calls this first, so those
 * operations run one at a time *per workshop*. Two desks booking the last seat
 * at the same moment queue here; the second one sees the seat already gone.
 * Operations on different workshops lock different rows and never wait on each other.
 *
 * Must be called inside withTransaction() (READ COMMITTED), so the read after
 * the lock returns the latest committed data.
 */
export async function lockWorkshop(tx, workshopId) {
  const locked = await tx.$queryRaw`SELECT id FROM workshops WHERE id = ${workshopId} FOR UPDATE`;
  if (locked.length === 0) throw new NotFoundError('Workshop');
  return tx.workshop.findUnique({ where: { id: workshopId } });
}
