// logics/venueLogic.js
import { getAllvenues, addvenue, updatevenue, deletevenue } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
export const showvenueForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const venue = await getvenueById(id);
      // const programs = await getAllprograms();

      // const venues = await getAllvenues();
      const departments = await getAlldepartments();
      res.render('venues', { venue,departments});
    } else {
      const departments = await getAlldepartments();
      // const venues = await getAllvenues();
      // const programs = await getAllprograms();

  
      res.render('venues', { venue: null,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching venues or programs : ' + error.message);
  }
};



export const handleAddvenue = async (req, res) => {
 const name=req.body.name;
  console.log(name);
  try {
    await addvenue({...req.body});
    res.redirect('/venues');
  } catch (error) {
    res.status(500).send('Error adding venue: ' + error.message);
  }
};

export const getEditvenueForm = async (req, res) => {
  try {
    const venue = await getvenueById(req.params.id);
    res.render('venues', { venue });
  } catch (error) {
    res.status(500).send('Error getting venue: ' + error.message);
  }
};

export const handleUpdatevenue = async (req, res) => {
  try {
    await updatevenue(req.params.id, req.body);
    res.redirect('/venues');
  } catch (error) {
    res.status(500).send('Error updating venue: ' + error.message);
  }
};

export const handleDeletevenue = async (req, res) => {
  try {
    await deletevenue(req.params.id);
    res.redirect('/venues');
  } catch (error) {
    res.status(500).send('Error deleting venue: ' + error.message);
  }
};

// logics/venueLogic.js
export const listvenues = async (req, res) => {
  try {
    const venues = await getAllvenues();
    const departments = await getAlldepartments();
    res.render('venues', { venues,departments });
  } catch (error) {
    res.status(500).send('Error fetching venues: ' + error.message);
  }
};
