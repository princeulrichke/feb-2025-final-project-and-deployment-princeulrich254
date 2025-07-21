import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  convertLeadToCustomer,
  getCrmDashboard
} from '../controllers/crmController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Lead routes
router.get('/leads', asyncHandler(getLeads));
router.post('/leads', asyncHandler(createLead));
router.put('/leads/:id', asyncHandler(updateLead));
router.delete('/leads/:id', asyncHandler(deleteLead));
router.post('/leads/:id/convert', asyncHandler(convertLeadToCustomer));

// Contact routes
router.get('/contacts', asyncHandler(getContacts));
router.post('/contacts', asyncHandler(createContact));
router.put('/contacts/:id', asyncHandler(updateContact));
router.delete('/contacts/:id', asyncHandler(deleteContact));

// Customer routes
router.get('/customers', asyncHandler(getCustomers));
router.post('/customers', asyncHandler(createCustomer));
router.put('/customers/:id', asyncHandler(updateCustomer));
router.delete('/customers/:id', asyncHandler(deleteCustomer));

// Communication routes
router.get('/communications', asyncHandler(getCommunications));
router.post('/communications', asyncHandler(createCommunication));
router.put('/communications/:id', asyncHandler(updateCommunication));
router.delete('/communications/:id', asyncHandler(deleteCommunication));

// Dashboard
router.get('/dashboard', asyncHandler(getCrmDashboard));

export default router;
