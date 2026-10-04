import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import prisma from '../prisma/client.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CompanyController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      let company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        // Fallback to first company
        company = await prisma.company.findFirst();
      }

      sendSuccess(res, company, 'Company profile retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const {
        name,
        legalName,
        logoUrl,
        website,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        gstin,
        pan,
        currencySymbol,
        defaultCommissionRate,
      } = req.body;

      const updated = await prisma.company.update({
        where: { id: companyId },
        data: {
          name: name !== undefined ? name : undefined,
          legalName: legalName !== undefined ? legalName : undefined,
          logoUrl: logoUrl !== undefined ? logoUrl : undefined,
          website: website !== undefined ? website : undefined,
          email: email !== undefined ? email : undefined,
          phone: phone !== undefined ? phone : undefined,
          address: address !== undefined ? address : undefined,
          city: city !== undefined ? city : undefined,
          state: state !== undefined ? state : undefined,
          pincode: pincode !== undefined ? pincode : undefined,
          gstin: gstin !== undefined ? gstin : undefined,
          pan: pan !== undefined ? pan : undefined,
          currencySymbol: currencySymbol !== undefined ? currencySymbol : undefined,
          defaultCommissionRate: defaultCommissionRate !== undefined ? String(defaultCommissionRate) : undefined,
        },
      });

      sendSuccess(res, updated, 'Company profile updated successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
