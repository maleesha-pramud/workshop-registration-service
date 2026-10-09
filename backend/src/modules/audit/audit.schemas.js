import { z } from 'zod';
import { AuditEntity } from '../../lib/audit.js';
import { pagination } from '../../lib/validators.js';

export const listAuditLogsQuery = z.object({
  entityType: z.enum(Object.values(AuditEntity)).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  ...pagination,
});
