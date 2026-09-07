
import timetableModel from '../models/timetableModel.js';

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const toShort = (t) => (t ? String(t).slice(0, 5) : t);

// searchTimetables is shared by two very different consumers: routes/searchtimatable.js's
// public timetable grid (which needs EVERY individual slot row to place in its day/time
// grid) and routes/timetables.js's admin "Update Timetable" list (which wants one row per
// class). Grouping here at the shared-function level silently dropped every slot but the
// first from the public grid - session_group_id grouping must stay opt-in per caller
// (see groupTimetablesBySession below, applied only in routes/timetables.js) rather than
// live inside this function.
export const searchTimetables = async (filters) => {
  try {
    return await timetableModel.getTimetablesFromDB(filters);
  } catch (error) {
    throw new Error('Error fetching timetables: ' + error.message);
  }
};

// A class books one or more rows sharing session_group_id (see
// models/manualTimetableModel.js / tmasterModel.js) - the admin list previously showed
// every row as separate, identical-looking entries with their own independent Edit/Delete
// actions. This collapses each group into one row for display: the earliest row's own
// id/start_time/end_time are kept as-is (so the edit form still gets the single 45-minute
// slot it needs - see logics/timetablesLogic.js::handleUpdatetimetable), and only `slot`
// is overridden with the combined range for the TIME column. Both edit and delete already
// resolve the whole group from just this one id (Stages 3 and 5), so no route changes are
// needed there - this is purely a display grouping, applied only where it's wanted.
export function groupTimetablesBySession(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.session_group_id)) groups.set(row.session_group_id, []);
    groups.get(row.session_group_id).push(row);
  }

  const sessions = [];
  for (const groupRows of groups.values()) {
    groupRows.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    const first = groupRows[0];
    const last = groupRows[groupRows.length - 1];

    sessions.push({
      ...first,
      slot: groupRows.length > 1 ? `${toShort(first.start_time)}-${toShort(last.end_time)}` : first.slot
    });
  }

  sessions.sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(String(a.day).toUpperCase()) - DAY_ORDER.indexOf(String(b.day).toUpperCase());
    return dayDiff !== 0 ? dayDiff : String(a.start_time).localeCompare(String(b.start_time));
  });

  return sessions;
}

export const getDistinctValues = async (column) => {
  try {
    return await timetableModel.getDistinctValues(column);
  } catch (error) {
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};



// import timetableModel from '../models/timetableModel.js';

// export const searchTimetables = async (filters) => {
//   try {
//     const timetables = await timetableModel.getTimetablesFromDB(filters);
//     return timetables;
//   } catch (error) {
//     throw new Error('Error fetching timetables: ' + error.message);
//   }
// };

// export const getDistinctValues = async (column) => {
//   try {
//     const values = await timetableModel.getDistinctValues(column);
//     return values;
//   } catch (error) {
//     throw new Error('Error fetching distinct values: ' + error.message);
//   }
// };
