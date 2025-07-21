import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { Contact } from '../models/Contact';
import { Customer } from '../models/Customer';
import { Communication } from '../models/Communication';
import { z } from 'zod';

// Validation schemas
const createLeadSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  stage: z.enum(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']).optional(),
  source: z.enum(['Website', 'Referral', 'Cold Call', 'Email Campaign', 'Social Media', 'Trade Show', 'Other']).optional(),
  value: z.number().min(0).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  assignedTo: z.string().optional()
});

const createContactSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().max(2000).optional()
});

const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  type: z.enum(['Individual', 'Business']),
  status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'VIP']).optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  leadId: z.string().optional()
});

const createCommunicationSchema = z.object({
  type: z.enum(['Email', 'Phone', 'Meeting', 'Note', 'Task', 'SMS', 'Video Call', 'Social Media']),
  direction: z.enum(['Inbound', 'Outbound']),
  subject: z.string().optional(),
  content: z.string().min(1),
  status: z.enum(['Pending', 'Completed', 'Cancelled', 'Scheduled']).optional(),
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  contactId: z.string().optional(),
  scheduledDate: z.string().transform((val) => {
    // Handle datetime-local format (YYYY-MM-DDTHH:mm) by adding seconds
    if (val && val.length === 16 && val.includes('T')) {
      return val + ':00.000Z';
    }
    return val;
  }).pipe(z.string().datetime()).optional(),
  duration: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  isImportant: z.boolean().optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().transform((val) => {
    // Handle datetime-local format (YYYY-MM-DDTHH:mm) by adding seconds
    if (val && val.length === 16 && val.includes('T')) {
      return val + ':00.000Z';
    }
    return val;
  }).pipe(z.string().datetime()).optional()
});

