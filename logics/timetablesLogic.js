// logics/timetablesLogic.js
import { getAlltimetables, addtimetable, updatetimetable, deletetimetable } from '../models/timetablesModel.js';

export const showtimetableForm = (req, res) => {
  const { id } = req.params;
  if (id) {
    gettimetableById(id)
      .then(timetable => res.render('timetables', { timetable }))
      .catch(error => res.status(500).send('Error fetching timetable: ' + error.message));
  } else {
    res.render('timetables', { timetable: null });
  }
};

export const handleAddtimetable = async (req, res) => {
  try {
    await addtimetable(req.body);
    res.redirect('/timetables');
  } catch (error) {
    res.status(500).send('Error adding timetable: ' + error.message);
  }
};

export const getEdittimetableForm = async (req, res) => {
  try {
    const timetable = await gettimetableById(req.params.id);
    res.render('timetables', { timetable });
  } catch (error) {
    res.status(500).send('Error getting timetable: ' + error.message);
  }
};

export const handleUpdatetimetable = async (req, res) => {
  try {
    await updatetimetable(req.params.id, req.body);
    res.redirect('/timetables');
  } catch (error) {
    res.status(500).send('Error updating timetable: ' + error.message);
  }
};

export const handleDeletetimetable = async (req, res) => {
  try {
    await deletetimetable(req.params.id);
    res.redirect('/timetables');
  } catch (error) {
    res.status(500).send('Error deleting timetable: ' + error.message);
  }
};

// logics/timetableLogic.js
export const listtimetables = async (req, res) => {
  try {
    const timetables = await getAlltimetables();
    res.render('timetables', { timetables });
 
  } catch (error) {
    res.status(500).send('Error fetching timetables: ' + error.message);
  }
};
