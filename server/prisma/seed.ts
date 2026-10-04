import { PrismaClient, Prisma } from '@prisma/client';
import { Role, InterestType, RepaymentFrequency, FundingSourceType, DealStatus } from '../src/types/enums.js';
import bcrypt from 'bcryptjs';
import { CalculationEngine } from '../src/services/calculationEngine.js';
import { LedgerService } from '../src/services/ledgerService.js';
import { DemoService } from '../src/services/demoService.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Company
  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Sri Lakshmi Finance Solutions',
      legalName: 'Sri Lakshmi Finance & Investments Pvt. Ltd.',
      registrationNo: 'U65999MH2023PTC123456',
      pan: 'AABCS1234F',
      gstin: '27AABCS1234F1Z5',
      email: 'contact@srilakshmifinance.com',
      website: 'www.srilakshmifinance.com',
      phone: '+91 98765 43210',
      address: 'Suite 402, Financial Commercial Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      currencySymbol: '₹',
      currencyCode: 'INR',
      defaultCommissionRate: '10.00',
    },
  });

  // 2. Initialize Ledger Accounts
  await LedgerService.initializeChartOfAccounts(prisma, company.id);

  // 3. Create Users
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  const managerHash = await bcrypt.hash('Manager@123456', 10);
  const staffHash = await bcrypt.hash('Staff@123456', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@financeerp.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@financeerp.com',
      password: passwordHash,
      fullName: 'Chief Investment Officer (Admin)',
      role: Role.SUPER_ADMIN,
      phone: '+91 98000 11111',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@financecorp.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'admin@financecorp.com',
      password: passwordHash,
      fullName: 'Chief Investment Officer (Admin)',
      role: Role.SUPER_ADMIN,
      phone: '+91 98000 11111',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@financeerp.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'manager@financeerp.com',
      password: managerHash,
      fullName: 'Rohit Sharma (Finance Manager)',
      role: Role.FINANCE_MANAGER,
      phone: '+91 98000 22222',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@financeerp.com' },
    update: {},
    create: {
      companyId: company.id,
      email: 'staff@financeerp.com',
      password: staffHash,
      fullName: 'Priya Patel (Operations Staff)',
      role: Role.STAFF,
      phone: '+91 98000 33333',
    },
  });

  // 4. Create Partners
  const partnerA = await prisma.partner.upsert({
    where: { partnerCode: 'PRT-0001' },
    update: {},
    create: {
      companyId: company.id,
      partnerCode: 'PRT-0001',
      name: 'Partner A (Vikram Singhania)',
      phone: '+91 98111 00001',
      email: 'vikram@partners.in',
      capitalContribution: '500000.00',
      sharePercentage: '50.00',
    },
  });

  const partnerB = await prisma.partner.upsert({
    where: { partnerCode: 'PRT-0002' },
    update: {},
    create: {
      companyId: company.id,
      partnerCode: 'PRT-0002',
      name: 'Partner B (Ananya Mehta)',
      phone: '+91 98111 00002',
      email: 'ananya@partners.in',
      capitalContribution: '500000.00',
      sharePercentage: '50.00',
    },
  });

  // 5. Create Outside Investors
  const investorA = await prisma.investor.upsert({
    where: { investorCode: 'INV-0001' },
    update: {},
    create: {
      companyId: company.id,
      investorCode: 'INV-0001',
      name: 'Investor A (Suresh Rao)',
      phone: '+91 98222 00001',
      email: 'suresh.rao@investor.in',
      pan: 'ABCDE1234F',
      bankName: 'HDFC Bank',
      bankAccountNo: '50100234567890',
      ifscCode: 'HDFC0000123',
    },
  });

  const investorB = await prisma.investor.upsert({
    where: { investorCode: 'INV-0002' },
    update: {},
    create: {
      companyId: company.id,
      investorCode: 'INV-0002',
      name: 'Investor B (Meera Iyer)',
      phone: '+91 98222 00002',
      email: 'meera.iyer@investor.in',
      pan: 'BCDEF2345G',
      bankName: 'ICICI Bank',
      bankAccountNo: '001101567890',
      ifscCode: 'ICIC0000011',
    },
  });

  await prisma.investor.upsert({
    where: { investorCode: 'INV-0003' },
    update: {},
    create: {
      companyId: company.id,
      investorCode: 'INV-0003',
      name: 'Investor C (Rajesh Verma)',
      phone: '+91 98222 00003',
      email: 'rajesh.verma@investor.in',
      pan: 'CDEFG3456H',
      bankName: 'State Bank of India',
      bankAccountNo: '302001122334',
      ifscCode: 'SBIN0000456',
    },
  });

  // 6. Generate Clean Dynamic Demo Dataset
  await DemoService.resetDemoData(company.id, superAdmin.id);
  console.log(`✅ Demo Deal FIN-000001 created dynamically relative to current date with sample repayments.`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
