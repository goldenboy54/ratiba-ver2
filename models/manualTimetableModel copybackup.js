
import db from '../db.js';

const getTimetablesFromDB = async (filters) => {
  let query = `
    SELECT 
      *, semester,
      u.full_name AS tutor_name, 
      subject_id, 
      s.user_id, 
      subject_code, 
      title AS subject_name, 
      credit, 
      total_hours_per_week, 
       program_id, program_name, program_type,
     program_level, program_duration, program_category,
      subject_department AS department_name, 
      type_prac_or_theory AS subject_type
    FROM 
      subjects s 
    JOIN 
      users u ON s.user_id = u.user_id 
    
    WHERE 
      1 = 1  AND ltpa < total_hours_per_week
  `;
  const params = [];


  // Apply filters
  if (filters.tutor_name) {
    query += ' AND u.full_name = ?';
    params.push(filters.tutor_name);
  }
  if (filters.semester) {
    query += ' AND semester = ?';
    params.push(filters.semester);
  }
  if (filters.program_type) {
    query += ' AND program_type = ?';
    params.push(filters.program_type);
  }
  // Add ORDER BY clause at the end
  query += ' ORDER BY tutor_name ASC';

  try {
    const [timetables] = await db.query(query, params);
    return timetables;
  } catch (err) {
    throw new Error('Database query failed: ' + err.message);
  }
};




const getDistinctValues = async (column) => {
  try {
    const [values] = await db.query(`SELECT DISTINCT ${column} FROM subjects s 
    JOIN 
      users u ON s.user_id = u.user_id  
      WHERE ltpa < total_hours_per_week`);
    return values;
  } catch (err) {
    throw new Error('Database query failed');
  }
};

export default {
  getTimetablesFromDB,
  getDistinctValues,
};


