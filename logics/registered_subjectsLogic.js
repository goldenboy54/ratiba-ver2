// logics/registered_subjectsLogic.js
import { getAllregistered_subjects, addregistered_subject, updateregistered_subject, deleteregistered_subject } from '../models/registered_subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
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

