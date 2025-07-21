import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UserRoleType } from '../schemas/auth';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User extends IUser {}
    interface Request {
      user?: IUser;
    }
  }
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRoleType;
  company: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Middleware to authenticate JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const payload = jwt.verify(
      token, 
      process.env.JWT_ACCESS_SECRET || 'default-secret'
    ) as JWTPayload;

    // Find user
    const user = await User.findById(payload.sub)
      .populate('company')
      .select('-password');

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Middleware to check if user has required role(s)
export const authorize = (...roles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient privileges' 
      });
    }

    next();
  };
};

// Middleware to check if user can access resource
export const canAccess = (requiredRole: UserRoleType) => {
  const roleHierarchy: Record<UserRoleType, number> = {
    'employee': 1,
    'sales_rep': 2,
    'accountant': 3,
    'hr_manager': 4,
    'manager': 5,
    'admin': 6,
    'owner': 7
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRoleLevel = roleHierarchy[req.user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient privileges' 
      });
    }

    next();
  };
};

// Middleware to check if user belongs to the same company
export const requireSameCompany = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }

  // This will be used in routes where we need to ensure users can only access their company's data
  // The route handler will need to implement the actual company comparison logic
  next();
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const payload = jwt.verify(
      token, 
      process.env.JWT_ACCESS_SECRET || 'default-secret'
    ) as JWTPayload;

    const user = await User.findById(payload.sub)
      .populate('company')
      .select('-password');

    if (user && user.isActive) {
      req.user = user;
    }

    next();
    
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional auth failed:', error);
    next();
  }
};