// Lead Controllers
export const getLeads = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, stage, assignedTo } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (stage) filter.stage = stage;
    if (assignedTo) filter.assignedTo = assignedTo;

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Lead.countDocuments(filter);

    res.json({
      success: true,
      data: {
        leads,
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
      message: 'Error fetching leads',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const validatedData = createLeadSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const lead = new Lead({
      ...validatedData,
      companyId,
      assignedTo: validatedData.assignedTo || userId,
      stage: validatedData.stage || 'New',
      status: 'Active',
      source: validatedData.source || 'Website',
      tags: [],
      expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : undefined
    });

    await lead.save();
    await lead.populate('assignedTo', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
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
      message: 'Error creating lead',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createLeadSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const lead = await Lead.findOneAndUpdate(
      { _id: id, companyId },
      {
        ...validatedData,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : undefined
      },
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
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
      message: 'Error updating lead',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const lead = await Lead.findOneAndDelete({ _id: id, companyId });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Contact Controllers
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contacts,
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
      message: 'Error fetching contacts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const validatedData = createContactSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const owner = (req as any).user._id;

    const contact = new Contact({
      ...validatedData,
      companyId,
      owner
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact }
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
      message: 'Error creating contact',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createContactSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const contact = await Contact.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact }
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
      message: 'Error updating contact',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const contact = await Contact.findOneAndDelete({ _id: id, companyId });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Dashboard analytics
export const getCrmDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Lead statistics
    const totalLeads = await Lead.countDocuments({ companyId });
    const newLeads = await Lead.countDocuments({ companyId, stage: 'New' });
    const qualifiedLeads = await Lead.countDocuments({ companyId, stage: 'Qualified' });
    const wonLeads = await Lead.countDocuments({ companyId, stage: 'Won' });

    // Lead stage distribution
    const leadStageDistribution = await Lead.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    // Lead source analysis
    const leadSourceAnalysis = await Lead.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    // Total contact count
    const totalContacts = await Contact.countDocuments({ companyId });

    // Total customer count
    const totalCustomers = await Customer.countDocuments({ companyId });

    // Recent leads (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentLeads = await Lead.countDocuments({
      companyId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Recent communications (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCommunications = await Communication.countDocuments({
      companyId,
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        statistics: {
          totalLeads,
          newLeads,
          qualifiedLeads,
          closedWonLeads: wonLeads,
          totalContacts,
          totalCustomers,
          recentLeads,
          recentCommunications
        },
        charts: {
          leadStatusDistribution: leadStageDistribution,
          leadSourceAnalysis
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching CRM dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Customer Controllers
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status, priority, type } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      data: {
        customers,
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
      message: 'Error fetching customers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const customer = new Customer({
      ...validatedData,
      companyId,
      assignedTo: userId,
      status: validatedData.status || 'Active',
      priority: validatedData.priority || 'Medium',
      tags: validatedData.tags || [],
      customerSince: new Date()
    });

    await customer.save();
    await customer.populate('assignedTo', 'firstName lastName email');

    // If this customer was converted from a lead, update the lead status
    if (validatedData.leadId) {
      await Lead.findByIdAndUpdate(validatedData.leadId, {
        status: 'closed_won',
        convertedAt: new Date(),
        convertedToCustomer: customer._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
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
      message: 'Error creating customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createCustomerSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const customer = await Customer.findOneAndUpdate(
      { _id: id, companyId },
      validatedData,
      { new: true }
    ).populate('assignedTo', 'firstName lastName email');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
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
      message: 'Error updating customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const customer = await Customer.findOneAndDelete({ _id: id, companyId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Communication Controllers
export const getCommunications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, type, leadId, customerId, contactId } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (type) filter.type = type;
    if (leadId) filter.leadId = leadId;
    if (customerId) filter.customerId = customerId;
    if (contactId) filter.contactId = contactId;

    const communications = await Communication.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('leadId', 'name email')
      .populate('customerId', 'firstName lastName email')
      .populate('contactId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Communication.countDocuments(filter);

    res.json({
      success: true,
      data: {
        communications,
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
      message: 'Error fetching communications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createCommunication = async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating communication with data:', JSON.stringify(req.body, null, 2));
    const validatedData = createCommunicationSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const communication = new Communication({
      ...validatedData,
      companyId,
      userId,
      status: validatedData.status || 'Completed',
      tags: validatedData.tags || [],
      scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : undefined,
      followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : undefined,
      completedDate: validatedData.status === 'Completed' ? new Date() : undefined
    });

    await communication.save();
    await communication.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'leadId', select: 'name email' },
      { path: 'customerId', select: 'firstName lastName email' },
      { path: 'contactId', select: 'firstName lastName email' }
    ]);

    // Update last contact date for related entities
    if (validatedData.leadId) {
      await Lead.findByIdAndUpdate(validatedData.leadId, { lastContactDate: new Date() });
    }
    if (validatedData.customerId) {
      await Customer.findByIdAndUpdate(validatedData.customerId, { lastContactDate: new Date() });
    }

    res.status(201).json({
      success: true,
      message: 'Communication logged successfully',
      data: { communication }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Communication validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating communication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCommunication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createCommunicationSchema.partial().parse(req.body);
    const companyId = (req as any).user.company;

    const updateData: any = {
      ...validatedData,
      scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : undefined,
      followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : undefined
    };

    if (validatedData.status === 'Completed') {
      updateData.completedDate = new Date();
    }

    const communication = await Communication.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    ).populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'leadId', select: 'name email' },
      { path: 'customerId', select: 'firstName lastName email' },
      { path: 'contactId', select: 'firstName lastName email' }
    ]);

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    res.json({
      success: true,
      message: 'Communication updated successfully',
      data: { communication }
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
      message: 'Error updating communication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCommunication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const communication = await Communication.findOneAndDelete({ _id: id, companyId });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: 'Communication not found'
      });
    }

    res.json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting communication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Pipeline conversion helper
export const convertLeadToCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const lead = await Lead.findOne({ _id: id, companyId });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (lead.status === 'Converted') {
      return res.status(400).json({
        success: false,
        message: 'Lead is already converted'
      });
    }

    // Check if customer with same email already exists in this company
    const existingCustomer = await Customer.findOne({ 
      email: lead.email, 
      companyId 
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: `Customer with email ${lead.email} already exists`
      });
    }

    // Create customer from lead
    const customer = new Customer({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.position,
      type: lead.company ? 'Business' : 'Individual',
      status: 'Active',
      priority: 'Medium',
      companyId,
      assignedTo: lead.assignedTo || userId,
      leadId: lead._id,
      notes: lead.notes,
      tags: [],
      customerSince: new Date()
    });

    await customer.save();

    // Update lead status
    lead.status = 'Converted';
    lead.stage = 'Won';
    lead.convertedDate = new Date();
    lead.convertedToCustomer = true;
    lead.customerId = customer._id as mongoose.Types.ObjectId;
    await lead.save();

    await customer.populate('assignedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Lead converted to customer successfully',
      data: { customer, lead }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error converting lead to customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
