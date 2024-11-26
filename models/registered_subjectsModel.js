// models/registered_subjectsModel.js
import pool from '../db.js';

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
