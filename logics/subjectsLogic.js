// logics/subjectsLogic.js
import { getAllSubjects, addSubjectInDB, getSubjectByUniqueKeys,
  getUserByEmail,addSubject, updateSubject,  getRegisteredSubjectByCode,
   getProgramsByCodes, deleteSubject } from '../models/subjectsModel.js';
import { getAllprograms } from '../models/programsModel.js';
import { getAllusers } from '../models/usersModel.js';
import { getAllvenues } from '../models/venuesModel.js';
import { getAlldepartments } from '../models/departmentsModel.js';
import { getAllregistered_subjects } from '../models/registered_subjectsModel.js';
import timetableModel from '../models/subjectsModel.js'; 


// logics/subjectsLogic.js
import fs from 'fs';
import xlsx from 'xlsx';
import csvtojson from 'csvtojson';



export const showSubjectForm = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      const subject = await getSubjectById(id);
      const programs = await getAllprograms();
      const users = await getAllusers();
      const venues = await getAllvenues();
      const departments = await getAlldepartments()
      const registered_subjects = await getAllregistered_subjects();
      res.render('subjects', { subject,programs,users,registered_subjects,venues,departments});
    } else {
      const departments = await getAlldepartments()
      const venues = await getAllvenues();
      const programs = await getAllprograms();
      const users = await getAllusers();
      const registered_subjects = await getAllregistered_subjects();
      res.render('subjects', { subject: null,programs,users,registered_subjects,venues,departments});
    }
  } catch (error) {
    res.status(500).send('Error fetching subjects or programs or users or registered_subjects: ' + error.message);
  }
};


// ---------------------- UPLOAD HANDLER ----------------------

// ---------------------- UPLOAD HANDLER ----------------------
export const handleUploadSubjectsCSV = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded.");

  try {
    let jsonData;
    const mime = file.mimetype;

    // Read XLSX or CSV
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.originalname.endsWith(".xlsx")
    ) {
      const workbook = xlsx.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      jsonData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    } else if (mime === "text/csv" || file.originalname.endsWith(".csv")) {
      jsonData = await csvtojson().fromFile(file.path);
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).send("Invalid file type. Upload CSV or XLSX.");
    }

    const results = {
      imported: 0,
      skipped: 0,
      duplicates: [],
      errors: []
    };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Normalizing & reading columns
      const user_email = (row.user_email || row.email || "").trim();
      const subject_code = (row.subject_code || row.subject || "").trim();
      const semester = (row.semester || "").trim();
      const type_prac_or_theory = (row.type_prac_or_theory || "").trim();
      const total_hours_per_week =
        Number(row.total_hours_per_week || row.total_hours || 0);

      const program_code_field =
        (row.program_code || row.program || row.program_codes || "").trim();

      // Required fields
      if (
        !user_email ||
        !subject_code ||
        !semester ||
        !type_prac_or_theory ||
        !program_code_field
      ) {
        results.skipped++;
        results.errors.push({
          row: i + 1,
          reason:
            "Missing required fields (user_email, subject_code, semester, type_prac_or_theory, program_code)."
        });
        continue;
      }

      try {
        // 1) Get user
        const user = await getUserByEmail(user_email);
        if (!user) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            reason: `User with email ${user_email} not found.`
          });
          continue;
        }

        // 2) Get registered subject
        const regSub = await getRegisteredSubjectByCode(subject_code);
        if (!regSub) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            reason: `Registered subject ${subject_code} not found.`
          });
          continue;
        }

        // 3) Extract program codes
        const programCodes = program_code_field
          .split("+")
          .map((x) => x.trim())
          .filter(Boolean);

        const programs = await getProgramsByCodes(programCodes);
        if (!programs.length) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            reason: `Programs not found for: ${program_code_field}`
          });
          continue;
        }

        // 4) Combine program_code for duplicate checking
        const mixed_program_code = [
          ...new Set(programs.map((p) => p.program_code.trim()))
        ].join(" + ");

        // 5) STRICT duplicate check
        const duplicate = await getSubjectByUniqueKeys(
          user.user_id,
          subject_code,
          semester,
          type_prac_or_theory,
          mixed_program_code
        );

        if (duplicate) {
          results.duplicates.push({
            row: i + 1,
            reason:
              "Duplicate exists (user + subject_code + semester + type + program_code)."
          });
          results.skipped++;
          continue;
        }

        // 6) Prepare insertion payload
        const payload = {
          user_id: user.user_id,
          registered_subject: regSub,
          total_hours_per_week,
          semester,
          type_prac_or_theory,
          programRows: programs
        };

        await addSubjectInDB(payload);
        results.imported++;
      } catch (err) {
        results.skipped++;
        results.errors.push({ row: i + 1, reason: err.message });
      }
    }

    fs.unlinkSync(file.path);
    console.log("UPLOAD SUMMARY:", results);

    res.redirect("/subjects");
  } catch (err) {
    try {
      if (file && file.path) fs.unlinkSync(file.path);
    } catch (e) {}
    res.status(500).send("Error processing file: " + err.message);
  }
};


