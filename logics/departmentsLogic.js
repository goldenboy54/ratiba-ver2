// logics/departmentsLogic.js
import { getAlldepartments, adddepartment,addDepartmentsFromFile, updatedepartment, deletedepartment,getDepartmentsFromDB,getDistinctValues1, getDepartmentByCode } from '../models/departmentsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';


import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';


export const searchDepartments = async (filters) => {
  try {
    const departments = await getDepartmentsFromDB(filters);
    return departments;
  } catch (error) {
    throw new Error('Error fetching Departments this is in departmentsLogic.js: ' + error.message);
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



export const handleAddDepartmerntFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    let departments = [];

    if (file.mimetype === 'text/csv') {
      departments = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .on('error', (err) => reject(err));
      });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      departments = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }

    const duplicates = [];

    for (const dept of departments) {
      const code = dept.department_code;

      if (!code || code.trim() === '') {
        console.log('Skipping row with missing or empty department_code.');
        continue; // Skip this row
      }

      const existingDept = await getDepartmentByCode(code);

      if (existingDept) {
        console.log(`Duplicate found: ${code} already exists.`);
        duplicates.push(code);
        continue; // Skip inserting duplicate
      }

      const newDepartment = {
        department_name: dept.department_name,
        department_code: dept.department_code,
        hod_name: dept.hod_name,
        hod_email: dept.hod_email,
      };

      await addDepartmentsFromFile(newDepartment);
    }

    console.log('Upload complete. Duplicates:', duplicates);

    res.redirect('/departments');
  } catch (error) {
    console.error(error);
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

