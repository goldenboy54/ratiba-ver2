import timetableModel from '../models/manualTimetableModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { addtimetable } from '../models/manualTimetableModel.js';

// Search timetables
export const searchTimetables = async (filters) => {
  return await timetableModel.getTimetablesFromDB(filters);
};

// Get distinct values
export const getDistinctValues = async (column) => {
  return await timetableModel.getDistinctValues(column);
};

/**
 * Return all unused slots across every venue.
 * Accepts an already-fetched `venues` array to avoid re-querying when the
 * caller already has one (e.g. handleAddtimetable below); otherwise fetches
 * its own copy (e.g. the route's GET handler, which calls this with no arg).
 */
export const getVenueSlots = async (venues) => {
    if (!venues) {
        venues = await getAllvenues(); // array of venue objects
    }

    const days = [
        'monday','tuesday','wednesday',
        'thursday','friday','saturday','sunday'
    ];

    const allSlots = [];

    venues.forEach(venue => {
        days.forEach(day => {
            for (let i = 1; i <= 18; i++) {
                const colSlot = `${day}_slot${i}`;
                const colStatus = `${day}_slot${i}_status`;

                // only include slots that are unused
                if (venue[colStatus] && venue[colStatus].toLowerCase() === 'unused') {
                    allSlots.push({
                        venue_id: venue.venue_id,
                        venue_name: venue.venue_name,
                        day: day.toUpperCase(),
                        slot_number: i,
                        slot: venue[colSlot],        // e.g., "07:30-08:15"
                        status: venue[colStatus],    // should be "unused"
                        column: colSlot              // original column for backend updates
                    });
                }
            }
        });
    });

    return allSlots;
};

// Handle add timetable
export const handleAddtimetable = async (req, res) => {
  let {
    day, venue_id, 'subject_ids[]': subject_ids, slot,
    tutor_name = '', semester = '', program_type = ''
  } = req.body;
  if (!Array.isArray(subject_ids)) subject_ids = [subject_ids];
  const logs = [];

  try {
    if (!day || !venue_id || !subject_ids.length || !slot) {
      // No emoji here — the catch block below is the single place that adds
      // the ❌ prefix, so every error (from here or from addtimetable) gets
      // exactly one prefix instead of stacking ⚠️❌ when caught.
      throw new Error('Missing required fields: day, venue, slot, or subject');
    }

    await addtimetable({ day, venue_id, subject_ids, slot, logs });

    // Re-apply the filter the user was on (posted back as hidden fields) so the
    // page re-renders the same filtered view instead of resetting to "no filter"
    // and hiding the assign-form section (it only shows when tutor_name is set).
    const criteria = { tutor_name, semester, program_type };
    // None of these five reads depend on each other, so run them concurrently
    // instead of waiting on each round-trip in turn.
    const [tutors, semesters, ptypes, venues, timetables] = await Promise.all([
      timetableModel.getDistinctValues('u.full_name'),
      timetableModel.getDistinctValues('s.semester'),
      timetableModel.getDistinctValues('program_type'),
      getAllvenues(),
      timetableModel.getTimetablesFromDB(criteria)
    ]);
    const slots = await getVenueSlots(venues); // depends on venues, so runs after

    res.render('manualTimetable', {
      tutors, semesters, ptypes, venues, slots,
      timetables, tutor_name, semester, program_type, error:null, success:null, logs
    });

  } catch (error) {
    const errMsg = '❌ ' + error.message;
    logs.push(errMsg);
    res.render('manualTimetable', {
      tutors: [], semesters: [], ptypes: [], venues: [], slots: [],
      timetables: [], tutor_name:'', semester:'', program_type:'', error: errMsg, success:null, logs
    });
  }
};