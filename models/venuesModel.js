// models/venueModel.js
import pool from '../db.js';

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





export const addVenuesFromFile = async (venues) => {
  const query = `INSERT INTO venues (venue_name,capacity,location,type,quality,department,status)
                 VALUES ?`;

  const values = venues.map((venue) => [
    venue.venue_name,
    venue.venue_capacity,
    venue.venue_location,
    venue.venue_type,
    venue.venue_quality,
    venue.venue_department,
    venue.venue_status,
  ]);

  await pool.query(query, [values]);
};