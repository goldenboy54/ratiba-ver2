import {
  getTimetablesContainingProgramCode,
  getAllDistinctProgramCodes,
  getAllSemesters,
} from '../models/viewTimetableByProgramCodeModel.js';

const WEEKDAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const BREAKS = [
  { time: '10:35 - 11:00', type: 'Tea Break' },
  { time: '12:30 - 13:15', type: 'Lunch Break' },
];

export const getTimetableByProgramCode = async ({ programCode, semester }) => {
  let timetables = [];

  if (programCode) {
    timetables = await getTimetablesContainingProgramCode(programCode, semester);
  }

  // Unique days in order
  const daysInData = [...new Set(timetables.map(t => t.day))];
  const uniqueDays = WEEKDAY_ORDER.filter(d => daysInData.includes(d));

  // Time slots + breaks
  const timeSlots = new Set(
    timetables.map(t => {
      const start = t.start_time?.slice(0, 5) || '';
      const end = t.end_time?.slice(0, 5) || '';
      return start && end ? `${start} - ${end}` : null;
    }).filter(Boolean)
  );

  BREAKS.forEach(b => timeSlots.add(b.time));

  const allTimeSlots = [...timeSlots].sort((a, b) => {
    const toMinutes = str => {
      const [h, m] = str.split(' - ')[0].split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(a) - toMinutes(b);
  });

  const programCodes = await getAllDistinctProgramCodes();
  const semesters = await getAllSemesters();

  return {
    timetables,
    uniqueDays,
    allTimeSlots,
    breaks: BREAKS,
    programCodes,
    semesters,
  };
};