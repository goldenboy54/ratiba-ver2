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
  "VETA": ["13:15-14:00","14:00-14:45", "14:50-15:35", "15:35-16:20",
    "16:25-17:10", "17:10-17:55"],
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

// ==================== SEMESTER CALENDAR (VETA vs NON-VETA) ====================
const SEMESTER_CALENDAR = {
  NON_VETA:  { I: ["OCT", "NOV", "DEC", "JAN", "FEB"], II: ["MAR", "APR", "MAY", "JUN", "JUL"] },
  VETA_L1L2: { I: ["JAN", "FEB", "MAR", "APR", "MAY"], II: ["JUL", "AUG", "SEP", "OCT", "NOV"] },
  VETA_L3:   { I: ["AUG", "SEP", "OCT", "NOV"],        II: ["JAN", "FEB", "MAR", "APR", "MAY"] },
};


// distinguish  VETA programs semester using
//  program_level 
function getProgramGroup(programType, programLevel) {
  const type = (programType || "").trim().toUpperCase();
  if (type === "VETA") {
    return String(programLevel || "").trim() === "3" ? "VETA_L3" : "VETA_L1L2";
  }
  return "NON_VETA";
}

// Check for semister overlap
function semestersOverlap(typeA, levelA, semA, typeB, levelB, semB) {
  const monthsA = SEMESTER_CALENDAR[getProgramGroup(typeA, levelA)]?.[semA];
  const monthsB = SEMESTER_CALENDAR[getProgramGroup(typeB, levelB)]?.[semB];
  if (!monthsA || !monthsB) return true;
  return monthsA.some(m => monthsB.includes(m));
}

// ==================== CO-TEACHING (COMPANION) DETECTION ====================
// An existing entry `e` belongs to one of the OTHER TUTORS on the same co-taught
// session as the subject being inserted (`S`) - not a real collision - only if
// everything that identifies "the same class" matches (subject, cohort, and
// overlapping program code) and only the tutor differs. Deliberately does NOT
// require the same venue_id: co-teachers are allowed to
// run the session from different rooms (confirmed business rule), so venue collision
// already resolves itself naturally whenever they pick different venues, and only needs
// this exemption when they happen to pick the same one.
function isSameSession(e, S) {
  if (!e.subject_code || !S.subject_code || e.subject_code !== S.subject_code) return false;
  if (String(e.semester) !== String(S.semester)) return false;
  if (String(e.program_level) !== String(S.program_level)) return false;
  // `subjects` has no `year` column - what lands in extracted_timetables.year is
  // S.year || S.program_duration (see the INSERT below), so that's what must be
  // compared here too, or this would always mismatch against a freshly-fetched S.
  if (String(e.year) !== String(S.year || S.program_duration)) return false;
  const eParts = e.program_code ? e.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
  const sParts = S.program_code ? S.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
  return eParts.some(p => sParts.includes(p));
}

// ==================== SHARED CONSTANTS ====================
const DOUBLE_SLOT_HOURS = 1.5;
const MAX_SLOTS_PER_DAY = 18;
const FRIDAY_BREAK_FIRST_SLOT = 7;
const FRIDAY_BREAK_LAST_SLOT = 8;

// Capacity check tolerance
const CAPACITY_TOLERANCE = 0.20;
const UNDERUTILIZATION_THRESHOLD = 0.30;//t goodhis

// Co-teaching: at most this many distinct tutors may share one session (see
// isSameSession above). A tutor trying to join a session that's already at this cap
// is blocked as a real collision, same as any other conflict.
const MAX_CO_TEACHERS = 5;

//Get each all 18 column names status of the a venue.
function getStatusColumnsForDay(dayLower) {
  const cols = [];
  for (let i = 1; i <= MAX_SLOTS_PER_DAY; i++) {
    cols.push(`${dayLower}_slot${i}_status`);
  }
  return cols;
}

