import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ERP Core placeholder routes
router.get('/projects', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ERP Projects endpoint - Coming soon',
    data: { projects: [] }
  });
}));

router.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ERP Tasks endpoint - Coming soon',
    data: { tasks: [] }
  });
}));

router.get('/operations', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ERP Operations endpoint - Coming soon',
    data: { operations: [] }
  });
}));

export default router;
