import db from '../db.js';

export const getTimetablesContainingProgramCode = async (programCode, semester = null) => {
  let query = `
    SELECT * FROM extracted_timetables 
    WHERE LOWER(program_code) LIKE LOWER(?) 
  `;
  const params = [`%${programCode}%`];

  if (semester) {
    query += ' AND semester = ?';
    params.push(semester);
  }

  query += `
    ORDER BY 
      FIELD(day, 'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'), 
      start_time, 
      arrange ASC
  `;

  const [rows] = await db.query(query, params);
  return rows;
};

// Used by api/student-timetable - a separate function rather than extending
// getTimetablesContainingProgramCode above, which the existing /timetable/by-program-code
// admin page already depends on. Adds program_level and program_type as their own exact
// filters (extracted_timetables has both as real columns) on top of the same
// program_code LIKE match, since a student's program is identified by all three together,
// not program_code alone (e.g. distinguishing a full-time cohort from an evening one
// sharing a program_code prefix).
export const getTimetablesForStudentLookup = async (programCode, programLevel = null, programType = null, semester = null) => {
  let query = `
    SELECT * FROM extracted_timetables
    WHERE LOWER(program_code) LIKE LOWER(?)
  `;
  const params = [`%${programCode}%`];

  if (programLevel) {
    query += ' AND program_level = ?';
    params.push(programLevel);
  }
  if (programType) {
    query += ' AND program_type = ?';
    params.push(programType);
  }
  if (semester) {
    query += ' AND semester = ?';
    params.push(semester);
  }

  query += `
    ORDER BY
      FIELD(day, 'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'),
      start_time,
      arrange ASC
  `;

  const [rows] = await db.query(query, params);
  return rows;
};

export const getAllDistinctProgramCodes = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT program_code 
    FROM programs 
    WHERE program_code IS NOT NULL AND program_code != ''
    ORDER BY program_code
  `);
  return rows.map(r => r.program_code.trim());
};

export const getAllSemesters = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT semester 
    FROM extracted_timetables 
    WHERE semester IS NOT NULL AND semester != ''
    ORDER BY semester DESC
  `);
  return rows.map(r => r.semester.trim());
};