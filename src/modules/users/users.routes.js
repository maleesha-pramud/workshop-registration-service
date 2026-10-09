import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './users.schemas.js';
import * as usersService from './users.service.js';

const router = Router();

router.use(authenticate, authorize('USERS_MANAGE'));

router.get('/', validate({ query: schemas.listUsersQuery }), async (req, res) => {
  const { items, meta } = await usersService.listUsers(req.validatedQuery);
  res.json({ data: items, meta });
});

router.post('/', validate({ body: schemas.createUserBody }), async (req, res) => {
  res.status(201).json({ data: await usersService.createUser(req.body, req.user) });
});

router.patch(
  '/:id',
  validate({ params: idParam, body: schemas.updateUserBody }),
  async (req, res) => {
    res.json({ data: await usersService.updateUser(req.params.id, req.body, req.user) });
  },
);

router.post(
  '/:id/reset-password',
  validate({ params: idParam, body: schemas.resetPasswordBody }),
  async (req, res) => {
    await usersService.resetPassword(req.params.id, req.body.password, req.user);
    res.status(204).end();
  },
);

export default router;
