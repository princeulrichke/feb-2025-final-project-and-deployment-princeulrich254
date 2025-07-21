import { Request, Response } from 'express';
import { Event } from '../models/Event';
import { z } from 'zod';

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['meeting', 'conference', 'training', 'deadline', 'reminder', 'other']).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1),
    endDate: z.string().datetime().optional()
  }).optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification']),
    minutesBefore: z.number().min(0)
  })).optional()
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['meeting', 'conference', 'training', 'deadline', 'reminder', 'other']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    interval: z.number().min(1),
    endDate: z.string().datetime().optional()
  }).optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification']),
    minutesBefore: z.number().min(0)
  })).optional()
});

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status, 
      startDate, 
      endDate,
      organizer,
      priority 
    } = req.query;
    const companyId = (req as any).user.company;

    const filter: any = { companyId };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (organizer) filter.organizer = organizer;
    
    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate as string);
      if (endDate) filter.startDate.$lte = new Date(endDate as string);
    }

    const events = await Event.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: {
        events,
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
      message: 'Error fetching events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const validatedData = createEventSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const event = new Event({
      ...validatedData,
      companyId,
      organizer: userId,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      ...(validatedData.recurrencePattern?.endDate && {
        recurrencePattern: {
          ...validatedData.recurrencePattern,
          endDate: new Date(validatedData.recurrencePattern.endDate)
        }
      })
    });

    await event.save();
    await event.populate('organizer', 'firstName lastName email');
    await event.populate('attendees', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
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
      message: 'Error creating event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;

    const event = await Event.findOne({ _id: id, companyId })
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateEventSchema.parse(req.body);
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    // Check if user is organizer or has permission to update
    const existingEvent = await Event.findOne({ _id: id, companyId });
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only organizer can update event (add role-based permission later)
    if (existingEvent.organizer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can update this event'
      });
    }

    const updateData = {
      ...validatedData,
      ...(validatedData.startDate && { startDate: new Date(validatedData.startDate) }),
      ...(validatedData.endDate && { endDate: new Date(validatedData.endDate) }),
      ...(validatedData.recurrencePattern?.endDate && {
        recurrencePattern: {
          ...validatedData.recurrencePattern,
          endDate: new Date(validatedData.recurrencePattern.endDate)
        }
      })
    };

    const event = await Event.findOneAndUpdate(
      { _id: id, companyId },
      updateData,
      { new: true }
    )
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
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
      message: 'Error updating event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    const event = await Event.findOne({ _id: id, companyId });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Only organizer can delete event (add role-based permission later)
    if (event.organizer.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can delete this event'
      });
    }

    await Event.findOneAndDelete({ _id: id, companyId });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;
    const { limit = 10 } = req.query;

    const upcomingEvents = await Event.find({
      companyId,
      status: 'scheduled',
      startDate: { $gte: new Date() },
      $or: [
        { organizer: userId },
        { attendees: userId }
      ]
    })
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: { events: upcomingEvents }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = (req as any).user.company;
    const userId = (req as any).user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const events = await Event.find({
      companyId,
      $or: [
        { organizer: userId },
        { attendees: userId }
      ],
      startDate: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    })
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getEventsDashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company;

    // Event statistics
    const totalEvents = await Event.countDocuments({ companyId });
    const scheduledEvents = await Event.countDocuments({ companyId, status: 'scheduled' });
    const completedEvents = await Event.countDocuments({ companyId, status: 'completed' });
    const cancelledEvents = await Event.countDocuments({ companyId, status: 'cancelled' });

    // Upcoming events (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingEvents = await Event.countDocuments({
      companyId,
      status: 'scheduled',
      startDate: { $gte: new Date(), $lte: nextWeek }
    });

    // Events by type
    const eventsByType = await Event.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Events by priority
    const eventsByPriority = await Event.aggregate([
      { $match: { companyId, status: 'scheduled' } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalEvents,
          scheduledEvents,
          completedEvents,
          cancelledEvents,
          upcomingEvents
        },
        charts: {
          eventsByType,
          eventsByPriority
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
