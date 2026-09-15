// Logic layer for GET /api/v1/student-timetable. This system has no individual student
// accounts, so a "student's timetable" is really their program's timetable - identified by
// program_code (required) plus program_level and program_type (optional refinements),
// matching the design confirmed before building this. Validates input, calls the new
// models/viewTimetableByProgramCodeModel.js query, and shapes rows into the same response
// contract as the teacher endpoint.
import { getTimetablesForStudentLookup } from '../../models/viewTimetableByProgramCodeModel.js';

export async function getStudentTimetable({ program_code, program_level, program_type, semester }) {
  const programCode = (program_code || '').trim();
  if (!programCode) {
    const err = new Error('program_code is required.');
    err.status = 400;
    throw err;
  }

  const rows = await getTimetablesForStudentLookup(
    programCode,
    (program_level || '').trim() || null,
    (program_type || '').trim() || null,
    (semester || '').trim() || null,
  );

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
