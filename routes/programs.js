// routes/programs.js
import express from 'express';
import { showprogramForm, handleAddprogram, getEditprogramForm, handleUpdateprogram, handleDeleteprogram, listprograms } from '../logics/programsLogic.js';

const router = express.Router();

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

export default router;
