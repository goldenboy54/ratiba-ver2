// logics/usersLogic.js
import { getAllusers, adduser,addUsersFromFile, updateuser, deleteuser, getuserById } from '../models/usersModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';

import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';



export const handleAddUserFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    const users = [];

    if (file.mimetype === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => users.push(row))
        .on('end', async () => {
          await addUsersFromFile(users);
          res.redirect('/users');
        });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      await addUsersFromFile(data);
      res.redirect('/users');
    } else {
      res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }
  } catch (error) {
    res.status(500).send('Error processing file: ' + error.message);
  }
};



export const showuserForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const user = await getuserById(id);
      // const programs = await getAllprograms();

      // const venues = await getAllvenues();
      const departments = await getAlldepartments();
      res.render('users', { user,departments});
    } else {
      const departments = await getAlldepartments()
      // const venues = await getAllvenues();
      // const programs = await getAllprograms();

  
      res.render('users', { user: null,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching users or programs or users : ' + error.message);
  }
};





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
    res.render('users', { user });  // Correct view name
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

export const listusers = async (req, res) => {
  try {
    const users = await getAllusers();
    const departments = await getAlldepartments();
    res.render('users', { users,departments });  // Correct view name
  } catch (error) {
    res.status(500).send('Error fetching users: ' + error.message);
  }
};
