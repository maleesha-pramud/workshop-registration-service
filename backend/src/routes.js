import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import userRoutes from './modules/users/users.routes.js';
import locationRoutes from './modules/locations/locations.routes.js';
import workshopRoutes from './modules/workshops/workshops.routes.js';
import {
  registrationsRouter,
  workshopRegistrationsRouter,
} from './modules/registrations/registrations.routes.js';

/**
 * Route map for /api. Each module under src/modules follows the same layout:
 *   <name>.routes.js      URL -> middleware (authenticate, authorize, validate) -> controller
 *   <name>.controller.js  HTTP in/out only
 *   <name>.service.js     business rules and database transactions
 *   <name>.schemas.js     zod request validation
 */
export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/locations', locationRoutes);
// Mounted before /workshops so the nested path is matched first.
apiRouter.use('/workshops/:workshopId/registrations', workshopRegistrationsRouter);
apiRouter.use('/workshops', workshopRoutes);
apiRouter.use('/registrations', registrationsRouter);
apiRouter.use('/audit-logs', auditRoutes);