// export const handleUploadSubjectsCSV = async (req, res) => {
//   const file = req.file;
//   if (!file) return res.status(400).send('No file uploaded.');
//   try {
//     let jsonData;
//     const mime = file.mimetype;
//     // Accept .xlsx or CSV
//     if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.originalname.endsWith('.xlsx')) {
//       const workbook = xlsx.readFile(file.path);
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
//       jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
//     } else if (mime === 'text/csv' || file.originalname.endsWith('.csv')) {
//       jsonData = await csvtojson().fromFile(file.path);
//     } else {
//       // delete temp file
//       fs.unlinkSync(file.path);
//       return res.status(400).send('Invalid file type. Upload CSV or XLSX.');
//     }

//     const results = {
//       imported: 0,
//       skipped: 0,
//       errors: [],
//       duplicates: []
//     };

//     for (let i = 0; i < jsonData.length; i++) {
//       const row = jsonData[i];
//       // normalize keys (in case of variations)
//       const user_email = (row.user_email || row.email || row.User_Email || '').toString().trim();
//       const subject_code = (row.subject_code || row.subject || row.Subject_Code || '').toString().trim();
//       const total_hours_per_week = row.total_hours_per_week || row.total_hours || row.ltpa || 0;
//       const semester = (row.semester || row.Sem || '').toString().trim();
//       const type_prac_or_theory = (row.type_prac_or_theory || row.Type_Prac_Or_Theory || '').toString().trim();

//       // Basic validation
//       if (!user_email || !subject_code || !semester || !type_prac_or_theory) {
//         results.skipped++;
//         results.errors.push({ row: i + 1, reason: 'Missing required fields (user_email, subject_code, semester or type_prac_or_theory).' });
//         continue;
//       }

//       try {
//         // 1) get user_id
//         const user = await getUserByEmail(user_email);
//         if (!user) {
//           results.skipped++;
//           results.errors.push({ row: i + 1, reason: `User with email ${user_email} not found.` });
//           continue;
//         }
//         const user_id = user.user_id;

//         // 2) get registered_subject by code
//         const regSub = await getRegisteredSubjectByCode(subject_code);
//         if (!regSub) {
//           results.skipped++;
//           results.errors.push({ row: i + 1, reason: `Registered subject with code ${subject_code} not found.` });
//           continue;
//         }

//         // 3) check duplicate (same user_id, subject_code, semester)
//         const existing = await getSubjectByUniqueKeys(user_id, subject_code, semester,type_prac_or_theory);
//         if (existing) {
//           results.duplicates.push({ row: i + 1, reason: 'Duplicate exists (user+subject+semester+type).' });
//           results.skipped++;
//           continue;
//         }

//         // 4) programs: either a single program_code or combined by '+'
//         // Expect a column program_code maybe; if not provided we can require program_code column in excel
//         const program_code_field = (row.program_code || row.program || row.program_codes || '').toString().trim();
//         if (!program_code_field) {
//           results.skipped++;
//           results.errors.push({ row: i + 1, reason: 'Missing program_code(s) field.' });
//           continue;
//         }
//         // split by '+' and trim
//         const programCodes = program_code_field.split('+').map(s => s.trim()).filter(Boolean);

