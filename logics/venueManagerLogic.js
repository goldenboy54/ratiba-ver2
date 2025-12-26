// logics/venueManagerLogic.js
import {
  getVenuesFromDB,
  getDistinctValues,
  addVenue,
  updateVenue,
  deleteVenue,
  getVenueById,
  getAllVenues,
  getVenueByName
} from '../models/venueManagerModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import xlsx from 'xlsx';
import csvtojson from 'csvtojson';

export const searchVenues = async (filters) => {
  try {
    return await getVenuesFromDB(filters);
  } catch (error) {
    throw new Error('Error fetching venues: ' + error.message);
  }
};

export const getDistinct = async (column) => {
  try {
    return await getDistinctValues(column);
  } catch (error) {
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};

export const handleUploadCSV = async (req, res) => {
  const file = req.file;
  try {
    let jsonData;
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
    const duplicates = [];
    for (const row of jsonData) {
      const name = row.venue_name;
      if (!name || name.trim() === '') continue;
      const existing = await getVenueByName(name);
      if (existing) {
        duplicates.push(name);
        continue;
      }
      await addVenue(row);
    }
    if (duplicates.length > 0) {
      console.log('Duplicates skipped:', duplicates);
    }
    res.redirect('/venueManager');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file.');
  }
};

export const showVenueForm = async (req, res) => {
  const { id } = req.params;
  try {
    const departments = await getAlldepartments();
    if (id) {
      const venue = await getVenueById(id);
      res.render('venueManager', { venue, departments });
    } else {
      res.render('venueManager', { venue: null, departments });
    }
  } catch (error) {
    res.status(500).send('Error fetching venue or departments: ' + error.message);
  }
};

export const handleAddVenue = async (req, res) => {
  try {
    await addVenue(req.body);
    res.redirect('/venueManager');
  } catch (error) {
    res.status(500).send('Error adding venue: ' + error.message);
  }
};

export const getEditVenueForm = async (req, res) => {
  try {
    const venue = await getVenueById(req.params.id);
    const departments = await getAlldepartments();
    res.render('venueManager', { venue, departments });
  } catch (error) {
    res.status(500).send('Error getting venue: ' + error.message);
  }
};

export const handleUpdateVenue = async (req, res) => {
  try {
    await updateVenue(req.params.id, req.body);
    res.redirect('/venueManager');
  } catch (error) {
    res.status(500).send('Error updating venue: ' + error.message);
  }
};

export const handleDeleteVenue = async (req, res) => {
  try {
    await deleteVenue(req.params.id);
    res.redirect('/venueManager');
  } catch (error) {
    res.status(500).send('Error deleting venue: ' + error.message);
  }
};

export const listVenues = async (req, res) => {
  try {
    const venues = await getAllVenues();
    const departments = await getAlldepartments();
    res.render('venueManager', { Viewvenues: venues, departments });
  } catch (error) {
    res.status(500).send('Error fetching venues: ' + error.message);
  }
};