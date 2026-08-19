import express from 'express';
import {
  searchTimetables,
  getDistinctValues,
  getVenueSlots,
  handleAddtimetable
} from '../logics/manualTimetableLogic.js';
import { getAllvenues } from '../models/venuesModel.js';

const router = express.Router();

// req.query becomes an array if the same key is submitted twice
// (?tutor=a&tutor=b); collapse to a single string so the model's
// `u.full_name = ?` equality filter doesn't silently break on an array param.
const asQueryString = (v) => (Array.isArray(v) ? v[0] : v) || '';

// Single source of truth for the view's full data shape, so the success and
// error render paths can't drift out of sync on which keys they pass.
const defaultPageData = () => ({
  timetables: [], tutors: [], semesters: [], ptypes: [], venues: [], slots: [],
  tutor_name: '', semester: '', program_type: '',
  error: null, success: null, logs: null
});

router.get('/', async (req, res) => {
  try {
    const criteria = {
      tutor_name: asQueryString(req.query.tutor),
      semester: asQueryString(req.query.semester),
      program_type: asQueryString(req.query.program_type)
    };

    // These five reads are independent, so run them concurrently.
    const [timetables, tutors, semesters, ptypes, venues] = await Promise.all([
      searchTimetables(criteria),
      getDistinctValues('u.full_name'),
      getDistinctValues('s.semester'),
      getDistinctValues('program_type'),
      getAllvenues()
    ]);
    const allSlots = await getVenueSlots(venues); // depends on venues, so runs after

    res.render('manualTimetable', {
      ...defaultPageData(),
      timetables, tutors, semesters, ptypes, venues, slots: allSlots,
      ...criteria
    });

  } catch (error) {
    res.status(500).render('manualTimetable', {
      ...defaultPageData(),
      error: '⚠️ Error loading page: ' + error.message
    });
  }
});

router.post('/add', handleAddtimetable);

export default router;
