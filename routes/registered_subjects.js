import express from 'express';
import multer from 'multer'; // for file handling
import xlsx from 'xlsx'; // for parsing Excel files
import {
  showregistered_subjectForm,
  handleAddregistered_subject,
  getEditregistered_subjectForm,
  handleUpdateregistered_subject,
  handleDeleteregistered_subject,
  searchRegistered_subjects,
  getDistinctValues,
  //listregistered_subjects,
  handleUploadCSV
} from '../logics/registered_subjectsLogic.js';
import { getAlldepartments } from '../models/departmentsModel.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });


// Route to search for timetables based on various criteria
router.get('/', async (req, res) => {
    try {
      // Extract search criteria from query parameters
      const criteria = {
        registered_subject_name: req.query.registered_subject_name,
        registered_subject_code: req.query.registered_subject_code,
        total_hours_per_week: req.query.total_hours_per_week,
        registered_subject_department: req.query.registered_subject_department,
        credit: req.query.credit,

      };
  
    
    const Viewregistered_subject = await searchRegistered_subjects(criteria);
  
      // Fetch distinct values for filters
      const Rsname = await getDistinctValues('registered_subject_name');
      const Rscode = await getDistinctValues('registered_subject_code');
      const Rscredit = await getDistinctValues('credit');
      const Rsltpa = await getDistinctValues('total_hours_per_week');
      const Rsdepartment = await getDistinctValues('registered_subject_department');
      
    const departments = await getAlldepartments();
      // Render the search results page with the fetched data
      res.render('registered_subjects', {
        Rsname,
        Viewregistered_subject,
        departments,
        Rscode,
        Rscredit,
        Rsltpa,
        Rsdepartment,
        ...criteria,
      });
    } catch (error) {
      // Handle and log errors
      res.status(500).send('Error searching : ' + error.message);
    }
  });



router.get('/form', showregistered_subjectForm);
router.post('/', handleAddregistered_subject);
router.get('/edit/:id', getEditregistered_subjectForm);
router.post('/edit/:id', handleUpdateregistered_subject);
router.get('/delete/:id', handleDeleteregistered_subject);
//router.get('/', listregistered_subjects);

// Route for file upload
router.post('/upload', upload.single('file'), handleUploadCSV);

export default router;
