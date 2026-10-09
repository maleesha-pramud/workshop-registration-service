import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma, withTransaction } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { AuditEntity, diff, recordAudit } from '../../lib/audit.js';
import { pageMeta } from '../../lib/validators.js';

// Never select passwordHash into API responses.
const publicFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsers({ q, role, isActive, page, pageSize }) {
  const where = {
    ...(role && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(q && { OR: [{ name: { contains: q } }, { email: { contains: q } }] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: publicFields,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, meta: pageMeta(page, pageSize, total) };
}

export async function createUser({ name, email, password, role }, actor) {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    return await withTransaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role },
        select: publicFields,
      });
      await recordAudit(tx, {
        actorId: actor.id,
        action: 'USER_CREATED',
        entityType: AuditEntity.USER,
        entityId: user.id,
        changes: { name, email, role },
      });
      return user;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('EMAIL_TAKEN', 'An account with this email already exists');
    }
    throw err;
  }
}

export async function updateUser(id, changes, actor) {
  return withTransaction(async (tx) => {
    // Lock all active admin rows: two admins demoting each other at the same
    // moment must not leave the centre with no admin at all.
    await tx.$queryRaw`SELECT id FROM users WHERE role = 'ADMIN' AND is_active = 1 FOR UPDATE`;

    const user = await tx.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    const losesAdmin =
      user.role === 'ADMIN' &&
      user.isActive &&
      ((changes.role && changes.role !== 'ADMIN') || changes.isActive === false);

    if (losesAdmin && user.id === actor.id) {
      throw new ConflictError(
        'CANNOT_MODIFY_SELF',
        'You cannot remove your own admin access or deactivate your own account',
      );
    }
    if (losesAdmin) {
      const otherAdmins = await tx.user.count({
        where: { role: 'ADMIN', isActive: true, id: { not: id } },
      });
      if (otherAdmins === 0) {
        throw new ConflictError('LAST_ADMIN', 'There must always be at least one active admin');
      }
    }

    const updated = await tx.user.update({ where: { id }, data: changes, select: publicFields });

    const changed = diff(user, changes, ['name', 'role', 'isActive']);
    if (Object.keys(changed).length) {
      let action = 'USER_UPDATED';
      if (changed.role) action = 'USER_ROLE_CHANGED';
      else if (changed.isActive) action = changes.isActive ? 'USER_REACTIVATED' : 'USER_DEACTIVATED';
      await recordAudit(tx, {
        actorId: actor.id,
        action,
        entityType: AuditEntity.USER,
        entityId: id,
        changes: changed,
      });
    }
    return updated;
  });
}

export async function resetPassword(id, password, actor) {
  const passwordHash = await bcrypt.hash(password, 10);
  return withTransaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundError('User');
    await tx.user.update({ where: { id }, data: { passwordHash } });
    await recordAudit(tx, {
      actorId: actor.id,
      action: 'USER_PASSWORD_RESET',
      entityType: AuditEntity.USER,
      entityId: id,
    });
  });
}
