import { z } from 'zod';
import { email, pagination, personName } from '../../lib/validators.js';

export const workshopIdParam = z.object({ workshopId: z.coerce.number().int().positive() });

export const createRegistrationBody = z.object({
  attendeeName: personName,
  attendeeEmail: email,
  // If the workshop is full, queue the attendee instead of refusing.
  joinWaitlist: z.boolean().default(false),
});

export const cancelRegistrationBody = z.object({
  reason: z.string().trim().max(255).optional(),
});

export const workshopRegistrationsQuery = z.object({
  status: z.enum(['ACTIVE', 'WAITLISTED', 'CANCELLED']).optional(),
});

export const searchRegistrationsQuery = z.object({
  // Matches attendee name or email: "has this person booked anything with us?"
  q: z.string().trim().min(2, 'Type at least 2 characters').max(100).optional(),
  status: z.enum(['ACTIVE', 'WAITLISTED', 'CANCELLED']).optional(),
  ...pagination,
});
