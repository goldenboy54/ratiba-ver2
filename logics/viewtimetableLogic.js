import timetableModel from '../models/viewtimetableModel.js';

export const viewtimetable = async (filters) => {
  try {
    const timetables = await timetableModel.getTimetablesFromDB(filters);
    return timetables;
  } catch (error) {
    throw new Error('Error fetching timetables: ' + error.message);
  }
};

export const getDistinctValues = async (column) => {
  try {
    const values = await timetableModel.getDistinctValues(column);
    return values;
  } catch (error) {
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};
