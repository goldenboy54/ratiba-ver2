// routes/timetables.js
import express from 'express';
import { showtimetableForm, handleAddtimetable, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';

const router = express.Router();
import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';

// Route to search for timetables based on various criteria
router.get('/', async (req, res) => {
  try {
    // Extract search criteria from query parameters
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      subject_name: req.query.subject,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      program_level: req.query.level,
      program_type: req.query.program_type,

    };
    // Perform search based on criteria
    const timetables = await searchTimetables(criteria);

    // Fetch distinct values for filters
    const programs = await getDistinctValues('program_name');
    const venues = await getDistinctValues('venue_name');
    const subjects = await getDistinctValues('subject_name');
    const tutors = await getDistinctValues('tutor_name');
    const departments = await getDistinctValues('department_name');
    const levels = await getDistinctValues('program_level');
    const semesters = await getDistinctValues('semester');
    const ptypes = await getDistinctValues('program_type');

    // Render the search results page with the fetched data
    res.render('timetables', {
      timetables,
      programs,
      venues,
      tutors,
      levels,
      departments,
      subjects,
      semesters,
      ptypes,
      ...criteria,
    });
  } catch (error) {
    // Handle and log errors
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});



// Route to show the form for adding a new timetable
router.get('/form', showtimetableForm);

// Route to handle form submission for adding a new timetable
router.post('/', handleAddtimetable);

// Route to show the form for editing an existing timetable
router.get('/edit/:id', getEdittimetableForm);

// Route to handle form submission for updating an existing timetable
router.post('/edit/:id', handleUpdatetimetable);

// Route to handle deletion of an existing timetable
router.get('/delete/:id', handleDeletetimetable);

// Route to list all timetables
router.get('/', listtimetables);

export default router;






