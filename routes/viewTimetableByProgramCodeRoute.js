import express from 'express';
import { getTimetableByProgramCode } from '../logics/viewTimetableByProgramCodeLogic.js';

const router = express.Router();

router.get('/timetable/by-program-code', async (req, res) => {
  try {
    const { programCode, semester } = req.query;

    const data = await getTimetableByProgramCode({ programCode, semester });

    res.render('viewTimetableByProgramCode', {
      programCode: programCode || '',
      semester: semester || '',
      timetables: data.timetables,
      uniqueDays: data.uniqueDays,
      allTimeSlots: data.allTimeSlots,
      breaks: data.breaks,
      programCodes: data.programCodes,
      semesters: data.semesters,
    });
  } catch (err) {
    console.error('Error in view timetable route:', err);
    res.status(500).render('error', { message: 'Failed to load timetable. Please try again.' });
  }
});

export default router;