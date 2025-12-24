// routes/subjects.js
import express from 'express';
import { getAllSubjects, addSubject, updateSubject, deleteSubject } from '../models/subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';

import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
import timetableModel from '../models/subjectsModel.js'; 
import {
  showSubjectForm,
  handleAddSubject,
  getEditSubjectForm,
  handleUpdateSubject,
  handleDeleteSubject,
  listSubjects
} from '../logics/subjectsLogic.js';

import { searchTimetables, getDistinctValues} from '../logics/subjectsLogic.js';
import { getAllvenues } from '../models/venuesModel.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const criteria = {
      user_name: req.query.user,
      semester: req.query.semester,
      category: req.query.category,
      program_type: req.query.program_type,
      program_name: req.query.program_name,
      level: req.query.level,
      subject_department: req.query.subject_department,
      title: req.query.title,

    };

    const subjects = await searchTimetables(criteria);
    const users = await getDistinctValues('u.full_name');
    const semesters = await getDistinctValues('s.semester');
    const ptypes = await getDistinctValues('p.program_type');
    const pname = await getDistinctValues('p.program_name');
    const plevel = await getDistinctValues('p.level');
    const idara = await getDistinctValues('s.subject_department');
    const sname = await getDistinctValues('s.title');
    const pcategory = await getDistinctValues('p.category');

    const venues = await getAllvenues(); // Fetch venues here
    const programs = await getAllprograms();

    const departments = await getAlldepartments()
    const registered_subjects = await getAllregistered_subjects();

    res.render('work_reports', {
      subjects,
      users,
      semesters,
      venues, // Pass venues to the view
      ptypes,
      programs,
      departments,
      registered_subjects,
      pname,
      plevel,
      idara,
      sname,
      pcategory,
      ...criteria,
    });
  } catch (error) {
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});


router.get('/form', showSubjectForm);
router.post('/form', handleAddSubject);
router.get('/edit/:id', getEditSubjectForm);
router.post('/edit/:id', handleUpdateSubject);
router.get('/delete/:id', handleDeleteSubject);


export default router;
