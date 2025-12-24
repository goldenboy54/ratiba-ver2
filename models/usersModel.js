// models/userModel.js
import bcrypt from 'bcrypt';
import pool from '../db.js';
import db from '../db.js';
export const getUsersFromDB = async (filters) => {
  let query = 'SELECT * FROM users WHERE 1=1 ';
  const params = [];

  if (filters.full_name) {
    query += ' AND full_name = ?';
    params.push(filters.full_name);
  }
  if (filters.department) {
    query += ' AND department = ?';
    params.push(filters.department);
  }
  if (filters.user_email) {
    query += ' AND user_email = ?';
    params.push(filters.user_email);
  }
  if (filters.role) {
    query += ' AND role = ?';
    params.push(filters.role);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY full_name ASC';

  try {
    const [users] = await db.query(query, params);
    return users;
  } catch (err) {
    throw new Error('Database query failed this is in usersModel.js');
  }
};

export const getDistinctValues1 = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM users`);
    return values;
  } catch (err) {
    throw new Error('Database query failed this is in usersModel.js');
  }
};




const saltRounds = 3;

export const getAllusers = async () => {
  try {
    const dbquery = 'SELECT * FROM users';
    const [results] = await pool.execute(dbquery);
    return results;
  } catch (err) {
    console.error('Error fetching users:', err);
    throw err;
  }
};

export const adduser = async (user) => {
  const { full_name, department, user_email, role, password, status } = user;

  if (!full_name || !user_email || !password) {
    throw new Error('Full name, email, and password are required.');
  }

  try {
    // Check if user already exists
    const dbquery1 = 'SELECT * FROM users WHERE user_email = ?';
    const valuesArray1 = [user_email];
    const [existingUser] = await pool.execute(dbquery1, valuesArray1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hashing the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare the values for insertion
    const valuesArray = [
      full_name || null,        // Use null if value is undefined
      department || null,       // Use null if value is undefined
      user_email || null,       // Use null if value is undefined
      role || null,             // Use null if value is undefined
      hashedPassword || null,   // Use null if value is undefined
      status || null            // Use null if value is undefined
    ];

    // Insert the new user into the database
    const dbquery =
      'INSERT INTO users (full_name, department, user_email, role, password, status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.execute(dbquery, valuesArray);
    return result;
  } catch (err) {
    console.error('Error adding user:', err);
    throw err;
  }
};


export const updateuser = async (id, user) => {
  try {
    const { full_name, department, user_email, role, password, status } = user;

    if (!full_name || !user_email) {
      throw new Error('Full name and email are required.');
    }

    // Get current password if new password is blank
    let finalPassword;
    if (!password) {
      const existingUser = await getuserById(id);
      if (!existingUser) throw new Error('User not found.');
      finalPassword = existingUser.password; // keep current password
    } else {
      finalPassword = await bcrypt.hash(password, saltRounds); // hash new password
    }

    // Update query
    const dbquery = `
      UPDATE users 
      SET full_name = ?, department = ?, user_email = ?, role = ?, password = ?, status = ? 
      WHERE user_id = ?
    `;
    const valuesArray = [full_name, department, user_email, role, finalPassword, status, id];

    const [result] = await pool.execute(dbquery, valuesArray);
    return result;
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};


export const deleteuser = async (id) => {
  try {
    const dbquery = 'DELETE FROM users WHERE user_id = ?';
    const valuesArray = [id];
    const [result] = await pool.execute(dbquery, valuesArray);
    return result;
  } catch (err) {
    console.error('Error deleting user:', err);
    throw err;
  }
};

// Add this function
export const getuserById = async (id) => {
  try {
    const dbquery = 'SELECT * FROM users WHERE user_id = ?';
    const valuesArray = [id];
    const [results] = await pool.execute(dbquery, valuesArray);
    
    // Check if any result is returned
    if (results.length > 0) {
      return results[0];  // Return the first result
    } else {
      // Handle case where no user is found
      return null;
    }
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    throw err;
  }
};


// Get user by email
export const getUserByEmail = async (email) => {
  try {
    if (!email) return null;
    const [rows] = await pool.execute('SELECT * FROM users WHERE user_email = ?', [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error checking user_email existence:', error);
    throw error;
  }
};

// Add a single user
export const addUsersFromFile = async (user) => {
  try {
    const password = "123"; // Default password or you can randomize
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `INSERT INTO users (full_name, department, user_email, role, password, status)
                   VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
      user.full_name,
      user.mother_department,
      user.work_email,
      user.staff_role,
      hashedPassword,
      user.status
    ];

    await pool.execute(query, values);
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};
