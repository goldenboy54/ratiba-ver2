import pool from '../db.js';
import db from '../db.js';

// Function to get all subjects
export const getAllSubjects = async () => {
  try {
    const dbquery = 'SELECT *,u.full_name AS full_name,u.department AS user_department,u.user_email AS user_email,u.role AS user_role,u.status AS user_status,subject_id, s.user_id, subject_code, title, credit, ltpa,total_hours_per_week, program_id AS program_id,program_type AS program_type,category AS program_department,program_capacity AS program_capacity,program_level,program_code AS program_code,duration AS program_duration, subject_department, type_prac_or_theory FROM subjects s JOIN users u ON s.user_id=u.user_id JOIN programs p ON s.program_id=program_id WHERE ltpa < total_hours_per_week ORDER BY subject_id DESC';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};



// models/subjectsModel.js

// Helper: get user by email
export const getUserByEmail = async (email) => {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE user_email = ? LIMIT 1`, [email]);
  return rows[0];
};

// Helper: get registered_subject by code
export const getRegisteredSubjectByCode = async (code) => {
  const [rows] = await pool.execute(
    `SELECT * FROM registered_subjects WHERE registered_subject_code = ? LIMIT 1`,
    [code]
  );
  return rows[0];
};

// Helper: get programs by codes (codes array)
export const getProgramsByCodes = async (codes) => {
  if (!Array.isArray(codes) || codes.length === 0) return [];
  // build placeholders
  const placeholders = codes.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT * FROM programs WHERE program_code IN (${placeholders})`,
    codes
  );
  return rows;
};

// check duplicate in subjects (same user, same subject_code, same semester)
// export const getSubjectByUniqueKeys = async (user_id, subject_code, semester) => {
//   const [rows] = await pool.execute(
//     `SELECT * FROM subjects WHERE user_id = ? AND subject_code = ? AND semester = ? LIMIT 1`,
//     [user_id, subject_code, semester]
//   );
//   return rows[0];
// };


// check duplicate (same user, same subject_code, same semester, same type, same program codes)
export const getSubjectByUniqueKeys = async (
  user_id,
  subject_code,
  semester,
  type_prac_or_theory,
  mixed_program_code
) => {
  const [rows] = await pool.execute(
    `SELECT * FROM subjects 
     WHERE user_id = ? 
       AND subject_code = ? 
       AND semester = ? 
       AND type_prac_or_theory = ?
       AND program_code = ?
     LIMIT 1`,
    [user_id, subject_code, semester, type_prac_or_theory, mixed_program_code]
  );
  return rows[0];
};


// Core: add subject to DB

