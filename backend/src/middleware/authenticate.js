import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { UnauthorizedError } from '../lib/errors.js';

/**
 * Verifies the bearer token, then reloads the user from the database.
 *
 * Trusting the role inside the token would mean a demoted or deactivated user
 * keeps their old powers until the token expires. One primary-key lookup per
 * request is a cheap price for changes taking effect immediately.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new UnauthorizedError('Your session has expired. Please sign in again.', 'TOKEN_INVALID');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Your account is no longer active.', 'ACCOUNT_DISABLED');
  }

  req.user = user;
  next();
}
