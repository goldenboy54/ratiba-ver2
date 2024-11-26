// logics/departmentsLogic.js
import { getAlldepartments, adddepartment, updatedepartment, deletedepartment } from '../models/departmentsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
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

