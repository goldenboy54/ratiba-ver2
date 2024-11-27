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
    handleAddProgramFromFile,
} from '../logics/programsLogic.js';

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
