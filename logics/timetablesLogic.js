
// logics/timetablesLogic.js
import { getTimetableById, mixPrograms } from "../models/manageTimetableModel.js";
import { getAlltimetables,updatetimetable,  deleteTimetableByIdWithEffects,} from '../models/timetablesModel.js';
import pool from '../db.js';

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
  const reason = req.body.reason;
  const notes = req.body.notes || '';
  const released_by = req.user ? req.user.name : (req.body.released_by || 'system');

  try {
    await deleteTimetableByIdWithEffects(id, {
      reason,
      notes,
      released_by,
      subject_code: req.body.subject_code,
      program_code: req.body.program_code,
      tutor_name: req.body.tutor_name,
      day: req.body.day,
      start_time: req.body.start_time,
      end_time: req.body.end_time
    });

    res.redirect('/timetables?success=' + encodeURIComponent('Timetable entry deleted successfully.'));
  } catch (err) {
    console.error('Error deleting timetable:', err);
    res.redirect('/timetables?error=' + encodeURIComponent('Error deleting timetable: ' + err.message));
  }
};


// export const handleDeletetimetable = async (req, res) => {
//   try {
//     await deletetimetable(req.params.id);
//     res.redirect('/timetables');
//   } catch (error) {
//     res.status(500).send('Error deleting timetable: ' + error.message);
//   }
// };


export const getEdittimetableForm = async (req, res) => {
  try {
    const timetable = await gettimetableById(req.params.id);
    res.render('timetables', { timetable });
  } catch (error) {
    res.status(500).send('Error getting timetable: ' + error.message);
  }
};




export const handleUpdatetimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const t = req.body || {};

    // Normalize "HH:MM" => "HH:MM:SS"
    const normalizeTime = v => {
      if (!v) return null;
      const s = String(v).trim();
      return s.length === 5 ? s + ':00' : s;
    };
    t.start_time = normalizeTime(t.start_time);
    t.end_time = normalizeTime(t.end_time);

    // Empty → null
    const sanitize = v => (v === undefined || v === "" ? null : v);

    // Required fields
    const requiredFields = [
      'day','start_time','end_time','subject_code','subject_name',
      'department_name','venue_name','tutor_name','venue_location',
      'program_name','subject_credit','program_level','year',
      'venue_type','venue_status','semester'
    ];

    for (const f of requiredFields) {
      if (!t[f] || t[f].toString().trim() === "") {
        return res.status(400).send(`Missing required field: '${f}'`);
      }
    }

    // Fetch current row
    const [[current]] = await pool.query(
      `SELECT * FROM extracted_timetables WHERE id = ?`,
      [id]
    );
    if (!current) return res.status(404).send("Timetable entry not found");

    // Get all other entries same day & semester
    const [others] = await pool.query(
      `SELECT * FROM extracted_timetables
       WHERE id != ? AND semester = ? AND day = ? AND  start_time=? AND end_time=? AND venue_name=?`,
      [id, t.semester, t.day,t.start_time,t.end_time,t.venue_name]
    );

