// routes/departments.js
import express from 'express';
import {
  showdepartmentForm,
  handleAdddepartment,
  getEditdepartmentForm,
  handleUpdatedepartment,
  handleDeletedepartment,
  listdepartments
} from '../logics/departmentsLogic.js';

const router = express.Router();

router.get('/form', showdepartmentForm);
router.post('/', handleAdddepartment);
router.get('/edit/:id', getEditdepartmentForm);
router.post('/edit/:id', handleUpdatedepartment);
router.get('/delete/:id', handleDeletedepartment);
router.get('/', listdepartments);

export default router;

