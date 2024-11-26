// models/userModel.js
import bcrypt from 'bcrypt';
import pool from '../db.js';

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





export const updateuser = async (id,user) => {
  try {

    const { full_name, department, user_email, role, password, status } = user;
// console.log(full_name)
// console.log(department)
// console.log(user_email)
// console.log(role)
// console.log(password)
// console.log(status)
      if (!full_name || !user_email || !password) {
        throw new Error('Full name, email, and password are required.');
      }
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : null;
    // console.log(hashedPassword)
    // Update user information
    const dbquery =
      'UPDATE users SET full_name = ?, department = ?, user_email = ?, role = ?, password = ?, status = ?  WHERE user_id = ?';
    const valuesArray = [
      full_name,
      department,
      user_email,
      role,
      hashedPassword,
      status,
      id,
    ];

    const [result] = await pool.execute(dbquery, valuesArray);
    return result;

  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};



// export const updateuser = async (user) => {
//   const { full_name, department, user_email, role, password, status } = user;

//   if (!full_name || !user_email || !password) {
//     throw new Error('Full name, email, and password are required.');
//   }

//   try {
//     // Check if user already exists
  
//     // Hashing the password
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Prepare the values for insertion
//     const valuesArray = [
//       full_name || null,        // Use null if value is undefined
//       department || null,       // Use null if value is undefined
//       user_email || null,       // Use null if value is undefined
//       role || null,             // Use null if value is undefined
//       hashedPassword || null,   // Use null if value is undefined
//       status || null            // Use null if value is undefined
//     ];

//     // Insert the new user into the database
//     const dbquery =
//      'UPDATE users SET full_name = ?, department = ?, user_email = ?, role = ?, password = ?, status = ?  WHERE user_id = ?';
//     const [result] = await pool.execute(dbquery, valuesArray);
//     return result;
//   } catch (err) {
//     console.error('Error adding user:', err);
//     throw err;
//   }
// };




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