// console.log(others)

    // Time overlap function
    const overlap = (s1, e1, s2, e2) => (s1 < e2 && e1 > s2);

    /* ================================================================
         UPDATED CHECKER WITH program_name + program_level
       ================================================================ */
    const programsMatch = (p1name, p1level, p2name, p2level) => {
      return p1name === p2name && p1level === p2level;
    };

    // Check if payload can fit into slot without conflict
    const canPlacePayloadInSlot = async (payload, slot, excludes = []) => {
      const params = [slot.semester, slot.day, slot.end_time, slot.start_time];
      let q = `SELECT * FROM extracted_timetables 
               WHERE semester = ? AND day = ? 
               AND start_time = ? AND end_time = ?`;

      if (excludes.length) {
        q += ` AND id NOT IN (${excludes.map(_ => "?").join(",")})`;
        params.push(...excludes);
      }

      const [rows] = await pool.query(q, params);

      for (const r of rows) {
        if (r.venue_name === slot.venue_name)
          return { ok: false, reason: "venue_conflict", row: r };

        if (payload.tutor_name && payload.tutor_name === r.tutor_name)
          return { ok: false, reason: "tutor_conflict", row: r };

        if (
          payload.program_name &&
          payload.program_level &&
          programsMatch(payload.program_name, payload.program_level, r.program_name, r.program_level)
        ) {
          return { ok: false, reason: "program_conflict", row: r };
        }
      }

      return { ok: true };
    };

    // Find holding slot for swap
    const findAvailableSlotForSwap = async (payload, excludeIds = []) => {
      const [slots] = await pool.query(
        `SELECT * FROM extracted_timetables 
         WHERE semester = ? AND day = ? AND id NOT IN (?)`,
        [t.semester, t.day, excludeIds]
      );
      for (const s of slots) {
        const ch = await canPlacePayloadInSlot(payload, s, excludeIds);
        if (ch.ok) return s;
      }
      return null;
    };

    let action = null;
    let collisionEntry = null;

    /* ================================================================
         COLLISION SCANNING — UPDATED WITH LEVEL CHECK
       ================================================================ */
    for (const e of others) {
      if (!overlap(t.start_time, t.end_time, e.start_time, e.end_time)) continue;
      // 1️⃣ Mix programs (same subject, different program)
      if (
        e.subject_code === t.subject_code &&
        !programsMatch(t.program_name, t.program_level, e.program_name, e.program_level)
      ) {
        action = "mix";
        collisionEntry = e;
        break;
      }

      // 2️⃣ STRICT EXCHANGE CHECK (two-way)
      const payloadA = {
        tutor_name: t.tutor_name,
        program_name: t.program_name,
        program_level: t.program_level
      };

      const payloadB = {
        tutor_name: e.tutor_name,
        program_name: e.program_name,
        program_level: e.program_level
      };

      const slotE = {
        semester: e.semester,
        day: e.day,
        start_time: e.start_time,
        end_time: e.end_time,
        venue_name: e.venue_name
      };

      const slotT = {
        semester: t.semester,
        day: t.day,
        start_time: t.start_time,
        end_time: t.end_time,
        venue_name: t.venue_name
      };

      const chA = await canPlacePayloadInSlot(payloadA, slotE, [id, e.id]);
      const chB = await canPlacePayloadInSlot(payloadB, slotT, [id, e.id]);

      if (chA.ok && chB.ok) {
        action = "exchange";
        collisionEntry = e;
        break;
      }

      // Hard conflict → cancel
      if (!chB.ok && (chB.reason === "tutor_conflict" || chB.reason === "program_conflict")) {
        const holdSlotA = await findAvailableSlotForSwap(payloadA, [id, e.id]);
        const holdSlotB = await findAvailableSlotForSwap(payloadB, [id, e.id]);

        if (!holdSlotA || !holdSlotB) {
          action = "cancel";
          collisionEntry = chB.row || e;
          break;
        }
      }
    }

    /* ================================================================
         RETURN UI RESPONSES (unchanged)
       ================================================================ */
    if (action && collisionEntry) {
      let msg = "";

      if (action === "mix") {
        msg = `<h4>Mix Programs</h4>
<p>Subject <b>${t.subject_name}</b> (${t.subject_code}) appears in another program 
(${collisionEntry.program_name} - Level ${collisionEntry.program_level}).</p>
<a href="/manageTimetable">Mix Now</a>
<a href="/timetables">Cancel</a>`;
      }

      if (action === "exchange") {
        msg = `<h4>Exchange Possible</h4>
           For Tutor: ${t.tutor_name}<br> teaching
<b>${t.subject_name}</b> (${t.subject_code})<br>
${t.day} | ${t.start_time} - ${t.end_time}<br>
Program: ${t.program_name} - Level ${t.program_level}<br>
<br><br> 
        with Tutor: ${collisionEntry.tutor_name}<br>
<br> teaching 
<b>${collisionEntry.subject_name}</b> (${collisionEntry.subject_code}) 
 program  (${collisionEntry.program_name} - Level ${collisionEntry.program_level}).</p>
 in Venue: ${collisionEntry.venue_name}
<form method="POST" action="/timetables/exchange">
  <input type="hidden" name="first_id" value="${id}">
  <input type="hidden" name="second_id" value="${collisionEntry.id}">
  <button class="btn btn-warning">Exchange Slots</button>
</form>
<a href="/timetables">Back</a>`;
      }

      if (action === "cancel") {
        msg = `<h4 style="color:red;">Exchange Impossible</h4>
<p>Conflict with:</p>
<b>${collisionEntry.subject_name}</b><br>
Program: ${collisionEntry.program_name} - Level ${collisionEntry.program_level}<br>
Tutor: ${collisionEntry.tutor_name}<br>
Venue: ${collisionEntry.venue_name}<br>`;
      }

      return res.status(409).send(msg);
    }

    /* ================================================================
         SAFE UPDATE (UNCHANGED)
       ================================================================ */
    const sql = `
      UPDATE extracted_timetables SET
        day=?, start_time=?, end_time=?, subject_code=?, subject_name=?,
        department_name=?, venue_name=?, tutor_name=?, venue_location=?,
        program_name=?, subject_credit=?, program_level=?, year=?,
        venue_type=?, venue_status=?, semester=?
      WHERE id=?`;

    const values = [
      sanitize(t.day), sanitize(t.start_time), sanitize(t.end_time),
      sanitize(t.subject_code), sanitize(t.subject_name),
      sanitize(t.department_name), sanitize(t.venue_name),
      sanitize(t.tutor_name), sanitize(t.venue_location),
      sanitize(t.program_name), sanitize(t.subject_credit),
      sanitize(t.program_level), sanitize(t.year),
      sanitize(t.venue_type), sanitize(t.venue_status),
      sanitize(t.semester), id
    ];

    await pool.execute(sql, values);

    return res.status(200).send(`
<h4>Updated Successfully</h4>
<b>${t.subject_name}</b> (${t.subject_code})<br>
${t.day} | ${t.start_time} - ${t.end_time}<br>
Program: ${t.program_name} - Level ${t.program_level}<br>
Venue: ${t.venue_name}
<br><br>
<a href="/timetables">Back</a>`);
  } catch (err) {
    console.error("Error updating timetable:", err);
    return res.status(500).send("Internal Error: " + err.message);
  }
};


