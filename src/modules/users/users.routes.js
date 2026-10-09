import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './users.schemas.js';
import * as controller from './users.controller.js';

const router = Router();

// Every route here is admin-only.
router.use(authenticate, authorize('USERS_MANAGE'));

router.get('/', validate({ query: schemas.listUsersQuery }), controller.list);
router.post('/', validate({ body: schemas.createUserBody }), controller.create);
router.patch('/:id', validate({ params: idParam, body: schemas.updateUserBody }), controller.update);
router.post(
  '/:id/reset-password',
  validate({ params: idParam, body: schemas.resetPasswordBody }),
  controller.resetPassword,
);

export default router;
