import timetableModel from '../models/timetableModel.js';

export const searchTimetables = async (filters) => {
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