// export const handleUpdatetimetable = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const t = req.body || {};

//     // Normalize "HH:MM" => "HH:MM:SS"
//     const normalizeTime = v => {
//       if (!v) return null;
//       const s = String(v).trim();
//       return s.length === 5 ? s + ':00' : s;
//     };
//     t.start_time = normalizeTime(t.start_time);
//     t.end_time = normalizeTime(t.end_time);

//     // Empty → null
//     const sanitize = v => (v === undefined || v === "" ? null : v);

//     // Required fields
//     const requiredFields = [
//       'day','start_time','end_time','subject_code','subject_name',
//       'department_name','venue_name','tutor_name','venue_location',
//       'program_name','subject_credit','program_level','year',
//       'venue_type','venue_status','semester'
//     ];

//     for (const f of requiredFields) {
//       if (!t[f] || t[f].toString().trim() === "") {
//         return res.status(400).send(`Missing required field: '${f}'`);
//       }
//     }

//     // Fetch current row
//     const [[current]] = await pool.query(
//       `SELECT * FROM extracted_timetables WHERE id = ?`,
//       [id]
//     );
//     if (!current) return res.status(404).send("Timetable entry not found");

//     // Get all other entries same day & semester
//     const [others] = await pool.query(
//       `SELECT * FROM extracted_timetables
//        WHERE id != ? AND semester = ? AND day = ?`,
//       [id, t.semester, t.day]
//     );

//     let action = null;
//     let collisionEntry = null;

//     // Time overlap
//     const overlap = (s1, e1, s2, e2) => (s1 < e2 && e1 > s2);

//     // Can payload fit in slot safely?
//     const canPlacePayloadInSlot = async (payload, slotTarget, excludes = []) => {
//       const params = [
//         slotTarget.semester,
//         slotTarget.day,
//         slotTarget.end_time,
//         slotTarget.start_time,
//       ];

//       let q = `
//         SELECT * FROM extracted_timetables
//         WHERE semester = ? AND day = ?
//         AND start_time < ? AND end_time > ?
//       `;

//       if (excludes.length) {
//         const ph = excludes.map(_ => "?").join(",");
//         q += ` AND id NOT IN (${ph})`;
//         params.push(...excludes);
//       }

//       const [rows] = await pool.query(q, params);

//       for (const r of rows) {
//         if (r.venue_name === slotTarget.venue_name)
//           return { ok: false, reason: "venue_conflict", row: r };

//         if (payload.tutor_name && payload.tutor_name === r.tutor_name)
//           return { ok: false, reason: "tutor_conflict", row: r };

//         if (payload.program_name && payload.program_name === r.program_name)
//           return { ok: false, reason: "program_conflict", row: r };
//       }

//       return { ok: true };
//     };

//     // COLLISION SCAN
//       // COLLISION SCAN
//     for (const e of others) {

//       // skip kama hakuna overlap
//       if (!overlap(t.start_time, t.end_time, e.start_time, e.end_time))
//         continue;

//       /* =========================================================
//          VENUE OVERLAP: Not a problem (ignore venue conflict here)
//          ========================================================= */

//       // 1️⃣ PROGRAM CONFLICT — program haijigawi
//       if (e.program_name === t.program_name && canPlacePayloadInSlot  ) {
//         action = "cancel";
//         collisionEntry = e;
//         break;
//       }

//       // 2️⃣ TUTOR CONFLICT — tutor hawezi fundisha sehemu mbili
//       if (e.tutor_name === t.tutor_name && !canPlacePayloadInSlot) {
//         action = "cancel";
//         collisionEntry = e;
//         break;
//       }

//       // 3️⃣ MIX — subject code ile ile lakini program tofauti
//       if (e.subject_code === t.subject_code && e.program_name !== t.program_name) {
//         action = "mix";
//         collisionEntry = e;
//         break;
//       }

//       // 4️⃣ STRICT EXCHANGE CHECK
//       const payloadA = {
//         tutor_name: t.tutor_name,
//         program_name: t.program_name,
//       };

