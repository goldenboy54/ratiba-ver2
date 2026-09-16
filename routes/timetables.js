// routes/timetables.js
import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { showtimetableForm, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';
import { searchTimetables, getDistinctValues, groupTimetablesBySession } from '../logics/timetableLogic.js';
import { truncateAllTimetables } from '../models/timetablesModel.js';
import { getDistinctPrograms } from '../logics/viewtimetableLogic.js';
import { getAllusers } from '../models/usersModel.js';
import { createSemesterCalendarResolver, loadSemesterCalendarSettings } from '../models/semesterCalendar.js';

const router = express.Router();

// =====================
// Search timetables
// =====================
router.get('/', async (req, res) => {
  try {
    const criteria = {
      department_name: req.query.department || '',
      program_name: req.query.program || '',
      subject_code: req.query.subject_code || '', 
      subject_name: req.query.subject || '',
      venue_name: req.query.venue || '',
      tutor_name: req.query.tutor || '',
      program_level: req.query.level || '',
      program_type: req.query.program_type || '',
      semester: req.query.semester || '',
    };

    // This admin list wants one row per class (a class may book several rows sharing
    // session_group_id) - the public /searchtimetable grid needs every individual row, so
    // the grouping is applied here only, not inside searchTimetables itself.
    const rawTimetables = await searchTimetables(criteria);
    const timetables = groupTimetablesBySession(rawTimetables);

    const programs = await getDistinctPrograms() || [];
    const venues = await getDistinctValues('venue_name') || [];
    const subjects = await getDistinctValues('subject_name') || [];
    const scodes = await getDistinctValues('subject_code') || [];
    const tutors = await getDistinctValues('tutor_name') || [];
    const departments = await getDistinctValues('department_name') || [];
    const levels = await getDistinctValues('program_level') || [];
    const semesters = await getDistinctValues('semester') || [];
    const ptypes = await getDistinctValues('program_type') || [];

    const allTutors = await getAllusers();

    const error = req.query.error || '';
    const success = req.query.success || '';

    res.render('timetables', {
      timetables,
      programs,
      venues,
      tutors,
      allTutors,
      levels,
      departments,
      subjects,
      scodes,
      semesters,
      ptypes,
      ...criteria,
      error,
      success,
      user: req.user || {}
    });
  } catch (err) {
    console.error('Error fetching timetables:', err);
    res.render('timetables', {
      timetables: [],
      programs: [],
      venues: [],
      tutors: [],
      levels: [],
      departments: [],
      subjects: [],
      scodes: [],
      semesters: [],
      ptypes: [],
      allTutors: [],
      department_name: '',
      program_name: '',
      subject_name: '',
      subject_code: '',
      venue_name: '',
      tutor_name: '',
      program_level: '',
      program_type: '',
      semester: '',
      error: 'Error fetching timetables: ' + err.message,
      success: '',
      user: req.user || {}
    });
  }
});

// =====================
// Forms & CRUD
// =====================
router.get('/form', showtimetableForm);
router.get('/edit/:id', getEdittimetableForm);
router.post('/edit/:id', handleUpdatetimetable);
router.post('/delete/:id', handleDeletetimetable);

// =====================
// Delete all
// =====================
router.post('/delete-all', async (req, res) => {
  try {
    if (!req.user || (req.user.role !== "tmaster" && req.user.role !== "admin")) {
      return res.redirect('/timetables?error=' + encodeURIComponent('Only admin / Timetable master can delete all timetables.'));
    }

    const password = String(req.body?.confirm_password || '');
    if (!password) {
      return res.redirect('/timetables?error=' + encodeURIComponent('Enter your current login password to clean all timetables.'));
    }

    const [users] = await pool.execute(
      `SELECT password FROM users
       WHERE user_id = ? AND status = 'active'
       AND role IN ('admin', 'tmaster')
       LIMIT 1`,
      [req.user.user_id]
    );
    if (!users[0] || !(await bcrypt.compare(password, users[0].password))) {
      return res.redirect('/timetables?error=' + encodeURIComponent('Login email or password is incorrect. No timetable was deleted.'));
    }

    await truncateAllTimetables();
    res.redirect('/timetables?success=' + encodeURIComponent('All timetables truncated successfully.'));
  } catch (err) {
    console.error('Error truncating timetables:', err);
    res.redirect('/timetables?error=' + encodeURIComponent('Error truncating timetables: ' + err.message));
  }
});

// =====================
// COLLISION HELPERS (Reusable)
// =====================
const getProgramCodes = (progStr) => {
  if (!progStr) return [];
  return String(progStr).split('+')
    .map(p => p.trim().toUpperCase())
    .filter(p => p.length > 0);
};

const programsOverlap = (prog1, prog2) => {
  const codes1 = getProgramCodes(prog1);
  const codes2 = getProgramCodes(prog2);
  return codes1.some(code => codes2.includes(code));
};

// ==================== SEMESTER CALENDAR (VETA vs NON-VETA) ====================
// A `semester` label ("I"/"II") only tells you which of a student's OWN two
// semesters an entry belongs to - it does NOT tell you the real calendar months,
// because VETA's academic calendar no longer lines up with everyone else's. Same
// mapping as models/manualTimetableModel.js, confirmed against the real 2026/2027
// ATC/VETA academic calendar; duplicated here rather than shared, matching this
// codebase's existing style for small per-file collision helpers.
// =====================
// Exchange Route (Updated with better collision detection)
// =====================

// =====================
// Exchange Route (FINAL FIXED - Inazingatia Program Code)
// =====================
router.post('/exchange', async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const semesterCalendar = createSemesterCalendarResolver(
      await loadSemesterCalendarSettings()
    );
    const { first_id, second_id, force } = req.body;

    if (!first_id || !second_id) {
      conn.release();
      return res.status(400).send('Both timetable IDs are required');
    }

    // Fetch both anchor records, then each one's FULL session group - a class books one or
    // two rows sharing session_group_id (see models/manualTimetableModel.js / tmasterModel.js),
    // and swapping just the single anchor row would leave its sibling behind in the old
    // day/time/venue, splitting the class across two disconnected slots.
    const [anchorRows] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
      [first_id, second_id]
    );

    if (anchorRows.length !== 2) {
      conn.release();
      return res.status(404).send('One or both timetables not found');
    }

    const firstAnchor = anchorRows.find(r => r.id == first_id);
    const secondAnchor = anchorRows.find(r => r.id == second_id);

    const [firstGroup] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE session_group_id = ? ORDER BY start_time`,
      [firstAnchor.session_group_id]
    );
    const [secondGroup] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE session_group_id = ? ORDER BY start_time`,
      [secondAnchor.session_group_id]
    );

    if (firstGroup.length !== secondGroup.length) {
      conn.release();
      return res.status(400).send(
        `Haiwezekani ku-swap: kundi la kwanza lina slot ${firstGroup.length}, la pili lina slot ${secondGroup.length}. ` +
        `Exchange inafanya kazi tu kati ya madarasa yenye idadi sawa ya slots (mfano double-slot na double-slot).`
      );
    }

    // Pair up each group's rows by position (both sorted by start_time, so index 0 is
    // always each class's earlier half) - swapping pair-by-pair keeps each class's own
    // internal slot ordering intact while relocating the whole class as one unit.
    const pairs = firstGroup.map((f, i) => ({ first: f, second: secondGroup[i] }));
    const allGroupIds = [...firstGroup.map(r => r.id), ...secondGroup.map(r => r.id)];

    // Helper to get program codes
    const getProgramCodes = (progStr) => {
      if (!progStr) return [];
      return String(progStr).split('+')
        .map(p => p.trim().toUpperCase())
        .filter(Boolean);
    };

    const sanitize = (v) => (v === undefined || v === "" ? null : String(v).trim());

    // =========================
    // Check for collisions after swap
    // =========================
    const checkCollisionsAfterSwap = async (entry, ignoreIds) => {
      const [conflicts] = await conn.query(`
        SELECT * FROM extracted_timetables
        WHERE id NOT IN (?)
          AND day = ?
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time = ? AND end_time = ?)
          )
      `, [
        ignoreIds.length ? ignoreIds : [0],
        entry.day,
        entry.end_time, entry.start_time,
        entry.start_time, entry.end_time
      ]);

      const results = [];

      for (const c of conflicts) {
        if (!semesterCalendar(entry, entry.semester, c, c.semester)) continue;

        // Tutor conflict
        if (c.tutor_name && entry.tutor_name &&
            sanitize(c.tutor_name) === sanitize(entry.tutor_name)) {
          results.push({ ...c, collisionType: 'tutor' });
          continue;
        }

        // Venue conflict
        if (c.venue_name && entry.venue_name &&
            sanitize(c.venue_name) === sanitize(entry.venue_name)) {
          results.push({ ...c, collisionType: 'venue' });
          continue;
        }

        // Program conflict - STRICT using program_code
        const entryCodes = getProgramCodes(entry.program_code || entry.program_name);
        const conflictCodes = getProgramCodes(c.program_code || c.program_name);

        if (entryCodes.some(code => conflictCodes.includes(code))) {
          results.push({ ...c, collisionType: 'program' });
        }
      }

      return results.length > 0 ? results : null;
    };

    // Simulate the swap for every pair, checking each resulting slot against everything
    // EXCEPT the two full groups being swapped (not just the two anchor ids).
    const swapFields = ['day', 'start_time', 'end_time', 'venue_name', 'venue_location',
                       'venue_type', 'venue_status', 'venue_id'];

    const collisionsByPair = [];
    for (const { first, second } of pairs) {
      const firstAfter = { ...first };
      const secondAfter = { ...second };

      swapFields.forEach(field => {
        const temp = firstAfter[field];
        firstAfter[field] = secondAfter[field];
        secondAfter[field] = temp;
      });

      const firstCollisions = await checkCollisionsAfterSwap(firstAfter, allGroupIds);
      const secondCollisions = await checkCollisionsAfterSwap(secondAfter, allGroupIds);

      if (firstCollisions) collisionsByPair.push({ label: `${first.start_time} - ${first.end_time} → ${second.day} ${second.start_time}-${second.end_time}`, collisions: firstCollisions });
      if (secondCollisions) collisionsByPair.push({ label: `${second.start_time} - ${second.end_time} → ${first.day} ${first.start_time}-${first.end_time}`, collisions: secondCollisions });
    }

    if (collisionsByPair.length && !force) {
      conn.release();

      let html = `
        <div style="max-width:1000px;margin:30px auto;padding:25px;border:2px solid #e67e22;border-radius:12px;background:#fffaf0;">
          <h3 style="color:#e67e22;">⚠️ Collision Imegunduliwa Baada ya Swap</h3>
          <div style="background:#fff3cd;padding:15px;border-left:5px solid #f39c12;margin:15px 0;">
            Swap inaweza kusababisha mgongano. Tumia FORCE SWAP ikiwa una uhakika.
          </div>`;

      collisionsByPair.forEach(({ label, collisions }) => {
        html += `<h5 style="color:#c0392b;">Baada ya swap (${label}):</h5>`;
        collisions.forEach(c => {
          html += `
            <div style="margin:12px 0;padding:12px;background:#f8d7da;border-radius:6px;">
              <strong>${c.subject_name} (${c.subject_code})</strong><br>
              Program: ${c.program_name} (${c.program_code || 'N/A'})<br>
              Tutor: ${c.tutor_name} | Venue: ${c.venue_name}<br>
              Type: ${c.collisionType.toUpperCase()}
            </div>`;
        });
      });

      html += `
          <form method="POST" action="/timetables/exchange" style="display:inline;">
            <input type="hidden" name="first_id" value="${first_id}">
            <input type="hidden" name="second_id" value="${second_id}">
            <input type="hidden" name="force" value="true">
            <button type="submit" class="btn btn-danger btn-lg">🚨 FORCE SWAP (Endelea Licha ya Hatari)</button>
          </form>
          &nbsp;&nbsp;
          <a href="/timetables" class="btn btn-secondary btn-lg">Cancel & Rudi Nyuma</a>
        </div>`;

      return res.send(html);
    }

    // =========================
    // EXECUTE THE SWAP (every pair, one transaction)
    // =========================
    await conn.beginTransaction();

    const swapQuery = `
      UPDATE extracted_timetables t1
      JOIN extracted_timetables t2 ON (t1.id = ? AND t2.id = ?)
      SET
        t1.day = t2.day, t1.start_time = t2.start_time, t1.end_time = t2.end_time,
        t1.venue_name = t2.venue_name, t1.venue_location = t2.venue_location,
        t1.venue_type = t2.venue_type, t1.venue_status = t2.venue_status, t1.venue_id = t2.venue_id,

        t2.day = t1.day, t2.start_time = t1.start_time, t2.end_time = t1.end_time,
        t2.venue_name = t1.venue_name, t2.venue_location = t1.venue_location,
        t2.venue_type = t1.venue_type, t2.venue_status = t1.venue_status, t2.venue_id = t1.venue_id
      WHERE t1.id = ? AND t2.id = ?`;

    for (const { first, second } of pairs) {
      await conn.execute(swapQuery, [first.id, second.id, first.id, second.id]);
    }

    await conn.commit();
    conn.release();

    return res.send(`
      <div style="max-width:650px;margin:40px auto;padding:35px;border:2px solid #28a745;border-radius:12px;text-align:center;background:#f8fff9;">
        <h3 style="color:#28a745;">✅ Swap Imekamilika kwa Mafanikio!</h3>
        <p>Timetable zimebadilishana salama bila collision.</p>
        <a href="/timetables" class="btn btn-primary btn-lg">Rudi Timetables</a>
      </div>
    `);

  } catch (err) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }
    console.error('Exchange error:', err);
    return res.status(500).send(`
      <h4 style="color:red;">Error kutekeleza swap</h4>
      <p>${err.message}</p>
      <a href="/timetables">Rudi Timetables</a>
    `);
  }
});



// Mix programs (unaweza kuiboresha baadaye kama inahitajika)
router.post('/mix', async (req, res) => {
  try {
    const { id_1, id_2 } = req.body;

    const [rows1] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [id_1]);
    const [rows2] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [id_2]);

    if (!rows1[0] || !rows2[0]) return res.status(404).send('One of the timetables not found');

    const mixedPrograms = rows1[0].mixed_programs 
      ? rows1[0].mixed_programs.split(',').map(p => p.trim()) 
      : [];

    if (!mixedPrograms.includes(rows2[0].program_name)) {
      mixedPrograms.push(rows2[0].program_name);
    }

    await pool.execute(
      `UPDATE extracted_timetables SET mixed_programs = ? WHERE id = ?`,
      [mixedPrograms.join(','), id_1]
    );

    res.send('Programs mixed successfully for the same subject');
  } catch (error) {
    res.status(500).send('Error mixing programs: ' + error.message);
  }
});

export default router;