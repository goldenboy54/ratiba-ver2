// models/venueModel.js
import pool from '../db.js';
import db from '../db.js';


export const getVenuesFromDB = async (filters) => {
  let query = 'SELECT * FROM venues WHERE (mnos<18 OR tnos<18 OR wnos<18 OR thnos<18 OR frnos<18)  ';
  const params = [];

  if (filters.venue_name) {
    query += ' AND venue_name = ?';
    params.push(filters.venue_name);
  }
  if (filters.venue_capacity) {
    query += ' AND capacity = ?';
    params.push(filters.venue_capacity);
  }
  if (filters.venue_location) {
    query += ' AND location = ?';
    params.push(filters.venue_location);
  }
  if (filters.venue_type) {
    query += ' AND type = ?';
    params.push(filters.venue_type);
  }
  if (filters.venue_quality) {
    query += ' AND quality = ?';
    params.push(filters.venue_quality);
  }
  if (filters.venue_department) {
    query += ' AND department = ?';
    params.push(filters.venue_department);
  }
  if (filters.venue_status) {
    query += ' AND status = ?';
    params.push(filters.venue_status);
  }


  query += ' ORDER BY totalnos DESC';


  try {
    const [venues] = await db.query(query, params);
    return venues;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

export const getDistinctValues1 = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM venues`);
    return values;
  } catch (err) {
    throw new Error('Database query failed');
  }
};




export const getAllvenues= async()=> {
    try{
          const dbquery ='SELECT * FROM venues WHERE mnos<18 OR tnos<18 OR wnos<18 OR thnos<18 OR frnos<18  ORDER BY totalnos DESC';
          const [matokeoYaQuery]= await pool.execute(dbquery);
      return matokeoYaQuery;
      }
  catch(err){
      console.error(err);
      throw err;
  }
  };

export const addvenue= async (venue) => {
try{
  const {name,capacity,location,type,quality,department,status}=venue;
    // console.log(name)
    // console.log(capacity)
    // console.log(location)
    // console.log(type)
    // console.log(quality)
    // console.log(department)
    // console.log(status)
    const dbquery='INSERT INTO venues (venue_name,capacity,location,type,quality,department,status) VALUES (?,?,?,?,?,?,?)';
    const valuesArray=[name,capacity,location,type,quality,department,status];
    const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
return matokeoYaQuery;
}catch(err){
  console.error(err);
  throw err;
}
};

export const updatevenue = async (id, venue) => {
try{
  const {name,capacity,location,type,quality,department,status}=venue;
  const dbquery='UPDATE venues SET  venue_name=? ,capacity=?,location=?,type=?,quality=?,department=?,status=? WHERE venue_id = ?';
  const valuesArray=[name,capacity,location,type,quality,department,status, id];
  const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
return matokeoYaQuery;
}
catch(err){
  console.error(err);
  throw err;
}
};

export const deletevenue = async (id) => {
  const dbquery='DELETE FROM venues WHERE venue_id = ?';
  const valuesArray=[id];
  const [matokeoYaQuery]= await pool.execute(dbquery,valuesArray);
  return matokeoYaQuery;
};


export const getVenueByName = async (venueName) => {
  if (!venueName) return null;
  const [rows] = await pool.execute('SELECT * FROM venues WHERE venue_name = ?', [venueName]);
  return rows.length > 0 ? rows[0] : null;
};


export const addVenuesFromFile = async (values) => {
  const query = `INSERT INTO venues (venue_name, capacity, location, type, quality, department, status)
                 VALUES ?`;
  await pool.query(query, [values]);
};


