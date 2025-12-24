// logics/programLogic.js
import { getAllprograms,  addProgramsFromFile,addprogram, updateprogram, deleteprogram ,getProgramsFromDB,getDistinctValues1,getProgramByCode} from '../models/programsModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';




import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';




export const searchprograms = async (filters) => {
  try {
    const programs = await getProgramsFromDB(filters);
    return programs;
  } catch (error) {
    throw new Error('Error fetching programs this is in programsLogic.js: ' + error.message);
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




export const handleAddProgramFromFile = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = path.resolve('uploads', file.filename);
    let programs = [];

    if (file.mimetype === 'text/csv') {
      programs = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', (error) => reject(error));
      });
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      programs = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).send('Invalid file type. Please upload a CSV or Excel file.');
    }

    // Now pass programs to inserting logic
    const { insertedPrograms, duplicatePrograms } = await addProgramsFromFile(programs);

    console.log(`Successfully inserted: ${insertedPrograms.length} programs`);
    console.log(`Duplicates skipped: ${duplicatePrograms.join(', ')}`);
    
    res.redirect('/programs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file: ' + error.message);
  }
};

export const showprogramForm = async (req, res) => {
  const { id } = req.params;
  try {
    const departments = await getAlldepartments();

    if (id) {
      const program = await getProgramByCode(id); // au getprogramById
      res.render('programs', { program, departments });
    } else {
      res.render('programs', { program: null, departments });
    }
  } catch (error) {
    res.status(500).send('Error fetching program or departments: ' + error.message);
  }
};


// export const showprogramForm = async (req, res) => {
//   const { id } = req.params;
//   try {
//     if (id) {
//         // const venues = await getAllvenues();
//       const program = await getprogramById(id);
  
//       const departments = await getAlldepartments();
//       res.render('programs', { program,departments});
//     } else {
   
//       const departments = await getAlldepartments();
//       res.render('programs', { program: null,departments});
//     }
//   } catch (error) {
//     res.status(500).send('Error fetching program or programs or departments: ' + error.message);
//   }
// };





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
