
// models/timetablesModel.js
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



const LTAP_DECREMENT = 0.75;

/**
 * Deletes a timetable entry and reverses its effects.
 * Strict matching: Tutor + Subject Code + Program Name
 * Even small spacing differences will reject the deletion.
 */
export const deleteTimetableByIdWithEffects = async (id, opts = {}) => {
  const conn = await pool.getConnection();

  let cleanTutorName = '';
  let cleanSubjectCode = '';
  let timetableProgramName = '';

  try {
    await conn.beginTransaction();

    // --- 1. DATA FETCHING ---
    const [tRows] = await conn.execute(
      'SELECT * FROM extracted_timetables WHERE id = ? LIMIT 1',
      [id]
    );

    if (tRows.length === 0) {
      throw new Error(`Deletion Failed: Timetable ID ${id} was not found.`);
    }

    const row = tRows[0];

    cleanTutorName = (row.tutor_name || '').trim();
    cleanSubjectCode = (row.subject_code || '').trim();
    timetableProgramName = (row.program_name || '').trim();   // Tunatumia program_name

    const cleanDay = (opts.day || row.day || '').toLowerCase().trim();
    const rawVenueType = (row.venue_type || '').toLowerCase();

    // Normalize time helper
    const normalizeTime = (t) => {
      if (!t) return null;
      const s = String(t).trim();
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
      if (/^\d{2}:\d{2}$/.test(s)) return s + ':00';
      return s;
    };

    const normStart = normalizeTime(row.start_time);
    const normEnd = normalizeTime(row.end_time);

    // --- 2. STRICT VALIDATION ---

    // A. Validate Tutor (Exact match)
    const [userRows] = await conn.execute(
      `SELECT user_id FROM users WHERE full_name = ? LIMIT 1`,
      [cleanTutorName]
    );

    if (userRows.length === 0) {
      throw new Error(`CRITICAL: Tutor "${cleanTutorName}" does not exist in the users table. Deletion Aborted.`);
    }

    const tutor_id = userRows[0].user_id;

    // B. Get subjects for this tutor (program_name + subject_code)
    const [subjects] = await conn.execute(
      `SELECT subject_id, subject_code, type_prac_or_theory, ltpa, program_name 
       FROM subjects WHERE user_id = ?`,
      [tutor_id]
    );

    if (subjects.length === 0) {
      throw new Error(`CRITICAL: No subjects found assigned to tutor "${cleanTutorName}". Deletion Aborted.`);
    }

    // Normalize helper (strict - removes extra spaces only)
    const normalize = (str) => String(str || '').trim().toUpperCase().replace(/\s+/g, ' ');

    const normTimetableSubject = normalize(cleanSubjectCode);
    const normTimetableProgram = normalize(timetableProgramName);

    // Strict exact match: Subject Code + Program Name
    const codeMatches = subjects.filter(s => {
      const dbSubject = normalize(s.subject_code);
      const dbProgram = normalize(s.program_name || '');

      return dbSubject === normTimetableSubject && dbProgram === normTimetableProgram;
    });

    // Detailed error reporting if no match
    if (codeMatches.length === 0) {
      console.error(`[DELETE ERROR] Strict match failed - Timetable ID: ${id}`);
      console.error(`   Timetable Subject Code : "${cleanSubjectCode}"`);
      console.error(`   Timetable Program Name : "${timetableProgramName}"`);
      console.error(`   Normalized Subject     : "${normTimetableSubject}"`);
      console.error(`   Normalized Program     : "${normTimetableProgram}"`);
      console.error(`   Tutor                  : "${cleanTutorName}"`);

      console.error(`   Available subjects for this tutor (${subjects.length}):`);
      subjects.forEach((sub, i) => {
        console.error(`     ${i+1}. Subject: "${sub.subject_code}" | Program Name: "${sub.program_name || 'N/A'}" | Type: ${sub.type_prac_or_theory || 'N/A'} | LTPA: ${sub.ltpa}`);
      });

      throw new Error(`CRITICAL: Subject "${cleanSubjectCode}" with Program "${timetableProgramName}" is not exactly assigned to ${cleanTutorName}. Deletion Aborted.`);
    }

    // C. Resolve subject type (Theory / Lab etc.)
    let finalSubject = null;

    if (codeMatches.length === 1) {
      finalSubject = codeMatches[0];
    } else {
      const isLabRelated = rawVenueType.includes('lab') || rawVenueType.includes('prac') || rawVenueType.includes('work');
      
      finalSubject = codeMatches.find(s => {
        const sType = (s.type_prac_or_theory || '').toLowerCase();
        if (isLabRelated) {
          return sType.includes('lab') || sType.includes('prac') || sType.includes('work');
        } else {
          return sType.includes('theo') || sType.includes('lect');
        }
      }) || codeMatches[0];
    }

    if (!finalSubject) {
      throw new Error(`CRITICAL: Could not resolve subject type for "${cleanSubjectCode}". Deletion Aborted.`);
    }

    // D. Validate Slot Column
    const slotColumn = getSlotColumnName(cleanDay, normStart, normEnd);
    if (!slotColumn) {
      throw new Error(`CRITICAL: Time slot ${normStart}-${normEnd} is not recognized. Deletion Aborted.`);
    }

    // --- 3. EXECUTION SECTION ---

    // 1. Decrement LTPA (never goes below 0)
    const currentLtpa = parseFloat(finalSubject.ltpa) || 0;
    const updatedLtpa = Math.max(0, currentLtpa - LTAP_DECREMENT);

    await conn.execute(
      'UPDATE subjects SET ltpa = ? WHERE subject_id = ?',
      [updatedLtpa, finalSubject.subject_id]
    );

    // 2. Free the Venue Slot
    if (row.venue_id) {
      const statusCol = `${slotColumn}_status`;
      await conn.execute(
        `UPDATE venues SET ${statusCol} = 'unused' WHERE venue_id = ?`,
        [row.venue_id]
      );
    }

    // 3. Log the Deletion
    await conn.execute(
      `INSERT INTO timetable_deletion_log 
        (timetable_id, venue_id, venue_name, day, start_time, end_time, subject_code, tutor_name, program_name, deleted_by, reason, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id, row.venue_id, row.venue_name, cleanDay, normStart, normEnd, 
        cleanSubjectCode, cleanTutorName, timetableProgramName,
        opts.deleted_by || 'system', opts.reason || 'manual deletion'
      ]
    );

    // 4. Final Delete
    await conn.execute('DELETE FROM extracted_timetables WHERE id = ?', [id]);

    await conn.commit();

    console.log(`✅ Timetable ID ${id} deleted successfully. LTPA: ${currentLtpa} → ${updatedLtpa}`);

    return { success: true };

  } catch (err) {
    if (conn) await conn.rollback();

    console.error(`[DELETE FAILED] Timetable ID: ${id}`);
    console.error(`   Tutor          : ${cleanTutorName || 'N/A'}`);
    console.error(`   Subject Code   : ${cleanSubjectCode || 'N/A'}`);
    console.error(`   Program Name   : ${timetableProgramName || 'N/A'}`);
    console.error(`   Error          : ${err.message}`);
    console.error(err);

    throw err;
  } finally {
    if (conn) conn.release();
  }
};


function getSlotColumnName(day, start, end) {
  const timeToSlot = {
    "07:30:00-08:15:00": 1,
    "08:15:00-09:00:00": 2,
    "09:05:00-09:50:00": 3,
    "09:50:00-10:35:00": 4,
    "11:00:00-11:45:00": 5,
    "11:45:00-12:30:00": 6,
    "13:15:00-14:00:00": 7,
    "14:00:00-14:45:00": 8,
    "14:50:00-15:35:00": 9,
    "15:35:00-16:20:00": 10,
    "16:25:00-17:10:00": 11,
    "17:10:00-17:55:00": 12,
    "18:00:00-18:45:00": 13,
    "18:45:00-19:30:00": 14,
    "19:35:00-20:20:00": 15,
    "20:20:00-21:05:00": 16,
    "21:10:00-21:55:00": 17,
    "21:55:00-22:40:00": 18,
  };

  const key = `${start}-${end}`;
  const slotNumber = timeToSlot[key];

  if (!slotNumber) return null;

  return `${day}_slot${slotNumber}`;
}

async function getTutorUserId(conn, fullName) {
  if (!fullName) return null;
  const [rows] = await conn.execute(
    'SELECT user_id FROM users WHERE full_name = ? LIMIT 1',
    [fullName]
  );
  return rows.length ? rows[0].user_id : null;
}


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

