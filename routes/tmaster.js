import express from 'express';
import { searchTimetables, getDistinctValues, handleAddtimetable,showSubjectForm} from '../logics/tmasterLogic.js';
import { getAllvenues } from '../models/venuesModel.js';
const router = express.Router();
router.get('/', async (req, res) => {
  try {
    const criteria = {
      tutor_name: req.query.tutor,
      semester: req.query.semester,
      program_type: req.query.program_type,

    };

    const timetables = await searchTimetables(criteria);
    const tutors = await getDistinctValues('u.full_name');
    const semesters = await getDistinctValues('s.semester');
    const ptypes = await getDistinctValues('p.program_type');

    const venues = await getAllvenues(); // Fetch venues here

    res.render('tmaster', {
      timetables,
      tutors,
      semesters,
      venues, // Pass venues to the view
      ptypes,
      ...criteria,
    });
  } catch (error) {
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});

// Route to add a new timetable
router.post('/add', handleAddtimetable);

export default router;
