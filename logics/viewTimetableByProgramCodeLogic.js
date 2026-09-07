import {
  getTimetablesContainingProgramCode,
  getAllDistinctProgramCodes,
  getAllSemesters,
} from '../models/viewTimetableByProgramCodeModel.js';
import { buildTimetableGrid, BREAKS } from './timetableGridLogic.js';

export const getTimetableByProgramCode = async ({ programCode, semester }) => {
  let timetables = [];

  if (programCode) {
    timetables = await getTimetablesContainingProgramCode(programCode, semester);
  }

  const { uniqueDays, allSlots: allTimeSlots, grid } = buildTimetableGrid(timetables);

  const programCodes = await getAllDistinctProgramCodes();
  const semesters = await getAllSemesters();

  return {
    timetables,
    uniqueDays,
    allTimeSlots,
    grid,
    breaks: BREAKS,
    programCodes,
    semesters,
  };
};