// ===returns the exact _status column name for  db update(used or unused) ====================
async function resolveSlotColumn({ day, slot, venue_id, venue }) {
  const dayLower = day.toLowerCase();
  const candidates = getStatusColumnsForDay(dayLower);

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
      const timeVal = venue[timeCol];
      if (timeVal && String(timeVal).trim() === slot.trim()) {
        return statusCol;
      }
    }
    throw new Error(`Time slot "${slot}" not found for day ${day} in venue ${venue_id}.`);
  }
  throw new Error("Slot must be a number or a string (time range).");
}

// ==================== MAIN FUNCTION: addtimetable (FULLY UPDATED) ====================
export const addtimetable = async ({ day, venue_id, subject_ids, slot, logs = [] }) => {
  //function to produce logs
  const log = (msg) => { 
    logs.push(msg); 
    console.log(msg); 
  };
//make sure all required input are available
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

  // Get current column/slot status name
  let currentStatusCol;
  try {
    currentStatusCol = await resolveSlotColumn({ day, slot, venue_id, venue: V });
  } catch (err) {
    log(`❌ ${err.message}`);
    return;
  }
  log(`Using status column: ${currentStatusCol}`);

  // current Time of the  current column/slot status name
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
    const ltpaIncrement = DOUBLE_SLOT_HOURS;

    if (remainingHours < ltpaIncrement) {
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
    if (currentSlotNum >= MAX_SLOTS_PER_DAY) {
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
        (currentSlotNum >= FRIDAY_BREAK_FIRST_SLOT && currentSlotNum <= FRIDAY_BREAK_LAST_SLOT) ||
        (nextSlotNum >= FRIDAY_BREAK_FIRST_SLOT && nextSlotNum <= FRIDAY_BREAK_LAST_SLOT)
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
      const [allEntriesThisSlot] = await db.query(`
        SELECT * FROM extracted_timetables
        WHERE day = ? AND slot = ?
      `, [day, sInfo.slotTime]);

      const existingEntries = allEntriesThisSlot.filter(e => semestersOverlap(
        S.program_type, S.program_level, S.semester,
        e.program_type, e.program_level, e.semester
      ));

      // Co-teaching companions: existing entries for one of the OTHER TUTORS on the same
      // session as S (see isSameSession), not a real conflict - but only up to
      // MAX_CO_TEACHERS distinct tutors per session. Once a session already has
      // MAX_CO_TEACHERS tutors, any further match is treated as a real collision instead
      // of being exempted below.
      const sessionCompanions = existingEntries.filter(e =>
        isSameSession(e, S) && Number(e.created_by) !== Number(S.tutor_db_id)
      );
      const distinctCoTeachers = new Set(sessionCompanions.map(e => Number(e.created_by)));
      const withinCoTeachCap = distinctCoTeachers.size < MAX_CO_TEACHERS;
      const companionSet = withinCoTeachCap ? new Set(sessionCompanions) : new Set();

      if (!withinCoTeachCap && sessionCompanions.length) {
        reasons.push(`CO-TEACH LIMIT REACHED: ${S.subject_code} on ${day} ${sInfo.slotTime} already has ${MAX_CO_TEACHERS} tutor(s) assigned`);
      }

      // 1. Tutor Collision Check
      const tutorConflict = existingEntries.some(e => Number(e.created_by) === Number(S.tutor_db_id));
      if (tutorConflict) {
        reasons.push(`TUTOR COLLISION: ${S.full_name} is already teaching on ${day} ${sInfo.slotTime}`);
      }

      // 2. Venue Collision Check (co-teach companions within the cap don't count)
      const venueConflict = existingEntries.some(e => Number(e.venue_id) === Number(venue_id) && !companionSet.has(e));
      if (venueConflict) {
        reasons.push(`VENUE COLLISION: Venue ${venue_id} (${V.venue_name}) is already in use on ${day} ${sInfo.slotTime}`);
      }

      // 3. Program Collision Check (co-teach companions within the cap don't count)
      let programConflict = false;
      const newParts = S.program_code ? S.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
      for (const e of existingEntries) {
        if (!e.program_code) continue;
        if (companionSet.has(e)) continue;
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
      const typeMismatch = !programSlotMatch(S.program_type, sInfo.slotTime);
      if (typeMismatch) {
        reasons.push(`PROGRAM TYPE MISMATCH: "${S.program_type}" not compatible with slot "${sInfo.slotTime}"`);
      }

      // If any conflict in this slot → cannot assign
      if (tutorConflict || venueConflict || programConflict || typeMismatch) {
        canAssign = false;
      }
    }

    // 5. Capacity Check - not slot-dependent (venue/class sizes don't change per slot),
    // so it runs once per subject rather than inside the slotInfos loop above.
    const classSize = Number(S.program_capacity) || 0;
    const venueCapacity = Number(V.capacity) || 0;
    const capacityExceeded = classSize > venueCapacity * (1 + CAPACITY_TOLERANCE);
    if (capacityExceeded) {
      reasons.push(`CAPACITY EXCEEDED: Class size ${classSize} exceeds venue ${V.venue_name}'s capacity of ${venueCapacity} (even with ${CAPACITY_TOLERANCE * 100}% tolerance)`);
      canAssign = false;
    } else if (venueCapacity > 0 && classSize < venueCapacity * UNDERUTILIZATION_THRESHOLD) {
      log(`ℹ Venue ${V.venue_name} (capacity ${venueCapacity}) is oversized for class of ${classSize} - consider a smaller venue.`);
    }

    // If any reason found, skip completely (NO INSERT)
    if (!canAssign) {
      log(`❌ COLLISION DETECTED for subject ${subject_id} (${S.title} - ${S.full_name}):`);
      reasons.forEach(r => log(`   → ${r}`));
      log(`   Skipping subject ${subject_id} entirely.`);
      continue;
    }

    // ===================== HOURS CHECK =====================
    if (remainingHours < ltpaIncrement) {
      log(`⚠ Assigning would exceed total hours for subject ${subject_id}. Skipping.`);
      continue;
    }

    // ===================== FINAL INSERT WITH TRANSACTION =====================
    // `db` is the shared connection pool, not one single connection. Calling
    // db.query("START TRANSACTION") and then more db.query(...) calls afterward does NOT
    // guarantee they all run on the same underlying MySQL connection under concurrent
    // load (the pool can hand each .query() call to a different connection) - so the
    // transaction below would not actually be atomic without checking out a dedicated
    // connection first. This is the same fix already applied correctly elsewhere in this
    // codebase, in logics/timetablesLogic.js :: handleUpdatetimetable.
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const sInfo of slotInfos) {
        const [startTime, endTime] = sInfo.slotTime.split("-").map(t => t.trim());

        await conn.query(`
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
        await conn.query(`UPDATE venues SET \`${sInfo.statusCol}\` = 'used' WHERE venue_id = ?`, [venue_id]);
      }

      // Update ltpa (assigned hours)
      await conn.query(`UPDATE subjects SET ltpa = COALESCE(ltpa, 0) + ? WHERE subject_id = ?`, [ltpaIncrement, subject_id]);

      await conn.commit();

      log(`✔ SUCCESS: Assigned subject ${subject_id} (${S.title}) by ${S.full_name} to ${day} ${slotInfos.map(s => s.slotTime).join(" & ")} at Venue ${venue_id}`);

    } catch (insertErr) {
      await conn.rollback();
      log(`❌ Database error while assigning subject ${subject_id}: ${insertErr.message}`);
    } finally {
      // Always release the connection back to the pool, whether this subject's
      // transaction succeeded or failed - otherwise the pool leaks a connection
      // on every failed assignment attempt.
      conn.release();
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
    WHERE (ltpa + ${DOUBLE_SLOT_HOURS}) <= total_hours_per_week
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
    WHERE (ltpa + ${DOUBLE_SLOT_HOURS}) <= total_hours_per_week
  `);
  return rows;
};

// Export
export default {
  getTimetablesFromDB,
  getDistinctValues,
  addtimetable,
};