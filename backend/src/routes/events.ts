import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  getEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getCalendarEvents,
  getEventsDashboard
} from '../controllers/eventsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Event routes
router.get('/', asyncHandler(getEvents));
router.post('/', asyncHandler(createEvent));
router.get('/upcoming', asyncHandler(getUpcomingEvents));
router.get('/calendar', asyncHandler(getCalendarEvents));
router.get('/dashboard', asyncHandler(getEventsDashboard));
router.get('/:id', asyncHandler(getEvent));
router.put('/:id', asyncHandler(updateEvent));
router.delete('/:id', asyncHandler(deleteEvent));

export default router;
