import timetableModel from '../models/manualTimetableModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
import { addtimetable } from '../models/manualTimetableModel.js';

// Show subject form
export const showSubjectForm = async (req, res) => {
  try {
    const departments = await getAlldepartments();
    const venues = await getAllvenues();
    const programs = await getAllprograms();
    const users = await getAllusers();
    const registered_subjects = await getAllregistered_subjects();
    const tutors = await timetableModel.getDistinctValues('u.full_name');
    const semesters = await timetableModel.getDistinctValues('s.semester');
    const ptypes = await timetableModel.getDistinctValues('program_type');
    const slots = await getVenueSlots();

    res.render('manualTimetable', {
      subject: null,
      programs,
      users,
      registered_subjects,
      venues,
      departments,
      tutors,
      semesters,
      ptypes,
      slots,
      timetables: [],
      tutor_name: '',
      semester: '',
      program_type: '',
      error: null,
      success: null,
      logs: null
    });
  } catch (error) {
    res.status(500).render('manualTimetable', {
      subject: null,
      programs: [],
      users: [],
      registered_subjects: [],
      venues: [],
      departments: [],
      tutors: [],
      semesters: [],
      ptypes: [],
      slots: [],
      timetables: [],
      tutor_name: '',
      semester: '',
      program_type: '',
      error: '⚠️ Error fetching data: ' + error.message,
      success: null,
      logs: null
    });
  }
};

// Search timetables
export const searchTimetables = async (filters) => {
  return await timetableModel.getTimetablesFromDB(filters);
};

// Get distinct values
export const getDistinctValues = async (column) => {
  return await timetableModel.getDistinctValues(column);
};

// Get venue-based slots
// Function to get available slots per venue
// Function to return ALL slots for ALL venues

/**
 * Return all unused slots from venues
 */
