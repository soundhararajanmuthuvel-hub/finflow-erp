import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ReportService } from '../services/reportService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ReportController {
  static async getClientFinanceReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await ReportService.getClientFinanceReport(companyId);
      sendSuccess(res, data, 'Client finance report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getInvestorReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await ReportService.getInvestorReport(companyId);
      sendSuccess(res, data, 'Investor investment and return report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getPartnerReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await ReportService.getPartnerReport(companyId);
      sendSuccess(res, data, 'Partner capital report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getCompanyProfitReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await ReportService.getCompanyProfitReport(companyId);
      sendSuccess(res, data, 'Company profit report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getCollectionReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { startDate, endDate } = req.query;
      const data = await ReportService.getCollectionReport(companyId, startDate as string, endDate as string);
      sendSuccess(res, data, 'Repayments collection report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getOverdueReport(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const data = await ReportService.getOverdueReport(companyId);
      sendSuccess(res, data, 'Overdue report retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
