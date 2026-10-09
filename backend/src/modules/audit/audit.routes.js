import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { listAuditLogsQuery } from './audit.schemas.js';
import * as controller from './audit.controller.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('AUDIT_READ'),
  validate({ query: listAuditLogsQuery }),
  controller.list,
);

export default router;
