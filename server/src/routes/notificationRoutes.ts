import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// VAPID & Web Push Subscriptions
router.get('/vapid-public-key', NotificationController.getVapidPublicKey);
router.post('/subscribe', NotificationController.subscribe);
router.post('/unsubscribe', NotificationController.unsubscribe);

// User Notification Preferences
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Test & Reminders
router.post('/test', NotificationController.sendTest);
router.post('/run-reminders', NotificationController.runRemindersScan);

// In-App Notifications List & Read States
router.get('/', NotificationController.list);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;
