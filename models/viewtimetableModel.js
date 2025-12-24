import db from '../db.js';

/**
 * Get timetables with optional filters
 */
// const getTimetablesFromDB = async (filters) => {
//   let query = 'SELECT * FROM extracted_timetables WHERE 1=1';
//   const params = [];

//   // Smart filter for program_name (handles combined entries)
//   if (filters.program_name) {
//     query += ' AND LOWER(program_name) LIKE ?';
//     params.push(`%${filters.program_name.toLowerCase()}%`);
//   }

//   if (filters.program_level) {
//     query += ' AND program_level = ?';
//     params.push(filters.program_level);
//   }
//   if (filters.venue_name) {
//     query += ' AND venue_name = ?';
//     params.push(filters.venue_name);
//   }
//   if (filters.tutor_name) {
//     query += ' AND tutor_name = ?';
//     params.push(filters.tutor_name);
//   }
//   if (filters.department_name) {
//     query += ' AND department_name = ?';
//     params.push(filters.department_name);
//   }
//   if (filters.subject_name) {
//     query += ' AND subject_name = ?';
//     params.push(filters.subject_name);
//   }
//   if (filters.semester) {
//     query += ' AND semester = ?';
//     params.push(filters.semester);
//   }
//   if (filters.program_type) {
//     query += ' AND program_type = ?';
//     params.push(filters.program_type);
//   }

//   query += ' ORDER BY start_time,end_time,arrange ASC';

//   try {
//     const [timetables] = await db.query(query, params);
//     return timetables;
//   } catch (err) {
//     throw new Error('Database query failed: ' + err.message);
//   }
// };


const getTimetablesFromDB = async (filters) => {
  let query = 'SELECT * FROM extracted_timetables WHERE 1=1';
  const params = [];

  // Program Name (smart match)
  if (filters.program_name) {
    query += ' AND LOWER(program_name) LIKE ?';
    params.push(`%${filters.program_name.toLowerCase()}%`);
  }

  if (filters.program_level) {
    query += ' AND LOWER(program_level) LIKE ?';
    params.push(`%${filters.program_level.toLowerCase()}%`);
  }

  if (filters.venue_name) {
    query += ' AND LOWER(venue_name) LIKE ?';
    params.push(`%${filters.venue_name.toLowerCase()}%`);
  }

  if (filters.tutor_name) {
    query += ' AND LOWER(tutor_name) LIKE ?';
    params.push(`%${filters.tutor_name.toLowerCase()}%`);
  }

  if (filters.department_name) {
    query += ' AND LOWER(department_name) LIKE ?';
    params.push(`%${filters.department_name.toLowerCase()}%`);
  }

  if (filters.subject_name) {
    query += ' AND LOWER(subject_name) LIKE ?';
    params.push(`%${filters.subject_name.toLowerCase()}%`);
  }

  if (filters.semester) {
    query += ' AND LOWER(semester) LIKE ?';
    params.push(`%${filters.semester.toLowerCase()}%`);
  }

  if (filters.program_type) {
    query += ' AND LOWER(program_type) LIKE ?';
    params.push(`%${filters.program_type.toLowerCase()}%`);
  }

  query += ' ORDER BY start_time, end_time, arrange ASC';

  try {
    const [timetables] = await db.query(query, params);
    return timetables;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};

/**
 * Get distinct values from a column
 */
const getDistinctValues = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM extracted_timetables`);
    return values;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};

/**
 * Get distinct program names, parsed from combined entries
 */
const getDistinctPrograms = async () => {
  try {
    //const [rows] = await db.query(`SELECT DISTINCT program_name FROM extracted_timetables`);
    const [rows] = await db.query(`SELECT DISTINCT program_name FROM programs`);

    const programsSet = new Set();

    rows.forEach(row => {
      if (!row.program_name) return;

      // Split combined entries by "+"
      const splitPrograms = row.program_name.split(/\s*\+\s*/);

      splitPrograms.forEach(p => {
        // Remove trailing counts in brackets, e.g. "Program Name (4)" -> "Program Name"
        const cleanName = p.replace(/\s*\(\d+\)$/, '').trim();
        if (cleanName) programsSet.add(cleanName);
      });
    });

    // Return sorted array of distinct programs
    return Array.from(programsSet).sort();
  } catch (err) {
    throw new Error('Failed to get distinct programs: ' + err.message);
  }
};

export default {
  getTimetablesFromDB,
  getDistinctValues,
  getDistinctPrograms,
};




// import db from '../db.js';

// const getTimetablesFromDB = async (filters) => {
//   let query = 'SELECT * FROM extracted_timetables WHERE 1=1';
//   const params = [];

//   if (filters.program_name) {
//   query += ' AND LOWER(program_name) LIKE ?';
//   params.push(`%${filters.program_name.toLowerCase()}%`);
// }

//   if (filters.program_level) {
//     query += ' AND program_level = ?';
//     params.push(filters.program_level);
//   }
//   if (filters.venue_name) {
//     query += ' AND venue_name = ?';
//     params.push(filters.venue_name);
//   }
//   if (filters.tutor_name) {
//     query += ' AND tutor_name = ?';
//     params.push(filters.tutor_name);
//   }
//   if (filters.department_name) {
//     query += ' AND department_name = ?';
//     params.push(filters.department_name);
//   }
//   if (filters.subject_name) {
//     query += ' AND subject_name = ?';
//     params.push(filters.subject_name);
//   }

//   if (filters.semester) {
//     query += ' AND semester = ?';
//     params.push(filters.semester);
//   }

//   if (filters.program_type) {
//     query += ' AND program_type = ?';
//     params.push(filters.program_type);
//   }

//   query += ' ORDER BY arrange,start_time ASC';


//   try {
//     const [timetables] = await db.query(query, params);
//     return timetables;
//   } catch (err) {
//     throw new Error('Database query failed');
//   }
// };

// const getDistinctValues = async (column) => {
//   try {
//     const [values] = await db.query(`SELECT DISTINCT ${column} FROM extracted_timetables`);
//     return values;
//   } catch (err) {
//     throw new Error('Database query failed');
//   }
// };

// export default {
//   getTimetablesFromDB,
//   getDistinctValues,
// };
