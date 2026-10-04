import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { RepaymentService } from '../services/repaymentService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RepaymentController {
  static async recordRepayment(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await RepaymentService.recordRepayment({
        companyId,
        userId,
        dealId: req.body.dealId,
        amountReceived: req.body.amountReceived,
        paymentDate: req.body.paymentDate,
        paymentMethod: req.body.paymentMethod,
        referenceNumber: req.body.referenceNumber,
        notes: req.body.notes,
        ipAddress,
      });

      sendSuccess(res, result, 'Repayment recorded and waterfall split processed', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async preview(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const { dealId, amountReceived } = req.body;
      const result = await RepaymentService.previewRepayment({
        companyId,
        dealId,
        amountReceived,
      });
      sendSuccess(res, result, 'Repayment waterfall allocation preview generated');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await RepaymentService.deleteRepayment(companyId, id);
      sendSuccess(res, { id }, 'Repayment voided and balances reversed successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
