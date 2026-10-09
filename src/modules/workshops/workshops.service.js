import { Prisma } from '@prisma/client';
import { prisma, withTransaction } from '../../lib/prisma.js';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { AuditEntity, diff, recordAudit } from '../../lib/audit.js';
import { pageMeta } from '../../lib/validators.js';
import { lockWorkshop } from './workshops.lock.js';
import { fillFromWaitlist } from '../registrations/waitlist.js';

const include = {
  location: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  _count: { select: { registrations: { where: { status: 'WAITLISTED' } } } },
};

const EDITABLE_FIELDS = [
  'code',
  'title',
  'description',
  'instructor',
  'locationId',
  'startsAt',
  'endsAt',
  'capacity',
  'status',
];

/** Adds the derived fields the UI needs, so it never has to recompute business rules. */
export function toWorkshopDto({ _count, ...w }) {
  const seatsLeft = Math.max(0, w.capacity - w.activeCount);
  return {
    ...w,
    waitlistCount: _count?.registrations ?? 0,
    seatsLeft,
    isFull: seatsLeft === 0,
    isBookable: w.status === 'OPEN' && seatsLeft > 0 && new Date(w.startsAt) > new Date(),
  };
}

export async function listWorkshops({ q, from, to, status, locationId, hasSeats, page, pageSize }) {
  const and = [];
  if (q) {
    and.push({
      OR: [{ code: { contains: q } }, { title: { contains: q } }, { instructor: { contains: q } }],
    });
  }
  if (from || to) and.push({ startsAt: { ...(from && { gte: from }), ...(to && { lte: to }) } });
  if (status) and.push({ status: { in: status } });
  if (locationId) and.push({ locationId });
  if (hasSeats === true) {
    // Column-to-column comparison on the denormalised counter: no COUNT(*) per row.
    and.push({
      status: 'OPEN',
      startsAt: { gt: new Date() },
      activeCount: { lt: prisma.workshop.fields.capacity },
    });
  } else if (hasSeats === false) {
    and.push({ activeCount: { gte: prisma.workshop.fields.capacity } });
  }

  const where = { AND: and };
  const [items, total] = await prisma.$transaction([
    prisma.workshop.findMany({
      where,
      include,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.workshop.count({ where }),
  ]);
  return { items: items.map(toWorkshopDto), meta: pageMeta(page, pageSize, total) };
}

export async function getWorkshop(id) {
  const workshop = await prisma.workshop.findUnique({ where: { id }, include });
  if (!workshop) throw new NotFoundError('Workshop');
  return toWorkshopDto(workshop);
}

async function assertLocationExists(tx, locationId) {
  const location = await tx.location.findUnique({ where: { id: locationId } });
  if (!location) {
    throw new ValidationError('Some fields are invalid', [
      { field: 'body.locationId', message: 'Location does not exist' },
    ]);
  }
}

function rethrowDuplicateCode(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new ConflictError('CODE_TAKEN', 'Another workshop already uses this code');
  }
  throw err;
}

export async function createWorkshop(data, actor) {
  try {
    return await withTransaction(async (tx) => {
      await assertLocationExists(tx, data.locationId);
      const created = await tx.workshop.create({
        data: { ...data, createdById: actor.id },
        include,
      });
      await recordAudit(tx, {
        actorId: actor.id,
        action: 'WORKSHOP_CREATED',
        entityType: AuditEntity.WORKSHOP,
        entityId: created.id,
        changes: Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, created[f] ?? null])),
      });
      return toWorkshopDto(created);
    });
  } catch (err) {
    rethrowDuplicateCode(err);
  }
}

export async function updateWorkshop(id, changes, actor) {
  try {
    return await withTransaction(async (tx) => {
      // Lock: a capacity cut must not interleave with a registration taking a seat.
      const current = await lockWorkshop(tx, id);

      if (changes.locationId) await assertLocationExists(tx, changes.locationId);

      const startsAt = changes.startsAt ?? current.startsAt;
      const endsAt = changes.endsAt ?? current.endsAt;
      if (endsAt <= startsAt) {
        throw new ValidationError('Some fields are invalid', [
          { field: 'body.endsAt', message: 'End time must be after the start time' },
        ]);
      }

      if (changes.capacity !== undefined && changes.capacity < current.activeCount) {
        throw new ConflictError(
          'CAPACITY_BELOW_REGISTRATIONS',
          `Capacity can't be lower than the ${current.activeCount} people already registered. Cancel registrations first.`,
          { activeCount: current.activeCount },
        );
      }

      let updated = await tx.workshop.update({
        where: { id },
        data: { ...changes, updatedById: actor.id },
        include,
      });

      const changed = diff(current, changes, EDITABLE_FIELDS);
      if (Object.keys(changed).length) {
        await recordAudit(tx, {
          actorId: actor.id,
          action: changed.status ? `WORKSHOP_${changes.status}` : 'WORKSHOP_UPDATED',
          entityType: AuditEntity.WORKSHOP,
          entityId: id,
          changes: changed,
        });
      }

      // More seats, or reopened: hand any free seats to the waitlist, in order.
      if (changed.capacity || changed.status) {
        const promoted = await fillFromWaitlist(tx, id, actor);
        if (promoted.length) updated = await tx.workshop.findUnique({ where: { id }, include });
      }

      return toWorkshopDto(updated);
    });
  } catch (err) {
    rethrowDuplicateCode(err);
  }
}
