// models/departmentsModel.js
import pool from '../db.js';

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
