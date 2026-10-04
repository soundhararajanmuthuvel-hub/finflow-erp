import { Router } from 'express';
import { PartnerController } from '../controllers/partnerController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { PartnerSchema } from '../validators/index.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', PartnerController.list);
router.get('/:id', PartnerController.getById);
router.post('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), validateRequest(PartnerSchema), PartnerController.create);
router.patch('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), PartnerController.update);
router.delete('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), PartnerController.delete);

export default router;
