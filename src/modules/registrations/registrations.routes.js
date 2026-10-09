import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../lib/validators.js';
import * as schemas from './registrations.schemas.js';
import * as controller from './registrations.controller.js';

/** Mounted at /workshops/:workshopId/registrations */
export const workshopRegistrationsRouter = Router({ mergeParams: true });

workshopRegistrationsRouter.use(authenticate);

workshopRegistrationsRouter.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ params: schemas.workshopIdParam, query: schemas.workshopRegistrationsQuery }),
  controller.listForWorkshop,
);
workshopRegistrationsRouter.post(
  '/',
  authorize('REGISTRATIONS_WRITE'),
  validate({ params: schemas.workshopIdParam, body: schemas.createRegistrationBody }),
  controller.register,
);

/** Mounted at /registrations */
export const registrationsRouter = Router();

registrationsRouter.use(authenticate);

registrationsRouter.get(
  '/',
  authorize('WORKSHOPS_READ'),
  validate({ query: schemas.searchRegistrationsQuery }),
  controller.search,
);
// Cancelling is a state change, not a deletion: the record stays for history.
registrationsRouter.post(
  '/:id/cancel',
  authorize('REGISTRATIONS_WRITE'),
  validate({ params: idParam, body: schemas.cancelRegistrationBody }),
  controller.cancel,
);
