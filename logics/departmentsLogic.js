// logics/departmentsLogic.js
import { getAlldepartments, adddepartment,addDepartmentsFromFile, updatedepartment, deletedepartment } from '../models/departmentsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';




// import {
//   getAllprograms,
//   getprogramById,
//   addprogram,
//   updateprogram,
//   deleteprogram,
//   addProgramsFromFile,
// } from '../models/programsModel.js';

import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// export const listPrograms = async (req, res) => {
//   try {
//     const programs = await getAllprograms();
//     res.render('programs', { programs });
//   } catch (error) {
//     res.status(500).send('Error fetching programs: ' + error.message);
//   }
// };

// export const handleAddprogram = async (req, res) => {
//   try {
//     await addprogram(req.body);
//     res.redirect('/programs');
//   } catch (error) {
//     res.status(500).send('Error adding program: ' + error.message);
//   }
// };



export const handleAddDepartmerntFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    const departments = [];

    if (file.mimetype === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => departments.push(row))
        .on('end', async () => {
          await addDepartmentsFromFile(departments);
          res.redirect('/departments');
        });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      await addDepartmentsFromFile(data);
      res.redirect('/departments');
    } else {
      res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }
  } catch (error) {
    res.status(500).send('Error processing file: ' + error.message);
  }
};



export const showdepartmentForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
        const venues = await getAllvenues();
      const department = await getdepartmentById(id);
      const programs = await getAllprograms();
      const users = await getAllusers();
      res.render('departments', { department,programs,users,venues});
    } else {
        const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      res.render('departments', { department: null,programs,users,venues});
    }
  } catch (error) {
    res.status(500).send('Error fetching department or programs or users: ' + error.message);
  }
};




export const handleAdddepartment = async (req, res) => {
  try {
    await adddepartment(req.body);
    res.redirect('/departments');
  } catch (error) {
    res.status(500).send('Error adding department: ' + error.message);
  }
};

export const getEditdepartmentForm = async (req, res) => {
  try {
    const department = await getdepartmentById(req.params.id);
    res.render('departments', { department });
  } catch (error) {
    res.status(500).send('Error getting department: ' + error.message);
  }
};

export const handleUpdatedepartment = async (req, res) => {
  try {
    await updatedepartment(req.params.id, req.body);
    res.redirect('/departments');
  } catch (error) {
    res.status(500).send('Error updating department: ' + error.message);
  }
};

export const handleDeletedepartment = async (req, res) => {
  try {
    await deletedepartment(req.params.id);
    res.redirect('/departments');
  } catch (error) {
    res.status(500).send('Error deleting department: ' + error.message);
  }
};

export const listdepartments = async (req, res) => {
  try {
    const venues = await getAllvenues();
    const departments = await getAlldepartments();
    const programs = await getAllprograms();
    const users = await getAllusers();
    res.render('departments', { departments,programs,users,venues});
  } catch (error) {
    res.status(500).send('Error fetching departments: ' + error.message);
  }
};

