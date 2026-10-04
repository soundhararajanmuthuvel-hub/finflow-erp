import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const notifications = await NotificationService.listNotifications(companyId);
      sendSuccess(res, notifications, 'Notifications retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

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

  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      await NotificationService.markAllAsRead(companyId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
