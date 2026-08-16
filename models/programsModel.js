// models/programModel.js
import pool from '../db.js';

import db from '../db.js';


export const getProgramsFromDB = async (filters) => {
  let query = 'SELECT *FROM programs WHERE 1=1 ';
  const params = [];

  if (filters.program_name) {
    query += ' AND program_name = ?';
    params.push(filters.program_name);
  }
  if (filters.program_code) {
    query += ' AND program_code = ?';
    params.push(filters.program_code);
  }
  if (filters.duration) {
    query += ' AND duration = ?';
    params.push(filters.duration);
  }
  if (filters.level) {
    query += ' AND level = ?';
    params.push(filters.level);
  }
  if (filters.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.program_capacity) {
    query += ' AND program_capacity = ?';
    params.push(filters.program_capacity);
  }
  if (filters.program_type) {
    query += ' AND program_type = ?';
    params.push(filters.program_type);
  }
  query += ' ORDER BY program_name ASC';

  try {
    const [programs] = await db.query(query, params);
    return programs;
  } catch (err) {
    throw new Error('Database query failed this is in programsModel.js');
  }
};

export const getDistinctValues1 = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM programs`);
    return values;
  } catch (err) {
    throw new Error('Database query failed this is in programsModel.js');
  }
};




export const getAllprograms= async()=> {
    try{
          const dbquery ='SELECT * FROM programs';
          const [matokeoYaQuery]= await pool.execute(dbquery);
      return matokeoYaQuery;
      }
  catch(err){
      console.error(err);
      throw err;
  }
  };
export const addprogram= async (program) => {
try{
    const {name,program_code,duration,level,category,program_capacity,program_type}=program;
    const dbquery='INSERT INTO programs (program_name,program_code,duration,level,category,program_capacity,program_type) VALUES (?,?, ?,?,?,?,?)';
    const valuesArray=[name,program_code,duration,level,category,program_capacity,program_type];
    const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
return matokeoYaQuery;
}catch(err){
  console.error(err);
  throw err;
}
};


export const getProgramByCode = async (program_code) => {
  if (!program_code) return null;
  
  const [rows] = await pool.execute('SELECT * FROM programs WHERE program_code = ?', [program_code]);
  return rows.length > 0 ? rows[0] : null;
};

export const addProgramsFromFile = async (programs) => {
  const insertedPrograms = [];
  const duplicatePrograms = [];

  for (const program of programs) {
    const code = program.program_code;

    if (!code || code.trim() === '') {
      console.log('Skipping program with missing or empty program_code');
      continue;
    }

    const existingProgram = await getProgramByCode(code);

    if (existingProgram) {
      console.log(`Duplicate found: ${code} already exists.`);
      duplicatePrograms.push(code);
      continue;
    }

    // Prepare values
    const query = `INSERT INTO programs 
      (program_name, program_code, duration, level, category, program_capacity, program_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      program.program_name ?? null,
      program.program_code ?? null,
      program.duration ?? null,
      program.level ?? null,
      // accept either program_department or category from input files
      (program.program_department ?? program.category ?? null),
      program.program_capacity ?? null,
      program.program_type ?? null,
    ];

    await pool.execute(query, values);
    insertedPrograms.push(code);
  }

  return { insertedPrograms, duplicatePrograms };
};

export const updateprogram = async (id, program) => {
try{
  const {name,program_code,duration,level,category,program_capacity,program_type}=program;
  const dbquery='UPDATE programs SET program_name=?,program_code=?,duration=?,level=?,category=?,program_capacity=?,program_type=? WHERE program_id = ?';
  const valuesArray=[ name,program_code,duration,level,category,program_capacity,program_type, id];
  const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
return matokeoYaQuery;
}
catch(err){
  console.error(err);
  throw err;
}
};

export const deleteprogram = async (id) => {
  const dbquery='DELETE FROM programs WHERE program_id = ?';
  const valuesArray=[id];
  const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
  return matokeoYaQuery;
};
