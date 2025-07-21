import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { 
  signupSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  inviteUserSchema,
  acceptInviteSchema,
  verifyEmailSchema
} from '../schemas/auth';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Token } from '../models/Token';
import { Employee } from '../models/Employee';
import { Department } from '../models/Department';
import { generateTokenPair, generateInviteToken, generateResetToken, generateVerificationToken } from '../utils/jwt';
import { emailService } from '../utils/email';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import dayjs from 'dayjs';

const router = Router();

// Owner signup - creates company and first user
router.post('/signup', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

  // Create company first
  const company = new Company({
    name: validatedData.companyName,
    owner: null // Will be set after user creation
  });

  // Create owner user
  const user = new User({
    email: validatedData.email,
    password: validatedData.password,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    phone: validatedData.phone,
    role: 'owner',
    company: company._id,
    isEmailVerified: false
  });

  // Set company owner
  company.owner = user._id as any;

  // Save both
  await Promise.all([company.save(), user.save()]);

  // Generate email verification token
  const verificationToken = generateVerificationToken();
  const emailToken = new Token({
    userId: user._id,
    token: verificationToken,
    type: 'email_verification',
    expiresAt: dayjs().add(24, 'hours').toDate()
  });
  await emailToken.save();

  // Send verification email
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
    await emailService.sendEmailVerificationEmail(
      user.email,
      verificationLink
    );
    logger.info(`Verification email sent to ${user.email}`);
  } catch (emailError) {
    logger.warn(`Failed to send verification email to ${user.email}:`, emailError);
    // Continue with signup even if email fails
  }

  // Generate tokens
  const tokens = generateTokenPair(user);

  logger.info(`New company created: ${company.name} by ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      company: {
        id: company._id,
        name: company.name
      },
      tokens
    }
  });
  } catch (error) {
    logger.error('Signup error:', error);
    throw error;
  }
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user
  const user = await User.findOne({ email: validatedData.email })
    .populate('company')
    .select('+password');

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(validatedData.password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw createError('Account is deactivated', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = generateTokenPair(user);

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        company: user.company
      },
      tokens
    }
  });
}));

// Google OAuth callback (handled by passport middleware)
router.get('/google', (req, res, next) => {
  // This will be implemented when we set up passport Google strategy
  res.json({ message: 'Google OAuth not implemented yet' });
});

// Forgot password
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = forgotPasswordSchema.parse(req.body);

  const user = await User.findOne({ email: validatedData.email });
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    });
  }

  // Generate reset token
  const resetToken = generateResetToken();
  const passwordResetToken = new Token({
    userId: user._id,
    token: resetToken,
    type: 'password_reset',
    expiresAt: dayjs().add(1, 'hour').toDate()
  });
  await passwordResetToken.save();

  // Send reset email
  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  await emailService.sendPasswordResetEmail(user.email, {
    userName: user.getFullName(),
    resetLink
  });

  logger.info(`Password reset requested for: ${user.email}`);

  res.json({
    success: true,
    message: 'If an account with that email exists, we\'ve sent a password reset link.'
  });
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = resetPasswordSchema.parse(req.body);

  // Find and validate token
  const tokenDoc = await Token.findOne({
    token: validatedData.token,
    type: 'password_reset',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    throw createError('Invalid or expired reset token', 400);
  }

  // Find user
  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Update password
  user.password = validatedData.password;
  await user.save();

  // Mark token as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  logger.info(`Password reset successful for: ${user.email}`);

  res.json({
    success: true,
    message: 'Password reset successful'
  });
}));

// Invite user (requires admin or owner role)
router.post('/invite', authenticate, authorize('admin', 'owner'), asyncHandler(async (req: Request, res: Response) => {
  const validatedData = inviteUserSchema.parse(req.body);
  const inviter = req.user!;

  // Check if user already exists
  const existingUser = await User.findOne({ email: validatedData.email });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Generate invite token
  const inviteToken = generateInviteToken();
  const invite = new Token({
    token: inviteToken,
    type: 'invite',
    email: validatedData.email,
    role: validatedData.role,
    company: inviter.company,
    expiresAt: dayjs().add(7, 'days').toDate()
  });
  await invite.save();

  // Send invite email
  const inviteLink = `${process.env.FRONTEND_URL}/auth/accept-invite?token=${inviteToken}`;
  await emailService.sendInviteEmail(validatedData.email, {
    inviteeName: `${validatedData.firstName} ${validatedData.lastName}`,
    inviterName: inviter.getFullName(),
    companyName: (inviter.company as any).name,
    role: validatedData.role,
    inviteLink
  });

  logger.info(`User invited: ${validatedData.email} to ${(inviter.company as any).name} by ${inviter.email}`);

  res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    data: {
      email: validatedData.email,
      role: validatedData.role,
      expiresAt: invite.expiresAt
    }
  });
}));

// Accept invite
router.post('/accept-invite/:token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const validatedData = acceptInviteSchema.parse({ ...req.body, token });

  // Find and validate invite token
  const invite = await Token.findOne({
    token: validatedData.token,
    type: 'invite',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).populate('company');

  if (!invite) {
    throw createError('Invalid or expired invite token', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Create user
  const user = new User({
    email: invite.email!,
    password: validatedData.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    role: invite.role,
    company: invite.company,
    isEmailVerified: true, // Pre-verified through invite
    department: req.body.department
  });
  await user.save();

  // Create employee record if this is an employee invitation with metadata
  if (invite.role === 'employee' && invite.metadata?.employeeData) {
    const employeeData = invite.metadata.employeeData;
    
    // Ensure department exists
    let department = await Department.findOne({ 
      name: employeeData.department, 
      companyId: invite.company 
    });

    if (!department) {
      department = new Department({
        name: employeeData.department,
        companyId: invite.company,
        employeeCount: 1,
        isActive: true
      });
      await department.save();
    } else {
      // Increment employee count
      department.employeeCount += 1;
      await department.save();
    }

    const employee = new Employee({
      employeeId: employeeData.employeeId,
      firstName: employeeData.firstName,
      lastName: employeeData.lastName,
      email: invite.email,
      phone: employeeData.phone,
      department: employeeData.department,
      position: employeeData.position,
      hireDate: new Date(employeeData.hireDate),
      salary: employeeData.salary,
      status: 'active', // Employee becomes active upon accepting invite
      manager: employeeData.manager,
      address: employeeData.address,
      emergencyContact: employeeData.emergencyContact,
      companyId: invite.company,
      userId: user._id
    });
    await employee.save();
    
    logger.info(`Employee record created: ${employee.employeeId} - ${employee.firstName} ${employee.lastName}`);
  }

  // Mark invite as used
  invite.isUsed = true;
  await invite.save();

  // Send welcome email
  const loginLink = `${process.env.FRONTEND_URL}/auth/login`;
  await emailService.sendWelcomeEmail(user.email, {
    userName: user.getFullName(),
    companyName: (invite.company as any).name,
    loginLink
  });

  // Generate tokens
  const tokens = generateTokenPair(user);

  logger.info(`Invite accepted: ${user.email} joined ${(invite.company as any).name}`);

  res.status(201).json({
    success: true,
    message: 'Invite accepted successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        company: invite.company
      },
      tokens
    }
  });
}));

// Verify email
router.post('/verify-email', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = verifyEmailSchema.parse(req.body);

  // Find and validate token
  const tokenDoc = await Token.findOne({
    token: validatedData.token,
    type: 'email_verification',
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    throw createError('Invalid or expired verification token', 400);
  }

  // Find and update user
  const user = await User.findById(tokenDoc.userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  user.isEmailVerified = true;
  await user.save();

  // Mark token as used
  tokenDoc.isUsed = true;
  await tokenDoc.save();

  logger.info(`Email verified for: ${user.email}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// Resend verification email
router.post('/resend-verification', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  if (user.isEmailVerified) {
    throw createError('Email already verified', 400);
  }

  // Delete existing verification tokens
  await Token.deleteMany({
    userId: user._id,
    type: 'email_verification'
  });

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const emailToken = new Token({
    userId: user._id,
    token: verificationToken,
    type: 'email_verification',
    expiresAt: dayjs().add(24, 'hours').toDate()
  });
  await emailToken.save();

  // Send verification email
  const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
  await emailService.sendEmailVerificationEmail(
    user.email,
    verificationLink
  );

  res.json({
    success: true,
    message: 'Verification email sent'
  });
}));

// Logout (client-side token removal, server-side token blacklisting can be added later)
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just return success as logout is handled client-side
  
  logger.info(`User logged out: ${req.user!.email}`);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        company: user.company
      }
    }
  });
}));

export default router;
