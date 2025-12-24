import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  showuserForm,
  handleAdduser,
  handleAddUserFromFile,
  handleUpdateuser,
  handleDeleteuser,
  listusers,
  searchUsers,
  getDistinctValues
} from '../logics/usersLogic.js';
import { getAlldepartments } from '../models/departmentsModel.js';

const router = express.Router();

// ---------------------------
// Multer File Upload Config
// ---------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

// ---------------------------
// List / Search Users
// ---------------------------
router.get('/', async (req, res) => {
  try {
    const criteria = {
      full_name: req.query.full_name || '',
      department: req.query.department || '',
      user_email: req.query.user_email || '',
      role: req.query.role || '',
      status: req.query.status || ''
    };

    let ViewUsers = [];
    if (Object.values(criteria).some(v => v)) {
      // If filters exist
      ViewUsers = await searchUsers(criteria);
    } else {
      // No filters, fetch all users
      ViewUsers = await listusers(); // Make sure listusers() returns array of users instead of rendering
    }

    // Distinct values for filters
    const [uname, udepartment, uemail, urole, ustatus] = await Promise.all([
      getDistinctValues('full_name'),
      getDistinctValues('department'),
      getDistinctValues('user_email'),
      getDistinctValues('role'),
      getDistinctValues('status')
    ]);

    const departments = await getAlldepartments();

    res.render('users', {
      uname,
      udepartment,
      uemail,
      urole,
      ustatus,
      departments,
      ViewUsers,
      sessionUser: req.user,
      ...criteria
    });

  } catch (error) {
    res.status(500).send('Error fetching users: ' + error.message);
  }
});


// ---------------------------
// Add User Form & Submit
// ---------------------------
router.get('/form', showuserForm);
router.post('/', handleAdduser);

// ---------------------------
// Update / Delete Users
// ---------------------------
router.post('/edit/:id', handleUpdateuser);
router.get('/delete/:id', handleDeleteuser);

// ---------------------------
// Upload Users from File
// ---------------------------
router.post('/uploads', upload.single('file'), handleAddUserFromFile);

export default router;


// // routes/users.js
// import express from 'express';
// import { showuserForm, handleAdduser,handleAddUserFromFile, handleUpdateuser, handleDeleteuser, listusers,searchUsers,getDistinctValues } from '../logics/usersLogic.js';
// import multer from 'multer';
// import path from 'path';

// import { getAlldepartments } from '../models/departmentsModel.js';


// const router = express.Router();


// // Configure multer for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Ensure this directory exists
//     },
//     filename: (req, file, cb) => {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     },
// });

// const upload = multer({ storage });



// // Route to search for timetables based on various criteria
// router.get('/', async (req, res) => {
//     try {
//       // Extract search criteria from query parameters
//       const criteria = {
//         full_name: req.query.full_name,
//         department: req.query.department,
//         user_email: req.query.user_email,
//         role: req.query.role,
//         status: req.query.status,
//        sessionUser: req.user  // <<< Pass the logged-in user
      
//       };

//       const ViewUsers = await searchUsers(criteria);
  
//       // Fetch distinct values for filters
//       const uname = await getDistinctValues('full_name');
//       const udepartment = await getDistinctValues('department');
//       const uemail = await getDistinctValues('user_email');
//       const urole = await getDistinctValues('role');
//       const ustatus = await getDistinctValues('status');

//     const departments = await getAlldepartments();
//       // Render the search results page with the fetched data
//       res.render('users', {
//         uname,
//         udepartment,
//         uemail,
//         urole,
//         ustatus,  
//         departments,
//         ViewUsers,
//         sessionUser: req.user,
//         ...criteria,
//       });
//     } catch (error) {
//       // Handle and log errors
//       res.status(500).send('Error searching : ' + error.message);
//     }
//   });




// // Route to show the form for adding a new user
// router.get('/form', showuserForm);

// // Route to handle form submission for adding a new user
// router.post('/', handleAdduser);

// // Route to list all users
// router.get('/', listusers);

// // Route to handle form submission for updating an existing user
// router.post('/edit/:id', handleUpdateuser);

// // Route to handle deletion of an existing user
// router.get('/delete/:id', handleDeleteuser);


// // Route to handle file uploads for adding programs
// router.post('/uploads', upload.single('file'), handleAddUserFromFile);

// export default router;
