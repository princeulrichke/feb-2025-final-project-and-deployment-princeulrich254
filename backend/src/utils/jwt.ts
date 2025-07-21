import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '../models/User';
import { UserRoleType } from '../schemas/auth';

export interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: UserRoleType;
  company: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Generate JWT access token
export const generateAccessToken = (user: IUser): string => {
  const payload = {
    sub: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    company: (user.company as any).toString(),
    iss: 'erp-business-suite',
    aud: 'erp-users'
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'default-secret', {
    expiresIn: '15m'
  });
};

// Generate JWT refresh token
export const generateRefreshToken = (user: IUser): string => {
  const payload = {
    sub: (user._id as any).toString(),
    type: 'refresh',
    iss: 'erp-business-suite',
    aud: 'erp-users'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'default-secret', {
    expiresIn: '7d'
  });
};

// Generate token pair
export const generateTokenPair = (user: IUser): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'default-secret');
};

// Generate secure random token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate reset password token
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate email verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate invite token
export const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash token for storage
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verify token hash
export const verifyTokenHash = (token: string, hashedToken: string): boolean => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hashedToken;
};

// Get token expiry date
export const getTokenExpiry = (hours: number = 24): Date => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// Get short-term token expiry (for email verification, etc.)
export const getShortTokenExpiry = (minutes: number = 15): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
