import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import prisma from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuditLogController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { entity, entityId } = req.query;
      const where: any = { companyId };

      if (entity) where.entity = entity as string;
      if (entityId) where.entityId = entityId as string;

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      sendSuccess(res, logs, 'Audit logs retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
