import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InviteEmailData {
  inviteeName: string;
  inviterName: string;
  companyName: string;
  role: string;
  inviteLink: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetLink: string;
}

interface WelcomeEmailData {
  userName: string;
  companyName: string;
  loginLink: string;
}

interface LowStockAlertData {
  recipientName: string;
  companyName: string;
  lowStockProducts: {
    name: string;
    sku: string;
    currentStock: number;
    minQuantity: number;
    category: string;
    warehouse: string;
  }[];
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Check if email credentials are configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      logger.warn('⚠️ Email credentials not configured. Email functionality will be disabled.');
      this.isConfigured = false;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    this.isConfigured = true;
    // Verify transporter configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service not configured, skipping verification');
      return;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully');
    } catch (error) {
      logger.error('❌ Email service connection failed:', error);
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      logger.warn(`Cannot send email to ${options.to}: Email service not configured`);
      return false;
    }

    try {
      const mailOptions = {
        from: `"ERP Business Suite" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}:`, result.messageId);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendInviteEmail(email: string, data: InviteEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited to Join ${data.companyName}!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.inviteeName}!</h2>
            <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.</p>
            
            <p>You'll have access to our comprehensive business management platform including:</p>
            <ul>
              <li>📊 Dashboard & Analytics</li>
              <li>👥 Customer Relationship Management (CRM)</li>
              <li>💼 Human Resource Management (HRM)</li>
              <li>📦 Inventory Management</li>
              <li>💰 Accounting & Invoicing</li>
              <li>📅 Company Events & Calendar</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data.inviteLink}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>Note:</strong> This invitation will expire in 7 days. If you have any questions, please contact ${data.inviterName} or our support team.</p>
            
            <div class="footer">
              <p>This invitation was sent by ${data.companyName} via ERP Business Suite</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      You're Invited to Join ${data.companyName}!
      
      Hello ${data.inviteeName}!
      
      ${data.inviterName} has invited you to join ${data.companyName} as a ${data.role}.
      
      Accept your invitation by visiting: ${data.inviteLink}
      
      This invitation will expire in 7 days.
      
      ---
      This invitation was sent by ${data.companyName} via ERP Business Suite
    `;

    return this.sendEmail({
      to: email,
      subject: `Invitation to join ${data.companyName}`,
      html,
      text
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>We received a request to reset your password for your ERP Business Suite account.</p>
            
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="button">Reset Your Password</a>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Important Security Information:</strong></p>
              <ul>
                <li>This link will expire in 1 hour for security reasons</li>
                <li>You can only use this link once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will not change until you click the link above</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3B82F6;">${data.resetLink}</p>
            
            <div class="footer">
              <p>This email was sent by ERP Business Suite</p>
              <p>If you're having trouble, contact our support team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Hello ${data.userName}!
      
      We received a request to reset your password for your ERP Business Suite account.
      
      Reset your password by visiting: ${data.resetLink}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this reset, please ignore this email.
      
      ---
      This email was sent by ERP Business Suite
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - ERP Business Suite',
      html,
      text
    });
  }

  async sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${data.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .features { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${data.companyName}!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Welcome to <strong>${data.companyName}</strong>! Your account has been successfully created and you now have access to our comprehensive business management platform.</p>
            
            <div class="features">
              <h3>🚀 What you can do now:</h3>
              <ul>
                <li>📊 <strong>Dashboard:</strong> Get insights into your business performance</li>
                <li>👥 <strong>CRM:</strong> Manage customers, leads, and sales pipeline</li>
                <li>💼 <strong>HRM:</strong> Handle employee management and HR processes</li>
                <li>📦 <strong>Inventory:</strong> Track products and manage stock levels</li>
                <li>💰 <strong>Accounting:</strong> Create invoices and manage finances</li>
                <li>📅 <strong>Events:</strong> Schedule and manage company events</li>
                <li>⚙️ <strong>Settings:</strong> Customize your workspace and preferences</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.loginLink}" class="button">Access Your Account</a>
            </div>
            
            <p><strong>Getting Started Tips:</strong></p>
            <ul>
              <li>Complete your profile information in Settings</li>
              <li>Explore the Dashboard to familiarize yourself with the interface</li>
              <li>Check out the Help section for tutorials and guides</li>
              <li>Contact your administrator if you need additional permissions</li>
            </ul>
            
            <div class="footer">
              <p>Welcome aboard! We're excited to have you as part of ${data.companyName}</p>
              <p>If you have any questions, our support team is here to help</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${data.companyName}!
      
      Hello ${data.userName}!
      
      Welcome to ${data.companyName}! Your account has been successfully created.
      
      Access your account by visiting: ${data.loginLink}
      
      You now have access to:
      - Dashboard & Analytics
      - Customer Relationship Management (CRM)
      - Human Resource Management (HRM)
      - Inventory Management
      - Accounting & Invoicing
      - Company Events & Calendar
      
      Getting Started:
      - Complete your profile information
      - Explore the Dashboard
      - Check out the Help section
      - Contact your administrator for additional permissions
      
      ---
      Welcome aboard! We're excited to have you as part of ${data.companyName}
    `;

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${data.companyName} - ERP Business Suite`,
      html,
      text
    });
  }

  async sendEmailVerificationEmail(email: string, verificationLink: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verify Your Email Address</h1>
          </div>
          <div class="content">
            <h2>Almost there!</h2>
            <p>Thank you for signing up for ERP Business Suite. To complete your registration and secure your account, please verify your email address.</p>
            
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This verification link will expire in 24 hours</li>
              <li>You won't be able to access all features until your email is verified</li>
              <li>If you didn't create this account, please ignore this email</li>
            </ul>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3B82F6;">${verificationLink}</p>
            
            <div class="footer">
              <p>This email was sent by ERP Business Suite</p>
              <p>If you're having trouble, contact our support team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Verify Your Email Address
      
      Thank you for signing up for ERP Business Suite.
      
      To complete your registration, please verify your email address by visiting:
      ${verificationLink}
      
      This verification link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      ---
      This email was sent by ERP Business Suite
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - ERP Business Suite',
      html,
      text
    });
  }

  async sendLowStockAlert(email: string, data: LowStockAlertData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Low Stock Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert-icon { font-size: 48px; margin-bottom: 10px; }
          .product-list { background: white; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0; }
          .product-item { padding: 15px; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center; }
          .product-item:last-child { border-bottom: none; }
          .product-info { flex: 1; }
          .product-name { font-weight: bold; color: #212529; margin-bottom: 5px; }
          .product-details { color: #6c757d; font-size: 14px; }
          .stock-info { text-align: right; }
          .current-stock { color: #dc3545; font-weight: bold; font-size: 18px; }
          .min-stock { color: #6c757d; font-size: 14px; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">⚠️</div>
            <h1>Low Stock Alert</h1>
            <p>Some products in your inventory are running low</p>
          </div>
          <div class="content">
            <p>Hello ${data.recipientName},</p>
            <p>This is an automated alert from <strong>${data.companyName}</strong> inventory management system.</p>
            <p>The following products have reached or fallen below their minimum stock levels:</p>
            
            <div class="product-list">
              ${data.lowStockProducts.map(product => `
                <div class="product-item">
                  <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-details">
                      SKU: ${product.sku} | Category: ${product.category} | Warehouse: ${product.warehouse}
                    </div>
                  </div>
                  <div class="stock-info">
                    <div class="current-stock">${product.currentStock} units</div>
                    <div class="min-stock">Min: ${product.minQuantity} units</div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <p><strong>Action Required:</strong> Please review these products and consider restocking to maintain optimal inventory levels.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/inventory" class="btn">View Inventory Dashboard</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Low Stock Alert - ${data.companyName}

