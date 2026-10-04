import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { InvestorService } from '../services/investorService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class InvestorController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const search = req.query.search as string | undefined;
      const investors = await InvestorService.listInvestors(companyId, search);
      sendSuccess(res, investors, 'Investors retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const investor = await InvestorService.getInvestorById(companyId, id);
      sendSuccess(res, investor, 'Investor details retrieved');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const investor = await InvestorService.createInvestor(companyId, req.body);
      sendSuccess(res, investor, 'Investor created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const investor = await InvestorService.updateInvestor(companyId, id, req.body);
      sendSuccess(res, investor, 'Investor updated successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await InvestorService.deleteInvestor(companyId, id);
      sendSuccess(res, { id }, 'Investor deleted successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
