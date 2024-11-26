// routes/venues.js
import express from 'express';
import { showvenueForm, handleAddvenue, getEditvenueForm, handleUpdatevenue, handleDeletevenue, listvenues } from '../logics/venuesLogic.js';

const router = express.Router();

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

export default router;
