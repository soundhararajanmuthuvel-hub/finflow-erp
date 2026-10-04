import { Router } from 'express';
import { DemoController } from '../controllers/demoController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.post(
  '/reset',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]),
  DemoController.reset
);

export default router;
