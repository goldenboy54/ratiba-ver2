import timetableModel from '../models/tmasterModel.js'; // Default import for the model
import { getAllSubjects, addSubject, updateSubject, deleteSubject } from '../models/subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
import { addtimetable } from '../models/tmasterModel.js';
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
      res.render('tmaster', { subject,programs,users,registered_subjects,venues,departments});
    } else {
      const departments = await getAlldepartments()
      const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      const registered_subjects = await getAllregistered_subjects();
      res.render('tmaster', { subject: null,programs,users,registered_subjects,venues,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching subjects or programs or users or registered_subjects: ' + error.message);
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



export const handleAddtimetable = async (req, res) => {
  let { day, venue_id, 'subject_ids[]': subject_ids } = req.body;

  // For cases where subject_ids is a single value and not an array
  if (!Array.isArray(subject_ids)) {
      subject_ids = [subject_ids];  // Convert single value to array
  }

  // console.log('Day:', day);
  // console.log('Venue ID:', venue_id);
  // console.log('Subject IDs:', subject_ids);

  // Check if required fields are present
  if (!day || !venue_id || !subject_ids || !subject_ids.length) {
      return res.status(400).send('Missing required fields: day, venue_id, or subject_ids');
  }

  try {
      // Pass the parameters correctly to the model function
      await addtimetable({ day, venue_id, subject_ids }); // Pass as an object
      res.redirect('/tmaster');
  } catch (error) {
      res.status(500).send('Error adding timetable: ' + error.message);
  }
};
