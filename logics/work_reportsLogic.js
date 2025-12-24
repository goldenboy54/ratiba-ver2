// logics/subjectsLogic.js
import { getAllSubjects, addSubject, updateSubject, deleteSubject } from '../models/work_reportsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
import timetableModel from '../models/subjectsModel.js'; 
export const showSubjectForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const subject = await getSubjectById(id);
      const programs = await getAllprograms();
      const users = await getAllusers();
      const venues = await getAllvenues();
      const departments = await getAlldepartments()
      const registered_subjects = await getAllregistered_subjects();
      res.render('work_reports', { subject,programs,users,registered_subjects,venues,departments});
    } else {
      const departments = await getAlldepartments()
      const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      const registered_subjects = await getAllregistered_subjects();
      res.render('work_reports', { subject: null,programs,users,registered_subjects,venues,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching subjects or programs or users or registered_subjects: ' + error.message);
  }
};



export const handleAddSubject = async (req, res) => {
  let { user_id,subject_id, total_hours_per_week,type_prac_or_theory, semester, 'program_ids[]': program_ids } = req.body;


  // For cases where program_ids is a single value and not an array
  if (!Array.isArray(program_ids)) {
      program_ids = [program_ids];  // Convert single value to array
  }


  // Check if required fields are present
  if (!subject_id || !user_id || !program_ids || !program_ids.length) {
      return res.status(400).send('Missing required fields: subject_id, user_id, or program_ids');
  }
  

  try {
      // Pass the parameters correctly to the model function
      await addSubject({ user_id,subject_id, total_hours_per_week,type_prac_or_theory, semester, program_ids }); // Pass as an object
      res.redirect('/work_reports');
  } catch (error) {
      res.status(500).send('Error assigning information: ' + error.message);
  }
};





export const getEditSubjectForm = async (req, res) => {
  try {
    const subject = await getSubjectById(req.params.id);
    res.render('work_reports', { subject });
  } catch (error) {
    res.status(500).send('Error getting subject: ' + error.message);
  }
};

export const handleUpdateSubject = async (req, res) => {
  try {
    await updateSubject(req.params.id, req.body);
    res.redirect('/work_reports');
  } catch (error) {
    res.status(500).send('Error updating subject: ' + error.message);
  }
};

export const handleDeleteSubject = async (req, res) => {
  try {
    await deleteSubject(req.params.id);
    res.redirect('/work_reports');
  } catch (error) {
    res.status(500).send('Error deleting subject: ' + error.message);
  }
};

export const listSubjects = async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    const programs = await getAllprograms();
    const users = await getAllusers();
    const venues = await getAllvenues();
    const departments = await getAlldepartments()
    const registered_subjects = await getAllregistered_subjects();
    res.render('work_reports', { subjects,programs,users,registered_subjects,venues,departments});
  } catch (error) {
    res.status(500).send('Error fetching subjects: ' + error.message);
  }
};



export const searchTimetables = async (filters) => {
  try {
    const timetables = await timetableModel.getTimetablesFromDB(filters);
    return timetables;
     // This now filter venue data

  } catch (error) {
    console.error('Error fetching timetables:', error); // Added logging
    throw new Error('Error fetching timetables: ' + error.message);
  }
};


export const getDistinctValues = async (column) => {
  try {
    const values = await timetableModel.getDistinctValues(column);
    return values;
  } catch (error) {
    console.error('Error fetching distinct values:', error); // Added logging
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};


