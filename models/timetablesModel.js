import pool from '../db.js';

// Fetch all timetables
export const getAlltimetables = async () => {
  try {
    const dbQuery = 'SELECT * FROM extracted_timetables';
    const [results] = await pool.execute(dbQuery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};


// Function to update timetable

export const updatetimetable = async (id, timetable) => {
  try {
    const query = `
      UPDATE extracted_timetables SET 
        day = ?, start_time = ?, end_time = ?, subject_code = ?, subject_name = ?, 
        department_name = ?, venue_name = ?, tutor_name = ?, venue_location = ?, 
        program_name = ?, subject_credit = ?, program_level = ?, year = ?, 
        venue_type = ?, venue_status = ? 
      WHERE id = ?
    `;

    // Replace undefined values with null
    const params = [
      timetable.day || null,
      timetable.start_time || null,
      timetable.end_time || null,
      timetable.subject_code || null,
      timetable.subject_name || null,
      timetable.department_name || null,
      timetable.venue_name || null,
      timetable.tutor_name || null,
      timetable.venue_location || null,
      timetable.program_name || null,
      timetable.subject_credit || null,
      timetable.program_level || null,
      timetable.year || null,
      timetable.venue_type || null,
      timetable.venue_status || null,
      id
    ];

    await pool.execute(query, params);
  } catch (err) {
    console.error('Error updating timetable:', err);
    throw err;
  }
};




const LTAP_DECREMENT = 0.75; // 45min = 0.75

export const deleteTimetableByIdWithEffects = async (id, opts = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ===========================
    // 1. Fetch timetable row
    // ===========================
    const [rows] = await conn.execute('SELECT * FROM extracted_timetables WHERE id = ?', [id]);
    if (!rows || rows.length === 0) throw new Error('Timetable row not found for id ' + id);
    const row = rows[0];

    const subject_code = opts.subject_code || row.subject_code;
    const program_code_raw = opts.program_code || row.program_code || row.program_name || '';
    const tutor_name = opts.tutor_name || row.tutor_name;
    const day = opts.day || row.day;
    const start_time = opts.start_time || row.start_time;
    const end_time = opts.end_time || row.end_time;
    const released_by = opts.released_by || 'system';
    const notes = opts.notes || '';

    // ===========================
    // 2. Insert freed slot helper
    // ===========================
    const insertFreedSlot = async (reasonText, extra = {}) => {
      const venue_id = row.venue_id || null;
      const venue_name = row.venue_name || null;
      await conn.execute(
        `INSERT INTO freed_slots (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [venue_id, venue_name, day, start_time, end_time, released_by, reasonText + (extra ? ' | ' + JSON.stringify(extra) : '')]
      );
    };

    // ===========================
    // 3. Helpers to get IDs
    // ===========================
    const getProgramId = async (progCode) => {
      const [programRows] = await conn.execute('SELECT program_id FROM programs WHERE program_code = ?', [progCode]);
      if (!programRows || programRows.length === 0) throw new Error('Program code not found: ' + progCode);
      return programRows[0].program_id;
    };

    const getTutorId = async (tutorName) => {
      const [userRows] = await conn.execute('SELECT user_id FROM users WHERE full_name = ?', [tutorName]);
      if (!userRows || userRows.length === 0) throw new Error('Tutor not found: ' + tutorName);
      return userRows[0].user_id;
    };

    // ===========================
    // 4. Decrement LTPA safely
    // ===========================
    const decrementLtpa = async (progCode, subjCode, tutorName) => {
      const program_id = await getProgramId(progCode);
      const tutor_id = await getTutorId(tutorName);

      // First fetch current LTPA
      const [ltpaRows] = await conn.execute(
        'SELECT ltpa FROM subjects WHERE program_id = ? AND subject_code = ? AND user_id = ?',
        [program_id, subjCode, tutor_id]
      );
      if (!ltpaRows || ltpaRows.length === 0) return;

      const currentLtpa = parseFloat(ltpaRows[0].ltpa) || 0;
      const newLtpa = Math.max(0, currentLtpa - LTAP_DECREMENT); // ensure no negative

      await conn.execute(
        'UPDATE subjects SET ltpa = ? WHERE program_id = ? AND subject_code = ? AND user_id = ?',
        [newLtpa, program_id, subjCode, tutor_id]
      );
    };

    // ===========================
    // 5. Parse combined programs
    // ===========================
    const programCodes = program_code_raw
      .split(/[,+]/)       // split by comma or plus
      .map(p => p.trim())  // remove extra spaces
      .filter(Boolean);    // remove empty

    // ===========================
    // 6. Main logic based on reason
    // ===========================
    if (opts.reason === 'tutor_collision' || opts.reason === 'program_collision') {
      // Only decrement LTPA, no freed slots
      for (const prog of programCodes) {
        await decrementLtpa(prog, subject_code, tutor_name);
      }
    } else if (opts.reason === 'unmix') {
      // One freed slot for the combined programs
      await insertFreedSlot('unmix freed slot', { subject_code, programs: programCodes, tutor_name, notes });
      // Decrement LTPA for each program individually
      for (const prog of programCodes) {
        await decrementLtpa(prog, subject_code, tutor_name);
      }
    } else {
      // General deletion: log freed slot
      await insertFreedSlot(opts.reason || 'deleted', { subject_code, programs: programCodes, tutor_name, notes });
      for (const prog of programCodes) {
        await decrementLtpa(prog, subject_code, tutor_name);
      }
    }

    // ===========================
    // 7. Delete timetable row
    // ===========================
    await conn.execute('DELETE FROM extracted_timetables WHERE id = ?', [id]);

    await conn.commit();
    conn.release();
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('deleteTimetableByIdWithEffects error', err);
    throw err;
  }
};

// truncate function stays same as before
// truncate function
export const truncateAllTimetables = async () => {
  try {
    // Delete timetable records
    await pool.execute('TRUNCATE TABLE extracted_timetables');
    await pool.execute('TRUNCATE TABLE freed_slots');

    // Reset ltpa
    await pool.execute(`UPDATE subjects SET ltpa=0.00 WHERE ltpa IS NOT NULL`);

    // Reset numeric counters
    await pool.execute(`
      UPDATE venues
      SET 
        mnos=1, tnos=1, wnos=1, thnos=1, frnos=1, satnos=1, sunnos=1,
        totalnos=7,
        status='Available'
    `);

    // Reset ALL slot statuses to "unused"
    const days = [
      'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday', 'sunday'
    ];

    let updates = [];

    for (const day of days) {
      for (let slot = 1; slot <= 18; slot++) {
        updates.push(`${day}_slot${slot}_status='unused'`);
      }
    }

    const sql = `
      UPDATE venues
      SET ${updates.join(", ")}
    `;

    await pool.execute(sql);

    console.log("All timetables truncated and venue slots reset!");
  } catch (err) {
    console.error(err);
    throw err;
  }
};






// // models/timetablesModel.js
// // import pool from '../db.js';

// const LTAP_DECREMENT = 0.75; // 45min = 0.75

// export const deleteTimetableByIdWithEffects = async (id, opts = {}) => {
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // ===========================
//     // 1. Fetch timetable row
//     // ===========================
//     const [rows] = await conn.execute('SELECT * FROM extracted_timetables WHERE id = ?', [id]);
//     if (!rows || rows.length === 0) throw new Error('Timetable row not found for id ' + id);
//     const row = rows[0];

//     const subject_code = opts.subject_code || row.subject_code;
//     const program_code_raw = opts.program_code || row.program_code || row.program_name || '';
//     const tutor_name = opts.tutor_name || row.tutor_name;
//     const day = opts.day || row.day;
//     const start_time = opts.start_time || row.start_time;
//     const end_time = opts.end_time || row.end_time;
//     const released_by = opts.released_by || 'system';
//     const notes = opts.notes || '';

//     // ===========================
//     // 2. Insert freed slot helper
//     // ===========================
//     const insertFreedSlot = async (reasonText, extra = {}) => {
//       const venue_id = row.venue_id || null;
//       const venue_name = row.venue_name || null;
//       await conn.execute(
//         `INSERT INTO freed_slots (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
//         [venue_id, venue_name, day, start_time, end_time, released_by, reasonText + (extra ? ' | ' + JSON.stringify(extra) : '')]
//       );
//     };

//     // ===========================
//     // 3. Helpers to get IDs
//     // ===========================
//     const getProgramId = async (progCode) => {
//       const [programRows] = await conn.execute('SELECT program_id FROM programs WHERE program_code = ?', [progCode]);
//       if (!programRows || programRows.length === 0) throw new Error('Program code not found: ' + progCode);
//       return programRows[0].program_id;
//     };

//     const getTutorId = async (tutorName) => {
//       const [userRows] = await conn.execute('SELECT user_id FROM users WHERE full_name = ?', [tutorName]);
//       if (!userRows || userRows.length === 0) throw new Error('Tutor not found: ' + tutorName);
//       return userRows[0].user_id;
//     };

//     const decrementLtpa = async (progCode, subjCode, tutorName) => {
//       const program_id = await getProgramId(progCode);
//       const tutor_id = await getTutorId(tutorName);
//       await conn.execute(
//         'UPDATE subjects SET ltpa = ltpa - ? WHERE program_id = ? AND subject_code = ? AND user_id = ?',
//         [LTAP_DECREMENT, program_id, subjCode, tutor_id]
//       );
//     };

//     // ===========================
//     // 4. Parse combined programs
//     // ===========================
//     const programCodes = program_code_raw
//       .split(/[,+]/)       // split by comma or plus
//       .map(p => p.trim())  // remove extra spaces
//       .filter(Boolean);    // remove empty

//     // ===========================
//     // 5. Main logic based on reason
//     // ===========================
//     if (opts.reason === 'tutor_collision' || opts.reason === 'program_collision') {
//       // Only decrement LTPA, no freed slots
//       for (const prog of programCodes) {
//         await decrementLtpa(prog, subject_code, tutor_name);
//       }
//     } else if (opts.reason === 'unmix') {
//       // One freed slot for the combined programs
//       await insertFreedSlot('unmix freed slot', { subject_code, programs: programCodes, tutor_name, notes });
//       // Decrement LTPA for each program individually
//       for (const prog of programCodes) {
//         await decrementLtpa(prog, subject_code, tutor_name);
//       }
//     } else {
//       // General deletion: log freed slot
//       await insertFreedSlot(opts.reason || 'deleted', { subject_code, programs: programCodes, tutor_name, notes });
//       for (const prog of programCodes) {
//         await decrementLtpa(prog, subject_code, tutor_name);
//       }
//     }

//     // ===========================
//     // 6. Delete timetable row
//     // ===========================
//     await conn.execute('DELETE FROM extracted_timetables WHERE id = ?', [id]);

//     await conn.commit();
//     conn.release();
//   } catch (err) {
//     await conn.rollback();
//     conn.release();
//     console.error('deleteTimetableByIdWithEffects error', err);
//     throw err;
//   }
// };
// models/timetablesModel.js
// import pool from '../db.js';

// export const truncateAllTimetables = async () => {
//   try {
//     await pool.execute('TRUNCATE TABLE extracted_timetables');
//     await pool.execute('TRUNCATE TABLE freed_slots');
//     await pool.execute(`
//       UPDATE venues
//       SET mnos=1,tnos=1,wnos=1,thnos=1,frnos=1,satnos=1,sunnos=1,totalnos=7
//       WHERE mnos IS NOT NULL
//     `);
//     await pool.execute(`UPDATE subjects SET ltpa=0.00 WHERE ltpa IS NOT NULL`);
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };

// models/timetablesModel.js
// import pool from '../db.js';

// const LTAP_DECREMENT = 0.75; // dakika 45 = 0.75 in decimal as you said

// export const deleteTimetableByIdWithEffects = async (id, opts = {}) => {
//   const conn = await pool.getConnection();
//   try {
//     await conn.beginTransaction();

//     // 1. fetch the timetable row
//     const [rows] = await conn.execute('SELECT * FROM extracted_timetables WHERE id = ?', [id]);
//     if (!rows || rows.length === 0) {
//       throw new Error('Timetable row not found for id ' + id);
//     }
//     const row = rows[0];

//     // Use passed values as fallback
//     const subject_code = opts.subject_code || row.subject_code;
//     const program_code_raw = opts.program_code || row.program_code || row.program_name || '';
//     const tutor_name = opts.tutor_name || row.tutor_name;
//     const day = opts.day || row.day;
//     const start_time = opts.start_time || row.start_time;
//     const end_time = opts.end_time || row.end_time;
//     const released_by = opts.released_by || 'system';
//     const notes = opts.notes || '';

//     // Helper: insert freed slot record
//     const insertFreedSlot = async (reasonText, extra = {}) => {
//       const insertQ = `
//         INSERT INTO freed_slots
//           (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
//       `;
//       const venue_id = row.venue_id || null;
//       const venue_name = row.venue_name || null;
//       await conn.execute(insertQ, [venue_id, venue_name, day, start_time, end_time, released_by, reasonText + (extra ? (' | ' + JSON.stringify(extra)) : '')]);
//     };

//     // Helper: update ltpa for a given program_code & subject_code & maybe tutor
// // Helper: decrement ltpa
// const decrementLtpa = async (progCode, subjCode, tutorName) => {
//   // 1. pata program_id kutoka programs table
//   const [progRows] = await conn.execute(
//     'SELECT program_id FROM programs WHERE program_code = ?',
//     [progCode]
//   );
//   if (!progRows || progRows.length === 0) {
//     throw new Error('Program code not found: ' + progCode);
//   }
//   const program_id = progRows[0].program_id;

//   // 2. pata user_id (tutor) kutoka timetable tutor_name
//   const [userRows] = await conn.execute(
//     'SELECT user_id FROM users WHERE full_name = ?',
//     [tutorName]
//   );
//   if (!userRows || userRows.length === 0) {
//     throw new Error('Tutor not found: ' + tutorName);
//   }
//   const tutor_id = userRows[0].user_id;

//   // 3. update subjects ltpa
//   const q = `
//     UPDATE subjects 
//     SET ltpa = ltpa - ? 
//     WHERE program_id = ? AND subject_code = ? AND user_id = ?
//   `;
//   await conn.execute(q, [LTAP_DECREMENT, program_id, subjCode, tutor_id]);
// };


//     // Decide behavior based on opts.reason
//     switch (opts.reason) {
//       case 'tutor_collision':
//       case 'program_collision':
//       case 'free_slot':
//       case 'exceed_ltpa':
//         // Put freed slot entry
//         await insertFreedSlot(opts.reason, { subject_code, program_code_raw, tutor_name, notes });

//         // decrement ltpa (single record) - most cases subtract 0.75 once
//         // If the timetable row actually represented multiple program codes, handle below.
//         if (program_code_raw && program_code_raw.includes(',')) {
//           // if combined, split and update each
//           const parts = program_code_raw.split(',').map(p => p.trim()).filter(Boolean);
//           for (const p of parts) {
//             await decrementLtpa(p, subject_code, tutor_name);
//           }
//         } else if (program_code_raw) {
//           await decrementLtpa(program_code_raw, subject_code, tutor_name);
//         } else {
//           // fallback: try using program_name column if program_code not available
//           await decrementLtpa(row.program_name || 'UNKNOWN', subject_code, tutor_name);
//         }

//         // For exceed_ltpa: also record more info in freed_slots table (already done)
//         break;

//       case 'unmix':
//         // unmix: parse program_code_raw into individual program codes
//         // For each parsed program code -> insert freed_slot and decrement ltpa for each
//         {
//           // ensure freed slot recorded
//           await insertFreedSlot('Deleted due to impossible unmix : splitting combined program(s)', { program_code_raw, notes, tutor_name }, 'resulted to delete these mixed program and returned time assigned by tmaster by each and then to be assigned again at future by each then combine correctly');

//           // parse program codes (assume comma-separated)
//           const parts = program_code_raw.split(',').map(p => p.trim()).filter(Boolean);
//           if (parts.length === 0) {
//             // if nothing to parse, still decrement for main program_name
//             await decrementLtpa(row.program_name || program_code_raw, subject_code, tutor_name);
//           } else {
//             for (const prog of parts) {
//               // For each program in combined, decrement ltpa and optionally insert detail to freed_slots
//               await decrementLtpa(prog, subject_code, tutor_name);
//               // Optionally log each parsed program in freed_slots separately:
//               await conn.execute(`
//                 INSERT INTO freed_slots
//                   (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
//               `, [row.venue_id || null, row.venue_name || null, day, start_time, end_time, released_by, `unmix: freed for program ${prog}`]);
//             }
//           }
//         }
//         break;

//       case 'other':
//       default:
//         // generic handling: insert freed slot and decrement once
//         await insertFreedSlot(opts.reason || 'deleted', { subject_code, program_code_raw, tutor_name, notes });
//         if (program_code_raw && program_code_raw.includes(',')) {
//           const parts = program_code_raw.split(',').map(p => p.trim()).filter(Boolean);
//           for (const p of parts) {
//             await decrementLtpa(p, subject_code, tutor_name);
//           }
//         } else {
//           await decrementLtpa(program_code_raw || row.program_name || 'UNKNOWN', subject_code, tutor_name);
//         }
//         break;
//     }

//     // Finally, delete the timetable row (single)
//     await conn.execute('DELETE FROM extracted_timetables WHERE id = ?', [id]);

//     await conn.commit();
//     conn.release();
//   } catch (err) {
//     await conn.rollback();
//     conn.release();
//     console.error('deleteTimetableByIdWithEffects error', err);
//     throw err;
//   }
// };

// Keep existing truncate function but leave as admin-only route if needed
// export const truncateAllTimetables = async () => {
//   // existing implementation: TRUNCATE extracted_timetables, TRUNCATE freed_slots, update venues & subjects etc.
//   try {
//     const query = 'TRUNCATE TABLE extracted_timetables';
//      const query2 = 'TRUNCATE TABLE freed_slots';

//     await pool.execute(query);
//     await pool.execute(query2);

//     // Define the update status query
//     const updateQuery = `
//       UPDATE venues
//       SET mnos=1,tnos=1,wnos=1,thnos=1,frnos=1,satnos=1,sunnos=1,totalnos=7
//       WHERE mnos IS NOT NULL
//     `;
//     await pool.execute(updateQuery);

//     const setQuery = `
//     UPDATE subjects
//     SET ltpa=0.00
//     WHERE ltpa IS NOT NULL
//   `;
//   await pool.execute(setQuery);



//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };


// // Function to delete timetable and delete from freed slots
// export const deletetimetable = async () => {
//   try {
//     const query = 'TRUNCATE TABLE extracted_timetables';
//      const query2 = 'TRUNCATE TABLE freed_slots';

//     await pool.execute(query);
//     await pool.execute(query2);

//     // Define the update status query
//     const updateQuery = `
//       UPDATE venues
//       SET mnos=1,tnos=1,wnos=1,thnos=1,frnos=1,satnos=1,sunnos=1,totalnos=7
//       WHERE mnos IS NOT NULL
//     `;
//     await pool.execute(updateQuery);

//     const setQuery = `
//     UPDATE subjects
//     SET ltpa=0.00
//     WHERE ltpa IS NOT NULL
//   `;
//   await pool.execute(setQuery);



//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };

