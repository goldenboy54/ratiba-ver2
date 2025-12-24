import express from 'express';
import {
  searchTimetables,
  getDistinctValues,
  handleAddtimetable
} from '../logics/manualTimetableLogic.js';

import { getAllvenues } from '../models/venuesModel.js';
import { getVenueSlots } from '../logics/manualTimetableLogic.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const criteria = {
      tutor_name: req.query.tutor || '',
      semester: req.query.semester || '',
      program_type: req.query.program_type || ''
    };

    const timetables = await searchTimetables(criteria);
    const tutors = await getDistinctValues('u.full_name');
    const semesters = await getDistinctValues('s.semester');
    const ptypes = await getDistinctValues('program_type');
    const venues = await getAllvenues();

    // 🟢 FIXED — get all slots for ALL venues ONCE
    const allSlots = await getVenueSlots();

    res.render('manualTimetable', {
      timetables,
      tutors,
      semesters,
      venues,
      ptypes,
      slots: allSlots, // ← final slots list
      ...criteria,
      error: null,
      success: null,
      logs: null
    });

  } catch (error) {

    res.status(500).render('manualTimetable', {
      timetables: [],
      tutors: [],
      semesters: [],
      venues: [],
      ptypes: [],
      slots: [],
      tutor_name: '',
      semester: '',
      program_type: '',
      error: '⚠️ Error loading page: ' + error.message,
      success: null,
      logs: null
    });
  }
});

router.post('/add', handleAddtimetable);

export default router;



// import express from 'express';
// import { searchTimetables, getDistinctValues, handleAddtimetable, showSubjectForm, getVenueSlots } from '../logics/manualTimetableLogic.js';
// import { getAllvenues } from '../models/venuesModel.js';

// const router = express.Router();

// // Show manual timetable page with filters
// router.get('/', async (req, res) => {
//   try {
//     const criteria = {
//       tutor_name: req.query.tutor || '',
//       semester: req.query.semester || '',
//       program_type: req.query.program_type || ''
//     };

//     const timetables = await searchTimetables(criteria);
//     const tutors = await getDistinctValues('u.full_name');
//     const semesters = await getDistinctValues('s.semester');
//     const ptypes = await getDistinctValues('program_type');
//     const venues = await getAllvenues();
//     const slots = await getVenueSlots();

//     res.render('manualTimetable', {
//       timetables,
//       tutors,
//       semesters,
//       venues,
//       ptypes,
//       slots,
//       ...criteria,
//       error: null,
//       success: null,
//       logs: null
//     });
//   } catch (error) {
//     res.status(500).render('manualTimetable', {
//       timetables: [],
//       tutors: [],
//       semesters: [],
//       venues: [],
//       ptypes: [],
//       slots: [],
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: '⚠️ Error loading page: ' + error.message,
//       success: null,
//       logs: null
//     });
//   }
// });

// // Handle manual assignment
// router.post('/add', handleAddtimetable);

// export default router;


// import express from 'express';
// import { searchTimetables, getDistinctValues, handleAddtimetable, showSubjectForm } from '../logics/manualTimetableLogic.js';
// import { getAllvenues } from '../models/venuesModel.js';

// const router = express.Router();

// router.get('/', async (req, res) => {
//   try {
//     const criteria = {
//       tutor_name: req.query.tutor || '',
//       semester: req.query.semester || '',
//       program_type: req.query.program_type || ''
//     };

//     const timetables = await searchTimetables(criteria);
//     const tutors = await getDistinctValues('u.full_name');
//     const semesters = await getDistinctValues('s.semester');
//     const ptypes = await getDistinctValues('program_type');
//     const venues = await getAllvenues();

//     res.render('manualTimetable', {
//       timetables,
//       tutors,
//       semesters,
//       venues,
//       ptypes,
//       ...criteria,
//       error: null,
//       success: null,
//       logs:null
//     });
//   } catch (error) {
//     res.status(500).render('manualTimetable', {
//       timetables: [],
//       tutors: [],
//       semesters: [],
//       venues: [],
//       ptypes: [],
//       tutor_name: '',
//       semester: '',
//       program_type: '',
//       error: '⚠️ Error searching timetables: ' + error.message,
//       success: null,
//       logs:null
//     });
//   }
// });

// router.post('/add', handleAddtimetable);

// export default router;

