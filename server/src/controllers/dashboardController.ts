import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { DashboardService } from '../services/dashboardService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DashboardController {
  static async getMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await DashboardService.getDashboardMetrics(companyId);
      sendSuccess(res, data, 'Dashboard metrics retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
