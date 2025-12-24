// logics/venueLogic.js
import { getAllvenues,addVenuesFromFile, addvenue, updatevenue, deletevenue,getVenuesFromDB,getDistinctValues1,getVenueByName } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';

import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';



export const searchVenues = async (filters) => {
  try {
    const venues = await getVenuesFromDB(filters);
    return venues;
  } catch (error) {
    throw new Error('Error fetching venues: ' + error.message);
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



export const handleAddVenueFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    let venues = [];

    if (file.mimetype === 'text/csv') {
      venues = await new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve(rows))
          .on('error', (error) => reject(error));
      });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      venues = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }

    // hapa sasa tunaingia kwenye kuchuja
    const newVenues = [];
    const duplicates = [];

    for (const venue of venues) {
      const venueName = venue.venue_name;
      if (!venueName || venueName.trim() === '') {
        console.log('Skipping row with missing or empty venue_name');
        continue;
      }

      const existingVenue = await getVenueByName(venueName.trim());

      if (existingVenue) {
        console.log(`Duplicate found: ${venueName} already exists.`);
        duplicates.push(venueName);
        continue;
      }

      newVenues.push([
        venue.venue_name,
        venue.venue_capacity,
        venue.venue_location,
        venue.venue_type,
        venue.venue_quality,
        venue.venue_department,
        venue.venue_status,
      ]);
    }

    if (newVenues.length > 0) {
      await addVenuesFromFile(newVenues); // badilisha hapa uone kwenye model
    }

    console.log(`Upload complete. Inserted ${newVenues.length} new venues. Duplicates: ${duplicates.length}`);
    res.redirect('/venues');

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file: ' + error.message);
  }
};

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
