import { z } from 'zod';
import { pagination } from '../../lib/validators.js';

export const WORKSHOP_STATUSES = ['OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED'];
const status = z.enum(WORKSHOP_STATUSES);

const dateTime = z.coerce.date({ invalid_type_error: 'Enter a valid date and time' });

const fields = {
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{1,31}$/, 'Use 2–32 letters, numbers or dashes (e.g. POT-101)'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(5000).nullable().optional(),
  instructor: z.string().trim().min(1, 'Instructor is required').max(120),
  locationId: z.coerce.number().int().positive('Choose a location'),
  startsAt: dateTime,
  endsAt: dateTime,
  capacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(1000, 'Capacity must be at most 1000'),
  status,
};

const endsAfterStarts = (w) => !w.startsAt || !w.endsAt || w.endsAt > w.startsAt;
const endsAfterStartsMsg = { message: 'End time must be after the start time', path: ['endsAt'] };

export const createWorkshopBody = z
  .object({ ...fields, status: status.default('OPEN') })
  .refine(endsAfterStarts, endsAfterStartsMsg)
  .refine((w) => w.startsAt > new Date(), {
    message: 'Start time must be in the future',
    path: ['startsAt'],
  });

export const updateWorkshopBody = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])))
  .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' })
  .refine(endsAfterStarts, endsAfterStartsMsg);

const csvOf = (values) =>
  z
    .string()
    .transform((s) => s.split(',').map((v) => v.trim().toUpperCase()).filter(Boolean))
    .pipe(z.array(z.enum(values)).min(1));

export const listWorkshopsQuery = z
  .object({
    q: z.string().trim().max(100).optional(),
    from: dateTime.optional(),
    to: dateTime.optional(),
    // Comma separated, e.g. status=OPEN,CLOSED
    status: csvOf(WORKSHOP_STATUSES).optional(),
    locationId: z.coerce.number().int().positive().optional(),
    // "Can I book someone onto this right now?": open, upcoming and not full.
    hasSeats: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    ...pagination,
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be before "to"',
    path: ['to'],
  });
