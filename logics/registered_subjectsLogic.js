// logics/registered_subjectsLogic.js
import { getAllregistered_subjects, addregistered_subject, updateregistered_subject, deleteregistered_subject,getRegistered_subjectsFromDB,getDistinctValues1,getRegistered_subjectByCode } from '../models/registered_subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';


import xlsx from 'xlsx'; // for parsing Excel files
import csvtojson from 'csvtojson'; // for parsing CSV files




export const searchRegistered_subjects = async (filters) => {
  try {
    const registered_subjects = await getRegistered_subjectsFromDB(filters);
    return registered_subjects;
  } catch (error) {
    throw new Error('Error fetching Registered_subjects this is in registered_subjectsLogic.js: ' + error.message);
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


export const handleUploadCSV = async (req, res) => {
  const file = req.file;
  try {
    let jsonData;

    // Check file extension and parse accordingly
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      jsonData = xlsx.utils.sheet_to_json(worksheet);
    } else if (file.mimetype === 'text/csv') {
      jsonData = await csvtojson().fromFile(file.path);
    } else {
      return res.status(400).send('Invalid file type. Please upload CSV or Excel.');
    }

    const duplicates = []; // store duplicates to show later

    for (const row of jsonData) {
      const code = row.registered_subject_code;
    
      if (!code || code.trim() === '') {
        console.log('Skipping row with missing or empty registered_subject_code');
        continue; // Skip this row
      }
    
      const existingSubject = await getRegistered_subjectByCode(code);
    
      if (existingSubject) {
        console.log(`Duplicate found: ${code} already exists.`);
        duplicates.push(code);
        continue; // Skip inserting
      }
    
      const newRegisteredSubject = {
        registered_subject_name: row.registered_subject_name,
        registered_subject_code: row.registered_subject_code,
        credit: row.credit,
        total_hours_per_week: row.total_hours_per_week,
        registered_subject_department: row.registered_subject_department,
      };
    
      await addregistered_subject(newRegisteredSubject);
    }
    

    if (duplicates.length > 0) {
      console.log('Duplicates skipped:', duplicates);
    }

    res.redirect('/registered_subjects');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file.');
  }
};






export const showregistered_subjectForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
        const venues = await getAllvenues();
        const departments = await getAlldepartments();
      const registered_subject = await getregistered_subjectById(id);
      const programs = await getAllprograms();
      const users = await getAllusers();
      res.render('registered_subjects', { registered_subject,programs,users,venues,departments});
    } else {
      const departments = await getAlldepartments();
        const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      res.render('registered_subjects', { registered_subject: null,programs,users,venues,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching registered_subject or programs or users: ' + error.message);
  }
};




export const handleAddregistered_subject = async (req, res) => {
  try {
    await addregistered_subject(req.body);
    res.redirect('/registered_subjects');
  } catch (error) {
    res.status(500).send('Error adding registered_subject: ' + error.message);
  }
};

export const getEditregistered_subjectForm = async (req, res) => {
  try {
    const registered_subject = await getregistered_subjectById(req.params.id);
    res.render('registered_subjects', { registered_subject });
  } catch (error) {
    res.status(500).send('Error getting registered_subject: ' + error.message);
  }
};

export const handleUpdateregistered_subject = async (req, res) => {
  try {
    await updateregistered_subject(req.params.id, req.body);
    res.redirect('/registered_subjects');
  } catch (error) {
    res.status(500).send('Error updating registered_subject: ' + error.message);
  }
};

export const handleDeleteregistered_subject = async (req, res) => {
  try {
    await deleteregistered_subject(req.params.id);
    res.redirect('/registered_subjects');
  } catch (error) {
    res.status(500).send('Error deleting registered_subject: ' + error.message);
  }
};

export const listregistered_subjects = async (req, res) => {
  try {
    const venues = await getAllvenues();
    const registered_subjects = await getAllregistered_subjects();
    const programs = await getAllprograms();
    const users = await getAllusers();
    const departments = await getAlldepartments();
    res.render('registered_subjects', { registered_subjects,programs,users,venues,departments});
  } catch (error) {
    res.status(500).send('Error fetching registered_subjects: ' + error.message);
  }
};

