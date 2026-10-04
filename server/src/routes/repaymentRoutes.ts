import { Router } from 'express';
import { RepaymentController } from '../controllers/repaymentController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { RecordRepaymentSchema } from '../validators/index.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.post(
  '/preview',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER, Role.STAFF]),
  RepaymentController.preview
);
router.post(
  '/',
  requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER, Role.STAFF]),
  validateRequest(RecordRepaymentSchema),
  RepaymentController.recordRepayment
);
router.delete('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), RepaymentController.delete);

export default router;
