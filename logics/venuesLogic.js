// logics/venueLogic.js
import { getAllvenues,addVenuesFromFile, addvenue, updatevenue, deletevenue } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';




import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// export const listPrograms = async (req, res) => {
//   try {
//     const programs = await getAllprograms();
//     res.render('programs', { programs });
//   } catch (error) {
//     res.status(500).send('Error fetching programs: ' + error.message);
//   }
// };

// export const handleAddprogram = async (req, res) => {
//   try {
//     await addprogram(req.body);
//     res.redirect('/programs');
//   } catch (error) {
//     res.status(500).send('Error adding program: ' + error.message);
//   }
// };

export const handleAddVenueFromFile = async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }
  
    try {
      const filePath = path.resolve('uploads', file.filename);
      const venues = [];
  
      if (file.mimetype === 'text/csv') {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => venues.push(row))
          .on('end', async () => {
            await addVenuesFromFile(venues);
            res.redirect('/venues');
          });
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        await addVenuesFromFile(data);
        res.redirect('/venues');
      } else {
        res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
      }
    } catch (error) {
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
