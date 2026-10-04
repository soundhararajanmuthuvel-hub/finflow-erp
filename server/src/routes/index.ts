import { Router } from 'express';
import authRoutes from './authRoutes.js';
import clientRoutes from './clientRoutes.js';
import partnerRoutes from './partnerRoutes.js';
import investorRoutes from './investorRoutes.js';
import dealRoutes from './dealRoutes.js';
import repaymentRoutes from './repaymentRoutes.js';
import ledgerRoutes from './ledgerRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import demoRoutes from './demoRoutes.js';
import companyRoutes from './companyRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/company', companyRoutes);
router.use('/settings/company', companyRoutes);
router.use('/clients', clientRoutes);
router.use('/partners', partnerRoutes);
router.use('/investors', investorRoutes);
router.use('/deals', dealRoutes);
router.use('/repayments', repaymentRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/demo', demoRoutes);

export default router;
