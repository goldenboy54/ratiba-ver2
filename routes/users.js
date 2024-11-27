// routes/users.js
import express from 'express';
import { showuserForm, handleAdduser,handleAddUserFromFile, handleUpdateuser, handleDeleteuser, listusers } from '../logics/usersLogic.js';
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


// Route to handle file uploads for adding programs
router.post('/uploads', upload.single('file'), handleAddUserFromFile);

export default router;
