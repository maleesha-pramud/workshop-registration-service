import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { prisma } from '../../lib/prisma.js';
import { AuditEntity } from '../../lib/audit.js';
import { ForbiddenError } from '../../lib/errors.js';
import { pageMeta, pagination } from '../../lib/validators.js';

// Each role sees the history of what it is responsible for.
const VISIBLE_ENTITIES = {
  ADMIN: [AuditEntity.USER],
  MANAGER: [AuditEntity.WORKSHOP, AuditEntity.REGISTRATION],
};

const query = z.object({
  entityType: z.enum(Object.values(AuditEntity)).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  ...pagination,
});

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('AUDIT_READ'),
  validate({ query }),
  async (req, res) => {
    const { entityType, entityId, page, pageSize } = req.validatedQuery;
    const visible = VISIBLE_ENTITIES[req.user.role] ?? [];
    if (entityType && !visible.includes(entityType)) throw new ForbiddenError();

    const where = {
      entityType: entityType ?? { in: visible },
      ...(entityId && { entityId }),
    };
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ data: await withEntityLabels(items), meta: pageMeta(page, pageSize, total) });
  },
);

/** Adds a human-readable `entityLabel` ("Jane Doe · POT-101") so the UI never shows bare ids. */
async function withEntityLabels(items) {
  const idsOf = (type) => [...new Set(items.filter((i) => i.entityType === type).map((i) => i.entityId))];

  const [users, workshops, registrations] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: idsOf(AuditEntity.USER) } }, select: { id: true, name: true } }),
    prisma.workshop.findMany({ where: { id: { in: idsOf(AuditEntity.WORKSHOP) } }, select: { id: true, code: true, title: true } }),
    prisma.registration.findMany({
      where: { id: { in: idsOf(AuditEntity.REGISTRATION) } },
      select: { id: true, attendeeName: true, workshop: { select: { code: true } } },
    }),
  ]);

  const labels = {
    [AuditEntity.USER]: new Map(users.map((u) => [u.id, u.name])),
    [AuditEntity.WORKSHOP]: new Map(workshops.map((w) => [w.id, `${w.code} · ${w.title}`])),
    [AuditEntity.REGISTRATION]: new Map(
      registrations.map((r) => [r.id, `${r.attendeeName} · ${r.workshop.code}`]),
    ),
  };

  return items.map((i) => ({
    ...i,
    entityLabel: labels[i.entityType]?.get(i.entityId) ?? `#${i.entityId}`,
  }));
}

export default router;
