// logics/usersLogic.js
import { getAllusers, adduser, updateuser, deleteuser, getuserById } from '../models/usersModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
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
