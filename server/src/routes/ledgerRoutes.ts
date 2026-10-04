import { Router } from 'express';
import { LedgerController } from '../controllers/ledgerController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/accounts', LedgerController.listAccounts);
router.get('/journal', LedgerController.listJournalTransactions);

export default router;
