import db from "../db.js";

// Get all subjects eligible for assignment (not fully scheduled)
// Sasa inaonyesha subjects zote za semester husika bila filter ya ltpa (kama ulivyosema)
export const getEligibleSubjects = async (semester) => {
  const [rows] = await db.query(`
    SELECT 
      s.subject_id,
      s.subject_code,
      s.title              AS subject_name,
      s.subject_department AS department_name,
      s.type_prac_or_theory,
      s.semester,
      s.credit             AS subject_credit,
      s.total_hours_per_week,
      s.ltpa,
      (s.ltpa + 0.75)      AS projected_ltpa,
      GREATEST(0, s.total_hours_per_week - s.ltpa) AS remaining_hours,
      u.full_name          AS tutor_name,
      -- Tumia moja kwa moja kutoka subjects (sio programs)
      s.program_name,
      s.program_code,
      s.program_type,
      s.program_level,
      s.program_duration   AS year,
      s.program_capacity,
      s.program_id         -- ikiwa bado unahitaji (optional)
    FROM subjects s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.semester = ? OR s.semester!= 'I' OR s.semester!='II' -- Hii itarudisha subjects zote za semester husika
    ORDER BY 
      remaining_hours DESC,
      u.full_name,
      s.subject_code
  `, [semester]);

  return rows;
};

// Get all available freed slots (haijabadilika)
export const getFreedSlots = async () => {
  const [rows] = await db.query(`
    SELECT id, venue_id, venue_name, day, start_time, end_time, released_by, reason
    FROM freed_slots
    WHERE reason IS NOT NULL
    ORDER BY day, start_time
  `);
  return rows;
};

// Insert into extracted_timetables bila kutumia programs table
export const addToExtractedTimetable = async (subject_ids, freedSlotId, created_by) => {
  if (!Array.isArray(subject_ids)) subject_ids = [subject_ids];

  // Extract subject_id if array of objects
  if (subject_ids.length && typeof subject_ids[0] === "object") {
    subject_ids = subject_ids.map(s => s.subject_id);
  }

  // Fetch freed slot
  const [slotData] = await db.query("SELECT * FROM freed_slots WHERE id = ?", [freedSlotId]);
  if (slotData.length === 0) throw new Error("❌ Selected freed slot not found.");
  const slot = slotData[0];

  // Fetch subjects data moja kwa moja kutoka subjects (bila JOIN programs)
  const [subjectsData] = await db.query(`
    SELECT 
      s.subject_id,
      s.subject_code,
      s.title              AS subject_name,
      s.subject_department AS department_name,
      s.credit             AS subject_credit,
      s.type_prac_or_theory AS subject_type,
      s.semester,
      u.full_name          AS tutor_name,
      -- Tumia fields zilizopo kwenye subjects
      s.program_name,
      s.program_code,
      s.program_type,
      s.program_level,
      s.program_duration   AS year,
      s.program_capacity,
      s.total_hours_per_week,
      s.ltpa,
      v.venue_name,
      v.capacity           AS venue_capacity,
      v.venue_id,
      v.type               AS venue_type,
      v.location           AS venue_location
    FROM subjects s
    JOIN users u ON s.user_id = u.user_id
    JOIN venues v ON v.venue_id = ?
    WHERE s.subject_id IN (?)
  `, [slot.venue_id, subject_ids]);

  if (!subjectsData.length) throw new Error("❌ Subject data not found for selected IDs.");

  // Check same tutor
  const tutorNames = [...new Set(subjectsData.map(s => s.tutor_name))];
  if (tutorNames.length > 1) throw new Error("❌ Cannot mix subjects with different tutors.");
  const tutor_name = tutorNames[0];

  // Collision check (haijabadilika)
  const [existing] = await db.query("SELECT * FROM extracted_timetables");
  for (const entry of existing) {
    const overlap =
      (slot.start_time >= entry.start_time && slot.start_time < entry.end_time) ||
      (slot.end_time > entry.start_time && slot.end_time <= entry.end_time) ||
      (slot.start_time <= entry.start_time && slot.end_time >= entry.end_time);

    if (
      overlap &&
      entry.day === slot.day &&
      (subject_ids.includes(entry.subject_id) || entry.tutor_name === tutor_name || entry.venue_name === slot.venue_name)
    ) {
      throw new Error(
        `⛔ Collision detected: ${tutor_name} or selected subject already scheduled at ${slot.start_time} in ${slot.venue_name}.`
      );
    }
  }

  // Merge program names & codes (kama walivyo kwenye subjects)
  const uniquePrograms     = [...new Set(subjectsData.map(s => s.program_name))];
  const newProgramName     = uniquePrograms.join(" + ");

  const uniqueProgramCodes = [...new Set(subjectsData.map(s => s.program_code))];
  const newProgramCode     = uniqueProgramCodes.join(" + ");

  // Day order
  const arrangeMap = {
    MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
    THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
  };
  const arrange = arrangeMap[slot.day.toUpperCase()] || 7;

  // Insert each subject with merged program info
  for (const data of subjectsData) {
    await db.query(`
      INSERT INTO extracted_timetables (
        day, start_time, end_time, subject_code, subject_name, department_name,
        venue_id, venue_name, tutor_name, venue_location, program_name, program_code,
        subject_credit, program_level, year, venue_type, venue_status, semester,
        venue_capacity, program_capacity, program_type, total_hours_per_week,
        arrange, created_by, created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    `, [
      slot.day,
      slot.start_time,
      slot.end_time,
      data.subject_code,
      data.subject_name,
      data.department_name,
      data.venue_id,
      data.venue_name,
      tutor_name,
      data.venue_location,
      newProgramName,           // merged
      newProgramCode,           // merged
      data.subject_credit,
      data.program_level,
      data.year,
      data.venue_type,
      "used",                   // au tumia data.venue_status ikiwa ipo
      data.semester,
      data.venue_capacity,
      data.program_capacity,
      data.program_type,
      data.total_hours_per_week,
      arrange,
      created_by
    ]);

    // Update ltpa
    await db.query("UPDATE subjects SET ltpa = ltpa + 0.75 WHERE subject_id = ?", [data.subject_id]);
  }

  // Delete used freed slot
  await db.query("DELETE FROM freed_slots WHERE id = ?", [freedSlotId]);

  return { message: `Timetable added successfully for subjects with programs: ${newProgramName}` };
};



