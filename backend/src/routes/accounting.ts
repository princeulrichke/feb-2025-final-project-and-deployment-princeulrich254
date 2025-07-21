import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getInvoices,
  createInvoice,
  getInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getOverdueInvoices,
  getInvoiceStatistics,
  getAccountingDashboard
} from '../controllers/accountingController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Invoice routes
router.get('/invoices', asyncHandler(getInvoices));
router.post('/invoices', asyncHandler(createInvoice));
router.get('/invoices/overdue', asyncHandler(getOverdueInvoices));
router.get('/invoices/statistics', asyncHandler(getInvoiceStatistics));
router.get('/invoices/:id', asyncHandler(getInvoice));
router.put('/invoices/:id/status', asyncHandler(updateInvoiceStatus));
router.delete('/invoices/:id', asyncHandler(deleteInvoice));

// Dashboard
router.get('/dashboard', asyncHandler(getAccountingDashboard));

export default router;