Hello ${data.recipientName},

The following products have reached or fallen below their minimum stock levels:

${data.lowStockProducts.map(product => 
  `${product.name} (${product.sku}): ${product.currentStock}/${product.minQuantity} units`
).join('\n')}

Please review these products and consider restocking to maintain optimal inventory levels.

View your inventory dashboard: ${process.env.FRONTEND_URL}/inventory

This is an automated email. Please do not reply to this message.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: `🚨 Low Stock Alert - ${data.companyName}`,
      html,
      text
    });
  }
}

let _emailService: EmailService | null = null;

export const emailService = {
  get instance(): EmailService {
    if (!_emailService) {
      _emailService = new EmailService();
    }
    return _emailService;
  },
  
  // Proxy methods to the instance
  async sendWelcomeEmail(to: string, data: WelcomeEmailData) {
    return this.instance.sendWelcomeEmail(to, data);
  },
  
  async sendPasswordResetEmail(to: string, data: PasswordResetEmailData) {
    return this.instance.sendPasswordResetEmail(to, data);
  },
  
  async sendInviteEmail(to: string, data: InviteEmailData) {
    return this.instance.sendInviteEmail(to, data);
  },
  
  async sendEmailVerificationEmail(to: string, verificationLink: string) {
    return this.instance.sendEmailVerificationEmail(to, verificationLink);
  },
  
  async sendLowStockAlert(to: string, data: LowStockAlertData) {
    return this.instance.sendLowStockAlert(to, data);
  }
};
