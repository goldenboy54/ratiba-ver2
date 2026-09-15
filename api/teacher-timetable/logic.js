// Logic layer for GET /api/v1/teacher-timetable. Validates input, calls the existing
// models/timetableModel.js query (unchanged - it already does exactly what this needs),
// and shapes the raw DB rows into this endpoint's own response contract so callers never
// see internal column names directly.
import timetableModel from '../../models/timetableModel.js';

export async function getTeacherTimetable({ tutor_name, semester }) {
  const tutorName = (tutor_name || '').trim();
  if (!tutorName) {
    const err = new Error('tutor_name is required.');
    err.status = 400;
    throw err;
  }

  // tutor_name is matched with exact equality in the model (not a partial/LIKE match) -
  const rows = await timetableModel.getTimetablesFromDB({
    tutor_name: tutorName,
    semester: (semester || '').trim() || undefined,
  });

  return rows.map(row => ({
    day: row.day,
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
    endTime: row.end_time ? String(row.end_time).slice(0, 5) : null,
    subject: { code: row.subject_code, name: row.subject_name },
    venue: { name: row.venue_name, location: row.venue_location },
    tutor: row.tutor_name,
    program: { code: row.program_code, level: row.program_level, type: row.program_type },
    semester: row.semester,
  }));
}
