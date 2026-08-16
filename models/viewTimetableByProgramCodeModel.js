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