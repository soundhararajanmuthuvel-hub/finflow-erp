import { z } from 'zod';
import { Role, InterestType, RepaymentFrequency, PaymentMethod, FundingSourceType } from '../types/enums.js';

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const ClientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    businessName: z.string().optional(),
    phone: z.string().min(8),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    pan: z.string().optional(),
    gstin: z.string().optional(),
    businessType: z.string().optional(),
    industry: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const PartnerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    pan: z.string().optional(),
    capitalContribution: z.number().nonnegative().optional(),
    sharePercentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});

export const InvestorSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    pan: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNo: z.string().optional(),
    ifscCode: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const FundingItemSchema = z.object({
  sourceType: z.nativeEnum(FundingSourceType),
  partnerId: z.string().uuid().optional().nullable(),
  investorId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  expectedReturnRate: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const CreateDealSchema = z.object({
  body: z.object({
    clientId: z.string().uuid(),
    financeAmountRequired: z.number().positive(),
    financeAmountApproved: z.number().positive(),
    startDate: z.string(),
    endDate: z.string().optional(),
    interestType: z.nativeEnum(InterestType).default(InterestType.FLAT),
    interestRate: z.number().nonnegative(),
    repaymentFrequency: z.nativeEnum(RepaymentFrequency).default(RepaymentFrequency.MONTHLY),
    numberOfRepayments: z.number().int().positive(),
    purpose: z.string().optional(),
    notes: z.string().optional(),
    fundings: z.array(FundingItemSchema),
    distributionRule: z.object({
      companyCommissionRate: z.number().min(0).max(100).default(0),
      outsideInvestorReturnRate: z.number().min(0).max(100).default(0),
      partnerProfitShareRate: z.number().min(0).max(100).default(0),
      ruleDescription: z.string().optional(),
    }),
  }),
});

export const RecordRepaymentSchema = z.object({
  body: z.object({
    dealId: z.string().uuid(),
    paymentDate: z.string().optional(),
    amountReceived: z.number().positive(),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const CreateExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    category: z.string().min(2),
    amount: z.number().positive(),
    paymentDate: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
    referenceNo: z.string().optional(),
    paidTo: z.string().optional(),
    notes: z.string().optional(),
  }),
});
