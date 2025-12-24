// routes/departments.js
import express from 'express';
import multer from 'multer';
import path from 'path';

import {
  showdepartmentForm,
  handleAdddepartment,
  handleAddDepartmerntFromFile,
  getEditdepartmentForm,
  handleUpdatedepartment,
  searchDepartments,
  getDistinctValues,
  handleDeletedepartment,
  listdepartments
} from '../logics/departmentsLogic.js';

import { getAlldepartments } from '../models/departmentsModel.js';

const router = express.Router();


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



// Route to search for timetables based on various criteria
router.get('/', async (req, res) => {
    try {
      // Extract search criteria from query parameters
      const criteria = {
        department_name: req.query.department_name,
        department_code: req.query.department_code,
        hod_name: req.query.hod_name,
        hod_email: req.query.hod_email,
  
      };
  
    
    const ViewDepartments = await searchDepartments(criteria);
  
      // Fetch distinct values for filters
      const dname = await getDistinctValues('department_name');
      const dcode = await getDistinctValues('department_code');
      const dhname = await getDistinctValues('hod_name');
      const dhemail = await getDistinctValues('hod_email');
     
    const departments = await getAlldepartments();
      // Render the search results page with the fetched data
      res.render('departments', {
        dname,
        dcode,
       dhname,
        dhemail,
        departments,
        ViewDepartments,
        ...criteria,
      });
    } catch (error) {
      // Handle and log errors
      res.status(500).send('Error searching : ' + error.message);
    }
  });



router.get('/form', showdepartmentForm);
router.post('/', handleAdddepartment);
router.get('/edit/:id', getEditdepartmentForm);
router.post('/edit/:id', handleUpdatedepartment);
router.get('/delete/:id', handleDeletedepartment);
router.get('/', listdepartments);


// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddDepartmerntFromFile);


export default router;

