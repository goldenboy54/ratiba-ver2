
// logics/timetablesLogic.js
import { getTimetableById, mixPrograms } from "../models/manageTimetableModel.js";
import { getAlltimetables,updatetimetable,  deleteTimetableByIdWithEffects,} from '../models/timetablesModel.js';
import pool from '../db.js';

// ==================== SEMESTER CALENDAR (VETA vs NON-VETA) ====================
// A `semester` label ("I"/"II") only tells you which of a student's OWN two
// semesters an entry belongs to - it does NOT tell you the real calendar months,
// because VETA's academic calendar no longer lines up with everyone else's. Same
// mapping as models/manualTimetableModel.js, confirmed against the real 2026/2027
// ATC/VETA academic calendar; duplicated here rather than shared, matching this
// codebase's existing style for small per-file collision helpers.
const SEMESTER_CALENDAR = {
  NON_VETA:  { I: ["OCT", "NOV", "DEC", "JAN", "FEB"], II: ["MAR", "APR", "MAY", "JUN", "JUL"] },
  VETA_L1L2: { I: ["JAN", "FEB", "MAR", "APR", "MAY"], II: ["JUL", "AUG", "SEP", "OCT", "NOV"] },
  VETA_L3:   { I: ["AUG", "SEP", "OCT", "NOV"],        II: ["JAN", "FEB", "MAR", "APR", "MAY"] },
};

function getProgramGroup(programType, programLevel) {
  const type = (programType || "").trim().toUpperCase();
  if (type === "VETA") {
    return String(programLevel || "").trim() === "3" ? "VETA_L3" : "VETA_L1L2";
  }
  return "NON_VETA";
}

// Two entries can only really collide if their semesters run during the same real
// months - falls back to "overlapping" (the cautious answer) if either side's
// group/semester isn't recognized, instead of silently letting it slip through.
function semestersOverlap(typeA, levelA, semA, typeB, levelB, semB) {
  const monthsA = SEMESTER_CALENDAR[getProgramGroup(typeA, levelA)]?.[semA];
  const monthsB = SEMESTER_CALENDAR[getProgramGroup(typeB, levelB)]?.[semB];
  if (!monthsA || !monthsB) return true;
  return monthsA.some(m => monthsB.includes(m));
}

export const showtimetableForm = (req, res) => {
  const { id } = req.params;
  if (id) {
    gettimetableById(id)
      .then(timetable => res.render('timetables', { timetable }))
      .catch(error => res.status(500).send('Error fetching timetable: ' + error.message));
  } else {
    res.render('timetables', { timetable: null });
  }
};




// logics/timetableLogic.js

// List all timetables
export const listtimetables = async (req, res) => {
  try {
    const timetables = await getAlltimetables();
    res.render('timetables', { timetables, query: req.query || {} }); // <-- add query
  } catch (err) {
    res.status(500).send('Error fetching timetables: ' + err.message);
  }
};


// Delete timetable handler
export const handleDeletetimetable = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await deleteTimetableByIdWithEffects(id, {
      reason:       req.body.reason || 'manual deletion',
      notes:        req.body.notes  || '',
      deleted_by:   req.user ? req.user.name : (req.body.released_by || 'system'),
      subject_code: req.body.subject_code,
      program_code: req.body.program_code,
      tutor_name:   req.body.tutor_name,
      day:          req.body.day,
      start_time:   req.body.start_time,
      end_time:     req.body.end_time
    });

    // Kama kuna warnings, onyesha kwa user badala ya redirect moja kwa moja
    if (result.warnings && result.warnings.length > 0) {
      const warningHtml = result.warnings
        .map(w => `<li style="margin-bottom:10px;">${w}</li>`)
        .join('');

      return res.send(`
        <div style="max-width:750px;margin:40px auto;padding:28px;
                    border:2px solid #e67e22;border-radius:12px;background:#fffaf0;">
          <h3 style="color:#27ae60;">✅ Timetable imefutwa kwa mafanikio</h3>
          <p style="color:#888;">ID: ${id}</p>

          <div style="background:#fff3cd;padding:18px;border-left:5px solid #f39c12;
                      border-radius:6px;margin-top:20px;">
            <h4 style="color:#b7770d;margin-top:0;">
              ⚠️ Matatizo yaliyogundulika wakati wa kufuta:
            </h4>
            <ul style="margin:0;padding-left:20px;color:#7a5000;">
              ${warningHtml}
            </ul>
          </div>

          <div style="margin-top:25px;">
            <a href="/timetables" class="btn btn-primary">Rudi Timetables</a>
          </div>
        </div>
      `);
    }

    // No warnings — clean delete
    return res.redirect(
      '/timetables?success=' + encodeURIComponent('Timetable entry deleted successfully.')
    );

  } catch (err) {
    console.error('Error deleting timetable:', err);
    return res.redirect(
      '/timetables?error=' + encodeURIComponent('Error deleting timetable: ' + err.message)
    );
  }
};



