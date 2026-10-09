import { AuditEntity, recordAudit } from '../../lib/audit.js';

/**
 * Moves the longest-waiting WAITLISTED attendees into free seats (first come,
 * first served) until the workshop is full or the waitlist is empty.
 *
 * Must run inside the transaction that already holds the workshop lock
 * (see lockWorkshop), so seat counts can't change underneath it.
 * Called after a cancellation frees a seat and after a capacity increase.
 *
 * Returns the promoted registrations so the UI can prompt staff to contact them:
 * attendees have no accounts, so a person has to let them know.
 */
export async function fillFromWaitlist(tx, workshopId, actor) {
  const workshop = await tx.workshop.findUnique({ where: { id: workshopId } });
  const freeSeats = workshop.capacity - workshop.activeCount;
  const accepting = workshop.status === 'OPEN' && workshop.startsAt > new Date();
  if (freeSeats <= 0 || !accepting) return [];

  const next = await tx.registration.findMany({
    where: { workshopId, status: 'WAITLISTED' },
    orderBy: [{ registeredAt: 'asc' }, { id: 'asc' }],
    take: freeSeats,
  });
  if (next.length === 0) return [];

  const now = new Date();
  await tx.registration.updateMany({
    where: { id: { in: next.map((r) => r.id) } },
    data: { status: 'ACTIVE', promotedAt: now },
  });
  await tx.workshop.update({
    where: { id: workshopId },
    data: { activeCount: { increment: next.length } },
  });

  for (const r of next) {
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'REGISTRATION_PROMOTED',
      entityType: AuditEntity.REGISTRATION,
      entityId: r.id,
      changes: { workshopId, status: { from: 'WAITLISTED', to: 'ACTIVE' } },
    });
  }

  return next.map((r) => ({ ...r, status: 'ACTIVE', promotedAt: now }));
}