//       const payloadB = {
//         tutor_name: e.tutor_name,
//         program_name: e.program_name,
//       };

//       // slot definitions
//       const slotE = {
//         semester: e.semester,
//         day: e.day,
//         start_time: e.start_time,
//         end_time: e.end_time,
//         venue_name: e.venue_name
//       };

//       const slotT = {
//         semester: t.semester,
//         day: t.day,
//         start_time: t.start_time,
//         end_time: t.end_time,
//         venue_name: t.venue_name
//       };

//       // check both sides
//       const chA = await canPlacePayloadInSlot(payloadA, slotE, [id, e.id]);
//       const chB = await canPlacePayloadInSlot(payloadB, slotT, [id, e.id]);

//       if (chA.ok && chB.ok) {
//         action = "exchange";
//         collisionEntry = e;
//         break;
//       }

//       // If reverse side fails due to tutor/program (NOT venue)
//       if (!chB.ok && (chB.reason === "tutor_conflict" || chB.reason === "program_conflict")) {
//         action = "cancel";
//         collisionEntry = chB.row || e;
//         break;
//       }

//     }


//     // RETURN UI COLLISION RESPONSES
//     if (action && collisionEntry) {
//       let msg = "";

// if (action === 'cancel') {
//     msg = `
// <h3 style="color:#b30000;">Exchange Impossible — Cancel Required</h3>

// <p>
// The system applied the <strong>Strict Two-Side Exchange Rule</strong> which requires that:
// </p>

// <ul>
//   <li><strong>(1)</strong> Your updated session must fit correctly inside the target slot 
//       <em>without causing tutor, program, or venue collisions</em>.</li>

//   <li><strong>(2)</strong> The other session must also fit inside your original slot 
//       using the <strong>same non-collision checks</strong>.</li>
// </ul>

// <p>
// During the validation, the system detected that placing 
// <strong>${t.subject_name}</strong> (${t.subject_code}) into 
// <strong>${t.venue_name}</strong> at 
// <strong>${t.start_time} – ${t.end_time}</strong> 
// creates a <strong>hard collision</strong> with an already scheduled session:
// </p>

// <div style="padding:10px;border:1px solid #ddd;border-radius:5px;">
//   <strong>${collisionEntry.subject_name}</strong> 
//   (${collisionEntry.subject_code})<br>
//   Program: <strong>${collisionEntry.program_name}</strong><br>
//   Tutor: <strong>${collisionEntry.tutor_name}</strong><br>
//   Venue: <strong>${collisionEntry.venue_name}</strong><br>
//   Time: <strong>${collisionEntry.start_time} – ${collisionEntry.end_time}</strong>
// </div>

// <br>

// <h4>Why Strict Exchange Failed:</h4>

// <p>At least one of the following conflicts was detected when simulating the swap:</p>

// <ul>
//   <li>
//     <strong>Program Conflict:</strong> The program for the above session is already in another class 
//     within the same time window — a program cannot exist in two venues at once.
//   </li>

//   <li>
//     <strong>Tutor Conflict:</strong> The tutor involved is already teaching somewhere else during 
//     the same interval — tutors cannot split sessions.
//   </li>

//   <li>
//     <strong>Venue Conflict:</strong> The venue is already booked and cannot host two sessions simultaneously.
//   </li>

//   <li>
//     <strong>Reverse-Side Failure:</strong> Even if your class could move to the other slot, the other class 
//     cannot move into your current slot without causing a new collision.  
//     (<em>Strict rule: Both sides MUST fit — not one side only.</em>)
//   </li>
// </ul>

// <br>

// <p style="color:#b30000;">
// Therefore it is <strong>impossible</strong> for these two sessions to exchange positions without violating timetable integrity.  
// The system must <strong>cancel</strong> this exchange request.
// </p>

// <p><a href="/timetables" class="btn btn-secondary">Back to Timetables</a></p>
// `;
// }

//       if (action === "mix") {
//         msg = `
// <h4>Mix Programs</h4>
// <p>Subject <b>${t.subject_name}</b> (${t.subject_code}) appears in another program (${collisionEntry.program_name}).</p>

// <a href="/manageTimetable">Go to mixing timetable page</a>

// <a href="/timetables">Cancel / Back</a>
// `;
//       }

//       if (action === "exchange") {
//         msg = `
// <h4>Exchange Possible</h4>
// <p>A strict two-way exchange can be applied.</p>

// <form method="POST" action="/timetables/exchange">
//   <input type="hidden" name="first_id" value="${id}">
//   <input type="hidden" name="second_id" value="${collisionEntry.id}">
//   <button class="btn btn-warning">Exchange Slots</button>
// </form>
// <a href="/timetables">Back</a>
// `;
//       }

//       return res.status(409).send(msg);
//     }

