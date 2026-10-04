import { Router } from 'express';
import { ReportController } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/client-finance', ReportController.getClientFinanceReport);
router.get('/investor-returns', ReportController.getInvestorReport);
router.get('/partner-capital', ReportController.getPartnerReport);
router.get('/company-profit', ReportController.getCompanyProfitReport);
router.get('/collections', ReportController.getCollectionReport);
router.get('/overdue', ReportController.getOverdueReport);

export default router;
