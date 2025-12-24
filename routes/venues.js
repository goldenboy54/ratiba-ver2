// routes/venues.js
import express from 'express';
import { showvenueForm, handleAddVenueFromFile, handleAddvenue, getEditvenueForm, handleUpdatevenue, handleDeletevenue,getDistinctValues,searchVenues } from '../logics/venuesLogic.js';
import multer from 'multer';
import path from 'path';
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
        venue_name: req.query.venue_name,
        venue_capacity: req.query.capacity,
        venue_location: req.query.location,
        venue_type: req.query.type,
        venue_quality: req.query.venue_quality,
        venue_department: req.query.department,
        venue_status: req.query.status,
      
  
      };
  
    
    const Viewvenues = await searchVenues(criteria);
  
      // Fetch distinct values for filters
      const vname = await getDistinctValues('venue_name');
      const vcapacity = await getDistinctValues('capacity');
      const vlocation = await getDistinctValues('location');
      const vtype = await getDistinctValues('type');
      const vquality = await getDistinctValues('quality');
      const vdepartment = await getDistinctValues('department');
      const vstatus = await getDistinctValues('status');
    const departments = await getAlldepartments();
      // Render the search results page with the fetched data
      res.render('venues', {
        Viewvenues,
        departments,
        vname,
        vcapacity,
        vlocation,
        vtype,
        vquality,
        vdepartment,
        vstatus,
        ...criteria,
      });
    } catch (error) {
      // Handle and log errors
      res.status(500).send('Error searching venues: ' + error.message);
    }
  });




// Route to show the form for adding a new venue
router.get('/form', showvenueForm);

// Route to handle form submission for adding a new venue
router.post('/', handleAddvenue);

// Route to show the form for editing an existing venue
router.get('/edit/:id', getEditvenueForm);

// Route to handle form submission for updating an existing venue
router.post('/edit/:id', handleUpdatevenue);

// Route to handle deletion of an existing venue
router.get('/delete/:id', handleDeletevenue);

// Route to list all venues
//router.get('/', listvenues);

// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddVenueFromFile);





export default router;
