import { Router } from 'express';
import { DealController } from '../controllers/dealController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { CreateDealSchema } from '../validators/index.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', DealController.list);
router.get('/:id', DealController.getById);
router.post('/preview-schedule', DealController.previewSchedule);
router.post('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER, Role.STAFF]), validateRequest(CreateDealSchema), DealController.create);
router.post('/:id/approve', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), DealController.approve);
router.post('/:id/activate', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), DealController.activate);
router.patch('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), DealController.update);
router.delete('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), DealController.delete);
router.post('/:id/funding', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), DealController.addFunding);
router.delete('/:id/funding/:fundingId', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), DealController.deleteFunding);

export default router;
