import viewtimetableModel from '../models/viewtimetableModel.js';
//import timetableModel from '../models/viewtimetableModel.js';
import db from '../db.js';

export const viewtimetable = async (filters) => {
  try {
    const timetables = await viewtimetableModel.getTimetablesFromDB(filters);
    return timetables;
  } catch (error) {
    throw new Error('Error fetching timetables: ' + error.message);
  }
};

export const getDistinctValues = async (column) => {
  try {
    const values = await viewtimetableModel.getDistinctValues(column);
    return values;
  } catch (error) {
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};



export const getDistinctPrograms = async () => {
  try {
    // Get raw distinct names from timetables
    const [rows] = await db.query(`
      SELECT DISTINCT program_name
      FROM extracted_timetables
      WHERE program_name IS NOT NULL AND program_name != ''
      ORDER BY program_name
    `);

    // Optional: clean/split combined names like "CS + IT"
    const programs = new Set();

    rows.forEach(row => {
      if (!row.program_name) return;
      const parts = row.program_name.split(/\s*\+\s*/);
      parts.forEach(p => {
        const clean = p.replace(/\s*\(\d+\)$/, '').trim(); // remove (4), (12) etc.
        if (clean) programs.add(clean);
      });
    });

    // Convert to array of objects (to stay compatible with your current EJS)
    return Array.from(programs)
      .sort()
      .map(name => ({ program_name: name, program_code: null })); // code is optional
  } catch (err) {
    throw new Error('Failed to get distinct programs: ' + err.message);
  }
};

// logic/viewtimetableLogic.js

// export const getDistinctPrograms = async () => {
//   try {
//     const [rows] = await db.query(`SELECT DISTINCT program_name, program_code FROM programs`);

//     // Optional: map or clean duplicates if needed
//     const programsMap = new Map();
//     rows.forEach(row => {
//       if (!programsMap.has(row.program_name)) {
//         programsMap.set(row.program_name, row.program_code);
//       }
//     });

//     // Return array of objects with name + code
//     return Array.from(programsMap, ([program_name, program_code]) => ({ program_name, program_code }));
//   } catch (err) {
//     throw new Error('Failed to get distinct programs: ' + err.message);
//   }
// };
