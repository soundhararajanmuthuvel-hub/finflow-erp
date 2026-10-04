import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { PartnerService } from '../services/partnerService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PartnerController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const partners = await PartnerService.listPartners(companyId);
      sendSuccess(res, partners, 'Partners retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const partner = await PartnerService.getPartnerById(companyId, id);
      sendSuccess(res, partner, 'Partner details retrieved');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const partner = await PartnerService.createPartner(companyId, req.body);
      sendSuccess(res, partner, 'Partner created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const partner = await PartnerService.updatePartner(companyId, id, req.body);
      sendSuccess(res, partner, 'Partner updated successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await PartnerService.deletePartner(companyId, id);
      sendSuccess(res, { id }, 'Partner deleted successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
