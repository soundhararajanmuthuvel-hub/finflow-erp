import prisma from '../prisma/client.js';
import { NotificationType } from '../types/enums.js';
import { WebPushService } from './webPushService.js';

export class NotificationService {
  static async listNotifications(
    companyId: string,
    options: { page?: number; limit?: number; type?: string; isRead?: boolean } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { companyId };
    if (options.type) {
      where.type = options.type;
    }
    if (options.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { companyId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async markAsRead(companyId: string, id: string) {
    return prisma.notification.updateMany({
      where: { id, companyId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(companyId: string) {
    return prisma.notification.updateMany({
      where: { companyId, isRead: false },
      data: { isRead: true },
    });
  }

  static async createNotification(
    companyId: string,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
    targetUrl?: string
  ) {
    // 1. Create In-App Notification in database
    const notification = await prisma.notification.create({
      data: {
        companyId,
        type,
        title,
        message,
        entityType,
        entityId,
      },
    });

    // 2. Map notification type to user preference category
    let categoryKey: any = 'systemAlerts';
    let defaultUrl = '/';

    switch (type) {
      case NotificationType.REPAYMENT_DUE:
        categoryKey = 'repaymentsDue';
        defaultUrl = '/repayments';
        break;
      case NotificationType.REPAYMENT_OVERDUE:
        categoryKey = 'repaymentsOverdue';
        defaultUrl = '/repayments';
        break;
      case NotificationType.PAYMENT_RECEIVED:
        categoryKey = 'paymentReceived';
        defaultUrl = '/repayments';
        break;
      case NotificationType.INVESTOR_PAYMENT_DUE:
        categoryKey = 'investorReturns';
        defaultUrl = '/investors';
        break;
      case NotificationType.DEAL_APPROVAL_REQUIRED:
      case NotificationType.DEAL_APPROVED:
      case NotificationType.DEAL_COMPLETED:
        categoryKey = 'dealsCreated';
        defaultUrl = entityId ? `/deals/${entityId}` : '/deals';
        break;
      default:
        categoryKey = 'systemAlerts';
        defaultUrl = '/';
        break;
    }

    // 3. Dispatch Web Push notification to all subscribed devices of this company
    try {
      await WebPushService.broadcastPushToCompany(
        companyId,
        {
          title: `FinFlow: ${title}`,
          body: message,
          icon: '/brand/pwa-192x192.png',
          badge: '/brand/pwa-192x192.png',
          tag: `finflow-${type}-${entityId || notification.id}`,
          data: {
            url: targetUrl || defaultUrl,
            notificationId: notification.id,
            entityType,
            entityId,
            timestamp: notification.createdAt.toISOString(),
          },
        },
        categoryKey
      );
    } catch (pushErr) {
      console.error('[NotificationService] Push broadcast error:', pushErr);
    }

    return notification;
  }
}
