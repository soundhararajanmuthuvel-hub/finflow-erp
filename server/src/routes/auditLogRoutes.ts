import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), AuditLogController.list);

export default router;