//         const programs = await getProgramsByCodes(programCodes);
//         if (!programs || programs.length === 0) {
//           results.skipped++;
//           results.errors.push({ row: i + 1, reason: `No programs found for code(s): ${program_code_field}` });
//           continue;
//         }

//         // Prepare payload for DB insertion
//         const payload = {
//           user_id,
//           registered_subject: regSub, // includes registered_subject_code, registered_subject_name, credit, registered_subject_department
//           total_hours_per_week: Number(total_hours_per_week) || Number(regSub.total_hours_per_week) || 0,
//           semester,
//           type_prac_or_theory: row.type_prac_or_theory || 'Theory',
//           programRows: programs // array of program objects
//         };

//         await addSubjectInDB(payload);
//         results.imported++;

//       } catch (err) {
//         console.error('Row import error:', err);
//         results.skipped++;
//         results.errors.push({ row: i + 1, reason: err.message });
//       }
//     }

//     // delete temp file
//     fs.unlinkSync(file.path);

//     console.log('Upload summary:', results);
//     // Optionally show results in query string or flash; here we redirect to /subjects
//     res.redirect('/subjects');
//   } catch (err) {
//     console.error(err);
//     // remove temp file
//     try { if (file && file.path) fs.unlinkSync(file.path); } catch (e) {}
//     res.status(500).send('Error processing file: ' + err.message);
//   }
// };




export const handleAddSubject = async (req, res) => {
  let { user_id,subject_id, total_hours_per_week,type_prac_or_theory, semester, 'program_ids[]': program_ids } = req.body;


  // For cases where program_ids is a single value and not an array
  if (!Array.isArray(program_ids)) {
      program_ids = [program_ids];  // Convert single value to array
  }


  // Check if required fields are present
  if (!subject_id || !user_id || !program_ids || !program_ids.length) {
      return res.status(400).send('Missing required fields: subject_id, user_id, or program_ids');
  }
  

  try {
      // Pass the parameters correctly to the model function
      await addSubject({ user_id,subject_id, total_hours_per_week,type_prac_or_theory, semester, program_ids }); // Pass as an object
      res.redirect('/subjects');
  } catch (error) {
      res.status(500).send('Error assigning information: ' + error.message);
  }
};





export const getEditSubjectForm = async (req, res) => {
  try {
    const subject = await getSubjectById(req.params.id);
    res.render('subjects', { subject });
  } catch (error) {
    res.status(500).send('Error getting subject: ' + error.message);
  }
};

export const handleUpdateSubject = async (req, res) => {
  try {
    await updateSubject(req.params.id, req.body);
    res.redirect('/subjects');
  } catch (error) {
    res.status(500).send('Error updating subject: ' + error.message);
  }
};

export const handleDeleteSubject = async (req, res) => {
  try {
    await deleteSubject(req.params.id);
    res.redirect('/subjects');
  } catch (error) {
    res.status(500).send('Error deleting subject: ' + error.message);
  }
};

export const listSubjects = async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    const programs = await getAllprograms();
    const users = await getAllusers();
    const venues = await getAllvenues();
    const departments = await getAlldepartments()
    const registered_subjects = await getAllregistered_subjects();
    res.render('subjects', { subjects,programs,users,registered_subjects,venues,departments});
  } catch (error) {
    res.status(500).send('Error fetching subjects: ' + error.message);
  }
};



export const searchTimetables = async (filters) => {
  try {
    const timetables = await timetableModel.getTimetablesFromDB(filters);
    return timetables;
     // This now filter venue data

  } catch (error) {
    console.error('Error fetching timetables:', error); // Added logging
    throw new Error('Error fetching timetables: ' + error.message);
  }
};


export const getDistinctValues = async (column) => {
  try {
    const values = await timetableModel.getDistinctValues(column);
    return values;
  } catch (error) {
    console.error('Error fetching distinct values:', error); // Added logging
    throw new Error('Error fetching distinct values: ' + error.message);
  }
};


