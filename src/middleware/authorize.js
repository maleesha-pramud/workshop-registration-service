import { can } from '../config/permissions.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

/** Allows the request through only if the signed-in user's role grants `permission`. */
export const authorize = (permission) => (req, res, next) => {
  if (!req.user) throw new UnauthorizedError();
  if (!can(req.user.role, permission)) throw new ForbiddenError();
  next();
};
