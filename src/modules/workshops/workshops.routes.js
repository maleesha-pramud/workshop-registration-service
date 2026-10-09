import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './workshops.schemas.js';
import * as workshopsService from './workshops.service.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ query: schemas.listWorkshopsQuery }),
  async (req, res) => {
    const { items, meta } = await workshopsService.listWorkshops(req.validatedQuery);
    res.json({ data: items, meta });
  },
);

router.get('/:id', authorize('WORKSHOPS_READ'), validate({ params: idParam }), async (req, res) => {
  res.json({ data: await workshopsService.getWorkshop(req.params.id) });
});

router.post(
  '/',
  authorize('WORKSHOPS_WRITE'),
  validate({ body: schemas.createWorkshopBody }),
  async (req, res) => {
    res.status(201).json({ data: await workshopsService.createWorkshop(req.body, req.user) });
  },
);

router.patch(
  '/:id',
  authorize('WORKSHOPS_WRITE'),
  validate({ params: idParam, body: schemas.updateWorkshopBody }),
  async (req, res) => {
    res.json({
      data: await workshopsService.updateWorkshop(req.params.id, req.body, req.user),
    });
  },
);

export default router;
