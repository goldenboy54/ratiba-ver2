// models/registered_subjectsModel.js
import pool from '../db.js';
import db from '../db.js';


export const getRegistered_subjectsFromDB = async (filters) => {
  let query = 'SELECT *FROM registered_subjects WHERE 1=1 ';
  const params = [];

  if (filters.registered_subject_name) {
    query += ' AND registered_subject_name = ?';
    params.push(filters.registered_subject_name);
  }
  if (filters.registered_subject_code) {
    query += ' AND registered_subject_code = ?';
    params.push(filters.registered_subject_code);
  }
  if (filters.total_hours_per_week) {
    query += ' AND total_hours_per_week = ?';
    params.push(filters.total_hours_per_week);
  }
  if (filters.registered_subject_department) {
    query += ' AND registered_subject_department = ?';
    params.push(filters.registered_subject_department);
  }
  if (filters.credit) {
    query += ' AND credit = ?';
    params.push(filters.credit);
  }
  query += ' ORDER BY registered_subject_id DESC';

  try {
    const [registered_subjects] = await db.query(query, params);
    return registered_subjects;
  } catch (err) {
    throw new Error('Database query failed this is in registered_subjectsModel.js');
  }
};

export const getDistinctValues1 = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM registered_subjects`);
    return values;
  } catch (err) {
    throw new Error('Database query failed this is in registered_subjectsModel.js');
  }
};



// Function to get all registered_subjects
export const getAllregistered_subjects = async () => {
  try {
    const dbquery = 'SELECT *FROM registered_subjects ORDER BY registered_subject_id DESC';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};




// Check if registered_subject_code exists
export const getRegistered_subjectByCode = async (code) => {
  try {
    if (!code) {
      return null; // No need to query if code is missing
    }
    const [rows] = await pool.execute('SELECT * FROM registered_subjects WHERE registered_subject_code = ?', [code]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking registered_subject_code existence:', error);
    throw error;
  }
};


// Function to add a registered_subject
export const addregistered_subject = async (registered_subject) => {
  const { registered_subject_name, registered_subject_code,credit,total_hours_per_week,registered_subject_department } = registered_subject;
  try {
    const dbquery = 'INSERT INTO registered_subjects (registered_subject_name,registered_subject_code,credit,total_hours_per_week,registered_subject_department) VALUES (?, ?,?,?,?)';
    const valuesArray = [registered_subject_name,registered_subject_code,credit,total_hours_per_week,registered_subject_department ];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to update a registered_subject
export const updateregistered_subject = async (id, registered_subject) => {
  const { registered_subject_name,registered_subject_code,credit,total_hours_per_week,registered_subject_department} = registered_subject;
  try {
    const dbquery = 'UPDATE registered_subjects SET registered_subject_name=?, registered_subject_code=?,credit=?,total_hours_per_week=?,registered_subject_department=? WHERE registered_subject_id = ?';
    const valuesArray = [registered_subject_name,registered_subject_code,credit,total_hours_per_week,registered_subject_department,id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to delete a registered_subject
export const deleteregistered_subject = async (id) => {
  try {
    const dbquery = 'DELETE FROM registered_subjects WHERE registered_subject_id = ?';
    const valuesArray = [id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