export const getEdittimetableForm = async (req, res) => {
  try {
    const timetable = await gettimetableById(req.params.id);
    res.render('timetables', { timetable });
  } catch (error) {
    res.status(500).send('Error getting timetable: ' + error.message);
  }
};


// logics/timetableLogic.js
// ====================== HELPERS ======================
// ====================== HELPERS ======================
const timeToSlot = {
  "07:30-08:15": 1, "08:15-09:00": 2, "09:05-09:50": 3, "09:50-10:35": 4,
  "11:00-11:45": 5, "11:45-12:30": 6, "13:15-14:00": 7, "14:00-14:45": 8,
  "14:50-15:35": 9, "15:35-16:20": 10, "16:25-17:10": 11, "17:10-17:55": 12,
  "18:00-18:45": 13, "18:45-19:30": 14, "19:35-20:20": 15, "20:20-21:05": 16,
  "21:10-21:55": 17, "21:55-22:40": 18,
};

const toShort = (v) => v ? String(v).trim().substring(0, 5) : null;

const getSlotCol = (day, start, end) => {
  const key = `${toShort(start)}-${toShort(end)}`;
  const num = timeToSlot[key];
  if (!num) return null;
  return `${String(day).toLowerCase()}_slot${num}`;
};

const slotStrToCol = (day, slotStr) => {
  if (!slotStr) return null;
  const num = timeToSlot[String(slotStr).trim()];
  if (!num) return null;
  return `${String(day).toLowerCase()}_slot${num}`;
};

const isSlotStillUsed = async (conn, venueId, slotCol, excludeId = null) => {
  const match = String(slotCol).match(/^(.+)_slot(\d+)$/);
  if (!match) return false;

  const day = match[1];
  const slotNum = parseInt(match[2]);

  const slotEntry = Object.entries(timeToSlot).find(([, n]) => n === slotNum);
  if (!slotEntry) return false;

  const [timeRange] = slotEntry;
  const [startShort, endShort] = timeRange.split('-');
  const startFull = startShort + ":00";
  const endFull = endShort + ":00";

  let query = `
    SELECT COUNT(*) as cnt 
    FROM extracted_timetables 
    WHERE venue_id = ? 
      AND LOWER(day) = ?
      AND (start_time = ? OR start_time = ?) 
      AND (end_time = ? OR end_time = ?)
  `;

  const params = [venueId, day, startFull, startShort, endFull, endShort];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  const [[row]] = await conn.query(query, params);
  return row.cnt > 0;
};

