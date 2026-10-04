import { Router } from 'express';
import { CompanyController } from '../controllers/companyController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', CompanyController.getProfile);
router.patch('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), CompanyController.updateProfile);

export default router;
