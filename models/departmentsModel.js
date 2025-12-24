// models/departmentsModel.js
import pool from '../db.js';

import db from '../db.js';


export const getDepartmentsFromDB = async (filters) => {
  let query = 'SELECT *FROM departments WHERE 1=1 ';
  const params = [];

  if (filters.department_name) {
    query += ' AND department_name = ?';
    params.push(filters.department_name);
  }
  if (filters.department_code) {
    query += ' AND department_code = ?';
    params.push(filters.department_code);
  }
  if (filters.hod_name) {
    query += ' AND hod_name = ?';
    params.push(filters.hod_name);
  }
  if (filters.hod_email) {
    query += ' AND hod_email = ?';
    params.push(filters.hod_email);
  }


  query += ' ORDER BY department_name ASC';

  try {
    const [departments] = await db.query(query, params);
    return departments;
  } catch (err) {
    throw new Error('Database query failed this is in departmentsModel.js');
  }
};

export const getDistinctValues1 = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM departments`);
    return values;
  } catch (err) {
    throw new Error('Database query failed this is in departmentsModel.js');
  }
};



// Function to get all departments
export const getAlldepartments = async () => {
  try {
    const dbquery = 'SELECT *FROM departments';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to add a department
export const adddepartment = async (department) => {
  const { department_name, department_code,hod_name,hod_email} = department;
  try {
    const dbquery = 'INSERT INTO departments (department_name,department_code,hod_name,hod_email) VALUES (?,?,?,?)';
    const valuesArray = [department_name,department_code,hod_name,hod_email ];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to update a department
export const updatedepartment = async (id, department) => {
  const { department_name,department_code,hod_name,hod_email} = department;
  try {
    const dbquery = 'UPDATE departments SET department_name=?, department_code=?, hod_name=?,hod_email=? WHERE department_id = ?';
    const valuesArray = [department_name,department_code,hod_name,hod_email,id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// Function to delete a department
export const deletedepartment = async (id) => {
  try {
    const dbquery = 'DELETE FROM departments WHERE department_id = ?';
    const valuesArray = [id];
    const [results] = await pool.execute(dbquery, valuesArray);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};


// Search department by code
export const getDepartmentByCode = async (code) => {
  try {
    if (!code) return null;
    const [rows] = await pool.execute('SELECT * FROM departments WHERE department_code = ?', [code]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking department_code existence:', error);
    throw error;
  }
};

// Insert one department
export const addDepartmentsFromFile = async (department) => {
  const { department_name, department_code, hod_name, hod_email } = department;
  try {
    const query = 'INSERT INTO departments (department_name, department_code, hod_name, hod_email) VALUES (?, ?, ?, ?)';
    const values = [department_name, department_code, hod_name, hod_email];
    await pool.execute(query, values);
  } catch (error) {
    console.error('Error inserting department:', error);
    throw error;
  }
};
