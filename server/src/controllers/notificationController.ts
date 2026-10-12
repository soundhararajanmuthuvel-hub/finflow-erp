import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';
import { WebPushService } from '../services/webPushService.js';
import { SchedulerService } from '../services/schedulerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationController {
  /**
   * Return public VAPID key for browser service worker registration
   */
  static async getVapidPublicKey(_req: AuthenticatedRequest, res: Response) {
    try {
      const publicKey = WebPushService.getPublicKey();
      sendSuccess(res, { publicKey }, 'VAPID public key retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Register a browser push subscription for authenticated user & company
   */
  static async subscribe(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { endpoint, keys, userAgent, deviceType } = req.body;

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        sendError(res, 'Invalid subscription payload: endpoint and keys (p256dh, auth) are required', 400);
        return;
      }

      const subscription = WebPushService.registerSubscription(companyId, userId, {
        endpoint,
        keys,
        userAgent: userAgent || req.headers['user-agent'],
        deviceType,
      });

      sendSuccess(res, subscription, 'Web push subscription registered successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Unsubscribe a device
   */
  static async unsubscribe(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { endpoint } = req.body;

      if (!endpoint) {
        sendError(res, 'Endpoint parameter is required', 400);
        return;
      }

      const removed = WebPushService.removeSubscription(companyId, userId, endpoint);
      sendSuccess(res, { removed }, 'Web push subscription removed');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Get user's notification preferences
   */
  static async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const preferences = WebPushService.getUserPreferences(companyId, userId);
      const subscriptions = WebPushService.getSubscriptionsForUser(companyId, userId);

      sendSuccess(
        res,
        {
          preferences,
          subscriptionsCount: subscriptions.length,
          devices: subscriptions.map((s) => ({
            id: s.id,
            deviceType: s.deviceType,
            userAgent: s.userAgent,
            createdAt: s.createdAt,
            endpointSnippet: s.endpoint.slice(0, 35) + '...',
          })),
        },
        'Notification preferences retrieved'
      );
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const updated = WebPushService.updateUserPreferences(companyId, userId, req.body);
      sendSuccess(res, updated, 'Notification preferences updated');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Send an authorized test push notification to this user's devices
   */
  static async sendTest(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const result = await WebPushService.sendTestPush(companyId, userId);
      if (!result.success && result.subscriptionsCount === 0) {
        sendError(
          res,
          'No active web push subscriptions found for this device. Please enable notifications first.',
          404
        );
        return;
      }

      // Also create an in-app test notification
      await NotificationService.createNotification(
        companyId,
        'SYSTEM_ALERT' as any,
        'Test Notification Verified',
        'Your browser and device are connected to FinFlow real-time alerts.',
        'SYSTEM',
        userId,
        '/settings'
      );

      sendSuccess(res, result, 'Test notification dispatched successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * List in-app notifications
   */
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { page, limit, type, isRead } = req.query;

      const result = await NotificationService.listNotifications(companyId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        type: type as string,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
      });

      sendSuccess(res, result, 'Notifications retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await NotificationService.markAsRead(companyId, id);
      sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      await NotificationService.markAllAsRead(companyId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  /**
   * Admin-only: trigger scheduled reminder scan manually
   */
  static async runRemindersScan(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const log = await SchedulerService.runDailyFinancialReminderScan(companyId, 'MANUAL_TRIGGER');
      sendSuccess(res, log, 'Financial reminders scan completed');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
