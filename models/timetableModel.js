// models/timetableModel.js
import db from '../db.js';

const getTimetablesFromDB = async (filters) => {
  let query = 'SELECT * FROM extracted_timetables WHERE 1=1';
  const params = [];

  if (filters.program_name) {
    query += ' AND LOWER(program_name) LIKE ?';
    params.push(`%${filters.program_name.toLowerCase()}%`);
  }

  if (filters.program_level) {
    query += ' AND program_level = ?';
    params.push(filters.program_level);
  }

  if (filters.venue_name) {
    query += ' AND venue_name = ?';
    params.push(filters.venue_name);
  }
  if (filters.tutor_name) {
    query += ' AND tutor_name = ?';
    params.push(filters.tutor_name);
  }
  if (filters.department_name) {
    query += ' AND department_name = ?';
    params.push(filters.department_name);
  }
  if (filters.subject_name) {
    query += ' AND subject_name = ?';
    params.push(filters.subject_name);
  }

    if (filters.subject_code) {
    query += ` AND subject_code = ?`;
    params.push(filters.subject_code);
  }

  if (filters.semester) {
    query += ' AND semester = ?';
    params.push(filters.semester);
  }
  if (filters.program_type) {
    query += ' AND program_type = ?';
    params.push(filters.program_type);
  }

  query += ' ORDER BY arrange, slot ASC';

  try {
    const [rows] = await db.query(query, params);
    return rows;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

const getDistinctValues = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM extracted_timetables`);
    return values;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

export default { getTimetablesFromDB, getDistinctValues };

