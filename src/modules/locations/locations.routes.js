import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './locations.controller.js';

const router = Router();

router.get('/', authenticate, authorize('LOCATIONS_READ'), controller.list);

export default router;
