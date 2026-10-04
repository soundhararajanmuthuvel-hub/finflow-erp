import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', NotificationController.list);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
