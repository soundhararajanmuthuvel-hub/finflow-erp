import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { DemoService } from '../services/demoService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class DemoController {
  static async reset(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const deal = await DemoService.resetDemoData(companyId, userId);
      sendSuccess(res, deal, 'Demo dataset reset successfully with relative dynamic dates', 200);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