export const addSubjectInDB = async (input) => {
  try {
    let user_id;
    let subject_code;
    let title;
    let credit = 0;
    let subject_department = "";
    let total_hours_per_week = 0;
    let semester = "I";
    let type_prac_or_theory = "Theory";
    let programRows = [];
    let program_ids_json = "[]";

    if (input.registered_subject) {
      user_id = input.user_id;
      subject_code = input.registered_subject.registered_subject_code;
      title = input.registered_subject.registered_subject_name;
      credit = Number(input.registered_subject.credit) || 0;
      subject_department =
        input.registered_subject.registered_subject_department || "";
      total_hours_per_week = Number(input.total_hours_per_week) || 0;
      semester = input.semester;
      type_prac_or_theory = input.type_prac_or_theory;
      programRows = input.programRows;
      program_ids_json = JSON.stringify(programRows.map((p) => p.program_id));
    } else {
      throw new Error("Invalid input for addSubjectInDB.");
    }

    const smartCombine = (f) => {
      const vals = programRows
        .map((p) => (p[f] || "").trim())
        .filter(Boolean);
      const unique = [...new Set(vals)];
      return unique.length <= 1 ? unique[0] || "" : unique.join(" + ");
    };

    const mixed_program_name = smartCombine("program_name");
    const mixed_program_code = smartCombine("program_code");
    const mixed_program_level =
      smartCombine("level") || smartCombine("program_level");
    const mixed_program_category =
      smartCombine("category") || smartCombine("program_category");
    const mixed_program_type =
      smartCombine("program_type") || smartCombine("type");
    const mixed_program_duration =
      smartCombine("duration") || smartCombine("program_duration");

    const totalProgramCapacity = programRows.reduce(
      (sum, p) => sum + (Number(p.program_capacity) || 0),
      0
    );

    const insertQuery = `
      INSERT INTO subjects
      (user_id, subject_code, title, credit, total_hours_per_week, program_id,
       subject_department, type_prac_or_theory, semester,
       program_name, program_code, program_level, program_category, program_type, program_duration,
       program_capacity, ltpa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      user_id,
      subject_code,
      title,
      credit,
      total_hours_per_week,
      program_ids_json,
      subject_department,
      type_prac_or_theory,
      semester,
      mixed_program_name,
      mixed_program_code,
      mixed_program_level,
      mixed_program_category,
      mixed_program_type,
      mixed_program_duration,
      totalProgramCapacity,
      0.0
    ]);

    return result;
  } catch (err) {
    console.error("addSubjectInDB error:", err);
    throw err;
  }
};


// export const addSubjectInDB = async (input) => {
//   /**
//    * input can be either:
//    * 1) { user_id, subject_id, total_hours_per_week, type_prac_or_theory, semester, program_ids }
//    * OR
//    * 2) { user_id, registered_subject, total_hours_per_week, semester, type_prac_or_theory, programRows }
//    *
//    * We'll support both to be compatible with form and file upload.
//    */
//   try {
//     let user_id;
//     let subject_code;
//     let title;
//     let credit = 0;
//     let subject_department = '';
//     let total_hours_per_week = 0;
//     let semester = 'I';
//     let type_prac_or_theory = 'Theory';
//     let programRows = [];
//     let program_ids_json = '[]';

//     if (input.registered_subject) {
//       // from file upload
//       user_id = input.user_id;
//       subject_code = input.registered_subject.registered_subject_code;
//       title = input.registered_subject.registered_subject_name;
//       credit = Number(input.registered_subject.credit) || 0;
//       subject_department = input.registered_subject.registered_subject_department || '';
//       total_hours_per_week = Number(input.total_hours_per_week) || 0;
//       semester = input.semester || 'I';
//       type_prac_or_theory = input.type_prac_or_theory || 'Theory';
//       programRows = input.programRows || [];
//       program_ids_json = JSON.stringify(programRows.map(p => p.program_id));
//     } else if (input.subject_id) {
//       // from form: subject_id refers to registered_subjects.registered_subject_id
//       user_id = input.user_id;
//       const [subRows] = await pool.execute(`SELECT * FROM registered_subjects WHERE registered_subject_id = ? LIMIT 1`, [input.subject_id]);
//       if (!subRows || subRows.length === 0) throw new Error('Registered subject not found.');
//       const sub = subRows[0];
//       subject_code = sub.registered_subject_code;
//       title = sub.registered_subject_name;
//       credit = Number(sub.credit) || 0;
//       subject_department = sub.registered_subject_department || '';
//       total_hours_per_week = Number(input.total_hours_per_week) || 0;
//       semester = input.semester || 'I';
//       type_prac_or_theory = input.type_prac_or_theory || 'Theory';
//       // program_ids array expected
//       programRows = [];
//       if (Array.isArray(input.program_ids) && input.program_ids.length) {
//         const placeholders = input.program_ids.map(() => '?').join(',');
//         const [programRowsDB] = await pool.execute(`SELECT * FROM programs WHERE program_id IN (${placeholders})`, input.program_ids);
//         programRows = programRowsDB;
//         program_ids_json = JSON.stringify(programRows.map(p => p.program_id));
//       } else {
//         program_ids_json = '[]';
//       }
//     } else {
//       throw new Error('Invalid input for addSubjectInDB.');
//     }

//     // combine program fields
//     const smartCombine = (field) => {
//       const vals = programRows.map(p => (p[field] || '').toString().trim()).filter(Boolean);
//       const unique = [...new Set(vals)];
//       if (unique.length === 0) return '';
//       if (unique.length === 1) return unique[0];
//       return unique.join(' + ');
//     };

//     const mixed_program_name = smartCombine('program_name');
//     const mixed_program_code = smartCombine('program_code');
//     const mixed_program_level = smartCombine('level') || smartCombine('program_level');
//     const mixed_program_category = smartCombine('category') || '';
//     const mixed_program_type = smartCombine('program_type') || '';
//     const mixed_program_duration = smartCombine('duration') || '';

//     const totalProgramCapacity = programRows.reduce((sum, p) => sum + (Number(p.program_capacity) || 0), 0);

//     // ltpa default 0.00; subject_id is AUTO_INCREMENT pk
//     const insertQuery = `
//       INSERT INTO subjects
//       (user_id, subject_code, title, credit, total_hours_per_week, program_id,
//        subject_department, type_prac_or_theory, semester,
//        program_name, program_code, program_level, program_category, program_type, program_duration,
//        program_capacity, ltpa)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       user_id,
//       subject_code,
//       title,
//       Number(credit) || 0,
//       Number(total_hours_per_week) || 0,
//       program_ids_json, // stored as text
//       subject_department,
//       type_prac_or_theory,
//       semester,
//       mixed_program_name,
//       mixed_program_code,
//       mixed_program_level,
//       mixed_program_category,
//       mixed_program_type,
//       mixed_program_duration,
//       totalProgramCapacity,
//       0.00 // ltpa default
//     ];

//     const [result] = await pool.execute(insertQuery, values);
//     return result;
//   } catch (err) {
//     console.error('addSubjectInDB error:', err);
//     throw err;
//   }
// };



// Function to add a subject
export const addSubject = async (subject) => {
  const {
    user_id,
    subject_id,
    total_hours_per_week,
    program_ids,
    type_prac_or_theory,
    semester,
  } = subject;

  if (!Array.isArray(program_ids) || program_ids.length === 0) {
    throw new Error("Please select at least one program.");
  }

  if (!user_id || !subject_id || !total_hours_per_week || !type_prac_or_theory || !semester) {
    throw new Error("Missing required subject fields.");
  }

  try {
    // ================= FETCH SUBJECT ======================
    const [subRows] = await pool.execute(
      `SELECT * FROM registered_subjects WHERE registered_subject_id = ?`,
      [subject_id]
    );

    if (subRows.length === 0) throw new Error("Selected subject not found.");
    const sub = subRows[0];

    // ================= FETCH PROGRAMS ======================
    const placeholders = program_ids.map(() => "?").join(",");
    const [programRows] = await pool.execute(
      `SELECT * FROM programs WHERE program_id IN (${placeholders})`,
      program_ids
    );

    if (programRows.length !== program_ids.length) {
      throw new Error("Some selected programs were not found.");
    }



    // =================================================================================
    //          🔥 CLEAN FUNCTION: REMOVE DUPLICATE VALUES AND MERGE SMARTLY
    // =================================================================================
    const smartCombine = (field) => {
      const unique = [...new Set(programRows.map((p) => p[field]?.trim() || ""))];

      if (unique.length === 1) return unique[0];     // kama zote zinafanana → chukua moja tu
      return unique.join(" + ");                     // kama zinatofautiana → join kwa "+"
    };

    // =================================================================================
    //          🔥 CALCULATE PROGRAM CAPACITY (SUM OF ALL PROGRAM CAPACITIES)
    // =================================================================================
    const totalProgramCapacity = programRows
      .reduce((sum, p) => sum + (Number(p.program_capacity) || 0), 0);

    // ================= CREATE MIXED FIELDS ======================
    const mixed_program_name = smartCombine("program_name");
    const mixed_program_code = smartCombine("program_code");
    const mixed_program_level = smartCombine("level");
    const mixed_program_category = smartCombine("category");
    const mixed_program_type = smartCombine("program_type");
    const mixed_program_duration = smartCombine("duration");

    // ================= INSERT INTO subjects ======================
    const insertQuery = `
      INSERT INTO subjects
      (user_id, subject_code, title, credit, total_hours_per_week, program_id,
       subject_department, type_prac_or_theory, semester,
       program_name, program_code, program_level, program_category, program_type, program_duration,
       program_capacity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user_id,
      sub.registered_subject_code,
      sub.registered_subject_name,
      sub.credit ?? 0,
      total_hours_per_week,
      JSON.stringify(program_ids),
      sub.registered_subject_department ?? "",
      type_prac_or_theory,
      semester,
      mixed_program_name,
      mixed_program_code,
      mixed_program_level,
      mixed_program_category,
      mixed_program_type,
      mixed_program_duration,
      totalProgramCapacity, // 🔥 HAPA NDO PROGRAM CAPACITY YA JUMLA
    ];

    await pool.execute(insertQuery, values);

    console.log("MIXED subject assigned successfully!");
    return { success: true, message: "Subject assigned successfully." };

  } catch (err) {
    console.error("Error adding subject:", err);
    throw new Error("Failed to assign subject: " + err.message);
  }
};


// Function to update a subject
export const updateSubject = async (id, subject) => {
  const { user_id, subject_code, title, credit, total_hours_per_week, program_id, subject_department, type_prac_or_theory, semester } = subject;

  // Replace undefined with null
  const valuesArray = [
    user_id,
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
console.log(valuesArray);
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
      program_id AS program_id, program_name AS program_name,program_type AS program_type,
     program_level,program_duration, program_category,
      subject_department AS department_name, 
      type_prac_or_theory AS subject_type
    FROM 
      subjects s 
    JOIN 
      users u ON s.user_id = u.user_id 
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
    query += ' AND program_type = ?';
    params.push(filters.program_type);
  }

  if (filters.program_name) {
    query += ' AND program_name = ?';
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

  if (filters.subject_code) {
  query += ' AND subject_code = ?';
  params.push(filters.subject_code);
}


  if (filters.category) {
    query += ' AND program_category = ?';
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
      users u ON s.user_id = u.user_id  ORDER BY ${column} ASC
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







// export const addSubject = async (subject) => {
//   const { user_id, subject_id, total_hours_per_week, program_ids, type_prac_or_theory, semester } = subject;

//   if (!Array.isArray(program_ids) || program_ids.length === 0) {
//     throw new Error("Please select at least one program.");
//   }

//   console.log(program_ids);

//   for (const program_id of program_ids) {
//     try {
//       // Fetch subject details
//       const subjectQuery = `SELECT * FROM registered_subjects WHERE registered_subject_id = ?`;
//       const [subjectRows] = await pool.execute(subjectQuery, [subject_id]);

//       if (subjectRows.length === 0) {
//         throw new Error(`Subject with ID ${subject_id} not found.`);
//       }

//       // Extract subject details
//       const subjectDetails = subjectRows[0];
//       const subject_code = subjectDetails.registered_subject_code;
//       const title = subjectDetails.registered_subject_name;
//       const credit = subjectDetails.credit;
//       const subject_department = subjectDetails.registered_subject_department;

//       // Replace undefined with null
//       const valuesArray = [
//         user_id,
//         subject_code,
//         title,
//         credit,
//         total_hours_per_week,
//         program_id,
//         subject_department,
//         type_prac_or_theory,
//         semester
//       ];

//       // Insert into subjects table
//       const dbquery = `
//         INSERT INTO subjects 
//         (user_id, subject_code, title, credit, total_hours_per_week, program_id, subject_department, type_prac_or_theory, semester) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       const [results] = await pool.execute(dbquery, valuesArray);
      
//       // Logging success for each program_id
//       console.log(`Subject added successfully for program ID ${program_id}`);
//     } catch (err) {
//       console.error(`Error adding subject for program ID ${program_id}:`, err);
//       throw err;
//     }
//   }
// };
