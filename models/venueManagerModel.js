// models/venueManagerModel.js
import db from '../db.js';

export const getVenuesFromDB = async (filters) => {
  let query = 'SELECT * FROM venues WHERE 1=1';
  const params = [];
  if (filters.venue_name) {
    query += ' AND venue_name = ?';
    params.push(filters.venue_name);
  }
  if (filters.capacity) {
    query += ' AND capacity = ?';
    params.push(filters.capacity);
  }
  if (filters.location) {
    query += ' AND location = ?';
    params.push(filters.location);
  }
  if (filters.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters.quality) {
    query += ' AND quality = ?';
    params.push(filters.quality);
  }
  if (filters.department) {
    query += ' AND department = ?';
    params.push(filters.department);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.day && filters.slot && filters.slot_status) {
    const slotCol = `${filters.day.toLowerCase()}_slot${filters.slot}_status`;
    query += ` AND ${slotCol} = ?`;
    params.push(filters.slot_status);
  }
  query += ' ORDER BY venue_id DESC';
  try {
    const [venues] = await db.query(query, params);
    return venues;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};

export const getDistinctValues = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM venues`);
    return values;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};

export const getAllVenues = async () => {
  try {
    const [results] = await db.query('SELECT * FROM venues ORDER BY venue_id DESC');
    return results;
  } catch (err) {
    throw err;
  }
};

export const getVenueById = async (id) => {
  try {
    const [rows] = await db.query('SELECT * FROM venues WHERE venue_id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    throw err;
  }
};

export const getVenueByName = async (name) => {
  try {
    if (!name) return null;
    const [rows] = await db.query('SELECT * FROM venues WHERE venue_name = ?', [name]);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    throw err;
  }
};

export const addVenue = async (venue) => {
  // Set unused columns to 0
  venue.mnos = 0;
  venue.tnos = 0;
  venue.wnos = 0;
  venue.thnos = 0;
  venue.frnos = 0;
  venue.satnos = 0;
  venue.sunnos = 0;
  venue.totalnos = 0;

  const columns = Object.keys(venue);
  const placeholders = Array(columns.length).fill('?').join(',');
  const values = Object.values(venue);
  try {
    const query = `INSERT INTO venues (${columns.join(',')}) VALUES (${placeholders})`;
    const [results] = await db.query(query, values);
    return results;
  } catch (err) {
    throw err;
  }
};

export const updateVenue = async (id, venue) => {
  const setStr = Object.keys(venue).map(k => `${k} = ?`).join(',');
  const values = [...Object.values(venue), id];
  try {
    const query = `UPDATE venues SET ${setStr} WHERE venue_id = ?`;
    const [results] = await db.query(query, values);
    return results;
  } catch (err) {
    throw err;
  }
};

export const deleteVenue = async (id) => {
  try {
    const [results] = await db.query('DELETE FROM venues WHERE venue_id = ?', [id]);
    return results;
  } catch (err) {
    throw err;
  }
};