// import db from "../db.js";

// // Get all subjects eligible for assignment (not fully scheduled)
// export const getEligibleSubjects = async (semester) => {
//   const [rows] = await db.query(`
//     SELECT s.subject_id, s.subject_code, s.title AS subject_name, s.subject_department,
//            s.type_prac_or_theory, s.semester, s.credit, s.total_hours_per_week,
//            u.full_name AS tutor_name, p.program_name,p.program_code, p.program_type, p.level AS program_level,
//            p.duration AS year, p.program_id,
//            (s.ltpa + 0.75) AS projected_ltpa
//     FROM subjects s
//     JOIN users u ON s.user_id = u.user_id
//     JOIN programs p ON s.program_id = p.program_id
//     LEFT JOIN extracted_timetables et 
//       ON et.subject_code = s.subject_code 
//       AND et.semester = s.semester
//     WHERE
//       (s.ltpa + 0.75) <= s.total_hours_per_week
//     ORDER BY  (s.ltpa + 0.75) DESC, u.full_name, s.subject_code
//   `);
//   return rows;
// };


// // Get all available freed slots
// export const getFreedSlots = async () => {
//   const [rows] = await db.query(`
//     SELECT id, venue_id, venue_name, day, start_time, end_time, released_by, reason
//     FROM freed_slots
//     WHERE reason IS NOT NULL
//     ORDER BY day, start_time
//   `);
//   return rows;
// };

// // Insert timetable row with mixed programs for same tutor & subject
// export const addToExtractedTimetable = async (subject_ids, freedSlotId, created_by) => {
//   if (!Array.isArray(subject_ids)) subject_ids = [subject_ids];
// // Extract subject_id if array of objects
// if (subject_ids.length && typeof subject_ids[0] === "object") {
//   subject_ids = subject_ids.map(s => s.subject_id);
// }

//   // Fetch freed slot
//   const [slotData] = await db.query("SELECT * FROM freed_slots WHERE id=?", [freedSlotId]);
//   if (slotData.length === 0) throw new Error("❌ Selected freed slot not found.");
//   const slot = slotData[0];

