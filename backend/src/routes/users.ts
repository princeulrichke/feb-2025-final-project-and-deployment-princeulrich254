import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { authenticate, authorize, canAccess } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users in company (admin+ only)
router.get('/', canAccess('admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { page = 1, limit = 10, role, search, department } = req.query;

  // Build filter
  const filter: any = { 
    company: user.company,
    isActive: true 
  };

  if (role) filter.role = role;
  if (department) filter.department = department;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const targetUser = await User.findOne({
    _id: id,
    company: user.company
  }).select('-password').populate('company', 'name');

  if (!targetUser) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user: targetUser }
  });
}));

// Update user (admin+ or self)
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { firstName, lastName, phone, department, isActive } = req.body;

  // Check if user can modify this account
  const canModify = user.role === 'owner' || 
                   user.role === 'admin' || 
                   (user._id as any).toString() === id;

  if (!canModify) {
    throw createError('Insufficient privileges', 403);
  }

  const targetUser = await User.findOne({
    _id: id,
    company: user.company
  });

  if (!targetUser) {
    throw createError('User not found', 404);
  }

  // Update allowed fields
  if (firstName) targetUser.firstName = firstName;
  if (lastName) targetUser.lastName = lastName;
  if (phone) targetUser.phone = phone;
  
  // Only admin+ can modify these fields
  if (user.role === 'owner' || user.role === 'admin') {
    if (department !== undefined) targetUser.department = department;
    if (isActive !== undefined) targetUser.isActive = isActive;
  }

  await targetUser.save();

  logger.info(`User updated: ${targetUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: targetUser }
  });
}));

// Update user role (owner only)
router.patch('/:id/role', authorize('owner'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'manager', 'employee', 'accountant', 'sales_rep', 'hr_manager'].includes(role)) {
    throw createError('Invalid role', 400);
  }

  const targetUser = await User.findOne({
    _id: id,
    company: user.company
  });

  if (!targetUser) {
    throw createError('User not found', 404);
  }

  // Can't change owner role
  if (targetUser.role === 'owner') {
    throw createError('Cannot change owner role', 400);
  }

  targetUser.role = role;
  await targetUser.save();

  logger.info(`User role updated: ${targetUser.email} to ${role} by ${user.email}`);

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: { user: targetUser }
  });
}));

// Deactivate user (admin+ only)
router.patch('/:id/deactivate', canAccess('admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const targetUser = await User.findOne({
    _id: id,
    company: user.company
  });

  if (!targetUser) {
    throw createError('User not found', 404);
  }

  // Can't deactivate owner
  if (targetUser.role === 'owner') {
    throw createError('Cannot deactivate owner', 400);
  }

  // Can't deactivate self
  if ((targetUser._id as any).toString() === (user._id as any).toString()) {
    throw createError('Cannot deactivate yourself', 400);
  }

  targetUser.isActive = false;
  await targetUser.save();

  logger.info(`User deactivated: ${targetUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
}));

// Reactivate user (admin+ only)
router.patch('/:id/activate', canAccess('admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const targetUser = await User.findOne({
    _id: id,
    company: user.company
  });

  if (!targetUser) {
    throw createError('User not found', 404);
  }

  targetUser.isActive = true;
  await targetUser.save();

  logger.info(`User activated: ${targetUser.email} by ${user.email}`);

  res.json({
    success: true,
    message: 'User activated successfully'
  });
}));

// Get user stats (admin+ only)
router.get('/stats/overview', canAccess('admin'), asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  const stats = await User.aggregate([
    { $match: { company: user.company } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        byRole: {
          $push: {
            role: '$role',
            count: 1
          }
        }
      }
    }
  ]);

  const roleStats = await User.aggregate([
    { $match: { company: user.company } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: stats[0] || { total: 0, active: 0, verified: 0 },
      byRole: roleStats
    }
  });
}));

export default router;