export const getVenueSlots = async () => {
    const venues = await getAllvenues(); // array of venue objects

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

// export const getVenueSlots = async () => {
//   const venues = await getAllvenues();
//   const allSlots = [];

//   venues.forEach(v => {
//     const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
//     days.forEach(day => {
//       for(let i=1;i<=18;i++){
//         const slotKey = `${day.toLowerCase()}_slot${i}`;
//         if(v[slotKey] && v[slotKey] !== "") {
//           allSlots.push({ venue_id: v.venue_id, day, slot: v[slotKey] });
//         }
//       }
//     });
//   });
//   return allSlots;
// };

// Handle add timetable
export const handleAddtimetable = async (req, res) => {
  let { day, venue_id, 'subject_ids[]': subject_ids, slot } = req.body;
  if (!Array.isArray(subject_ids)) subject_ids = [subject_ids];
  const logs = [];

  try {
    if (!day || !venue_id || !subject_ids.length || !slot) {
      throw new Error('⚠️ Missing required fields: day, venue, slot, or subject');
    }

    await addtimetable({ day, venue_id, subject_ids, slot, logs });

    const tutors = await timetableModel.getDistinctValues('u.full_name');
    const semesters = await timetableModel.getDistinctValues('s.semester');
    const ptypes = await timetableModel.getDistinctValues('program_type');
    const venues = await getAllvenues();
    const timetables = await timetableModel.getTimetablesFromDB({});

    res.render('manualTimetable', {
      tutors, semesters, ptypes, venues, slots: await getVenueSlots(),
      timetables, tutor_name:'', semester:'', program_type:'', error:null, success:null, logs
    });

  } catch (error) {
    logs.push('❌ ' + error.message);
    res.render('manualTimetable', {
      tutors: [], semesters: [], ptypes: [], venues: [], slots: [],
      timetables: [], tutor_name:'', semester:'', program_type:'', error: '❌ ' + error.message, success:null, logs
    });
  }
};


// import timetableModel from '../models/manualTimetableModel.js';
// import { getAllprograms } from '../models/programsModel.js';
// import { getAllusers } from '../models/usersModel.js';
// import { getAllvenues } from '../models/venuesModel.js';
// import { getAlldepartments } from '../models/departmentsModel.js';
// import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
// import { addtimetable } from '../models/manualTimetableModel.js';

// export const showSubjectForm = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const departments = await getAlldepartments();
//     const venues = await getAllvenues();
//     const programs = await getAllprograms();
//     const users = await getAllusers();
//     const registered_subjects = await getAllregistered_subjects();
//     const tutors = await timetableModel.getDistinctValues('u.full_name');
//     const semesters = await timetableModel.getDistinctValues('s.semester');
//     const ptypes = await timetableModel.getDistinctValues('program_type');
//     const slots = await timetableModel.getDistinctValues('s.slot');

//     res.render('manualTimetable', {
//       subject: id ? await getSubjectById(id) : null,
//       programs,
//       users,
//       registered_subjects,
//       venues,
//       departments,
//       tutors,
//       semesters,
//       ptypes,
//       slots,
//       timetables: [],
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: null,
//       success: null,
//       logs:null
//     });
//   } catch (error) {
//     res.status(500).render('manualTimetable', {
//       subject: null,
//       programs: [],
//       users: [],
//       registered_subjects: [],
//       venues: [],
//       departments: [],
//       tutors: [],
//       semesters: [],
//       ptypes: [],
//       slots: [],
//       timetables: [],
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: '⚠️ Error fetching data: ' + error.message,
//       success: null,
//       logs:null
//     });
//   }
// };

// export const searchTimetables = async (filters) => {
//   try {
//     return await timetableModel.getTimetablesFromDB(filters);
//   } catch (error) {
//     console.error('Error fetching timetables:', error);
//     throw new Error('Error fetching timetables: ' + error.message);
//   }
// };

// export const getDistinctValues = async (column) => {
//   try {
//     return await timetableModel.getDistinctValues(column);
//   } catch (error) {
//     console.error('Error fetching distinct values:', error);
//     throw new Error('Error fetching distinct values: ' + error.message);
//   }
// };
// export const handleAddtimetable = async (req, res) => {
//   let { day, venue_id, 'subject_ids[]': subject_ids, slot } = req.body;
//   if (!Array.isArray(subject_ids)) subject_ids = [subject_ids];

//   const logs = []; // array ya ku-display kwenye page

//   try {
//     const departments = await getAlldepartments();
//     const venues = await getAllvenues();
//     const programs = await getAllprograms();
//     const users = await getAllusers();
//     const registered_subjects = await getAllregistered_subjects();
//     const tutors = await timetableModel.getDistinctValues('u.full_name');
//     const semesters = await timetableModel.getDistinctValues('s.semester');
//     const ptypes = await timetableModel.getDistinctValues('p.program_type');
//     const timetables = await timetableModel.getTimetablesFromDB({}); // fetch all timetables
//     const slots = await timetableModel.getDistinctValues('s.slot');

//     if (!day || !venue_id || !subject_ids.length) {
//       return res.render('manualTimetable', {
//         subject: null,
//         programs,
//         users,
//         registered_subjects,
//         venues,
//         departments,
//         tutors,
//         semesters,
//         ptypes,
//         slots,
//         timetables,
//         tutor_name: '',
//         semester: '',
//         program_type: '',
//         error: '⚠️ Missing required fields: day, venue or subjects',
//         success: null,
//         logs
//       });
//     }

//     // Pass logs array to model
//     await addtimetable({ day, venue_id, subject_ids,slot, logs });

//     // Render page na logs
//     res.render('manualTimetable', {
//       subject: null,
//       programs,
//       users,
//       registered_subjects,
//       venues,
//       departments,
//       tutors,
//       semesters,
//       ptypes,
//       timetables,
//       slots,
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: null,
//       success: null,
//       logs
//     });

//   } catch (error) {
//     logs.push('❌ ' + error.message);
//     res.render('manualTimetable', {
//       subject: null,
//       programs: [],
//       users: [],
//       registered_subjects: [],
//       venues: [],
//       departments: [],
//       tutors: [],
//       semesters: [],
//       ptypes: [],
//       slots: [],
//       timetables: [],
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: '❌ ' + error.message,
//       success: null,
//       logs
//     });
//   }
// };