//   // Fetch all subjects info
//   const [subjectsData] = await db.query(`
//     SELECT s.subject_id, s.subject_code, s.title AS subject_name, s.subject_department AS department_name,
//            s.credit AS subject_credit, s.type_prac_or_theory AS subject_type, s.semester,
//            u.full_name AS tutor_name, p.program_name,p.program_code, p.program_type, p.level AS program_level,
//            p.duration AS year, p.program_id, p.program_capacity, s.total_hours_per_week, s.ltpa,
//            v.venue_name, v.capacity AS venue_capacity, v.venue_id,v.type AS venue_type, v.location AS venue_location
//     FROM subjects s
//     JOIN users u ON s.user_id = u.user_id
//     JOIN programs p ON s.program_id = p.program_id
//     JOIN venues v ON v.venue_id = ?
//     WHERE s.subject_id IN (?)
//   `, [slot.venue_id, subject_ids]);

//   if (!subjectsData.length) throw new Error("❌ Subject data not found for selected IDs.");

//   // Ensure all subjects have same tutor for mixing
//   const tutorNames = [...new Set(subjectsData.map(s => s.tutor_name))];
//   if (tutorNames.length > 1) throw new Error("❌ Cannot mix subjects with different tutors.");
//   const tutor_name = tutorNames[0];

//   // Collision check
//   const [existing] = await db.query("SELECT * FROM extracted_timetables");
//   for (const entry of existing) {
//     const overlap =
//       (slot.start_time >= entry.start_time && slot.start_time < entry.end_time) ||
//       (slot.end_time > entry.start_time && slot.end_time <= entry.end_time) ||
//       (slot.start_time <= entry.start_time && slot.end_time >= entry.end_time);

//     if (
//       overlap &&
//       entry.day === slot.day &&
//       (subject_ids.includes(entry.subject_id) || entry.tutor_name === tutor_name || entry.venue_name === slot.venue_name)
//     ) {
//       throw new Error(
//         `⛔ Collision detected: ${tutor_name} or selected subject already scheduled at ${slot.start_time} in ${slot.venue_name}.`
//       );
//     }
//   }

//   // Merge program names
//   const uniquePrograms = [...new Set(subjectsData.map(s => s.program_name))];
//   const newProgramName = uniquePrograms.join(" + ");
//   const uniqueProgramCode = [...new Set(subjectsData.map(s => s.program_code))];
//   const newProgramCode = uniqueProgramCode.join(" + ");
//   // Determine day order
//   const arrangeMap = {
//     MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
//     THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 7
//   };
//   const arrange = arrangeMap[slot.day.toUpperCase()] || 7;

//   // Insert each subject individually but with merged program name
//   for (const data of subjectsData) {
//     await db.query(`
//       INSERT INTO extracted_timetables (
//         day, start_time, end_time, subject_code, subject_name, department_name,
//         venue_id, venue_name, tutor_name, venue_location, program_name,program_code, subject_credit,
//         program_level, year, venue_type, venue_status, semester, venue_capacity,
//         program_capacity, program_type, total_hours_per_week, arrange, created_by, created_at
//       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
//     `, [
//       slot.day,
//       slot.start_time,
//       slot.end_time,
//       data.subject_code,
//       data.subject_name,
//       data.department_name,
//       data.venue_id,
//       data.venue_name,
//       tutor_name,
//       data.venue_location,
//       newProgramName,
//       newProgramCode,
//       data.subject_credit,
//       data.program_level,
//       data.year,
//       data.venue_type,
//       data.venue_status,
//       data.semester,
//       data.venue_capacity,
//       data.program_capacity,
//       data.program_type,
//       data.total_hours_per_week,
//       arrange,
//       created_by
//     ]);

//     // Update LTPA per subject
//     await db.query("UPDATE subjects SET ltpa = ltpa + 0.75 WHERE subject_id=?", [data.subject_id]);
//   }

//   // Remove freed slot
//   await db.query("DELETE FROM freed_slots WHERE id=?", [freedSlotId]);

//   return { message: ` Timetable added successfully for subjects with programs: ${newProgramName}` };
// };

