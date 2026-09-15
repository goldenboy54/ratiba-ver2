import express from 'express';
import { getStudentTimetable } from './logic.js';
import { sendSuccess, sendError } from '../shared/respond.js';

const router = express.Router();

// GET /api/v1/student-timetable?program_code=...&program_level=...&program_type=...&semester=...
router.get('/', async (req, res) => {
  try {
    const data = await getStudentTimetable({
      program_code: req.query.program_code,
      program_level: req.query.program_level,
      program_type: req.query.program_type,
      semester: req.query.semester,
    });
    return sendSuccess(res, data);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error('GET /api/v1/student-timetable failed:', err);
    return sendError(res, status === 500 ? 'Failed to fetch student timetable.' : err.message, status);
  }
});

export default router;
