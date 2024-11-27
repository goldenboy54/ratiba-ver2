import express from 'express';
import multer from 'multer'; // for file handling
import xlsx from 'xlsx'; // for parsing Excel files
import {
  showregistered_subjectForm,
  handleAddregistered_subject,
  getEditregistered_subjectForm,
  handleUpdateregistered_subject,
  handleDeleteregistered_subject,
  listregistered_subjects,
  handleUploadCSV
} from '../logics/registered_subjectsLogic.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/form', showregistered_subjectForm);
router.post('/', handleAddregistered_subject);
router.get('/edit/:id', getEditregistered_subjectForm);
router.post('/edit/:id', handleUpdateregistered_subject);
router.get('/delete/:id', handleDeleteregistered_subject);
router.get('/', listregistered_subjects);

// Route for file upload
router.post('/upload', upload.single('file'), handleUploadCSV);

export default router;
