import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

// Middleware to check if user is owner
export const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Owner privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking owner privileges',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Middleware to check if user has specific role
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking user role',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Middleware to check if user belongs to company
export const requireSameCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const companyId = user.company;
    
    // Add company check logic here if needed
    // For now, we assume the user's company is already validated in auth middleware
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking company access',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
