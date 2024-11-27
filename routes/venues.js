// routes/venues.js
import express from 'express';
import { showvenueForm, handleAddVenueFromFile, handleAddvenue, getEditvenueForm, handleUpdatevenue, handleDeletevenue, listvenues } from '../logics/venuesLogic.js';
import multer from 'multer';
import path from 'path';

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
router.get('/', listvenues);

// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddVenueFromFile);

export default router;
