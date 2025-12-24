// logics/usersLogic.js
import { getAllusers, adduser,addUsersFromFile, updateuser, deleteuser, getuserById,getUsersFromDB,getDistinctValues1,getUserByEmail } from '../models/usersModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import csvtojson from 'csvtojson';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';




export const searchUsers = async (filters) => {
  try {
    const users = await getUsersFromDB(filters);
    return users;
  } catch (error) {
    throw new Error('Error fetching Users this is in usersLogic.js: ' + error.message);
  }
};

export const getDistinctValues = async (column) => {
  try {
    const values = await getDistinctValues1(column);
    return values;
  } catch (error) {
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};


export const handleAddUserFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    let users = [];

    if (file.mimetype === 'text/csv') {
      users = await csvtojson().fromFile(filePath);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      users = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }

    const duplicates = [];
    for (const user of users) {
      const email = user.work_email;

      if (!email || email.trim() === '') {
        console.log('Skipping user with missing email.');
        continue;
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        console.log(`Duplicate found: ${email} already exists.`);
        duplicates.push(email);
        continue;
      }

      await addUsersFromFile(user);
    }

    console.log('Duplicate emails:', duplicates);
    res.redirect('/users');
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file: ' + error.message);
  }
};

// ======================
// Show User Form
// ======================
export const showuserForm = async (req, res) => {
  const { id } = req.params;
  try {
    const departments = await getAlldepartments();
    const user = id ? await getuserById(id) : null;

    // Make sure all filter variables are defined
    const uname = [];
    const udepartment = [];
    const uemail = [];
    const urole = [];
    const ustatus = [];

    return res.render('users', { 
      user, 
      departments, 
      sessionUser: req.user, 
      ViewUsers: [],
      uname,
      udepartment,
      uemail,
      urole,
      ustatus
    });
  } catch (error) {
    res.status(500).send('Error fetching user or departments: ' + error.message);
  }
};


// export const showuserForm = async (req, res) => {
//   const { id } = req.params;
//   try {
//     if (id) {
//       const user = await getuserById(id);
//       // const programs = await getAllprograms();

//       // const venues = await getAllvenues();
//       const departments = await getAlldepartments();
//       res.render('users', { user,departments,sessionUser: req.user });
//     } else {
//       const departments = await getAlldepartments()
//       // const venues = await getAllvenues();
//       // const programs = await getAllprograms();


//       res.render('users', { user: null,departments, sessionUser: req.user });
//     }
//   } catch (error) {
//     res.status(500).send('Error fetching users or programs or users : ' + error.message);
//   }
// };


export const handleAdduser = async (req, res) => {
  try {
    const profilePicture = req.file ? req.file.filename : null;
    await adduser({ ...req.body, profile_picture: profilePicture });
    res.redirect('/users');
  } catch (error) {
    res.status(500).send('Error adding user: ' + error.message);
  }
};

export const getEdituserForm = async (req, res) => {
  try {
    const user = await getuserById(req.params.id);
    res.render('users', { user, sessionUser: req.user });  // Correct view name
  } catch (error) {
    res.status(500).send('Error getting user: ' + error.message);
  }
};

export const handleUpdateuser = async (req, res) => {
  try {
    const profilePicture = req.file ? req.file.filename : null;
    await updateuser(req.params.id, { ...req.body, profile_picture: profilePicture });
    res.redirect('/users');
  } catch (error) {
    res.status(500).send('Error updating user: ' + error.message);
  }
};

export const handleDeleteuser = async (req, res) => {
  try {
    await deleteuser(req.params.id);
    res.redirect('/users');
  } catch (error) {
    res.status(500).send('Error deleting user: ' + error.message);
  }
};

export const listusers = async () => {
  try {
    const users = await getAllusers(); // fetch all users
    return users; // return array instead of rendering
  } catch (error) {
    throw new Error('Error fetching users: ' + error.message);
  }
};


// export const listusers = async (req, res) => {
//   try {
//     const users = await getAllusers();
//     const departments = await getAlldepartments();
//     res.render('users', { users,departments, sessionUser: req.user });  // Correct view name
//   } catch (error) {
//     res.status(500).send('Error fetching users: ' + error.message);
//   }
// };
