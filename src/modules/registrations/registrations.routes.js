import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './registrations.schemas.js';
import * as registrationsService from './registrations.service.js';

// Mounted at /workshops/:workshopId/registrations
export const workshopRegistrationsRouter = Router({ mergeParams: true });

workshopRegistrationsRouter.use(authenticate);

workshopRegistrationsRouter.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ params: schemas.workshopIdParam, query: schemas.workshopRegistrationsQuery }),
  async (req, res) => {
    const items = await registrationsService.listForWorkshop(
      req.params.workshopId,
      req.validatedQuery,
    );
    res.json({ data: items });
  },
);

workshopRegistrationsRouter.post(
  '/',
  authorize('REGISTRATIONS_WRITE'),
  validate({ params: schemas.workshopIdParam, body: schemas.createRegistrationBody }),
  async (req, res) => {
    const registration = await registrationsService.register(
      req.params.workshopId,
      req.body,
      req.user,
    );
    res.status(201).json({ data: registration });
  },
);

// Mounted at /registrations
export const registrationsRouter = Router();

registrationsRouter.use(authenticate);

registrationsRouter.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ query: schemas.searchRegistrationsQuery }),
  async (req, res) => {
    const { items, meta } = await registrationsService.search(req.validatedQuery);
    res.json({ data: items, meta });
  },
);

// Cancelling is a state change, not a deletion: the record stays for history.
registrationsRouter.post(
  '/:id/cancel',
  authorize('REGISTRATIONS_WRITE'),
  validate({ params: idParam, body: schemas.cancelRegistrationBody }),
  async (req, res) => {
    res.json({ data: await registrationsService.cancel(req.params.id, req.body, req.user) });
  },
);
