import db from '../db.js';

export const getTimetablesFromDB = async (filters) => {
  let query = `
    SELECT 
      *, u.full_name AS tutor_name, s.title AS subject_name, subject_code,
      program_name, program_type, program_level, total_hours_per_week, semester
    FROM subjects s
    JOIN users u ON s.user_id = u.user_id
    WHERE ltpa < total_hours_per_week
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
    WHERE ltpa < total_hours_per_week
  `);
  return rows;
};

async function resolveSlotColumn({ day, slot, venue_id }) {
  const dayLower = day.toLowerCase();
  const [cols] = await db.query(`SHOW COLUMNS FROM venues`);
  const colNames = cols.map(c => c.Field);
  const candidates = colNames.filter(c => c.startsWith(dayLower) && c.endsWith("_status")).sort();

  if (!candidates.length) throw new Error(`No slot status columns found for day "${day}" in table venues.`);

  if (typeof slot === "number") {
    const idx = slot - 1;
    if (!candidates[idx]) throw new Error(`Slot index ${slot} does NOT exist for ${day}.`);
    return candidates[idx];
  }

  if (typeof slot === "string") {
    for (const statusCol of candidates) {
      const timeCol = statusCol.replace(/_status$/, "");
      try {
        const [rows] = await db.query(`SELECT \`${timeCol}\` AS timeVal FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]);
        if (rows.length && rows[0].timeVal && rows[0].timeVal.trim() === slot.trim()) return statusCol;
      } catch (err) { continue; }
    }
    throw new Error(`Slot "${slot}" not found for ${day} in venue ${venue_id}.`);
  }

  throw new Error("Slot must be number or string (time range).");
}

export const addtimetable = async ({ day, venue_id, subject_ids, slot, logs = [] }) => {
  const log = msg => { logs.push(msg); console.log(msg); };
  if (!day || !venue_id || !subject_ids || !Array.isArray(subject_ids) || !slot) {
    throw new Error("Missing required parameters: day, venue_id, subject_ids(array), slot.");
  }

  let statusCol;
  try { statusCol = await resolveSlotColumn({ day, slot, venue_id }); }
  catch (err) { log(`❌ ${err.message}`); return; }

  log(`Using status column: ${statusCol}`);

  const [venueRows] = await db.query(`SELECT \`${statusCol}\` AS status FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]);
  if (!venueRows.length) { log(`❌ Venue not found: ${venue_id}`); return; }
  if (venueRows[0].status === "used") { log(`❌ Slot already used.`); return; }

  const dayMap = {
    monday: "mnos", tuesday: "tnos", wednesday: "wnos",
    thursday: "thnos", friday: "frnos", saturday: "satnos", sunday: "sunnos"
  };
  const dayLower = day.toLowerCase();
  const counterCol = dayMap[dayLower];

  const timeCol = statusCol.replace(/_status$/, "");
  let slotTimeValue = null;
  try { const [trows] = await db.query(`SELECT \`${timeCol}\` AS t FROM venues WHERE venue_id=? LIMIT 1`, [venue_id]); if (trows.length) slotTimeValue = trows[0].t; } catch(e){}

  const [existingEntries] = await db.query(`SELECT * FROM extracted_timetables WHERE day=? AND slot=?`, [day, slotTimeValue || slot]);

  for (const subject_id of subject_ids) {
    const [subjectData] = await db.query(`
      SELECT s.*, u.full_name, u.user_id AS tutor_db_id
      FROM subjects s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.subject_id=?
    `, [subject_id]);

    if (!subjectData.length) { log(`❌ No data for subject_id=${subject_id}`); continue; }
    const S = subjectData[0];

    const tutorConflict = existingEntries.some(e => e.tutor_name == S.full_name || e.tutor_name == S.user_id || e.tutor_name == S.tutor_db_id);
    const programConflict = existingEntries.some(e => {
      if (!e.program_code || !S.program_code) return false;
      const existingParts = e.program_code.split("+").map(p => p.trim().toLowerCase());
      const newParts = S.program_code ? S.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
      return existingParts.some(p => newParts.includes(p));
    });
    const venueConflict = existingEntries.some(e => Number(e.venue_id) === Number(venue_id));

    if (tutorConflict) { log(`⚠ Tutor collision for subject_id=${subject_id}`); continue; }
    if (programConflict) { log(`⚠ Program collision for subject_id=${subject_id}`); continue; }
    if (venueConflict) { log(`⚠ Venue collision for subject_id=${subject_id}`); continue; }

    const finalSlotText = slotTimeValue || (typeof slot === "string" ? slot : `slot${slot}`);

    try {
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
        finalSlotText,
        (typeof finalSlotText === "string" && finalSlotText.includes("-")) ? finalSlotText.split("-")[0] : null,
        (typeof finalSlotText === "string" && finalSlotText.includes("-")) ? finalSlotText.split("-")[1] : null,
        S.subject_code || null,
        S.title || null,
        S.subject_department || null,
        venue_id,
        S.venue_name || null,
        S.full_name || S.user_id || null,
        S.venue_location || null,
        S.program_name || null,
        S.subject_credit || S.credit || null,
        S.program_level || null,
        S.year || S.program_duration || null,
        S.type || null,
        "used",
        S.semester || null,
        S.venue_capacity || S.program_capacity || null,
        S.program_capacity || null,
        S.program_type || null,
        S.total_hours_per_week || null,
        ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].indexOf(day.toUpperCase()) + 1,
        S.program_code || null,
        S.user_id || S.tutor_db_id || null,
        new Date()
      ]);

      await db.query(`UPDATE subjects SET ltpa = ltpa + 0.75 WHERE subject_id=?`, [subject_id]);
      await db.query(`UPDATE venues SET \`${statusCol}\`='used' WHERE venue_id=?`, [venue_id]);

      if (counterCol) {
        await db.query(`
          UPDATE venues
          SET \`${counterCol}\` = COALESCE(\`${counterCol}\`,0)+1,
              totalnos = COALESCE(mnos,0)+COALESCE(tnos,0)+COALESCE(wnos,0)+COALESCE(thnos,0)+COALESCE(frnos,0)+COALESCE(satnos,0)+COALESCE(sunnos,0)
          WHERE venue_id=?
        `, [venue_id]);
      }

      await db.query(`UPDATE venues SET status='Busy' WHERE venue_id=? AND (SELECT COUNT(*) FROM extracted_timetables WHERE venue_id=?) > 0`, [venue_id, venue_id]);
      log(`✔ Assigned subject_id=${subject_id} → ${day} -> ${finalSlotText} (venue ${venue_id})`);

    } catch (insertErr) { log(`❌ Failed to insert subject_id=${subject_id}: ${insertErr.message}`); continue; }
  }
};

export default {
  getTimetablesFromDB,
  getDistinctValues,
  addtimetable,
};

