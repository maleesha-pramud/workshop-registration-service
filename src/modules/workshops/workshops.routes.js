import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './workshops.schemas.js';
import * as controller from './workshops.controller.js';

const router = Router();

router.use(authenticate);

// Reading: manager + staff. Writing: manager only (see config/permissions.js).
router.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ query: schemas.listWorkshopsQuery }),
  controller.list,
);
router.get('/:id', authorize('WORKSHOPS_READ'), validate({ params: idParam }), controller.get);
router.post(
  '/',
  authorize('WORKSHOPS_WRITE'),
  validate({ body: schemas.createWorkshopBody }),
  controller.create,
);
router.patch(
  '/:id',
  authorize('WORKSHOPS_WRITE'),
  validate({ params: idParam, body: schemas.updateWorkshopBody }),
  controller.update,
);

export default router;