//     // NO COLLISION → UPDATE SAFELY (NO FREED SLOT)
//     const sql = `
//       UPDATE extracted_timetables SET
//         day=?, start_time=?, end_time=?, subject_code=?, subject_name=?,
//         department_name=?, venue_name=?, tutor_name=?, venue_location=?,
//         program_name=?, subject_credit=?, program_level=?, year=?,
//         venue_type=?, venue_status=?, semester=?
//       WHERE id=?`;

//     const values = [
//       sanitize(t.day), sanitize(t.start_time), sanitize(t.end_time),
//       sanitize(t.subject_code), sanitize(t.subject_name),
//       sanitize(t.department_name), sanitize(t.venue_name),
//       sanitize(t.tutor_name), sanitize(t.venue_location),
//       sanitize(t.program_name), sanitize(t.subject_credit),
//       sanitize(t.program_level), sanitize(t.year),
//       sanitize(t.venue_type), sanitize(t.venue_status),
//       sanitize(t.semester), id
//     ];

//     await pool.execute(sql, values);

//     // SUCCESS
//     return res.status(200).send(`
// <h4>Updated Successfully</h4>
// <b>${t.subject_name}</b> (${t.subject_code})<br>
// ${t.day} | ${t.start_time} - ${t.end_time}<br>
// Venue: ${t.venue_name} | Tutor: ${t.tutor_name}
// <br><br>
// <a href="/timetables">Back</a>
// `);

//   } catch (err) {
//     console.error("Error updating timetable:", err);
//     return res.status(500).send("Internal Error: " + err.message);
//   }
// };



// export const handleUpdatetimetable = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const t = req.body;
//     const sanitize = v => (v === undefined || v === '' ? null : v);

//     const requiredFields = [
//       'day','start_time','end_time','subject_code','subject_name',
//       'department_name','venue_name','tutor_name','venue_location',
//       'program_name','subject_credit','program_level','year',
//       'venue_type','venue_status','semester'
//     ];

//     for (const f of requiredFields) {
//       if (!t[f] || t[f].toString().trim() === '') 
//         return res.status(400).send(`Missing required field: '${f}'`);
//     }

//     // Get current record
//     const [[current]] = await pool.query(`SELECT * FROM extracted_timetables WHERE id = ?`, [id]);

//     // Get all other timetable entries
//     const [existing] = await pool.query(`SELECT * FROM extracted_timetables WHERE id != ?`, [id]);

//     let action = null; // will store collision action
//     let collisionEntry = null;

//     for (const e of existing) {
//       const timeOverlap =
//         (t.start_time < e.end_time && t.end_time > e.start_time); // overlap check
//       if (!timeOverlap || e.day !== t.day) continue;

//       // Cancel: venue already booked for that time
//       if (e.venue_name === t.venue_name) {
//         action = 'cancel';
//         collisionEntry = e;
//         break; // no point checking further
//       }

//       // Exchange: tutor or subject conflict
//       if ((e.tutor_name === t.tutor_name && e.subject_code !== t.subject_code) ||
//           (e.tutor_name !== t.tutor_name && e.subject_code !== t.subject_code) ||
//           (e.tutor_name === t.tutor_name && e.subject_code === t.subject_code && e.program_name === t.program_name)
//       ) {
//         action = 'exchange';
//         collisionEntry = e;
//         break;
//       }

//       // Mix: same subject, different program, venue already booked
//       if (e.subject_code === t.subject_code && e.program_name !== t.program_name) {
//         action = 'mix';
//         collisionEntry = e;
//         break;
//       }
//     }

//     if (action && collisionEntry) {
//       let msg = '';
//       if (action === 'cancel') {
//         msg = `
// <h4>Cancel Required</h4>
// <p>Cannot place <strong>${t.subject_name}</strong> (${t.subject_code}) because venue <strong>${t.venue_name}</strong> is already booked or tutor/program is busy in this slot.</p>`;
//       } else if (action === 'exchange') {
//         msg = `
// <h4>Exchange Option</h4>
// <p>Conflict detected with <strong>${collisionEntry.subject_name}</strong> (${collisionEntry.subject_code})</p>
// <form method="POST" action="/timetables/exchange">
//   <input type="hidden" name="first_id" value="${id}" />
//   <input type="hidden" name="second_id" value="${collisionEntry.id}" />
//   <button type="submit" class="btn btn-warning">Exchange Slots</button>
// </form>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//       } else if (action === 'mix') {
//         msg = `
// <h4>Mix Programs</h4>
// <p>Subject <strong>${t.subject_name}</strong> (${t.subject_code}) exists in another program <strong>${collisionEntry.program_name}</strong> during this slot.</p>
// <form method="POST" action="/timetables/mix">
//   <input type="hidden" name="id_1" value="${id}" />
//   <input type="hidden" name="id_2" value="${collisionEntry.id}" />
//   <button type="submit" class="btn btn-primary">Mix Programs</button>
// </form>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//       }
//       return res.status(409).send(msg);
//     }

