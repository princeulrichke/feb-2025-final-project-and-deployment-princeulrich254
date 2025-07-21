import { Request, Response } from 'express';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { z } from 'zod';

// Validation schemas
const createInvoiceItemSchema = z.object({
  product: z.string().optional(),
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  total: z.number().min(0)
});

const createInvoiceSchema = z.object({
  customer: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    address: z.string().optional(),
    phone: z.string().optional()
  }),
  items: z.array(createInvoiceItemSchema).min(1),
  taxRate: z.number().min(0).max(1),
  discountAmount: z.number().min(0).optional(),
  dueDate: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional()
});

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, customer, startDate, endDate } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (status) filter.status = status;
    if (customer) {
      filter.$or = [
        { 'customer.name': { $regex: customer, $options: 'i' } },
        { 'customer.email': { $regex: customer, $options: 'i' } }
      ];
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate as string);
      if (endDate) filter.issueDate.$lte = new Date(endDate as string);
    }

    const invoices = await Invoice.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const validatedData = createInvoiceSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    // Calculate totals
    let subtotal = 0;
    for (const item of validatedData.items) {
      subtotal += item.total;
    }

    const discountAmount = validatedData.discountAmount || 0;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * validatedData.taxRate;
    const total = subtotalAfterDiscount + taxAmount;

    // Generate invoice number (simple format: INV-YYYY-NNNN)
    const year = new Date().getFullYear();
    const invoiceCount = await Invoice.countDocuments({ companyId }) + 1;
    const invoiceNumber = `INV-${year}-${invoiceCount.toString().padStart(4, '0')}`;

    const invoice = new Invoice({
      invoiceNumber,
      customer: validatedData.customer,
      items: validatedData.items,
      subtotal,
      taxRate: validatedData.taxRate,
      taxAmount,
      discountAmount,
      total,
      dueDate: new Date(validatedData.dueDate),
      notes: validatedData.notes,
      terms: validatedData.terms,
      companyId,
      createdBy: userId
    });

    await invoice.save();
    await invoice.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: { invoice }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const invoice = await Invoice.findOne({ _id: id, companyId })
      .populate('createdBy', 'firstName lastName email')
      .populate('items.product', 'name sku');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paidDate } = req.body;
    const companyId = (req as any).user.company;

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData: any = { status };
    if (status === 'paid' && paidDate) {
      updateData.paidDate = new Date(paidDate);
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: { invoice }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating invoice status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const invoice = await Invoice.findOne({ _id: id, companyId });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be deleted'
      });
    }

    await Invoice.findOneAndDelete({ _id: id, companyId });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getOverdueInvoices = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;
    const today = new Date();

    // Update overdue invoices
    await Invoice.updateMany(
      {
        companyId,
        status: 'sent',
        dueDate: { $lt: today }
      },
      { status: 'overdue' }
    );

    const overdueInvoices = await Invoice.find({
      companyId,
      status: 'overdue'
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: { invoices: overdueInvoices }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getInvoiceStatistics = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Invoice counts by status
    const statusCounts = await Invoice.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Total revenue (paid invoices)
    const revenueData = await Invoice.aggregate([
      { $match: { companyId, status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);

    // Outstanding amount (sent + overdue invoices)
    const outstandingData = await Invoice.aggregate([
      { $match: { companyId, status: { $in: ['sent', 'overdue'] } } },
      { $group: { _id: null, totalOutstanding: { $sum: '$total' } } }
    ]);

    // Monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Invoice.aggregate([
      {
        $match: {
          companyId,
          status: 'paid',
          paidDate: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' }
          },
          revenue: { $sum: '$total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        statusCounts,
        totalRevenue: revenueData[0]?.totalRevenue || 0,
        totalOutstanding: outstandingData[0]?.totalOutstanding || 0,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAccountingDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Invoice statistics
    const totalInvoices = await Invoice.countDocuments({ companyId });
    const paidInvoices = await Invoice.countDocuments({ companyId, status: 'paid' });
    const overdueInvoices = await Invoice.countDocuments({ companyId, status: 'overdue' });
    const draftInvoices = await Invoice.countDocuments({ companyId, status: 'draft' });

    // Financial metrics
    const revenueData = await Invoice.aggregate([
      { $match: { companyId, status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
    ]);

    const outstandingData = await Invoice.aggregate([
      { $match: { companyId, status: { $in: ['sent', 'overdue'] } } },
      { $group: { _id: null, totalOutstanding: { $sum: '$total' } } }
    ]);

    // Recent invoices
    const recentInvoices = await Invoice.find({ companyId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly trends
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Invoice.aggregate([
      {
        $match: {
          companyId,
          issueDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          totalAmount: { $sum: '$total' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalInvoices,
          paidInvoices,
          overdueInvoices,
          draftInvoices,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          totalOutstanding: outstandingData[0]?.totalOutstanding || 0
        },
        recentInvoices,
        monthlyTrends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching accounting dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
