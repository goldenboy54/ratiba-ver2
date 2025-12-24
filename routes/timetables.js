// // routes/timetables.js
// import express from 'express';
// import pool from '../db.js';
// import { showtimetableForm, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';
// import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';

// const router = express.Router();

// // =====================
// // Search timetables
// // =====================
// router.get('/', async (req, res) => {
//   try {
//     const criteria = {
//       department_name: req.query.department,
//       program_name: req.query.program,
//       subject_name: req.query.subject,
//       venue_name: req.query.venue,
//       tutor_name: req.query.tutor,
//       program_level: req.query.level,
//       program_type: req.query.program_type,
//     };

//     const timetables = await searchTimetables(criteria);

//     const programs = await getDistinctValues('program_name');
//     const venues = await getDistinctValues('venue_name');
//     const subjects = await getDistinctValues('subject_name');
//     const tutors = await getDistinctValues('tutor_name');
//     const departments = await getDistinctValues('department_name');
//     const levels = await getDistinctValues('program_level');
//     const semesters = await getDistinctValues('semester');
//     const ptypes = await getDistinctValues('program_type');

//     res.render('timetables', {
//       timetables,
//       programs,
//       venues,
//       tutors,
//       levels,
//       departments,
//       subjects,
//       semesters,
//       ptypes,
//       ...criteria,
//     });
//   } catch (error) {
//     res.status(500).send('Error searching timetables: ' + error.message);
//   }
// });

// // =====================
// // Forms
// // =====================
// router.get('/form', showtimetableForm);
// router.get('/edit/:id', getEdittimetableForm);

// // =====================
// // CRUD
// // =====================
// router.post('/edit/:id', handleUpdatetimetable);
// // router.get('/delete/:id', handleDeletetimetable);
// // Use POST for delete (form submission from modal)
// router.post('/delete/:id', handleDeletetimetable);
// router.get('/list', listtimetables);

// import {
//   truncateAllTimetables // keep existing truncate if needed
// } from '../models/timetablesModel.js';
// // routes/timetables.js
// router.post('/delete-all', async (req, res) => {
//   try {
//     // optional: check req.user.isAdmin
//     await truncateAllTimetables();
//     req.flash('success', 'All timetables truncated and related resets applied.');
//     res.redirect('/timetables');
//   } catch (err) {
//     req.flash('error', 'Error truncating: ' + err.message);
//     res.redirect('/timetables');
//   }
// });


import express from 'express';
import pool from '../db.js';
import { showtimetableForm, getEdittimetableForm, handleUpdatetimetable, handleDeletetimetable, listtimetables } from '../logics/timetablesLogic.js';
import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';
import { truncateAllTimetables } from '../models/timetablesModel.js';
import {getDistinctPrograms} from '../logics/viewtimetableLogic.js';
const router = express.Router();

