import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { permissionsFor } from '../../config/permissions.js';
import { prisma } from '../../lib/prisma.js';
import { UnauthorizedError } from '../../lib/errors.js';

// Compared against when the email doesn't exist, so a wrong email and a wrong
// password take the same time and can't be told apart (no account enumeration).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export function toSessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: permissionsFor(user.role),
  };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.isActive) {
    throw new UnauthorizedError('Incorrect email or password', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ sub: String(user.id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user: toSessionUser(user) };
}