//     // Freed slots if venue/time changed
//     if (current && (current.venue_name !== t.venue_name || current.start_time !== t.start_time)) {
//       await pool.query(
//         `INSERT INTO freed_slots 
//           (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
//         [
//           current.venue_id || null,
//           current.venue_name || "Unknown",
//           current.day,
//           current.start_time,
//           current.end_time,
//           'System',
//           `Slot freed due to update (moved to ${t.venue_name} ${t.start_time})`
//         ]
//       );

//       await pool.query(
//         `DELETE FROM extracted_timetables 
//          WHERE day=? AND start_time=? AND venue_id=? AND program_name=?`,
//         [current.day, current.start_time, current.venue_id, current.program_name]
//       );
//     }

//     // Normal update
//     const sql = `
//       UPDATE extracted_timetables SET
//         day=?, start_time=?, end_time=?, subject_code=?, subject_name=?,
//         department_name=?, venue_name=?, tutor_name=?, venue_location=?,
//         program_name=?, subject_credit=?, program_level=?, year=?,
//         venue_type=?, venue_status=?, semester=?
//       WHERE id=?`;
//     const values = [
//       sanitize(t.day), sanitize(t.start_time), sanitize(t.end_time),
//       sanitize(t.subject_code), sanitize(t.subject_name),
//       sanitize(t.department_name), sanitize(t.venue_name),
//       sanitize(t.tutor_name), sanitize(t.venue_location),
//       sanitize(t.program_name), sanitize(t.subject_credit),
//       sanitize(t.program_level), sanitize(t.year),
//       sanitize(t.venue_type), sanitize(t.venue_status),
//       sanitize(t.semester), sanitize(id)
//     ];

//     await pool.execute(sql, values);

//     res.status(200).send(`
// <h4>Timetable Updated Successfully</h4>
// <p>${t.subject_name} (${t.subject_code})</p>
// <p>Day: ${t.day} | Time: ${t.start_time} - ${t.end_time}</p>
// <p>Venue: ${t.venue_name} | Tutor: ${t.tutor_name}</p>
//     `);

//   } catch (err) {
//     console.error('Error updating timetable:', err);
//     res.status(500).send('Internal Error while updating timetable: ' + err.message);
//   }
// };


// export const handleUpdatetimetable = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const timetable = req.body;
//     const sanitize = v => (v === undefined || v === '' ? null : v);

//     const requiredFields = [
//       'day','start_time','end_time','subject_code','subject_name',
//       'department_name','venue_name','tutor_name','venue_location',
//       'program_name','subject_credit','program_level','year',
//       'venue_type','venue_status','semester'
//     ];

//     for (const field of requiredFields) {
//       if (!timetable[field] || timetable[field].toString().trim() === '') {
//         return res.status(400).send(`Missing required field: '${field}'`);
//       }
//     }

//     const [currentRows] = await pool.query(`SELECT * FROM extracted_timetables WHERE id = ?`, [id]);
//     const currentRecord = currentRows[0];

//     const [existing] = await pool.query(`SELECT * FROM extracted_timetables WHERE id != ?`, [id]);

//     let collision = null;

//     for (const entry of existing) {
//       const timeOverlap =
//         (timetable.start_time >= entry.start_time && timetable.start_time < entry.end_time) ||
//         (timetable.end_time > entry.start_time && timetable.end_time <= entry.end_time) ||
//         (timetable.start_time <= entry.start_time && timetable.end_time >= entry.end_time);

//       if (!timeOverlap || entry.day !== timetable.day) continue;

//       // Venue already taken
//       if (entry.venue_name === timetable.venue_name) {
//         collision = { type: 'Venue', a: entry };
//         break;
//       }

//       // Program and subject checks
//       if (entry.program_name === timetable.program_name && entry.subject_code === timetable.subject_code) {
//         if (entry.tutor_name !== timetable.tutor_name) {
//           collision = { type: 'Exchange', reason: 'Same program & subject, tutor differs', a: entry };
//         }
//       } 
//       // Mix: same subject, different program
//       else if (entry.subject_code === timetable.subject_code && entry.program_name !== timetable.program_name) {
//         collision = { type: 'Mix', reason: 'Same subject, different program', a: entry };
//       }
//       // Exchange: different subject or tutor
//       else if (entry.subject_code !== timetable.subject_code || entry.tutor_name !== timetable.tutor_name) {
//         collision = { type: 'Exchange', reason: 'Different subject or tutor', a: entry };
//       }

//       if (collision) break;
//     }

//     if (collision) {
//       let msg = '';
//       switch (collision.type) {
//         case 'Mix':
//           msg = `
// <h4>Mix Option Available <a href="/manageTimetable"> GO TO MIX PROGRAM PAGE</a>
// </h4>
// <p>Subject <strong>${timetable.subject_name}</strong> exists in another program (<strong>${collision.a.program_name}</strong>) at this time.</p>

