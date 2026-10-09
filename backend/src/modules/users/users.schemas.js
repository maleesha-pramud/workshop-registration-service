import { z } from 'zod';
import { email, pagination, password, personName } from '../../lib/validators.js';

const role = z.enum(['ADMIN', 'MANAGER', 'STAFF']);

export const listUsersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  role: role.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  ...pagination,
});

export const createUserBody = z.object({
  name: personName,
  email,
  password,
  role,
});

export const updateUserBody = z
  .object({
    name: personName.optional(),
    role: role.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' });

export const resetPasswordBody = z.object({ password });
