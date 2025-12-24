import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    showprogramForm,
    handleAddprogram,
    getEditprogramForm,
    handleUpdateprogram,
    handleDeleteprogram,
    listprograms,
    searchprograms,
    getDistinctValues,
    handleAddProgramFromFile,
} from '../logics/programsLogic.js';

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
        program_name: req.query.program_name,
        program_code: req.query.program_code,
        duration: req.query.duration,
        level: req.query.level,
        category: req.query.category,
        program_capacity: req.query.program_capacity,
        program_type: req.query.program_type,

      };
  
    
    const Viewprograms = await searchprograms(criteria);
  
      // Fetch distinct values for filters
      const pname = await getDistinctValues('program_name');
      const pcode = await getDistinctValues('program_code');
      const pduration = await getDistinctValues('duration');
      const plevel = await getDistinctValues('level');
      const pcategory = await getDistinctValues('category');
      const pcapacity = await getDistinctValues('program_capacity');
      const ptype = await getDistinctValues('program_type');
      
    const departments = await getAlldepartments();
      // Render the search results page with the fetched data
      res.render('programs', {
        pname,
        pcode,
        pduration,
        plevel,
        pcategory,
        pcapacity,
        ptype,
        departments,
        Viewprograms,
        ...criteria,
      });
    } catch (error) {
      // Handle and log errors
      res.status(500).send('Error searching : ' + error.message);
    }
  });


// Route to show the form for adding a new program
router.get('/form', showprogramForm);

// Route to handle form submission for adding a new program
router.post('/', handleAddprogram);

// Route to show the form for editing an existing program
router.get('/edit/:id', getEditprogramForm);

// Route to handle form submission for updating an existing program
router.post('/edit/:id', handleUpdateprogram);

// Route to handle deletion of an existing program
router.get('/delete/:id', handleDeleteprogram);

// Route to list all programs
router.get('/', listprograms);

// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddProgramFromFile);

export default router;