// <!-- <form method="POST" action="/timetables/mix">
//   <input type="hidden" name="id_1" value="${id}" />
//   <input type="hidden" name="id_2" value="${collision.a.id}" />
//   <button type="submit" class="btn btn-primary">Mix Programs</button>
// </form>  -->

// <a href="/manageTimetable"> GO TO MIX PROGRAM PAGE</a>

// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//           break;
//         case 'Exchange':
//           msg = `
// <h4>Exchange Option Available</h4>
// <p>Conflict with <strong>${collision.a.subject_name}</strong> (${collision.a.program_name}) at this time.</p>
// <form method="POST" action="/timetables/exchange">
//   <input type="hidden" name="first_id" value="${id}" />
//   <input type="hidden" name="second_id" value="${collision.a.id}" />
//   <button type="submit" class="btn btn-warning">Exchange</button>
// </form>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//           break;
//         case 'Venue':
//           msg = `
// <h4>Venue Already Taken</h4>
// <p>Venue <strong>${collision.a.venue_name}</strong> is already booked by <strong>${collision.a.program_name}</strong> (${collision.a.subject_name})</p>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary">Cancel</button>
// </form>`;
//           break;
//       }
//       return res.status(409).send(msg);
//     }

//     // Freed slots if venue or time changed
//     if (currentRecord && (currentRecord.venue_name !== timetable.venue_name || currentRecord.start_time !== timetable.start_time)) {
//       await pool.query(
//         `INSERT INTO freed_slots 
//           (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
//         [
//           currentRecord.venue_id || null,
//           currentRecord.venue_name || "Unknown",
//           currentRecord.day,
//           currentRecord.start_time,
//           currentRecord.end_time,
//           'System',
//           `Slot freed due to update (moved to ${timetable.venue_name} ${timetable.start_time})`
//         ]
//       );

//       await pool.query(
//         `DELETE FROM extracted_timetables 
//          WHERE day=? AND start_time=? AND venue_id=? AND program_name=?`,
//         [currentRecord.day, currentRecord.start_time, currentRecord.venue_id, currentRecord.program_name]
//       );
//     }

//     // Update timetable normally
//     const sql = `
//       UPDATE extracted_timetables SET
//         day=?, start_time=?, end_time=?, subject_code=?, subject_name=?,
//         department_name=?, venue_name=?, tutor_name=?, venue_location=?,
//         program_name=?, subject_credit=?, program_level=?, year=?,
//         venue_type=?, venue_status=?, semester=?
//       WHERE id=?`;
//     const values = [
//       sanitize(timetable.day), sanitize(timetable.start_time), sanitize(timetable.end_time),
//       sanitize(timetable.subject_code), sanitize(timetable.subject_name),
//       sanitize(timetable.department_name), sanitize(timetable.venue_name),
//       sanitize(timetable.tutor_name), sanitize(timetable.venue_location),
//       sanitize(timetable.program_name), sanitize(timetable.subject_credit),
//       sanitize(timetable.program_level), sanitize(timetable.year),
//       sanitize(timetable.venue_type), sanitize(timetable.venue_status),
//       sanitize(timetable.semester), sanitize(id)
//     ];

//     await pool.execute(sql, values);

//     res.status(200).send(`
// <h4>Timetable Updated Successfully</h4>
// <p>${timetable.subject_name} (${timetable.subject_code})</p>
// <p>Day: ${timetable.day} | Time: ${timetable.start_time} - ${timetable.end_time}</p>
// <p>Venue: ${timetable.venue_name} | Tutor: ${timetable.tutor_name}</p>
//     `);
//   } catch (err) {
//     console.error('Error updating timetable:', err);
//     res.status(500).send('Internal Error while updating timetable: ' + err.message);
//   }
// };


// export const handleUpdatetimetable = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const timetable = req.body; 
//     const sanitize = v => (v === undefined || v === '' ? null : v);

//     const requiredFields = [
//       'day','start_time','end_time','subject_code','subject_name',
//       'department_name','venue_name','tutor_name','venue_location',
//       'program_name','subject_credit','program_level','year',
//       'venue_type','venue_status','semester'
//     ];

//     for (const field of requiredFields) {
//       if (!timetable[field] || timetable[field].toString().trim() === '') {
//         return res.status(400).send(`Missing required field: '${field}'`);
//       }
//     }

//     const [currentRows] = await pool.query(
//       `SELECT * FROM extracted_timetables WHERE id = ?`,
//       [id]
//     );
//     const currentRecord = currentRows[0];

//     const [existing] = await pool.query(`SELECT * FROM extracted_timetables WHERE id != ?`, [id]);

