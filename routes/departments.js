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
  handleDeletedepartment,
  listdepartments
} from '../logics/departmentsLogic.js';

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


router.get('/form', showdepartmentForm);
router.post('/', handleAdddepartment);
router.get('/edit/:id', getEditdepartmentForm);
router.post('/edit/:id', handleUpdatedepartment);
router.get('/delete/:id', handleDeletedepartment);
router.get('/', listdepartments);


// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddDepartmerntFromFile);


export default router;

