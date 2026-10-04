import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { DealService } from '../services/dealService.js';
import { CalculationEngine } from '../services/calculationEngine.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { DealStatus, InterestType, RepaymentFrequency } from '../types/enums.js';

export class DealController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const status = req.query.status as DealStatus | undefined;
      const search = req.query.search as string | undefined;
      const deals = await DealService.listDeals(companyId, status, search);
      sendSuccess(res, deals, 'Deals retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const deal = await DealService.getDealById(companyId, id);
      sendSuccess(res, deal, 'Deal retrieved');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  static async previewSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { financeAmount, interestRate, interestType, frequency, numberOfRepayments, startDate } = req.body;
      const schedule = CalculationEngine.generateSchedule({
        financeAmount,
        interestRate,
        interestType: interestType || InterestType.FLAT,
        frequency: frequency || RepaymentFrequency.MONTHLY,
        numberOfRepayments: Number(numberOfRepayments),
        startDate: startDate ? new Date(startDate) : new Date(),
      });
      const totals = CalculationEngine.calculateDealTotals(
        financeAmount,
        interestRate,
        Number(numberOfRepayments),
        frequency || RepaymentFrequency.MONTHLY,
        interestType || InterestType.FLAT
      );
      sendSuccess(res, { totals, schedule }, 'Schedule generated preview');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const deal = await DealService.createDeal(companyId, userId, req.body);
      sendSuccess(res, deal, 'Finance deal created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const id = req.params.id as string;
      const deal = await DealService.approveDeal(companyId, id, userId);
      sendSuccess(res, deal, 'Deal approved successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async activate(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const deal = await DealService.activateDeal(companyId, id);
      sendSuccess(res, deal, 'Deal activated and capital disbursed');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const deal = await DealService.updateDeal(companyId, id, req.body);
      sendSuccess(res, deal, 'Deal updated successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await DealService.deleteDeal(companyId, id);
      sendSuccess(res, { id }, 'Deal deleted successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async addFunding(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const funding = await DealService.addFunding(companyId, id, req.body);
      sendSuccess(res, funding, 'Funding participant added successfully', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async deleteFunding(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const fundingId = req.params.fundingId as string;
      await DealService.deleteFunding(companyId, id, fundingId);
      sendSuccess(res, { fundingId }, 'Funding participant removed');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
