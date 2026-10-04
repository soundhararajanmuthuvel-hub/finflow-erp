import { Router } from 'express';
import { ClientController } from '../controllers/clientController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { ClientSchema } from '../validators/index.js';
import { Role } from '../types/enums.js';

const router = Router();
router.use(authenticate);

router.get('/', ClientController.list);
router.get('/:id', ClientController.getById);
router.post('/', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER, Role.STAFF]), validateRequest(ClientSchema), ClientController.create);
router.patch('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE_MANAGER]), ClientController.update);
router.delete('/:id', requireRoles([Role.SUPER_ADMIN, Role.ADMIN]), ClientController.delete);

export default router;
