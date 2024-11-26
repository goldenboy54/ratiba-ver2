// routes/users.js
import express from 'express';
import { showuserForm, handleAdduser, handleUpdateuser, handleDeleteuser, listusers } from '../logics/usersLogic.js';

const router = express.Router();

// Route to show the form for adding a new user
router.get('/form', showuserForm);

// Route to handle form submission for adding a new user
router.post('/', handleAdduser);

// Route to list all users
router.get('/', listusers);

// Route to handle form submission for updating an existing user
router.post('/edit/:id', handleUpdateuser);

// Route to handle deletion of an existing user
router.get('/delete/:id', handleDeleteuser);

export default router;
