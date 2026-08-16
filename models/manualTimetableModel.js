// models/manualTimetableModel.js
import db from '../db.js';

// ==================== SLOT RANGES ====================
const SLOT_RANGES = {
  "full-time": [
    "07:30-08:15", "08:15-09:00", "09:05-09:50", "09:50-10:35", "11:00-11:45",
    "11:45-12:30", "13:15-14:00", "14:00-14:45", "14:50-15:35", "15:35-16:20",
    "16:25-17:10", "17:10-17:55"
  ],
  "evening": [
    "16:25-17:10", "17:10-17:55", "18:00-18:45", "18:45-19:30", 
    "19:35-20:20", "20:20-21:05", "21:10-21:55", "21:55-22:40"
  ],
  "VETA": ["14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00", "17:00-17:55"],
  "full-evening": ["16:25-17:10", "17:10-17:55"]
};

// ==================== PROGRAM SLOT MATCH ====================
const programSlotMatch = (programType, slotTime) => {
  if (!programType || !slotTime) return false;
  const types = programType.split("+").map(t => t.trim().toLowerCase());
  
  if (types.includes("full-time") && !types.includes("evening")) {
    return SLOT_RANGES["full-time"].includes(slotTime);
  }
  if (types.includes("evening") && !types.includes("full-time")) {
    return SLOT_RANGES["evening"].includes(slotTime);
  }
  if (types.includes("full-time") && types.includes("evening")) {
    return SLOT_RANGES["full-evening"].includes(slotTime) || SLOT_RANGES["evening"].includes(slotTime);
  }
  if (types.includes("veta")) {
    return SLOT_RANGES["VETA"].includes(slotTime);
  }
  return false;
};

