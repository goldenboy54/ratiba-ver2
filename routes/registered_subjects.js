// routes/registered_subjects.js
import express from 'express';
import {
  showregistered_subjectForm,
  handleAddregistered_subject,
  getEditregistered_subjectForm,
  handleUpdateregistered_subject,
  handleDeleteregistered_subject,
  listregistered_subjects
} from '../logics/registered_subjectsLogic.js';

const router = express.Router();

router.get('/form', showregistered_subjectForm);
router.post('/', handleAddregistered_subject);
router.get('/edit/:id', getEditregistered_subjectForm);
router.post('/edit/:id', handleUpdateregistered_subject);
router.get('/delete/:id', handleDeleteregistered_subject);
router.get('/', listregistered_subjects);

export default router;
