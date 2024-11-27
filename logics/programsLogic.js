// logics/programLogic.js
import { getAllprograms,  addProgramsFromFile,addprogram, updateprogram, deleteprogram } from '../models/programsModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';



// import {
//   getAllprograms,
//   getprogramById,
//   addprogram,
//   updateprogram,
//   deleteprogram,
//   addProgramsFromFile,
// } from '../models/programsModel.js';

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

export const handleAddProgramFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    const programs = [];

    if (file.mimetype === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => programs.push(row))
        .on('end', async () => {
          await addProgramsFromFile(programs);
          res.redirect('/programs');
        });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      await addProgramsFromFile(data);
      res.redirect('/programs');
    } else {
      res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }
  } catch (error) {
    res.status(500).send('Error processing file: ' + error.message);
  }
};



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
