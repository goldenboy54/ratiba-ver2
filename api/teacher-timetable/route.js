import express from 'express';
import { getTeacherTimetable } from './logic.js';
import { sendSuccess, sendError } from '../shared/respond.js';

const router = express.Router();

// GET /api/v1/teacher-timetable?tutor_name=...&semester=...
router.get('/', async (req, res) => {
  try {
    const data = await getTeacherTimetable({
      tutor_name: req.query.tutor_name,
      semester: req.query.semester,
    });
    return sendSuccess(res, data);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('GET /api/v1/teacher-timetable failed:', err);
    return sendError(res, status === 500 ? 'Failed to fetch teacher timetable.' : err.message, status);
  }
});

export default router;
