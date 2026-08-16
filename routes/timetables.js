// routes/timetables.js
import express from 'express';
import pool from '../db.js';
import { showtimetableForm, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';
import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';
import { truncateAllTimetables } from '../models/timetablesModel.js';
import { getDistinctPrograms } from '../logics/viewtimetableLogic.js';
import { getAllusers } from '../models/usersModel.js';

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
    };

    const timetables = await searchTimetables(criteria);

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
      semesters: [],
      ptypes: [],
      department_name: '',
      program_name: '',
      subject_name: '',
      subject_code: '',
      venue_name: '',
      tutor_name: '',
      program_level: '',
      program_type: '',
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

// =====================
// Exchange Route (Updated with better collision detection)
// =====================

// =====================
// Exchange Route (FINAL FIXED - Inazingatia Program Code)
// =====================
router.post('/exchange', async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { first_id, second_id, force } = req.body;

    if (!first_id || !second_id) {
      conn.release();
      return res.status(400).send('Both timetable IDs are required');
    }

    // Fetch both records
    const [rows] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
      [first_id, second_id]
    );

    if (rows.length !== 2) {
      conn.release();
      return res.status(404).send('One or both timetables not found');
    }

    const first = rows.find(r => r.id == first_id);
    const second = rows.find(r => r.id == second_id);

    // Helper to get program codes
    const getProgramCodes = (progStr) => {
      if (!progStr) return [];
      return String(progStr).split('+')
        .map(p => p.trim().toUpperCase())
        .filter(Boolean);
    };

    // =========================
    // Check for collisions after swap
    // =========================
    const checkCollisionsAfterSwap = async (entry, ignoreIds) => {
      const [conflicts] = await conn.query(`
        SELECT * FROM extracted_timetables
        WHERE id NOT IN (?)
          AND semester = ?
          AND day = ?
          AND (
            (start_time < ? AND end_time > ?) OR
            (start_time = ? AND end_time = ?)
          )
      `, [
        ignoreIds.length ? ignoreIds : [0],
        entry.semester,
        entry.day,
        entry.end_time, entry.start_time,
        entry.start_time, entry.end_time
      ]);

      const results = [];

      for (const c of conflicts) {
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

    const sanitize = (v) => (v === undefined || v === "" ? null : String(v).trim());

    // Simulate swap for checking
    const firstAfter = { ...first };
    const secondAfter = { ...second };

    const swapFields = ['day', 'start_time', 'end_time', 'venue_name', 'venue_location', 
                       'venue_type', 'venue_status', 'venue_id'];

    swapFields.forEach(field => {
      const temp = firstAfter[field];
      firstAfter[field] = secondAfter[field];
      secondAfter[field] = temp;
    });

    // Check collisions after swap
    const firstCollisions = await checkCollisionsAfterSwap(firstAfter, [first_id, second_id]);
    const secondCollisions = await checkCollisionsAfterSwap(secondAfter, [first_id, second_id]);

    if ((firstCollisions || secondCollisions) && !force) {
      conn.release();

      let html = `
        <div style="max-width:1000px;margin:30px auto;padding:25px;border:2px solid #e67e22;border-radius:12px;background:#fffaf0;">
          <h3 style="color:#e67e22;">⚠️ Collision Imegunduliwa Baada ya Swap</h3>
          <div style="background:#fff3cd;padding:15px;border-left:5px solid #f39c12;margin:15px 0;">
            Swap inaweza kusababisha mgongano. Tumia FORCE SWAP ikiwa una uhakika.
          </div>`;

      if (firstCollisions) {
        html += `<h5 style="color:#c0392b;">Slot 1 baada ya swap:</h5>`;
        firstCollisions.forEach(c => {
          html += `
            <div style="margin:12px 0;padding:12px;background:#f8d7da;border-radius:6px;">
              <strong>${c.subject_name} (${c.subject_code})</strong><br>
              Program: ${c.program_name} (${c.program_code || 'N/A'})<br>
              Tutor: ${c.tutor_name} | Venue: ${c.venue_name}<br>
              Type: ${c.collisionType.toUpperCase()}
            </div>`;
        });
      }

      if (secondCollisions) {
        html += `<h5 style="color:#c0392b;">Slot 2 baada ya swap:</h5>`;
        secondCollisions.forEach(c => {
          html += `
            <div style="margin:12px 0;padding:12px;background:#f8d7da;border-radius:6px;">
              <strong>${c.subject_name} (${c.subject_code})</strong><br>
              Program: ${c.program_name} (${c.program_code || 'N/A'})<br>
              Tutor: ${c.tutor_name} | Venue: ${c.venue_name}<br>
              Type: ${c.collisionType.toUpperCase()}
            </div>`;
        });
      }

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
    // EXECUTE THE SWAP
    // =========================
    await conn.beginTransaction(); // Ensure transaction for swap

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

    await conn.execute(swapQuery, [first_id, second_id, first_id, second_id]);

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