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
  listSubjects,
  handleUploadSubjectsCSV
} from '../logics/subjectsLogic.js';


import { searchTimetables, getDistinctValues} from '../logics/subjectsLogic.js';

import { getAllvenues } from '../models/venuesModel.js';
// routes/subjects.js
import multer from 'multer';


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
      subject_code: req.query.subject_code,

    };

    const subjects = await searchTimetables(criteria);
    const uname = await getDistinctValues('u.full_name');
    const semesters = await getDistinctValues('s.semester');
    const ptypes = await getDistinctValues('s.program_type');
    const pname = await getDistinctValues('s.program_name');
    const plevel = await getDistinctValues('s.program_level');
    const idara = await getDistinctValues('s.subject_department');
    const sname = await getDistinctValues('s.title');
    const scode = await getDistinctValues('s.subject_code');
    const pcategory = await getDistinctValues('program_category');
    const venues = await getAllvenues(); // Fetch venues here
    const programs = await getAllprograms();
    const users = await getAllusers();
    const departments = await getAlldepartments()
    const registered_subjects = await getAllregistered_subjects();

    res.render('subjects', {
      subjects,
      users,
      uname,
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
      scode,
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

const upload = multer({ dest: 'uploads/' });

// upload CSV/Excel
router.post('/upload', upload.single('file'), handleUploadSubjectsCSV);


export default router;
