import { z } from 'zod';

// Shared building blocks for request schemas.

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(191);

export const personName = z.string().trim().min(1, 'Name is required').max(120);

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters'); // bcrypt limit

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export function pageMeta(page, pageSize, total) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