// =====================
// Search timetables
// =====================
router.get('/', async (req, res) => {
  try {
    const criteria = {
      department_name: req.query.department || '',
      program_name: req.query.program || '',
      subject_name: req.query.subject || '',
      venue_name: req.query.venue || '',
      tutor_name: req.query.tutor || '',
      program_level: req.query.level || '',
      program_type: req.query.program_type || '',
    };

    // Fetch filtered timetables
    const timetables = await searchTimetables(criteria);

    // Fetch dropdown data
    const programs = await getDistinctPrograms() || [];
    const venues = await getDistinctValues('venue_name') || [];
    const subjects = await getDistinctValues('subject_name') || [];
    const tutors = await getDistinctValues('tutor_name') || [];
    const departments = await getDistinctValues('department_name') || [];
    const levels = await getDistinctValues('program_level') || [];
    const semesters = await getDistinctValues('semester') || [];
    const ptypes = await getDistinctValues('program_type') || [];

    // Messages from query string
    const error = req.query.error || '';
    const success = req.query.success || '';

    res.render('timetables', {
      timetables,
      programs,
      venues,
      tutors,
      levels,
      departments,
      subjects,
      semesters,
      ptypes,
      ...criteria,
      error,
      success,
      user: req.user || {}  // ensure user object is always defined
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
// Forms
// =====================
router.get('/form', showtimetableForm);
router.get('/edit/:id', getEdittimetableForm);

// =====================
// CRUD
// =====================
router.post('/edit/:id', handleUpdatetimetable);
router.post('/delete/:id', handleDeletetimetable);

// =====================
// Delete all timetables
// =====================
router.post('/delete-all', async (req, res) => {
  try {
    // Check if user is admin or tmaster
    if (!req.user || (req.user.role !== "tmaster" && req.user.role !== "admin")) {
      console.log('Unauthorized user role:', req.user?.role);
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
// Collision Actions
// =====================

// Cancel action: redirect to timetables list
router.get('/cancel', (req, res) => {
  res.redirect('/timetables');
});

// Exchange tutor sessions

router.post('/exchange', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { first_id, second_id, confirm } = req.body;

    if (!first_id || !second_id) {
      conn.release();
      return res.status(400).send('Both timetable IDs are required');
    }

    // Fetch original rows BEFORE swap
    const [rows] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
      [first_id, second_id]
    );

    if (rows.length !== 2) {
      conn.release();
      return res.status(404).send('One of the timetables not found');
    }

    const firstBefore = rows.find(r => r.id == first_id);
    const secondBefore = rows.find(r => r.id == second_id);

    // Columns to swap (venue & timing only)
    const swapColumns = [
      'day','start_time','end_time','venue_name','venue_location',
      'venue_type','venue_status','venue_id'
    ];

    const generateTable = (title, before, after) => `
      <div style="margin-bottom:20px;">
        <h4>${title}</h4>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;">
          <tr style="background:#f2f2f2;"><th>Column</th><th>From</th><th>To</th></tr>
          ${swapColumns.map(f => `
            <tr>
              <td>${f}</td>
              <td>${before[f] ?? '<i>null</i>'}</td>
              <td>${after ? after[f] ?? '<i>null</i>' : '<i>Pending</i>'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;

    // Confirmation page if not confirmed yet
    if (!confirm) {
      const htmlConfirm = `
        <h3 style="color:#0b5ed7;">⚠ Confirm Timetable Exchange</h3>
        <p>This will <strong>swap day, time, and venue info only</strong>.</p>
        ${generateTable(`First ID: ${first_id}`, firstBefore)}
        ${generateTable(`Second ID: ${second_id}`, secondBefore)}
        <div style="margin-top:15px;">
          <form method="POST" action="/timetables/exchange" style="display:inline;">
            <input type="hidden" name="first_id" value="${first_id}">
            <input type="hidden" name="second_id" value="${second_id}">
            <input type="hidden" name="confirm" value="yes">
            <button type="submit" style="padding:10px 20px;background:#198754;color:white;border:none;border-radius:5px;cursor:pointer;">Confirm Exchange</button>
          </form>
          <a href="/timetables" style="padding:10px 20px;background:#dc3545;color:white;border-radius:5px;text-decoration:none;margin-left:10px;">Cancel</a>
        </div>
      `;
      conn.release();
      return res.send(htmlConfirm);
    }

    // Execute swap (venue & timing only)
    const swapQuery = `
      UPDATE extracted_timetables AS t1
      JOIN extracted_timetables AS t2 ON (t1.id = ? AND t2.id = ?)
      SET
        t1.day = (@d := t1.day), t1.day = t2.day, t2.day = @d,
        t1.start_time = (@st := t1.start_time), t1.start_time = t2.start_time, t2.start_time = @st,
        t1.end_time = (@et := t1.end_time), t1.end_time = t2.end_time, t2.end_time = @et,
        t1.venue_name = (@vn := t1.venue_name), t1.venue_name = t2.venue_name, t2.venue_name = @vn,
        t1.venue_location = (@vl := t1.venue_location), t1.venue_location = t2.venue_location, t2.venue_location = @vl,
        t1.venue_type = (@vt := t1.venue_type), t1.venue_type = t2.venue_type, t2.venue_type = @vt,
        t1.venue_status = (@vs := t1.venue_status), t1.venue_status = t2.venue_status, t2.venue_status = @vs,
        t1.venue_id = (@vid := t1.venue_id), t1.venue_id = t2.venue_id, t2.venue_id = @vid
    `;
    await conn.execute(swapQuery, [first_id, second_id]);

    // Fetch AFTER swap
    const [afterRows] = await conn.query(
      `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
      [first_id, second_id]
    );
    const firstAfter = afterRows.find(r => r.id == first_id);
    const secondAfter = afterRows.find(r => r.id == second_id);

    conn.release();

    const htmlReport = `
      <h3 style="color:#198754;">✅ Timetables Fully Exchanged (Venue & Timing Only)</h3>
      ${generateTable(`First ID: ${first_id}`, firstBefore, firstAfter)}
      ${generateTable(`Second ID: ${second_id}`, secondBefore, secondAfter)}
      <p>
        📌 All other data remains unchanged.<br>
        🔗 <a href="/timetables" style="color:#0b5ed7;">Back to Timetables</a>
      </p>
    `;
    return res.send(htmlReport);

  } catch (err) {
    conn.release();
    console.error('Exchange error:', err);
    return res.status(500).send('Error exchanging timetables: ' + err.message);
  }
});

// router.post('/exchange', async (req, res) => {
//   const conn = await pool.getConnection();
//   try {
//     const { first_id, second_id, confirm } = req.body;

//     if (!first_id || !second_id) {
//       conn.release();
//       return res.status(400).send('Both timetable IDs are required');
//     }

//     // Fetch original rows BEFORE swap
//     const [rows] = await conn.query(
//       `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
//       [first_id, second_id]
//     );

//     if (rows.length !== 2) {
//       conn.release();
//       return res.status(404).send('One of the timetables not found');
//     }

//     const firstBefore = rows.find(r => r.id == first_id);
//     const secondBefore = rows.find(r => r.id == second_id);

//     // Columns to display (for preview)
//     const swapColumns = [
//       'subject_code','subject_name','tutor_name','department_name','program_name',
//       'subject_credit','program_level','program_type','total_hours_per_week',
//       'program_capacity','arrange','created_by','created_at','updated_by','updated_at',
//       'program_code','semester','year','day','start_time','end_time','venue_name','venue_location'
//     ];

//     // Generate HTML table preview
//     const generateTable = (title, before, after) => `
//       <div style="margin-bottom:20px;">
//         <h4>${title}</h4>
//         <table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;">
//           <tr style="background:#f2f2f2;"><th>Column</th><th>From</th><th>To</th></tr>
//           ${swapColumns.map(f => `
//             <tr>
//               <td>${f}</td>
//               <td>${before[f] ?? '<i>null</i>'}</td>
//               <td>${after ? after[f] ?? '<i>null</i>' : '<i>Pending</i>'}</td>
//             </tr>
//           `).join('')}
//         </table>
//       </div>
//     `;

//     // Confirmation page if not confirmed yet
//     if (!confirm) {
//       const htmlConfirm = `
//         <h3 style="color:#0b5ed7;">⚠ Confirm Timetable Exchange</h3>
//         <p>This will <strong>swap all session details including day and time</strong> except venue, which remains fixed.</p>
//         ${generateTable(`First ID: ${first_id}`, firstBefore)}
//         ${generateTable(`Second ID: ${second_id}`, secondBefore)}
//         <div style="margin-top:15px;">
//           <form method="POST" action="/timetables/exchange" style="display:inline;">
//             <input type="hidden" name="first_id" value="${first_id}">
//             <input type="hidden" name="second_id" value="${second_id}">
//             <input type="hidden" name="confirm" value="yes">
//             <button type="submit" style="padding:10px 20px;background:#198754;color:white;border:none;border-radius:5px;cursor:pointer;">Confirm Exchange</button>
//           </form>
//           <a href="/timetables" style="padding:10px 20px;background:#dc3545;color:white;border-radius:5px;text-decoration:none;margin-left:10px;">Cancel</a>
// <br><br><br><br>

//         </div>
//       `;
//       conn.release();
//       return res.send(htmlConfirm);
//     }

//     // Execute swap (all except venue stays in place)
//     const swapQuery = `
//       UPDATE extracted_timetables AS t1
//       JOIN extracted_timetables AS t2 ON (t1.id = ? AND t2.id = ?)
//       SET
//         t1.subject_code = (@sc := t1.subject_code), t1.subject_code = t2.subject_code, t2.subject_code = @sc,
//         t1.subject_name = (@sn := t1.subject_name), t1.subject_name = t2.subject_name, t2.subject_name = @sn,
//         t1.tutor_name = (@tn := t1.tutor_name), t1.tutor_name = t2.tutor_name, t2.tutor_name = @tn,
//         t1.department_name = (@dn := t1.department_name), t1.department_name = t2.department_name, t2.department_name = @dn,
//         t1.program_name = (@pn := t1.program_name), t1.program_name = t2.program_name, t2.program_name = @pn,
//         t1.subject_credit = (@scd := t1.subject_credit), t1.subject_credit = t2.subject_credit, t2.subject_credit = @scd,
//         t1.program_level = (@pl := t1.program_level), t1.program_level = t2.program_level, t2.program_level = @pl,
//         t1.program_type = (@pt := t1.program_type), t1.program_type = t2.program_type, t2.program_type = @pt,
//         t1.total_hours_per_week = (@th := t1.total_hours_per_week), t1.total_hours_per_week = t2.total_hours_per_week, t2.total_hours_per_week = @th,
//         t1.program_capacity = (@pc := t1.program_capacity), t1.program_capacity = t2.program_capacity, t2.program_capacity = @pc,
//         t1.arrange = (@arr := t1.arrange), t1.arrange = t2.arrange, t2.arrange = @arr,
//         t1.created_by = (@cb := t1.created_by), t1.created_by = t2.created_by, t2.created_by = @cb,
//         t1.created_at = (@ca := t1.created_at), t1.created_at = t2.created_at, t2.created_at = @ca,
//         t1.updated_by = (@ub := t1.updated_by), t1.updated_by = t2.updated_by, t2.updated_by = @ub,
//         t1.updated_at = (@ua := t1.updated_at), t1.updated_at = t2.updated_at, t2.updated_at = @ua,
//         t1.program_code = (@pcd := t1.program_code), t1.program_code = t2.program_code, t2.program_code = @pcd,
//         t1.semester = (@sem := t1.semester), t1.semester = t2.semester, t2.semester = @sem,
//         t1.year = (@y := t1.year), t1.year = t2.year, t2.year = @y,
//         t1.day = (@d := t1.day), t1.day = t2.day, t2.day = @d,
//         t1.start_time = (@st := t1.start_time), t1.start_time = t2.start_time, t2.start_time = @st,
//         t1.end_time = (@et := t1.end_time), t1.end_time = t2.end_time, t2.end_time = @et
//     `;
//     await conn.execute(swapQuery, [first_id, second_id]);

//     // Fetch AFTER swap
//     const [afterRows] = await conn.query(
//       `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
//       [first_id, second_id]
//     );
//     const firstAfter = afterRows.find(r => r.id == first_id);
//     const secondAfter = afterRows.find(r => r.id == second_id);

//     conn.release();

//     // Show final report
//     const htmlReport = `
//       <h3 style="color:#198754;">✅ Timetables Fully Exchanged</h3>
//       ${generateTable(`First ID: ${first_id}`, firstBefore, firstAfter)}
//       ${generateTable(`Second ID: ${second_id}`, secondBefore, secondAfter)}
//       <p>
//         📌 Venue remains fixed.<br>
//         🔗 <a href="/timetables" style="color:#0b5ed7;">Back to Timetables</a>
//       </p>
//     `;
//     return res.send(htmlReport);

//   } catch (err) {
//     conn.release();
//     console.error('Exchange error:', err);
//     return res.status(500).send('Error exchanging timetables: ' + err.message);
//   }
// });

// router.post('/exchange', async (req, res) => {
//   const conn = await pool.getConnection();
//   try {
//     const { first_id, second_id, confirm } = req.body;

//     if (!first_id || !second_id) {
//       conn.release();
//       return res.status(400).send('Both timetable IDs are required');
//     }

//     // Fetch original rows BEFORE swap
//     const [rows] = await conn.query(
//       `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
//       [first_id, second_id]
//     );

//     if (rows.length !== 2) {
//       conn.release();
//       return res.status(404).send('One of the timetables not found');
//     }

//     const firstBefore = rows.find(r => r.id == first_id);
//     const secondBefore = rows.find(r => r.id == second_id);

//     // Columns to display (swapable columns)
//     const swapColumns = [
//       'subject_code','subject_name','tutor_name','department_name','program_name',
//       'subject_credit','program_level','program_type','total_hours_per_week',
//       'program_capacity','arrange','created_by','created_at','updated_by','updated_at',
//       'program_code','semester','year'
//     ];

//     // Generate before table HTML
//     const generateTable = (title, before, after) => `
//       <h4>${title}</h4>
//       <table border="1" cellpadding="5" cellspacing="0">
//         <tr><th>Column</th><th>From</th><th>To</th></tr>
//         ${swapColumns.map(f => `
//           <tr>
//             <td>${f}</td>
//             <td>${before[f] ?? '<i>null</i>'}</td>
//             <td>${after ? after[f] ?? '<i>null</i>' : '<i>Pending</i>'}</td>
//           </tr>
//         `).join('')}
//       </table>
//     `;

//     // If not confirmed yet, show confirmation page
//     if (!confirm) {
//       const htmlConfirm = `
//         <h3>⚠ Confirm Timetable Exchange</h3>
//         ${generateTable(`First ID: ${first_id}`, firstBefore)}
//         ${generateTable(`Second ID: ${second_id}`, secondBefore)}
//         <p>
//           Day, time, and venue details will remain fixed.<br>
//           <form method="POST" action="/timetables/exchange">
//             <input type="hidden" name="first_id" value="${first_id}">
//             <input type="hidden" name="second_id" value="${second_id}">
//             <input type="hidden" name="confirm" value="yes">
//             <button type="submit">OK, Exchange</button>
//             <a href="/timetables"><button type="button">Cancel</button></a>
//           </form>
//         </p>
//       `;
//       conn.release();
//       return res.send(htmlConfirm);
//     }

//     // Execute swap (day, time, venue remain fixed)
//     const swapQuery = `
//       UPDATE extracted_timetables AS t1
//       JOIN extracted_timetables AS t2 ON (t1.id = ? AND t2.id = ?)
//       SET
//           t1.subject_code = (@sc := t1.subject_code), t1.subject_code = t2.subject_code, t2.subject_code = @sc,
//           t1.subject_name = (@sn := t1.subject_name), t1.subject_name = t2.subject_name, t2.subject_name = @sn,
//           t1.tutor_name = (@tn := t1.tutor_name), t1.tutor_name = t2.tutor_name, t2.tutor_name = @tn,
//           t1.department_name = (@dn := t1.department_name), t1.department_name = t2.department_name, t2.department_name = @dn,
//           t1.program_name = (@pn := t1.program_name), t1.program_name = t2.program_name, t2.program_name = @pn,
//           t1.subject_credit = (@scd := t1.subject_credit), t1.subject_credit = t2.subject_credit, t2.subject_credit = @scd,
//           t1.program_level = (@pl := t1.program_level), t1.program_level = t2.program_level, t2.program_level = @pl,
//           t1.program_type = (@pt := t1.program_type), t1.program_type = t2.program_type, t2.program_type = @pt,
//           t1.total_hours_per_week = (@th := t1.total_hours_per_week), t1.total_hours_per_week = t2.total_hours_per_week, t2.total_hours_per_week = @th,
//           t1.program_capacity = (@pc := t1.program_capacity), t1.program_capacity = t2.program_capacity, t2.program_capacity = @pc,
//           t1.arrange = (@arr := t1.arrange), t1.arrange = t2.arrange, t2.arrange = @arr,
//           t1.created_by = (@cb := t1.created_by), t1.created_by = t2.created_by, t2.created_by = @cb,
//           t1.created_at = (@ca := t1.created_at), t1.created_at = t2.created_at, t2.created_at = @ca,
//           t1.updated_by = (@ub := t1.updated_by), t1.updated_by = t2.updated_by, t2.updated_by = @ub,
//           t1.updated_at = (@ua := t1.updated_at), t1.updated_at = t2.updated_at, t2.updated_at = @ua,
//           t1.program_code = (@pcd := t1.program_code), t1.program_code = t2.program_code, t2.program_code = @pcd,
//           t1.semester = (@sem := t1.semester), t1.semester = t2.semester, t2.semester = @sem,
//           t1.year = (@y := t1.year), t1.year = t2.year, t2.year = @y
//     `;
//     await conn.execute(swapQuery, [first_id, second_id]);

//     // Fetch AFTER swap
//     const [afterRows] = await conn.query(
//       `SELECT * FROM extracted_timetables WHERE id IN (?, ?)`,
//       [first_id, second_id]
//     );
//     const firstAfter = afterRows.find(r => r.id == first_id);
//     const secondAfter = afterRows.find(r => r.id == second_id);

//     conn.release();

//     // Show final report
//     const htmlReport = `
//       <h3>✅ Timetables Fully Exchanged</h3>
//       ${generateTable(`First ID: ${first_id}`, firstBefore, firstAfter)}
//       ${generateTable(`Second ID: ${second_id}`, secondBefore, secondAfter)}
//       <p>
//         📌 Day, time, and venue details remain fixed.<br>
//         🔗 <a href="/timetables">Back to Timetables</a>
//       </p>
//     `;

//     return res.send(htmlReport);

//   } catch (err) {
//     conn.release();
//     console.error('Exchange error:', err);
//     return res.status(500).send('Error exchanging timetables: ' + err.message);
//   }
// });


// router.post('/exchange', async (req, res) => {
//   const conn = await pool.getConnection();
//   try {
//     const { first_id, second_id } = req.body;
//     if (!first_id || !second_id) {
//       conn.release();
//       return res.status(400).send('Both timetable IDs are required');
//     }

//     // Swap only columns that are allowed (exclude id, day/time, venue details)
//     const swapQuery = `
//       UPDATE extracted_timetables AS t1
//       JOIN extracted_timetables AS t2 ON (t1.id = ? AND t2.id = ?)
//       SET
//           t1.subject_code = (@sc := t1.subject_code), t1.subject_code = t2.subject_code, t2.subject_code = @sc,
//           t1.subject_name = (@sn := t1.subject_name), t1.subject_name = t2.subject_name, t2.subject_name = @sn,
//           t1.tutor_name = (@tn := t1.tutor_name), t1.tutor_name = t2.tutor_name, t2.tutor_name = @tn,
//           t1.department_name = (@dn := t1.department_name), t1.department_name = t2.department_name, t2.department_name = @dn,
//           t1.program_name = (@pn := t1.program_name), t1.program_name = t2.program_name, t2.program_name = @pn,
//           t1.subject_credit = (@scd := t1.subject_credit), t1.subject_credit = t2.subject_credit, t2.subject_credit = @scd,
//           t1.program_level = (@pl := t1.program_level), t1.program_level = t2.program_level, t2.program_level = @pl,
//           t1.program_type = (@pt := t1.program_type), t1.program_type = t2.program_type, t2.program_type = @pt,
//           t1.total_hours_per_week = (@th := t1.total_hours_per_week), t1.total_hours_per_week = t2.total_hours_per_week, t2.total_hours_per_week = @th,
//           t1.program_capacity = (@pc := t1.program_capacity), t1.program_capacity = t2.program_capacity, t2.program_capacity = @pc,
//           t1.arrange = (@arr := t1.arrange), t1.arrange = t2.arrange, t2.arrange = @arr,
//           t1.created_by = (@cb := t1.created_by), t1.created_by = t2.created_by, t2.created_by = @cb,
//           t1.created_at = (@ca := t1.created_at), t1.created_at = t2.created_at, t2.created_at = @ca,
//           t1.updated_by = (@ub := t1.updated_by), t1.updated_by = t2.updated_by, t2.updated_by = @ub,
//           t1.updated_at = (@ua := t1.updated_at), t1.updated_at = t2.updated_at, t2.updated_at = @ua,
//           t1.program_code = (@pcd := t1.program_code), t1.program_code = t2.program_code, t2.program_code = @pcd,
//           t1.semester = (@sem := t1.semester), t1.semester = t2.semester, t2.semester = @sem,
//           t1.year = (@y := t1.year), t1.year = t2.year, t2.year = @y
//     `;

//     const [result] = await conn.execute(swapQuery, [first_id, second_id]);
//     conn.release();

//     return res.send(`✅ Timetables ${first_id} and ${second_id} have been fully swapped (with day, time, and venue fixed).`);

//   } catch (err) {
//     conn.release();
//     console.error('Exchange error:', err);
//     return res.status(500).send('Error exchanging timetables: ' + err.message);
//   }
// });


// router.post('/exchange', async (req, res) => {
//   try {
//     const { first_id, second_id } = req.body;

//     const [firstRows] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [first_id]);
//     const [secondRows] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [second_id]);

//     if (!firstRows[0] || !secondRows[0]) return res.status(404).send('One of the timetables not found');

//     const first = firstRows[0];
//     const second = secondRows[0];

//     // Swap tutor_name, venue_name, start_time, end_time
//     await pool.execute(
//       `UPDATE extracted_timetables SET tutor_name=?, venue_name=?, start_time=?, end_time=? WHERE id=?`,
//       [second.tutor_name, second.venue_name, second.start_time, second.end_time, first.id]
//     );

//     await pool.execute(
//       `UPDATE extracted_timetables SET tutor_name=?, venue_name=?, start_time=?, end_time=? WHERE id=?`,
//       [first.tutor_name, first.venue_name, first.start_time, first.end_time, second.id]
//     );

//     res.send('✅ Tutor sessions exchanged successfully');
//   } catch (error) {
//     res.status(500).send('Error exchanging tutor sessions: ' + error.message);
//   }
// });

// Mix programs (same subject, different programs)
router.post('/mix', async (req, res) => {
  try {
    const { id_1, id_2 } = req.body;

    const [rows1] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [id_1]);
    const [rows2] = await pool.query(`SELECT * FROM extracted_timetables WHERE id=?`, [id_2]);

    if (!rows1[0] || !rows2[0]) return res.status(404).send('One of the timetables not found');

    const mixedPrograms = rows1[0].mixed_programs ? rows1[0].mixed_programs.split(',') : [];
    if (!mixedPrograms.includes(rows2[0].program_name)) mixedPrograms.push(rows2[0].program_name);

    await pool.execute(
      `UPDATE extracted_timetables SET mixed_programs=? WHERE id=?`,
      [mixedPrograms.join(','), id_1]
    );

    res.send('✅ Programs mixed successfully for the same subject');
  } catch (error) {
    res.status(500).send('Error mixing programs: ' + error.message);
  }
});

export default router;
