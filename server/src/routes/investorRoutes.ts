import { Router } from 'express';
import { InvestorController } from '../controllers/investorController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { InvestorSchema } from '../validators/index.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', InvestorController.list);
router.get('/:id', InvestorController.getById);
router.post('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), validateRequest(InvestorSchema), InvestorController.create);
router.patch('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), InvestorController.update);
router.delete('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), InvestorController.delete);

export default router;
