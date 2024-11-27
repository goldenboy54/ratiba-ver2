// models/programModel.js
import pool from '../db.js';

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



export const addProgramsFromFile = async (programs) => {
  const query = `INSERT INTO programs (program_name, program_code, duration, level, category, program_capacity, program_type)
                 VALUES ?`;

  const values = programs.map((program) => [
    program.program_name,
    program.program_code,
    program.duration,
    program.level,
    program.program_department,
    program.program_capacity,
    program.program_type,
  ]);

  await pool.query(query, [values]);
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
