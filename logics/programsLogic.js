// logics/programLogic.js
import { getAllprograms, addprogram, updateprogram, deleteprogram } from '../models/programsModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';

export const showprogramForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
        // const venues = await getAllvenues();
      const program = await getprogramById(id);
  
      const departments = await getAlldepartments();
      res.render('programs', { program,departments});
    } else {
   
      const departments = await getAlldepartments();
      res.render('programs', { program: null,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching program or programs or departments: ' + error.message);
  }
};



export const handleAddprogram = async (req, res) => {
  try {
    await addprogram(req.body);
    res.redirect('/programs');
  } catch (error) {
    res.status(500).send('Error adding program: ' + error.message);
  }
};

export const getEditprogramForm = async (req, res) => {
  try {
    const program = await getprogramById(req.params.id);
    res.render('programs', { program });
  } catch (error) {
    res.status(500).send('Error getting program: ' + error.message);
  }
};

export const handleUpdateprogram = async (req, res) => {
  try {
    await updateprogram(req.params.id, req.body);
    res.redirect('/programs');
  } catch (error) {
    res.status(500).send('Error updating program: ' + error.message);
  }
};

export const handleDeleteprogram = async (req, res) => {
  try {
    await deleteprogram(req.params.id);
    res.redirect('/programs');
  } catch (error) {
    res.status(500).send('Error deleting program: ' + error.message);
  }
};

export const listprograms = async (req, res) => {
  try {
    const programs = await getAllprograms();
    const departments = await getAlldepartments();
    res.render('programs', { programs,departments });
  } catch (error) {
    res.status(500).send('Error fetching programs: ' + error.message);
  }
};
