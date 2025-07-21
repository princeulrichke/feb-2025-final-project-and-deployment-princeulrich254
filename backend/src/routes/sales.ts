import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Sales placeholder routes
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sales Orders endpoint - Coming soon',
    data: { orders: [] }
  });
}));

router.get('/quotations', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sales Quotations endpoint - Coming soon',
    data: { quotations: [] }
  });
}));

router.get('/purchases', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sales Purchase Orders endpoint - Coming soon',
    data: { purchases: [] }
  });
}));

export default router;
