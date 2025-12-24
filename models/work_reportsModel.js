import pool from '../db.js';
import db from '../db.js';
// Function to get all subjects
export const getAllSubjects = async () => {
  try {
    const dbquery = 'SELECT *,u.full_name AS full_name,u.department AS user_department,u.user_email AS user_email,u.role AS user_role,u.status AS user_status,subject_id, s.user_id, subject_code, title, credit, ltpa,total_hours_per_week, p.program_id AS program_id,p.program_type AS program_type,p.category AS program_department,p.program_capacity AS program_capacity,p.level AS program_level,p.program_code AS program_code,p.duration AS program_duration, subject_department, type_prac_or_theory FROM subjects s JOIN users u ON s.user_id=u.user_id JOIN programs p ON s.program_id=p.program_id WHERE ltpa < total_hours_per_week ORDER BY subject_id DESC';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
// Function to add a subject
export const addSubject = async (subject) => {
  const { user_id, subject_id, total_hours_per_week, program_ids, type_prac_or_theory, semester } = subject;

  if (!Array.isArray(program_ids) || program_ids.length === 0) {
    throw new Error("Please select at least one program.");
  }

  console.log(program_ids);

  for (const program_id of program_ids) {
    try {
      // Fetch subject details
      const subjectQuery = `SELECT * FROM registered_subjects WHERE registered_subject_id = ?`;
      const [subjectRows] = await pool.execute(subjectQuery, [subject_id]);

      if (subjectRows.length === 0) {
        throw new Error(`Subject with ID ${subject_id} not found.`);
      }

      // Extract subject details
      const subjectDetails = subjectRows[0];
      const subject_code = subjectDetails.registered_subject_code;
      const title = subjectDetails.registered_subject_name;
      const credit = subjectDetails.credit;
      const subject_department = subjectDetails.registered_subject_department;

      // Replace undefined with null
      const valuesArray = [
        user_id,
        subject_code,
        title,
        credit,
        total_hours_per_week,
        program_id,
        subject_department,
        type_prac_or_theory,
        semester
      ];

      // Insert into subjects table
      const dbquery = `
        INSERT INTO subjects 
        (user_id, subject_code, title, credit, total_hours_per_week, program_id, subject_department, type_prac_or_theory, semester) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [results] = await pool.execute(dbquery, valuesArray);
      
      // Logging success for each program_id
      console.log(`Subject added successfully for program ID ${program_id}`);
    } catch (err) {
      console.error(`Error adding subject for program ID ${program_id}:`, err);
      throw err;
    }
  }
};



// Function to update a subject
export const updateSubject = async (id, subject) => {
  const { user_id, subject_code, title, credit, total_hours_per_week, program_id, subject_department, type_prac_or_theory, semester } = subject;

  // Replace undefined with null
  const valuesArray = [
    user_id ?? null,
    subject_code ?? null,
    title ?? null,
    credit ?? null,
    total_hours_per_week ?? null,
    program_id ?? null,
    subject_department ?? null,
    type_prac_or_theory ?? null,
    semester ?? null,
    id
  ];

  try {
    const dbquery = 'UPDATE subjects SET user_id=?, subject_code=?, title=?, credit=?, total_hours_per_week=?, program_id=?, subject_department=?, type_prac_or_theory=?, semester=? WHERE subject_id = ?';
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to delete a subject
export const deleteSubject = async (id) => {
  try {
    const dbquery = 'DELETE FROM subjects WHERE subject_id = ?';
    const valuesArray = [id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};





const getTimetablesFromDB = async (filters) => {
  let query = `
    SELECT 
      *, semester,
      u.full_name AS user_name, 
      subject_id, 
      s.user_id, 
      subject_code, 
      title AS subject_name, 
      credit, 
      total_hours_per_week, 
      p.program_id AS program_id, p.program_name AS program_name,p.program_type AS program_type,
      p.level AS program_level,p.duration AS program_duration,p.category AS program_category,
      subject_department AS department_name, 
      type_prac_or_theory AS subject_type
    FROM 
      subjects s 
    JOIN 
      users u ON s.user_id = u.user_id 
    JOIN programs p ON s.program_id = p.program_id
    WHERE 
      1 = 1 
  `;
  const params = [];


  // Apply filters
  if (filters.user_name) {
    query += ' AND u.full_name = ?';
    params.push(filters.user_name);
  }
  if (filters.semester) {
    query += ' AND semester = ?';
    params.push(filters.semester);
  }
  if (filters.program_type) {
    query += ' AND p.program_type = ?';
    params.push(filters.program_type);
  }

  if (filters.program_name) {
    query += ' AND p.program_name = ?';
    params.push(filters.program_name);
  }
  if (filters.program_level) {
    query += ' AND program_level = ?';
    params.push(filters.program_level);
  }
  if (filters.subject_department) {
    query += ' AND subject_department = ?';
    params.push(filters.subject_department);
  }
  if (filters.title) {
    query += ' AND title = ?';
    params.push(filters.title);
  }
  if (filters.category) {
    query += ' AND p.category = ?';
    params.push(filters.category);
  }
  // Add ORDER BY clause at the end
  query += ' ORDER BY user_name ASC';

  try {
    const [timetables] = await db.query(query, params);
    return timetables;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};




const getDistinctValues = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM subjects s 
    JOIN 
      users u ON s.user_id = u.user_id  
      JOIN
            programs p ON s.program_id = p.program_id  

       `);
    return values;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

export default {
  getTimetablesFromDB,
  getDistinctValues,
};
