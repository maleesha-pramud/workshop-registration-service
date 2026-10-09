import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/', authenticate, authorize('LOCATIONS_READ'), async (req, res) => {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
  res.json({ data: locations });
});

export default router;
