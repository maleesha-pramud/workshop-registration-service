import { prisma, withTransaction } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { AuditEntity, recordAudit } from '../../lib/audit.js';
import { pageMeta } from '../../lib/validators.js';
import { lockWorkshop } from '../workshops/workshops.lock.js';
import { fillFromWaitlist } from './waitlist.js';

const include = {
  registeredBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
};

function assertAcceptingRegistrations(workshop) {
  if (workshop.status !== 'OPEN') {
    throw new ConflictError(
      'WORKSHOP_NOT_OPEN',
      `This workshop is ${workshop.status.toLowerCase()} and is not taking registrations`,
    );
  }
  if (workshop.startsAt <= new Date()) {
    throw new ConflictError('WORKSHOP_STARTED', 'This workshop has already started');
  }
}

/**
 * Registers an attendee, never exceeding capacity even under concurrent requests.
 *
 * 1. Lock the workshop row (all bookings for this workshop now queue here).
 * 2. With the lock held, read the latest state and check the rules.
 * 3. Take the seat (increment the counter) and insert the registration.
 * 4. Commit, which releases the lock for the next request in the queue.
 *
 * The DB CHECK (active_count <= capacity) is the last line of defence: if this
 * logic were ever wrong, the increment would fail instead of overbooking.
 *
 * When the workshop is full and joinWaitlist is set, the attendee is queued
 * instead (WAITLISTED rows don't hold a seat).
 */
export async function register(workshopId, { attendeeName, attendeeEmail, joinWaitlist }, actor) {
  return withTransaction(async (tx) => {
    const workshop = await lockWorkshop(tx, workshopId);
    assertAcceptingRegistrations(workshop);

    const existing = await tx.registration.findFirst({
      where: { workshopId, attendeeEmail, status: { in: ['ACTIVE', 'WAITLISTED'] } },
    });
    if (existing) {
      throw new ConflictError(
        'ALREADY_REGISTERED',
        existing.status === 'ACTIVE'
          ? `${attendeeEmail} is already registered for this workshop`
          : `${attendeeEmail} is already on the waitlist for this workshop`,
      );
    }

    const isFull = workshop.activeCount >= workshop.capacity;
    if (isFull && !joinWaitlist) {
      throw new ConflictError('WORKSHOP_FULL', 'Sorry, this workshop is full', {
        capacity: workshop.capacity,
        waitlistAvailable: true,
      });
    }

    if (!isFull) {
      await tx.workshop.update({
        where: { id: workshopId },
        data: { activeCount: { increment: 1 } },
      });
    }
    const registration = await tx.registration.create({
      data: {
        workshopId,
        attendeeName,
        attendeeEmail,
        status: isFull ? 'WAITLISTED' : 'ACTIVE',
        registeredById: actor.id,
      },
      include,
    });

    await recordAudit(tx, {
      actorId: actor.id,
      action: isFull ? 'REGISTRATION_WAITLISTED' : 'REGISTRATION_CREATED',
      entityType: AuditEntity.REGISTRATION,
      entityId: registration.id,
      changes: { workshopId, attendeeName, attendeeEmail, status: registration.status },
    });
    return registration;
  });
}

/**
 * Cancels a registration and frees its seat. The record is kept forever, with who
 * cancelled it and when. A freed seat goes straight to the next person on the
 * waitlist, within the same locked transaction, so nobody can jump the queue.
 */
export async function cancel(registrationId, { reason }, actor) {
  return withTransaction(async (tx) => {
    const found = await tx.registration.findUnique({
      where: { id: registrationId },
      select: { workshopId: true },
    });
    if (!found) throw new NotFoundError('Registration');

    const workshop = await lockWorkshop(tx, found.workshopId);
    if (workshop.status === 'COMPLETED') {
      throw new ConflictError('WORKSHOP_COMPLETED', 'This workshop has already taken place');
    }

    // Re-read under the lock: a colleague may have cancelled it a moment ago.
    const registration = await tx.registration.findUnique({ where: { id: registrationId } });
    if (registration.status === 'CANCELLED') {
      throw new ConflictError('ALREADY_CANCELLED', 'This registration was already cancelled');
    }

    const cancelled = await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: 'CANCELLED',
        cancelledById: actor.id,
        cancelledAt: new Date(),
        cancelReason: reason || null,
      },
      include,
    });

    if (registration.status === 'ACTIVE') {
      await tx.workshop.update({
        where: { id: workshop.id },
        data: { activeCount: { decrement: 1 } },
      });
    }

    await recordAudit(tx, {
      actorId: actor.id,
      action: 'REGISTRATION_CANCELLED',
      entityType: AuditEntity.REGISTRATION,
      entityId: registrationId,
      changes: { status: { from: registration.status, to: 'CANCELLED' }, reason: reason || null },
    });

    const promoted =
      registration.status === 'ACTIVE' ? await fillFromWaitlist(tx, workshop.id, actor) : [];

    return { registration: cancelled, promoted };
  });
}

/** Full history for one workshop, including cancellations. */
export async function listForWorkshop(workshopId, { status }) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { id: true },
  });
  if (!workshop) throw new NotFoundError('Workshop');

  const registrations = await prisma.registration.findMany({
    where: { workshopId, ...(status && { status }) },
    include,
    orderBy: [{ registeredAt: 'asc' }, { id: 'asc' }],
  });

  // Rows are ordered by registeredAt, which is exactly the waitlist order.
  let position = 0;
  return registrations.map((r) =>
    r.status === 'WAITLISTED' ? { ...r, waitlistPosition: ++position } : r,
  );
}

/** Search across all workshops, e.g. everything one attendee has booked or cancelled. */
export async function search({ q, status, page, pageSize }) {
  const where = {
    ...(status && { status }),
    ...(q && { OR: [{ attendeeEmail: { contains: q } }, { attendeeName: { contains: q } }] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.registration.findMany({
      where,
      include: {
        ...include,
        workshop: { select: { id: true, code: true, title: true, startsAt: true, status: true } },
      },
      orderBy: [{ registeredAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.registration.count({ where }),
  ]);
  return { items, meta: pageMeta(page, pageSize, total) };
}