// ====================== MAIN UPDATE HANDLER ======================
export const handleUpdatetimetable = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;
    const t = { ...req.body };

    // ====================== NORMALIZATION ======================
    const normalizeTime = (v) => {
      if (!v) return null;
      const s = String(v).trim();
      return s.length === 5 ? s + ":00" : s;
    };

    t.start_time = normalizeTime(t.start_time);
    t.end_time = normalizeTime(t.end_time);

    const sanitize = (v) => (v === undefined || v === "" ? null : String(v).trim());

    // ====================== VALIDATION ======================
    const requiredFields = [
      'day', 'start_time', 'end_time', 'subject_code', 'subject_name',
      'department_name', 'venue_name', 'tutor_name', 'venue_location',
      'program_name', 'program_level', 'semester'
    ];

    for (const f of requiredFields) {
      if (!t[f] || String(t[f]).trim() === "") {
        await conn.rollback();
        conn.release();
        return res.status(400).send(`Missing required field: '${f}'`);
      }
    }

    // ====================== FETCH CURRENT ROW ======================
    const [[current]] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE id = ?`, [id]
    );

    if (!current) {
      await conn.rollback();
      conn.release();
      return res.status(404).send("Timetable entry not found");
    }

    // ====================== COLLISION DETECTION ======================
    const overlap = (s1, e1, s2, e2) => s1 < e2 && e1 > s2;

    const getProgramCodes = (progStr) =>
      progStr ? String(progStr).split('+').map(p => p.trim().toUpperCase()).filter(Boolean) : [];

    const [others] = await conn.query(
      `SELECT * FROM extracted_timetables
       WHERE id != ? AND day = ?`,
      [id, t.day]
    );

    let action = null;
    let collisionEntry = null;

    for (const e of others) {
      if (!overlap(t.start_time, t.end_time, e.start_time, e.end_time)) continue;
      // Same-time overlap alone isn't enough anymore - a matching semester
      // label no longer means "same real time" now that VETA's calendar
      // diverges from non-VETA's (see SEMESTER_CALENDAR above).
      if (!semestersOverlap(t.program_type, t.program_level, t.semester, e.program_type, e.program_level, e.semester)) continue;

      // 1. TUTOR CONFLICT (Highest priority)
      if (sanitize(t.tutor_name) === sanitize(e.tutor_name)) {
        action = "tutor_conflict";
        collisionEntry = e;
        break;
      }

      // 2. VENUE CONFLICT 
      if (sanitize(t.venue_name) === sanitize(e.venue_name)) {
        action = "venue_conflict";
        collisionEntry = e;
        break;
      }

      // 3. PROGRAM CONFLICT (Strict - only same program code)
      const newCodes = getProgramCodes(t.program_code || t.program_name);
      const existingCodes = getProgramCodes(e.program_code || e.program_name);

      if (newCodes.some(code => existingCodes.includes(code))) {
        action = "program_conflict";
        collisionEntry = e;
        break;
      }
    }

    // ====================== COLLISION RESPONSE ======================
    if (action && collisionEntry) {
      await conn.rollback();
      conn.release();

      if (action === "venue_conflict") {
        return res.status(409).send(`
          <div style="max-width:950px;margin:30px auto;padding:25px;border:2px solid #e74c3c;border-radius:12px;background:#fff;">
            <h4 style="color:#c0392b;">⚠️ Venue Collision Imegunduliwa</h4>
            
            <div style="background:#fff3cd;padding:18px;border-left:5px solid #f39c12;margin:20px 0;">
              <strong>Onyo:</strong> Swap inaweza kusababisha class kuondolewa kwenye Lab. Fikiria vizuri.
            </div>

            <div style="margin-bottom:20px;">
              <strong>Slot Unayotaka:</strong><br>
              ${t.day} | ${t.start_time} - ${t.end_time}<br>
              <b>${t.subject_name} (${t.subject_code})</b><br>
              Program: ${t.program_name} (${t.program_code || 'N/A'}) | Level: ${t.program_level || 'N/A'}<br>
              Venue: ${t.venue_name} (${t.venue_location || 'N/A'}) | Tutor: ${t.tutor_name}
            </div>

            <div style="margin-bottom:25px;">
              <strong>Slot Inayogongana:</strong><br>
              ${collisionEntry.day} | ${collisionEntry.start_time} - ${collisionEntry.end_time}<br>
              <b>${collisionEntry.subject_name} (${collisionEntry.subject_code})</b><br>
              Program: ${collisionEntry.program_name} (${collisionEntry.program_code || 'N/A'}) | Level: ${collisionEntry.program_level || 'N/A'}<br>
              Venue: ${collisionEntry.venue_name} (${collisionEntry.venue_location || 'N/A'}) | Tutor: ${collisionEntry.tutor_name}
            </div>

            <form method="POST" action="/timetables/exchange" style="display:inline;">
              <input type="hidden" name="first_id" value="${id}">
              <input type="hidden" name="second_id" value="${collisionEntry.id}">
              <button type="submit" class="btn btn-warning btn-lg">🔄 SWAP VENUE</button>
            </form>
            &nbsp;&nbsp;
            <a href="/timetables" class="btn btn-secondary btn-lg">Cancel & Rudi Nyuma</a>
          </div>`);
      }

      // Tutor or Program Conflict
      const conflictType = action === "tutor_conflict" ? "Tutor" : "Program";
      return res.status(409).send(`
        <div style="max-width:950px;margin:30px auto;padding:30px;border:3px solid #e67e22;border-radius:12px;background:#fffaf0;">
          <h3 style="color:#e67e22;">⚠️ ${conflictType} Collision Imegunduliwa</h3>
          <div style="background:#fff3cd;padding:18px;border-left:5px solid #f39c12;margin:20px 0;">
            <strong>Onyo:</strong> Swap inaweza kusababisha class kuondolewa kwenye Lab. Fikiria vizuri.
          </div>
          <div style="margin-bottom:20px;">
            <strong>Slot Unayotaka:</strong><br>
            ${t.day} | ${t.start_time} - ${t.end_time}<br>
            <b>${t.subject_name} (${t.subject_code})</b><br>
            Program: ${t.program_name} (${t.program_code || 'N/A'})<br>
            Venue: ${t.venue_name} | Tutor: ${t.tutor_name}
          </div>
          <div style="margin-bottom:25px;">
            <strong>Slot Inayogongana:</strong><br>
            ${collisionEntry.day} | ${collisionEntry.start_time} - ${collisionEntry.end_time}<br>
            <b>${collisionEntry.subject_name} (${collisionEntry.subject_code})</b><br>
            Program: ${collisionEntry.program_name} (${collisionEntry.program_code || 'N/A'})<br>
            Venue: ${collisionEntry.venue_name} | Tutor: ${collisionEntry.tutor_name}
          </div>
          <form method="POST" action="/timetables/exchange" style="display:inline-block;margin-right:15px;">
            <input type="hidden" name="first_id" value="${id}">
            <input type="hidden" name="second_id" value="${collisionEntry.id}">
            <input type="hidden" name="force" value="true">
            <button type="submit" class="btn btn-danger btn-lg">🚨 FORCE SWAP</button>
          </form>
          <a href="/timetables" class="btn btn-secondary btn-lg">Cancel & Rudi Nyuma</a>
        </div>`);
    }

    // ====================== NO COLLISION - VENUE SLOT MANAGEMENT ======================
    const oldDay = String(current.day).toLowerCase();
    const oldVenueId = current.venue_id || null;

    let oldSlotCol = slotStrToCol(oldDay, current.slot);
    if (!oldSlotCol) {
      oldSlotCol = getSlotCol(oldDay, current.start_time, current.end_time);
    }

    const newDay = sanitize(t.day).toLowerCase();
    const newSlotCol = getSlotCol(newDay, t.start_time, t.end_time);

    if (!newSlotCol) {
      await conn.rollback();
      conn.release();
      return res.status(400).send(`Muda ${t.start_time} - ${t.end_time} hauko kwenye orodha ya slots.`);
    }

    const [[newVenueRow]] = await conn.query(
      `SELECT venue_id FROM venues WHERE venue_name = ? LIMIT 1`,
      [sanitize(t.venue_name)]
    );

    if (!newVenueRow) {
      await conn.rollback();
      conn.release();
      return res.status(404).send(`Venue "${t.venue_name}" haikupatikana.`);
    }

    const newVenueId = newVenueRow.venue_id;

    const venueChanged = newVenueId !== oldVenueId;
    const slotChanged = oldSlotCol !== newSlotCol;
    const dayChanged = oldDay !== newDay;

    if (oldVenueId && oldSlotCol && (venueChanged || slotChanged || dayChanged)) {
      const stillUsed = await isSlotStillUsed(conn, oldVenueId, oldSlotCol, id);
      if (!stillUsed) {
        await conn.execute(`UPDATE venues SET ${oldSlotCol}_status = 'unused' WHERE venue_id = ?`, [oldVenueId]);
      }
    }

    await conn.execute(`UPDATE venues SET ${newSlotCol}_status = 'used' WHERE venue_id = ?`, [newVenueId]);

    // ====================== UPDATE THE TIMETABLE ======================
    const newSlotStr = `${toShort(t.start_time)}-${toShort(t.end_time)}`;

    const sql = `
      UPDATE extracted_timetables SET
        day = ?, start_time = ?, end_time = ?, subject_code = ?, subject_name = ?,
        department_name = ?, venue_name = ?, venue_id = ?, tutor_name = ?,
        venue_location = ?, program_name = ?, subject_credit = ?, program_level = ?,
        year = ?, venue_type = ?, venue_status = ?, semester = ?, slot = ?
      WHERE id = ?`;

    const values = [
      sanitize(t.day), sanitize(t.start_time), sanitize(t.end_time),
      sanitize(t.subject_code), sanitize(t.subject_name),
      sanitize(t.department_name), sanitize(t.venue_name), newVenueId,
      sanitize(t.tutor_name), sanitize(t.venue_location),
      sanitize(t.program_name), sanitize(t.subject_credit),
      sanitize(t.program_level), sanitize(t.year),
      sanitize(t.venue_type), sanitize(t.venue_status),
      sanitize(t.semester), newSlotStr, id
    ];

    await conn.execute(sql, values);
    await conn.commit();

    console.log(`✅ Timetable id=${id} updated successfully`);

    return res.status(200).send(`
      <div style="max-width:600px;margin:40px auto;padding:30px;border:2px solid #27ae60;border-radius:12px;text-align:center;">
        <h3 style="color:#27ae60;">✅ Timetable Ime-update kwa Mafanikio!</h3>
        <p><strong>${t.subject_name} (${t.subject_code})</strong></p>
        <p>${t.day} | ${t.start_time} - ${t.end_time}</p>
        <p>Program: ${t.program_name} | Venue: ${t.venue_name}</p>
        <br>
        <a href="/timetables" class="btn btn-primary btn-lg">Rudi Timetables</a>
      </div>`);

  } catch (err) {
    await conn.rollback();
    console.error("Error updating timetable:", err);
    return res.status(500).send(`<h4 style="color:red;">Server Error</h4><p>${err.message}</p>`);
  } finally {
    conn.release();
  }
};
