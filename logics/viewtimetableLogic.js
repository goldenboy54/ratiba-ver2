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


// logic/viewtimetableLogic.js

export const getDistinctPrograms = async () => {
  try {
    const [rows] = await db.query(`SELECT DISTINCT program_name, program_code FROM programs`);

    // Optional: map or clean duplicates if needed
    const programsMap = new Map();
    rows.forEach(row => {
      if (!programsMap.has(row.program_name)) {
        programsMap.set(row.program_name, row.program_code);
      }
    });

    // Return array of objects with name + code
    return Array.from(programsMap, ([program_name, program_code]) => ({ program_name, program_code }));
  } catch (err) {
    throw new Error('Failed to get distinct programs: ' + err.message);
  }
};
