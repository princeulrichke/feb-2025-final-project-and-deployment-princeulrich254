import { Router, Request, Response } from 'express';
import { Company } from '../models/Company';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get company profile
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  
  const company = await Company.findById(user.company).populate('owner', 'firstName lastName email');
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  res.json({
    success: true,
    data: { company }
  });
}));

// Update company profile (admin+ only)
router.put('/profile', authorize('admin', 'owner'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const updates = req.body;

  const company = await Company.findById(user.company);
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  // Update allowed fields
  const allowedFields = ['name', 'description', 'industry', 'website', 'email', 'phone', 'address'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      (company as any)[field] = updates[field];
    }
  });

  await company.save();

  res.json({
    success: true,
    message: 'Company profile updated successfully',
    data: { company }
  });
}));

// Update company settings (owner only)
router.put('/settings', authorize('owner'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { settings } = req.body;

  const company = await Company.findById(user.company);
  
  if (!company) {
    throw createError('Company not found', 404);
  }

  if (settings) {
    company.settings = { ...company.settings, ...settings };
    await company.save();
  }

  res.json({
    success: true,
    message: 'Company settings updated successfully',
    data: { company }
  });
}));

export default router;