// Function to add a timetable
export const addtimetable = async ({ day, venue_id, subject_ids,logs = []  }) => {
  try {
      // Log the subject_ids to verify they are passed correctly
      //console.log("Subject IDs received in model:", subject_ids);

      // Ensure subject_ids is defined and is an array with at least one element
      if (!Array.isArray(subject_ids) || subject_ids.length === 0) {
          throw new Error("Please select at least one subject.");
      }

// //console.log(venue_id)
// //console.log(day)
    let start_time, end_time;

    // Fetch the current mnos and menos from the venues table based on venue_id
    const venueQuery = `SELECT *,mnos,tnos,wnos,thnos,frnos,satnos,sunnos FROM venues WHERE venue_id= ?`;
    const [venue] = await db.query(venueQuery, [venue_id]);
    
    let first_subject_id_in_array = subject_ids[0];
    ////console.log(first_subject_id_in_array)
    
    
let venue_type=venue[0].type;

let venue_location=venue[0].location;
let venue_capacity=venue[0].capacity;
let venue_department=venue[0].department;


    const programQuery = `SELECT *,p.program_type AS program_type FROM subjects s JOIN programs p ON s.program_id = p.program_id  WHERE subject_id = ?`;
    const [programData] = await db.query(programQuery, [first_subject_id_in_array]);
    // //console.log(programData)


    let program_capacity=programData[0].program_capacity;
let program_type=programData[0].program_type;

if (programData.length > 0) {
    const programType = programData[0].program_type; // Access the first object
    ////console.log(programType); // This should print 'evening'
    
    if (!programType) {
        //console.log("Invalid program type.");
    } else {
  // Continue with your logic here
        //console.log(`Program type is valid: ${programType}`);
    }
} else {
    //console.log("No data returned for the given subject_id.");
}

// //console.log(programData[0].program_type)

    if (!venue) {
      console.error("The venue is not found or is full. Please choose another.");
    }
    
    //let { mnos, tnos, wnos, thnos, frnos, satnos, sunnos } = venue;
  

let mnos=venue[0].mnos;
let tnos=venue[0].tnos;
let wnos=venue[0].wnos;
let thnos=venue[0].thnos;
let frnos=venue[0].frnos;
let satnos=venue[0].satnos;
let sunnos=venue[0].sunnos;

    let i=1;
    for (i = 1; i < 2; i++) { //simple for loop for the aim to update number of slots based on day
      // Logic to assign time slots based on mnos and menos
    
      if (programData[0].program_type === "full-time" || programData[0].program_type === "evening" || programData[0].program_type === "veta") {
        // //console.log(programData[0].program_type)
        //console.log(day)

// Assume venue[0] exists
let slots = {
  MONDAY: venue[0].mnos,
  TUESDAY: venue[0].tnos,
  WEDNESDAY: venue[0].wnos,
  THURSDAY: venue[0].thnos,
  FRIDAY: venue[0].frnos,
  SATURDAY: venue[0].satnos,
  SUNDAY: venue[0].sunnos,
};


// Define time slots for full-time / evening / veta
const timeSlotsFullTime = {
  1: ["07:30", "08:15"],
  2: ["08:15", "09:00"],
  3: ["09:05", "09:50"],
  4: ["09:50", "10:35"],
  5: ["11:00", "11:45"],
  6: ["11:45", "12:30"],
  7: ["13:15", "14:00"],
  8: ["14:00", "14:45"],
  9: ["14:50", "15:35"],
  10: ["15:35", "16:25"],
  11: ["16:30", "17:15"],
  12: ["17:15", "18:00"],
  13: ["18:05", "18:50"],  // Evening only
  14: ["18:50", "19:35"],  // Evening only
  15: ["19:40", "20:25"],  // Evening only
  16: ["20:25", "21:10"],  // Evening only
  17: ["21:15", "22:00"],  // Evening only
  18: ["22:00", "22:45"],  // Evening only
};

// Determine program type conditions
const programType = programData[0].program_type;
const isFullTime = programType === "full-time";
const isEvening = programType === "evening";
const isVeta = programType === "veta";

// Get the current day slot counter
let currentSlot = slots[day];

// Only process if day exists in slots and program type is relevant
if (currentSlot !== undefined && (isFullTime || isEvening || isVeta)) {
  let slotAssigned = false;

  // Loop through all possible slot numbers
  for (let slotNum = 1; slotNum <= 18; slotNum++) {
    const [start_time_candidate, end_time_candidate] = timeSlotsFullTime[slotNum] || [];

    if (!start_time_candidate) continue; // skip undefined slots

    // Determine if this slot should be assigned for this program type
    if (
      ((isFullTime || isVeta) && slotNum <= 12) ||
      (isEvening && slotNum >= 13)
    ) {
      if (currentSlot === slotNum) {
        start_time = start_time_candidate;
        end_time = end_time_candidate;

        // Increment the slot counter for this day
        slots[day]++;

        slotAssigned = true;
        break; // exit loop after assigning
      }
    }
  }

          if (start_time && end_time !== null) {

  // Update database with new slot counter and totalnos
  if (slotAssigned) {
    const columnMap = {
      MONDAY: "mnos",
      TUESDAY: "tnos",
      WEDNESDAY: "wnos",
      THURSDAY: "thnos",
      FRIDAY: "frnos",
      SATURDAY: "satnos",
      SUNDAY: "sunnos",
    };

    const column = columnMap[day];
    const newCount = slots[day];

    await db.query(
      `UPDATE venues SET ${column} = ?, totalnos = totalnos + ? WHERE venue_id = ?`,
      [newCount, 1, venue_id] // Add 1 to totalnos for this slot assignment
    );
  }
}

     } else {
          console.error(`Start time or end time is null for day: ${day}, venue_id: ${venue_id}`);
                 // await autoCollisionMonitor();
          continue; // Skip this iteration if times are not properly set
        }

   
    // //console.log(`Day: ${day}, mnos: ${mnos}, start_time: ${start_time}, end_time: ${end_time}`);


    for (const subject_id of subject_ids) {
      // //console.log(`Processing subject_id: ${subject_id}`);
      // //console.log(`Day: ${day}, mnos: ${mnos}, start_time: ${start_time}, end_time: ${end_time}`);




      // Fetch subject and related details for each subject_id
      const subjectQuery = `
          SELECT s.subject_code, s.subject_department AS department_name, s.title AS subject_name, 
                 s.credit AS subject_credit, s.type_prac_or_theory AS subject_type,s.semester AS semester, v.venue_id, 
                 v.venue_name, v.location AS venue_location,v.department AS venue_department, u.full_name AS tutor_name, p.program_name, p.program_code,  
                 p.program_type, p.level AS program_level, p.duration AS year,p.program_id AS program_id, s.total_hours_per_week AS total_hours_per_week,
                 v.type AS venue_type, v.status AS venue_status
          FROM subjects s
          JOIN users u ON s.user_id = u.user_id
          JOIN programs p ON s.program_id = p.program_id
          JOIN venues v ON v.venue_id = ?
          WHERE s.subject_id = ? AND s.subject_id IS NOT NULL
      `;

      const [subjectData] = await db.query(subjectQuery, [venue_id, subject_id]);
      
      // //console.log('Fetched subject data:', subjectData);
      
      if (!subjectData || subjectData.length === 0) {
          console.error(`No subject data found for subject_id: ${subject_id}`);
          continue; // Skip this subject if no data is found
      }

      // Validate subject data fields before inserting
      const {
          subject_code,
          subject_name,
          department_name,
          venue_name,
          tutor_name,
          program_name,
          subject_credit,
          program_level,
          year,
          venue_type,
          venue_status,
          semester,
          total_hours_per_week,
          program_id,
          program_code
      } = subjectData[0]; // Access the first item in the array

      if (!subject_code || !subject_name || !department_name || !venue_name || !tutor_name ||
          !program_id || !subject_credit || !program_level || !year || !start_time || !end_time) {
          console.error(`Incomplete data for subject_id: ${subject_id}. Skipping insertion.`);
       const msg = `Incomplete data for subject_id: ${subject_id}. Skipping insertion.`;
      console.error(msg);
      logs.push(msg);
          continue; // Skip this subject if any critical field is missing
      }


      //hii itasaidia siku ya jumatatu ianze juu na ijumaa iwe chini wakati wa kuona ratiba
let arrange;
if(day==="MONDAY"){  arrange=1}else if(day==="TUESDAY"){ arrange=2}
else if(day==="WEDNESDAY"){ arrange=3}else if(day==="THURSDAY"){ arrange=4}
else if(day==="FRIDAY"){ arrange=5 }else if(day==="SATURDAY"){ arrange=6} else{ arrange=7}




// Fetch all entries in extracted_timetable to check for collisions
const iscollisionQuery = `SELECT * FROM extracted_timetables`;
const [iscollisionData] = await db.query(iscollisionQuery);

// Flag to track if a collision was found
let collisionFound = false;

for (let entry of iscollisionData) {
    // Check for time overlaps (not just exact matches)
    const timeOverlap = (
        (start_time >= entry.start_time && start_time < entry.end_time) ||  // Overlaps with the start of an existing event
        (end_time > entry.start_time && end_time <= entry.end_time) ||     // Overlaps with the end of an existing event
        (start_time <= entry.start_time && end_time >= entry.end_time)     // Completely overlaps the existing event
    );

    // Check for program, tutor, and venue collisions
    if (
        (timeOverlap && entry.day === day && entry.program_id === program_id && entry.subject_code !== subject_code ) ||
        (timeOverlap && entry.day === day && entry.tutor_name === tutor_name && entry.subject_code !== subject_code) ||
        (timeOverlap && entry.day === day && entry.venue_name === venue_name && entry.subject_code !== subject_code)
    ) {
       
        
        collisionFound = true;
         // Collision detected, stop further processing
         console.error(`There is a collision for tutor ${tutor_name} or program ${program_name}. Reassign it.`);
         // Example: Display an error notification using alert
    const msg = `There is a collision for tutor ${tutor_name} or program ${program_name}. Reassign it.`;
    console.error(msg);
    logs.push(msg);
    break; // Stop checking further if collision found

    }
}



if (!collisionFound) {
    // No collision, proceed with insertion
    const insertQuery = `
        INSERT INTO extracted_timetables (
            day, start_time, end_time, subject_code, subject_name, department_name, 
            venue_id, venue_name, tutor_name, venue_location, program_name, subject_credit, 
            program_level, year, venue_type, venue_status,semester,venue_capacity,
            program_capacity,program_type,total_hours_per_week,arrange,program_code
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)
    `;

    const params = [
        day,
        start_time,
        end_time,
        subject_code,
        subject_name,
        department_name,
        venue_id,
        venue_name,
        tutor_name,
        subjectData[0].venue_location, // Extract venue location
        program_name,
        subject_credit,
        program_level,
        year,
        venue_type,
        venue_status,
        semester,
       venue_capacity,
       program_capacity,
       program_type,
       total_hours_per_week,
       arrange,
       program_code
    ];

    const result = await db.query(insertQuery, params);
    
    // Define the update status query
    const updateQuery = `
      UPDATE subjects
      SET ltpa=ltpa+0.75
      WHERE subject_id=?
    `;
    await db.query(updateQuery,subject_id);

    


    console.log(`Timetable added successfully for subject_id: ${subject_id}`);
        // ... insert logic
    const msg = `Timetable added successfully for subject_id: ${subject_id}`;
    console.log(msg);
    logs.push(msg);
} else {
    console.error("There is a collision, reassign it.");
     throw new Error("There is a collision, reassign it.");

}

    }



}

else {


// Log an error if the program type is invalid

  

console.error("Invalid program type.");
 
  } 
  
  
 
}
    }

  
  catch (err) {
      console.error('Error adding timetable:', err.message);
      throw err;
  }
  
}
  



