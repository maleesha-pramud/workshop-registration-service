import { z } from 'zod';
import { email } from '../../lib/validators.js';

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});