// ==================== RESOLVE SLOT COLUMN ====================
async function resolveSlotColumn({ day, slot, venue_id }) {
  const dayLower = day.toLowerCase();
  const [cols] = await db.query(`SHOW COLUMNS FROM venues`);
  const colNames = cols.map(c => c.Field);
  const candidates = colNames.filter(c => c.startsWith(dayLower) && c.endsWith("_status")).sort();

  if (!candidates.length) {
    throw new Error(`No slot status columns found for day "${day}" in venues table.`);
  }

  if (typeof slot === "number") {
    const idx = slot - 1;
    if (!candidates[idx]) throw new Error(`Slot ${slot} does not exist for day ${day}.`);
    return candidates[idx];
  }

  if (typeof slot === "string") {
    for (const statusCol of candidates) {
      const timeCol = statusCol.replace(/_status$/, "");
      try {
        const [rows] = await db.query(`SELECT \`${timeCol}\` AS timeVal FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]);
        if (rows.length && rows[0].timeVal && rows[0].timeVal.trim() === slot.trim()) {
          return statusCol;
        }
      } catch (err) { continue; }
    }
    throw new Error(`Time slot "${slot}" not found for day ${day} in venue ${venue_id}.`);
  }
  throw new Error("Slot must be a number or a string (time range).");
}

// ==================== MAIN FUNCTION: addtimetable (FULLY UPDATED) ====================
export const addtimetable = async ({ day, venue_id, subject_ids, slot, logs = [] }) => {
  const log = (msg) => { 
    logs.push(msg); 
    console.log(msg); 
  };

  if (!day || !venue_id || !Array.isArray(subject_ids) || subject_ids.length === 0 || !slot) {
    throw new Error("Missing required parameters: day, venue_id, subject_ids (array), slot.");
  }

  const dayUpper = day.toUpperCase();
  const dayLower = day.toLowerCase();
  const dayToArrange = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6, SUNDAY:7 };
  const arrange = dayToArrange[dayUpper] || 0;

  // Fetch venue data
  const [venueDataRes] = await db.query(`SELECT * FROM venues WHERE venue_id = ?`, [venue_id]);
  if (!venueDataRes.length) {
    log(`❌ Venue ID ${venue_id} not found.`);
    return;
  }
  const V = venueDataRes[0];

  // Resolve current status column
  let currentStatusCol;
  try {
    currentStatusCol = await resolveSlotColumn({ day, slot, venue_id });
  } catch (err) {
    log(`❌ ${err.message}`);
    return;
  }

  log(`Using status column: ${currentStatusCol}`);

  const currentTimeCol = currentStatusCol.replace(/_status$/, "");
  let currentSlotTime = null;
  try {
    const [trows] = await db.query(`SELECT \`${currentTimeCol}\` AS t FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]);
    if (trows.length) currentSlotTime = trows[0].t;
  } catch (e) {}

  const finalCurrentSlot = currentSlotTime || (typeof slot === "string" ? slot : `slot${slot}`);

  // Extract current slot number
  const slotNumMatch = currentStatusCol.match(/slot(\d+)_status$/);
  if (!slotNumMatch) {
    log(`❌ Could not extract slot number from column "${currentStatusCol}".`);
    return;
  }
  const currentSlotNum = parseInt(slotNumMatch[1]);

  // Process each subject one by one
  for (const subject_id of subject_ids) {
    const [subjectData] = await db.query(`
      SELECT s.*, u.full_name, u.user_id AS tutor_db_id
      FROM subjects s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.subject_id = ?
    `, [subject_id]);

    if (!subjectData.length) {
      log(`❌ No data found for subject_id = ${subject_id}.`);
      continue;
    }

    const S = subjectData[0];
    const currentLtpa = Number(S.ltpa || 0);
    const totalHours = Number(S.total_hours_per_week || 0);
    const remainingHours = totalHours - currentLtpa;

    if (remainingHours < 1.5) {
      log(`⚠ Subject ${subject_id} (${S.title}) has insufficient remaining hours (${remainingHours}). Single slots not allowed. Skipping.`);
      continue;
    }

    // ===================== PREPARE DOUBLE SLOT =====================
    let slotInfos = [];
    let canAssignDouble = true;

    const currentSlotInfo = {
      statusCol: currentStatusCol,
      timeCol: currentTimeCol,
      slotTime: finalCurrentSlot
    };
    slotInfos.push(currentSlotInfo);

    // Try to add next slot for double (1.5 hours)
    if (currentSlotNum >= 18) {
      canAssignDouble = false;
      log(`⚠ Subject ${subject_id}: Current slot ${currentSlotNum} too high for double slot.`);
    } else {
      const nextSlotNum = currentSlotNum + 1;
      const nextStatusCol = currentStatusCol.replace(`slot${currentSlotNum}_status`, `slot${nextSlotNum}_status`);
      const nextTimeCol = nextStatusCol.replace(/_status$/, "");

      let nextSlotTime = null;
      try {
        const [nrows] = await db.query(`SELECT \`${nextTimeCol}\` AS t FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]);
        if (nrows.length) nextSlotTime = nrows[0].t;
      } catch (e) {
        canAssignDouble = false;
      }

      if (!nextSlotTime) {
        canAssignDouble = false;
        log(`⚠ Subject ${subject_id}: Next slot time not available.`);
      }

      // Friday break check
      const isFriday = dayUpper === "FRIDAY";
      if (isFriday && (
        (currentSlotNum >= 7 && currentSlotNum <= 8) || 
        (nextSlotNum >= 7 && nextSlotNum <= 8)
      )) {
        canAssignDouble = false;
        log(`⚠ Subject ${subject_id}: Overlaps with Friday break period.`);
      }

      // Program type compatibility for next slot
      if (nextSlotTime && !programSlotMatch(S.program_type, nextSlotTime)) {
        canAssignDouble = false;
        log(`⚠ Subject ${subject_id}: Program type "${S.program_type}" does not match next slot "${nextSlotTime}".`);
      }

      if (canAssignDouble && nextSlotTime) {
        slotInfos.push({
          statusCol: nextStatusCol,
          timeCol: nextTimeCol,
          slotTime: nextSlotTime
        });
      }
    }

    if (!canAssignDouble || slotInfos.length < 2) {
      log(`⚠ Double slot assignment not possible for subject ${subject_id} (${S.title}). Skipping.`);
      continue;
    }

    // ===================== STRICT COLLISION CHECKS (BEFORE INSERT) =====================
    let canAssign = true;
    const reasons = [];

    for (const sInfo of slotInfos) {
      // Fetch ALL existing timetables for this exact day + slot + semester
      const [existingEntries] = await db.query(`
        SELECT * FROM extracted_timetables 
        WHERE day = ? AND slot = ? AND semester = ?
      `, [day, sInfo.slotTime, S.semester]);

      // 1. Tutor Collision Check
      const tutorConflict = existingEntries.some(e => Number(e.created_by) === Number(S.tutor_db_id));
      if (tutorConflict) {
        reasons.push(`TUTOR COLLISION: ${S.full_name} is already teaching on ${day} ${sInfo.slotTime}`);
      }

      // 2. Venue Collision Check
      const venueConflict = existingEntries.some(e => Number(e.venue_id) === Number(venue_id));
      if (venueConflict) {
        reasons.push(`VENUE COLLISION: Venue ${venue_id} (${V.venue_name}) is already in use on ${day} ${sInfo.slotTime}`);
      }

      // 3. Program Collision Check
      let programConflict = false;
      const newParts = S.program_code ? S.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
      for (const e of existingEntries) {
        if (!e.program_code) continue;
        const existingParts = e.program_code.split("+").map(p => p.trim().toLowerCase());
        if (existingParts.some(p => newParts.includes(p))) {
          programConflict = true;
          break;
        }
      }
      if (programConflict) {
        reasons.push(`PROGRAM COLLISION: Overlap with program code ${S.program_code} on ${day} ${sInfo.slotTime}`);
      }

      // 4. Program Type vs Slot Time compatibility
      if (!programSlotMatch(S.program_type, sInfo.slotTime)) {
        reasons.push(`PROGRAM TYPE MISMATCH: "${S.program_type}" not compatible with slot "${sInfo.slotTime}"`);
      }

      // If any conflict in this slot → cannot assign
      if (tutorConflict || venueConflict || programConflict || !programSlotMatch(S.program_type, sInfo.slotTime)) {
        canAssign = false;
      }
    }

    // If any reason found, skip completely (NO INSERT)
    if (!canAssign) {
      log(`❌ COLLISION DETECTED for subject ${subject_id} (${S.title} - ${S.full_name}):`);
      reasons.forEach(r => log(`   → ${r}`));
      log(`   Skipping subject ${subject_id} entirely.`);
      continue;
    }

    // ===================== HOURS CHECK =====================
    const ltpaIncrement = 1.5; // Double slot = 1.5 hours
    if (currentLtpa + ltpaIncrement > totalHours) {
      log(`⚠ Assigning would exceed total hours for subject ${subject_id}. Skipping.`);
      continue;
    }

    // ===================== FINAL INSERT WITH TRANSACTION =====================
    try {
      await db.query("START TRANSACTION");

      for (const sInfo of slotInfos) {
        const [startTime, endTime] = sInfo.slotTime.split("-").map(t => t.trim());

        await db.query(`
          INSERT INTO extracted_timetables (
            day, slot, start_time, end_time,
            subject_code, subject_name, department_name,
            venue_id, venue_name, tutor_name, venue_location,
            program_name, subject_credit, program_level,
            year, venue_type, venue_status,
            semester, venue_capacity, program_capacity,
            program_type, total_hours_per_week,
            arrange, program_code, created_by, created_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
          day,
          sInfo.slotTime,
          startTime || null,
          endTime || null,
          S.subject_code || null,
          S.title || null,
          S.subject_department || null,
          venue_id,
          V.venue_name || null,
          S.full_name || null,
          V.location || null,
          S.program_name || null,
          S.subject_credit || S.credit || null,
          S.program_level || null,
          S.year || S.program_duration || null,
          V.type || null,
          "used",
          S.semester || null,
          V.capacity || null,
          S.program_capacity || null,
          S.program_type || null,
          S.total_hours_per_week || null,
          arrange,
          S.program_code || null,
          S.tutor_db_id || null,
          new Date()
        ]);

        // Mark venue slot as used
        await db.query(`UPDATE venues SET \`${sInfo.statusCol}\` = 'used' WHERE venue_id = ?`, [venue_id]);
      }

      // Update ltpa (assigned hours)
      await db.query(`UPDATE subjects SET ltpa = COALESCE(ltpa, 0) + ? WHERE subject_id = ?`, [ltpaIncrement, subject_id]);

      await db.query("COMMIT");

      log(`✔ SUCCESS: Assigned subject ${subject_id} (${S.title}) by ${S.full_name} to ${day} ${slotInfos.map(s => s.slotTime).join(" & ")} at Venue ${venue_id}`);

    } catch (insertErr) {
      await db.query("ROLLBACK");
      log(`❌ Database error while assigning subject ${subject_id}: ${insertErr.message}`);
    }
  }
};

// ==================== OTHER FUNCTIONS (unchanged) ====================
export const getTimetablesFromDB = async (filters) => {
  let query = `
    SELECT *, u.full_name AS tutor_name, s.title AS subject_name, subject_code,
           program_name, program_type, program_level, total_hours_per_week, semester
    FROM subjects s
    JOIN users u ON s.user_id = u.user_id
    WHERE (ltpa + 1.5) <= total_hours_per_week
  `;
  const params = [];
  if (filters.tutor_name) { query += ' AND u.full_name = ?'; params.push(filters.tutor_name); }
  if (filters.semester) { query += ' AND semester = ?'; params.push(filters.semester); }
  if (filters.program_type) { query += ' AND program_type = ?'; params.push(filters.program_type); }
  query += ' ORDER BY tutor_name ASC';
  const [rows] = await db.query(query, params);
  return rows;
};

export const getDistinctValues = async (column) => {
  const [rows] = await db.query(`
    SELECT DISTINCT ${column}
    FROM subjects s
    JOIN users u ON s.user_id = u.user_id
    WHERE (ltpa + 1.5) <= total_hours_per_week
  `);
  return rows;
};

// Export
export default {
  getTimetablesFromDB,
  getDistinctValues,
  addtimetable,
};