//     let collision = null;
//     for (const entry of existing) {
//       const overlap =
//         (timetable.start_time >= entry.start_time && timetable.start_time < entry.end_time) ||
//         (timetable.end_time > entry.start_time && timetable.end_time <= entry.end_time) ||
//         (timetable.start_time <= entry.start_time && timetable.end_time >= entry.end_time);

//       if (overlap && entry.day === timetable.day) {
//         if (entry.tutor_name === timetable.tutor_name) collision = { type: 'Tutor', a: entry };
//         else if (entry.program_name === timetable.program_name && entry.venue_name === timetable.venue_name)
//           collision = { type: 'Program', a: entry };
//         else if (entry.venue_name === timetable.venue_name) collision = { type: 'Venue', a: entry };
//       }
//       if (collision) break;
//     }

//     if (collision) {
//       // Collision HTML with forms calling the correct router actions
//       let msg = '';
//       if (collision.type === 'Tutor') {
//         msg = `
// <h4>Collision Detected</h4>
// <p>Tutor <strong>${collision.a.tutor_name}</strong> already has a class at this time.</p>
// <form method="POST" action="/timetables/exchange">
//   <input type="hidden" name="first_id" value="${id}" />
//   <input type="hidden" name="second_id" value="${collision.a.id}" />
//   <button type="submit" class="btn btn-warning">Exchange</button>
// </form>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//       } else if (collision.type === 'Program') {
//         msg = `
// <h4>Same Subject Found in Different Programs</h4>
// <form method="POST" action="/timetables/mix">
//   <input type="hidden" name="id_1" value="${id}" />
//   <input type="hidden" name="id_2" value="${collision.a.id}" />
//   <button type="submit" class="btn btn-primary">Mix Programs</button>
// </form>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary mt-2">Cancel</button>
// </form>`;
//       } else if (collision.type === 'Venue') {
//         msg = `
// <h4>Venue Collision</h4>
// <p>Venue <strong>${collision.a.venue_name}</strong> is already booked by <strong>${collision.a.program_name}</strong> (${collision.a.subject_name})</p>
// <form method="GET" action="/timetables/cancel">
//   <button type="submit" class="btn btn-secondary">Cancel</button>
// </form>`;
//       }
//       return res.status(409).send(msg);
//     }

 

//     // Freed slots if venue changed or slot is being moved
// if (currentRecord && (currentRecord.venue_name !== timetable.venue_name || currentRecord.start_time !== timetable.start_time)) {
//   // Insert into freed_slots
//   await pool.query(
//     `INSERT INTO freed_slots 
//       (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
//     [
//       currentRecord.venue_id || null,
//       currentRecord.venue_name || "Unknown",
//       currentRecord.day,
//       currentRecord.start_time,
//       currentRecord.end_time,
//       'System',
//       `Slot freed due to update (moved to ${timetable.venue_name} ${timetable.start_time})`
//     ]
//   );

//   // Delete the old slot from extracted_timetables to free the space
//   await pool.query(
//     `DELETE FROM extracted_timetables 
//      WHERE day=? AND start_time=? AND venue_id=? AND program_name=?`,
//     [currentRecord.day, currentRecord.start_time, currentRecord.venue_id, currentRecord.program_name]
//   );
// }

//     // Update timetable normally
//     const sql = `
//       UPDATE extracted_timetables SET
//         day=?, start_time=?, end_time=?, subject_code=?, subject_name=?,
//         department_name=?, venue_name=?, tutor_name=?, venue_location=?,
//         program_name=?, subject_credit=?, program_level=?, year=?,
//         venue_type=?, venue_status=?, semester=?
//       WHERE id=?`;
//     const values = [
//       sanitize(timetable.day), sanitize(timetable.start_time), sanitize(timetable.end_time),
//       sanitize(timetable.subject_code), sanitize(timetable.subject_name),
//       sanitize(timetable.department_name), sanitize(timetable.venue_name),
//       sanitize(timetable.tutor_name), sanitize(timetable.venue_location),
//       sanitize(timetable.program_name), sanitize(timetable.subject_credit),
//       sanitize(timetable.program_level), sanitize(timetable.year),
//       sanitize(timetable.venue_type), sanitize(timetable.venue_status),
//       sanitize(timetable.semester), sanitize(id)
//     ];

//     await pool.execute(sql, values);

//     res.status(200).send(`
// <h4>Timetable Updated Successfully</h4>
// <p>${timetable.subject_name} (${timetable.subject_code})</p>
// <p>Day: ${timetable.day} | Time: ${timetable.start_time} - ${timetable.end_time}</p>
// <p>Venue: ${timetable.venue_name} | Tutor: ${timetable.tutor_name}</p>
//     `);
//   } catch (err) {
//     console.error('Error updating timetable:', err);
//     res.status(500).send('Internal Error while updating timetable: ' + err.message);
//   }
// };



