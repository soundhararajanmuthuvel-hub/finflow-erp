import prisma from '../prisma/client.js';
import { NotificationType } from '../types/enums.js';

export class NotificationService {
  static async listNotifications(companyId: string) {
    return prisma.notification.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
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
    entityId?: string
  ) {
    return prisma.notification.create({
      data: {
        companyId,
        type,
        title,
        message,
        entityType,
        entityId,
      },
    });
  }
}
