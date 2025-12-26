import db from '../db.js';
import fs from "fs";

/**
 * Auto timetable assignment
 * - Assigns subjects double slots across the day until all hours are fulfilled
 * - Handles program type, tutor/venue/program collisions
 * - Respects Friday breaks
 * - Prevents full-time being assigned to late evening slots
 * - Logs all actions for debugging
 */
export async function addtimetable({ semester }) {
  const logPath = "models/timetable-logs.txt";
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

  log("=== STARTING AUTO TIMETABLE ===");

  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const dayToArrange = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5 };

  const SLOT_RANGES = {
    "full-time": ["07:30-08:15","08:15-09:00","09:05-09:50","09:50-10:35","11:00-11:45",
                  "11:45-12:30","13:15-14:00","14:00-14:45","14:50-15:35","15:35-16:20",
                  "16:25-17:10","17:10-17:55"],
    "evening": ["17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10","20:10-20:55",
                "20:55-21:40","21:40-22:25","22:25-23:10"],
    "VETA": ["14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"],
    "full-evening": ["16:25-17:10","17:10-17:55"]
  };

  // Program type vs slot validation
  const programSlotMatch = (programType, slotTime) => {
    if (!programType || !slotTime) return false;
    const types = programType.split("+").map(t => t.trim().toLowerCase());

    // Full-time: only assign to slots before 21:10
    if (types.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime)) return true;
    if (types.includes("evening") && SLOT_RANGES["evening"].includes(slotTime)) return true;
    if (types.includes("veta") && SLOT_RANGES["VETA"].includes(slotTime)) return true;
    if (types.includes("full-time") && types.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime)) return true;
    return false;
  };

  try {
    let subjectsPending = true;

    while (subjectsPending) {
      const [subjectsRes] = await db.query(`
        SELECT S.*, u.full_name
        FROM subjects S
        JOIN users u ON S.user_id = u.user_id
        WHERE (0.75 + COALESCE(S.ltpa,0)) <= S.total_hours_per_week
          AND S.semester = ?
        ORDER BY (S.total_hours_per_week - COALESCE(S.ltpa,0)) DESC, COALESCE(S.ltpa,0) ASC
      `, [semester]);

      if (!subjectsRes.length) {
        log("🎉 All subjects assigned successfully.");
        subjectsPending = false;
        break;
      }

      for (const S of subjectsRes) {
        const tutor_id = S.user_id;
        const subject_id = S.subject_id;
        const program_capacity = Number(S.program_capacity) || 0;
        const program_code = (S.program_code || "").trim();
        const mixParts = program_code ? program_code.split("+").map(p => p.trim()) : [];
        const slotsNeeded = 2;
        const program_type = S.program_type;
        let remainingHours = S.total_hours_per_week - (S.ltpa || 0);

        for (const day of DAYS) {
          if (remainingHours <= 0) break;
          const arrange = dayToArrange[day];
          const dayLower = day.toLowerCase();

          // Get venues
          let venues = [];
          if (S.type_prac_or_theory === "Lab") {
            [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`, [S.subject_department, program_capacity]);
            if (!venues.length) [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department]);
          } else {
            [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`, [program_capacity]);
            if (!venues.length) [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);
          }
          if (!venues.length) continue;

          for (const venue of venues) {
            const MAX_SLOTS = 18;

            for (let i = 1; i <= MAX_SLOTS - slotsNeeded + 1 && remainingHours > 0; i++) {
              if (day === "FRIDAY" && i >= 6 && i <= 8) continue;

              const slotCols = [];
              let canAssign = true;

              for (let j = 0; j < slotsNeeded; j++) {
                const colIndex = i + j;
                if (day === "FRIDAY" && (colIndex >= 6 && colIndex <= 8)) { canAssign = false; break; }

                const col = `${dayLower}_slot${colIndex}`;
                const statusCol = `${col}_status`;
                if (!(col in venue)) { canAssign = false; break; }

                const slotTime = venue[col];
                // Skip full-time late evening slots
                if (program_type.toLowerCase().includes("full-time") && ["21:10-21:55","21:55-22:40"].includes(slotTime)) {
                  canAssign = false; break;
                }

                slotCols.push({ col, statusCol, slotTime });
                if (!slotTime || (venue[statusCol] && venue[statusCol].toLowerCase() === "used") || !programSlotMatch(program_type, slotTime)) { canAssign = false; break; }
              }
              if (!canAssign) continue;

              // Collision check
              let collision = false;
              for (const s of slotCols) {
                const slotTime = s.slotTime;

                const [tutorRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND tutor_name=? LIMIT 1`, [day, slotTime, S.full_name]);
                if (tutorRes.length) { collision = true; break; }

                const [venueRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND venue_id=? LIMIT 1`, [day, slotTime, venue.venue_id]);
                if (venueRes.length) { collision = true; break; }

                if (mixParts.length) {
                  for (const part of mixParts) {
                    const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code LIKE ? LIMIT 1`, [day, slotTime, `%${part}%`]);
                    if (progRes.length) { collision = true; break; }
                  }
                  if (collision) break;
                } else {
                  const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code=? LIMIT 1`, [day, slotTime, program_code]);
                  if (progRes.length) { collision = true; break; }
                }
              }
              if (collision) continue;

              // Assign
              try {
                await db.query("START TRANSACTION");
                for (const s of slotCols) {
                  const [startTime, endTime] = s.slotTime.split("-");
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
                    day, s.slotTime, startTime.trim(), endTime?.trim() || null,
                    S.subject_code, S.title, S.subject_department,
                    venue.venue_id, venue.venue_name, S.full_name, venue.location,
                    S.program_name, S.subject_credit, S.program_level,
                    S.year, venue.type, "used",
                    S.semester, venue.capacity, S.program_capacity,
                    program_type, S.total_hours_per_week,
                    arrange, program_code, tutor_id, new Date()
                  ]);
                  await db.query(`UPDATE venues SET \`${s.statusCol}\`='used' WHERE venue_id=?`, [venue.venue_id]);
                }
                const ltpaIncrement = slotsNeeded * 0.75;
                await db.query(`UPDATE subjects SET ltpa=COALESCE(ltpa,0)+? WHERE subject_id=?`, [ltpaIncrement, subject_id]);
                await db.query("COMMIT");
                log(`✔ Assigned subject_id=${subject_id} → ${slotsNeeded} consecutive slots in venue ${venue.venue_id} (day ${day})`);
                remainingHours -= ltpaIncrement;
              } catch (txErr) {
                await db.query("ROLLBACK");
                log(`❌ ERROR assigning subject_id=${subject_id} in venue ${venue.venue_id} (day ${day}): ${txErr.message}`);
              }
            }
          }
        }

        if (remainingHours > 0) log(`⚠ Could not fully assign subject_id=${subject_id}. Remaining hours: ${remainingHours}`);
      }
    }
  } catch (err) {
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ❌ ERROR: ${err.message}\n`);
    throw err;
  }
}

// import fs from "fs";

// /**
//  * Improved addtimetable function
//  * - Uses program_capacity to pick venues (prefer capacity >= program_capacity)
//  * - Does NOT "count" mixed parts to decide capacity; uses program_capacity field
//  * - Robust collision checks (tutor / venue / program)
//  * - Transactional inserts for atomicity per assignment
//  * - Better logging
//  */
// export async function addtimetable({ semester }) {
//   try {
//     const logPath = "models/timetable-logs.txt";
//     if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
//     const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

//     log("=== STARTING AUTO TIMETABLE (DOUBLE SLOTS + MIXED PROGRAM + COLLISION-FREE + LOG SAFE) ===");

//     const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
//     const dayToArrange = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5 };

//     const SLOT_RANGES = {
//       "full-time": ["07:30-08:15","08:15-09:00","09:00-09:45","09:45-10:30","10:30-11:15",
//                     "11:15-12:00","12:00-12:45","12:45-13:30","13:30-14:15","14:15-15:00",
//                     "15:00-15:45","15:45-16:30","16:30-17:15","17:10-17:55"],
//       "evening": ["17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10","20:10-20:55",
//                   "20:55-21:40","21:40-22:25","22:25-23:10"],
//       "VETA": ["14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"],
//       "full-evening": ["16:25-17:10","17:10-17:55"]
//     };

//     const programSlotMatch = (programType, slotTime) => {
//       if (!programType || !slotTime) return false;
//       const types = programType.split("+").map(t => t.trim().toLowerCase());
//       if (types.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime)) return true;
//       if (types.includes("evening") && SLOT_RANGES["evening"].includes(slotTime)) return true;
//       if (types.includes("veta") && SLOT_RANGES["VETA"].includes(slotTime)) return true;
//       // if program_type contains both full-time+evening and the slot is in the full-evening small range
//       if (types.includes("full-time") && types.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime)) return true;
//       return false;
//     };

//     while (true) {
//       // pick the subject that still needs scheduling (most sequential_slots first, tie-breaker ltpa)
//       const [subjectsRes] = await db.query(`
//         SELECT S.*, u.full_name
//         FROM subjects S
//         JOIN users u ON S.user_id = u.user_id
//         WHERE (0.75 + S.ltpa) <= S.total_hours_per_week
//           AND S.semester=?
//         ORDER BY JSON_LENGTH(COALESCE(S.sequential_slots, '[]')) DESC, S.ltpa ASC
//         LIMIT 1
//       `, [semester]);

//       if (!subjectsRes.length) {
//         log("🎉 All subjects assigned successfully.");
//         return;
//       }

//       const S = subjectsRes[0];
//       const tutor_id = S.user_id;
//       const subject_id = S.subject_id;
//       const program_capacity = Number(S.program_capacity) || 0; // ensure number
//       const program_code = (S.program_code || "").trim();
//       const mixParts = program_code ? program_code.split("+").map(p => p.trim()) : [];

//       // parse sequential slots safely
//       let sequential_slots = [];
//       try {
//         sequential_slots = S.sequential_slots ? JSON.parse(S.sequential_slots).map(n => Number(n)).filter(n => !isNaN(n)) : [];
//       } catch (e) {
//         sequential_slots = [];
//       }

//       const slotsNeeded = sequential_slots.length ? Math.max(...sequential_slots) : 2;
//       const program_type = S.program_type;

//       let subjectAssigned = false;

//       for (const day of DAYS) {
//         const arrange = dayToArrange[day];
//         const dayLower = day.toLowerCase();

//         // Strategy for selecting venues:
//         // 1) Prefer venues with capacity >= program_capacity (order by capacity ASC to fit snugly)
//         // 2) If none found, fallback to all venues ordered by capacity DESC (bigger first)
//         // 3) If it's a Lab subject, restrict to Lab type and matching department
//         let venueQueryParams = [];
//         let venueQuery = "";
//         if (S.type_prac_or_theory === "Lab") {
//           // labs: try labs with enough capacity first
//           venueQuery = `SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`;
//           venueQueryParams = [S.subject_department, program_capacity];
//           var [venues] = await db.query(venueQuery, venueQueryParams);

//           if (!venues.length) {
//             // fallback: any lab ordered by largest first
//             [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department]);
//           }
//         } else {
//           // theory/non-lab: prefer venues with capacity >= needed
//           venueQuery = `SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`;
//           venueQueryParams = [program_capacity];
//           var [venues] = await db.query(venueQuery, venueQueryParams);

//           if (!venues.length) {
//             // fallback: all non-lab venues, biggest first
//             [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);
//           }
//         }

//         // if still no venues, log and break out (cannot place subject anywhere)
//         if (!venues || !venues.length) {
//           log(`⚠ No venues available for subject_id=${subject_id} (day ${day}). Skipping day.`);
//           continue;
//         }

//         // For each candidate venue try to find consecutive free slots
//         for (const venue of venues) {
//           // we assume venue columns day_slot1 ... day_slot18 exist
//           // if your DB uses different number of slots adjust MAX_SLOTS
//           const MAX_SLOTS = 18;
//           for (let i = 1; i <= MAX_SLOTS - slotsNeeded + 1; i++) {
//             const slotCols = [];
//             let canAssign = true;

//             for (let j = 0; j < slotsNeeded; j++) {
//               const col = `${dayLower}_slot${i + j}`;
//               const statusCol = `${col}_status`; // e.g. monday_slot3_status
//               const slotTime = venue[col]; // the stored time string like "07:30-08:15"
//               slotCols.push({ col, statusCol, slotTime });

//               // validate slot exists in the venue and it's not used and matches program time-range
//               if (!slotTime || (venue[statusCol] && (String(venue[statusCol]).toLowerCase() === "used")) || !programSlotMatch(program_type, slotTime)) {
//                 canAssign = false;
//                 break;
//               }
//             }
//             if (!canAssign) continue;

//             // --- Collision checks: check existing extracted_timetables for each slot ---
//             let collision = false;
//             for (const s of slotCols) {
//               const slotTime = s.slotTime;
//               // check tutor collision (same tutor in same day & slot)
//               const [tutorRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND tutor_name=? LIMIT 1`, [day, slotTime, S.full_name]);
//               if (tutorRes.length) { collision = true; break; }

//               // check venue collision (same venue assigned already)
//               const [venueRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND venue_id=? LIMIT 1`, [day, slotTime, venue.venue_id]);
//               if (venueRes.length) { collision = true; break; }

//               // check program collision: ANY program that shares any mix part should not collide
//               if (mixParts.length) {
//                 // use LIKE for each part to catch "A+B" or "A" appearances
//                 for (const part of mixParts) {
//                   const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code LIKE ? LIMIT 1`, [day, slotTime, `%${part}%`]);
//                   if (progRes.length) { collision = true; break; }
//                 }
//                 if (collision) break;
//               } else {
//                 // if program is single (no mix), check exact program_code collision
//                 const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code = ? LIMIT 1`, [day, slotTime, program_code]);
//                 if (progRes.length) { collision = true; break; }
//               }
//             }
//             if (collision) continue;

//             // --- Perform assignment atomically for all slots (transaction) ---
//             try {
//               await db.query("START TRANSACTION");

//               for (const s of slotCols) {
//                 const [startTime, endTime] = s.slotTime.split("-");
//                 await db.query(`
//                   INSERT INTO extracted_timetables (
//                     day, slot, start_time, end_time,
//                     subject_code, subject_name, department_name,
//                     venue_id, venue_name, tutor_name, venue_location,
//                     program_name, subject_credit, program_level,
//                     year, venue_type, venue_status,
//                     semester, venue_capacity, program_capacity,
//                     program_type, total_hours_per_week,
//                     arrange, program_code, created_by, created_at
//                   ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//                 `, [
//                   day, s.slotTime, startTime.trim(), endTime ? endTime.trim() : null,
//                   S.subject_code, S.title, S.subject_department,
//                   venue.venue_id, venue.venue_name, S.full_name, venue.location,
//                   S.program_name, S.subject_credit, S.program_level,
//                   S.year, venue.type, "used",
//                   S.semester, venue.capacity, S.program_capacity,
//                   program_type, S.total_hours_per_week,
//                   arrange, program_code, tutor_id, new Date()
//                 ]);

//                 // update venue status column for that slot (mark used)
//                 // Note: column names cannot be parameterized, so we build query string carefully.
//                 const updateStatusSql = `UPDATE venues SET \`${s.statusCol}\` = 'used' WHERE venue_id = ?`;
//                 await db.query(updateStatusSql, [venue.venue_id]);
//               }

//               // update subject ltpa (accumulate)
//               const ltpaIncrement = (slotsNeeded * 0.75);
//               await db.query(`UPDATE subjects SET ltpa = COALESCE(ltpa,0) + ? WHERE subject_id = ?`, [ltpaIncrement, subject_id]);

//               await db.query("COMMIT");
//               log(`✔ Assigned subject_id=${subject_id} → ${slotsNeeded} consecutive slots in venue ${venue.venue_id} (day ${day})`);
//               subjectAssigned = true;
//               break; // break out of slot index loop
//             } catch (txErr) {
//               await db.query("ROLLBACK");
//               log(`❌ TRANSACTION ERROR assigning subject_id=${subject_id} to venue ${venue.venue_id} (day ${day}): ${txErr.message}`);
//               // continue trying other slots/venues
//               continue;
//             }
//           } // end slot index loop

//           if (subjectAssigned) break;
//         } // end venues loop

//         if (subjectAssigned) break;
//       } // end days loop

//       if (!subjectAssigned) {
//         log(`⚠ Could not assign subject_id=${subject_id}. Deferred due to collision or no suitable venue.`);
//         // mark subject as deferred or increment a retry counter if desired
//         // e.g. await db.query(`UPDATE subjects SET scheduling_attempts = COALESCE(scheduling_attempts,0)+1 WHERE subject_id = ?`, [subject_id]);
//         // to avoid infinite loops ensure eventual termination condition (not implemented here)
//         // For safety, let's break out of outer while after logging to avoid infinite loop
//         // (You may instead choose to continue and rely on external termination.)
//         break;
//       }
//     } // end while

//   } catch (err) {
//     fs.appendFileSync("models/timetable-logs.txt", `${new Date().toISOString()} - ❌ ERROR: ${err.message}\n`);
//     throw err;
//   }
// }


// import fs from "fs";

// export async function addtimetable({ semester }) {
//   try {
//     const logPath = "models/timetable-logs.txt";
//     if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
//     const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

//     log("=== STARTING AUTO TIMETABLE (DOUBLE SLOTS + MIXED PROGRAM + COLLISION-FREE + LOG SAFE) ===");

//     const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
//     const dayToArrange = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5 };

//     const SLOT_RANGES = {
//       "full-time": ["07:30-08:15","08:15-09:00","09:00-09:45","09:45-10:30","10:30-11:15",
//                     "11:15-12:00","12:00-12:45","12:45-13:30","13:30-14:15","14:15-15:00",
//                     "15:00-15:45","15:45-16:30","16:30-17:15","17:10-17:55"],
//       "evening": ["17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10","20:10-20:55",
//                   "20:55-21:40","21:40-22:25","22:25-23:10"],
//       "VETA": ["14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"],
//       "full-evening": ["16:25-17:10","17:10-17:55"]
//     };

//     const programSlotMatch = (programType, slotTime) => {
//       const types = programType.split("+").map(t => t.trim().toLowerCase());
//       if (types.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime)) return true;
//       if (types.includes("evening") && SLOT_RANGES["evening"].includes(slotTime)) return true;
//       if (types.includes("veta") && SLOT_RANGES["VETA"].includes(slotTime)) return true;
//       if (types.includes("full-time") && types.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime)) return true;
//       return false;
//     };

//     while (true) {
//       const [subjectsRes] = await db.query(`
//         SELECT S.*, u.full_name
//         FROM subjects S
//         JOIN users u ON S.user_id = u.user_id
//         WHERE (0.75 + S.ltpa) <= S.total_hours_per_week
//           AND S.semester=?
//         ORDER BY JSON_LENGTH(S.sequential_slots) DESC, S.ltpa ASC
//         LIMIT 1
//       `, [semester]);

//       if (!subjectsRes.length) {
//         log("🎉 All subjects assigned successfully.");
//         return;
//       }

//       const S = subjectsRes[0];
//       const tutor_id = S.user_id;
//       const subject_id = S.subject_id;
//       const program_capacity= S.program_capacity;
//       const program_code = S.program_code;
//       const mixParts = program_code.split("+").map(p => p.trim());

//       let sequential_slots = [];
//       try {
//         sequential_slots = S.sequential_slots ? JSON.parse(S.sequential_slots).map(n => Number(n)).filter(n => !isNaN(n)) : [];
//       } catch { sequential_slots = []; }

//       const slotsNeeded = sequential_slots.length ? Math.max(...sequential_slots) : 2;
//       const program_type = S.program_type;

//       let subjectAssigned = false;

//       for (const day of DAYS) {
//         const arrange = dayToArrange[day];
//         const dayLower = day.toLowerCase();

//         const [venues] = S.type_prac_or_theory === "Lab"
//           ? await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department])
//           : await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);

//         for (const venue of venues) {
//           for (let i = 1; i <= 18 - slotsNeeded; i++) {
//             const slotCols = [];
//             let canAssign = true;

//             for (let j = 0; j < slotsNeeded; j++) {
//               const col = `${dayLower}_slot${i+j}`;
//               const statusCol = `${col}_status`;
//               const slotTime = venue[col];
//               slotCols.push({ col, statusCol, slotTime });

//               if (!slotTime || venue[statusCol]==="used" || !programSlotMatch(program_type, slotTime)) {
//                 canAssign = false;
//                 break;
//               }
//             }
//             if (!canAssign) continue;

//             // --- Check collisions robustly ---
//             let collision = false;
//             for (const s of slotCols) {
//               const [tutorRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND tutor_name=?`, [day, s.slotTime, S.full_name]);
//               const [venueRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND venue_id=?`, [day, s.slotTime, venue.venue_id]);

//               let programCollision = false;
//               for (const part of mixParts) {
//                 const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code LIKE ?`, [day, s.slotTime, `%${part}%`]);
//                 if (progRes.length) { programCollision = true; break; }
//               }

//               if (tutorRes.length || venueRes.length || programCollision) {
//                 collision = true;
//                 break;
//               }
//             }
//             if (collision) continue;

//             // --- Assign slots safely ---
//             for (const s of slotCols) {
//               const [startTime, endTime] = s.slotTime.split("-");
//               await db.query(`
//                 INSERT INTO extracted_timetables (
//                   day, slot, start_time, end_time,
//                   subject_code, subject_name, department_name,
//                   venue_id, venue_name, tutor_name, venue_location,
//                   program_name, subject_credit, program_level,
//                   year, venue_type, venue_status,
//                   semester, venue_capacity, program_capacity,
//                   program_type, total_hours_per_week,
//                   arrange, program_code, created_by, created_at
//                 ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//               `, [
//                 day, s.slotTime, startTime, endTime,
//                 S.subject_code, S.title, S.subject_department,
//                 venue.venue_id, venue.venue_name, S.full_name, venue.location,
//                 S.program_name, S.subject_credit, S.program_level,
//                 S.year, venue.type, "used",
//                 S.semester, venue.capacity, S.program_capacity,
//                 program_type, S.total_hours_per_week,
//                 arrange, program_code, tutor_id, new Date()
//               ]);

//               await db.query(`UPDATE venues SET ${s.statusCol}='used' WHERE venue_id=?`, [venue.venue_id]);
//             }

//             await db.query(`UPDATE subjects SET ltpa = ltpa + ? WHERE subject_id=?`, [(slotsNeeded*0.75), subject_id]);
//             log(`✔ Assigned subject_id=${subject_id} → ${slotsNeeded} consecutive slots in venue ${venue.venue_id}`);
//             subjectAssigned = true;
//             break;
//           }
//           if (subjectAssigned) break;
//         }
//         if (subjectAssigned) break;
//       }

//       if (!subjectAssigned) {
//         log(`⚠ Could not assign subject_id=${subject_id}. Deferred due to collision.`);
//       }
//     }

//   } catch (err) {
//     fs.appendFileSync("models/timetable-logs.txt", `${new Date().toISOString()} - ❌ ERROR: ${err.message}\n`);
//     throw err;
//   }
// }



// =======================================================================
//  FULL FUNCTION: addtimetable() 
//  CLEAN, UPDATED, NO START/END TIME, USE SLOT ONLY
//  Includes: venue collision, tutor collision, program collision,
//            mixed-program collision, extraction, ltpa update
// =======================================================================



// import fs from "fs";

// export async function addtimetable({ semester }) {
//   try {
//     const logPath = "models/timetable-logs.txt";
//     if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
//     const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

//     log("=== STARTING AUTO TIMETABLE (FULL UPDATED: DOUBLE SLOTS + MIXED PROGRAM + START/END TIME) ===");

//     const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
//     const dayToArrange = { MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5 };

//     const SLOT_RANGES = {
//       "full-time": [
//         "07:30-08:15","08:15-09:00","09:00-09:45","09:45-10:30","10:30-11:15",
//         "11:15-12:00","12:00-12:45","12:45-13:30","13:30-14:15","14:15-15:00",
//         "15:00-15:45","15:45-16:30","16:30-17:15","17:10-17:55"
//       ],
//       "evening": [
//         "17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10",
//         "20:10-20:55","20:55-21:40","21:40-22:25","22:25-23:10"
//       ],
//       "VETA": [
//         "14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"
//       ],
//       "full-evening": [
//         "16:25-17:10","17:10-17:55"
//       ]
//     };

//     const programSlotMatch = (programType, slotTime) => {
//       const types = programType.split("+").map(t => t.trim().toLowerCase());
//       if (types.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime)) return true;
//       if (types.includes("evening") && SLOT_RANGES["evening"].includes(slotTime)) return true;
//       if (types.includes("veta") && SLOT_RANGES["VETA"].includes(slotTime)) return true;
//       if (types.includes("full-time") && types.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime)) return true;
//       return false;
//     };

//     while (true) {
//       const [subjectsRes] = await db.query(`
//         SELECT S.*, u.full_name
//         FROM subjects S
//         JOIN users u ON S.user_id = u.user_id
//         WHERE (0.75 + S.ltpa) <= S.total_hours_per_week
//           AND S.semester=?
//         ORDER BY JSON_LENGTH(S.sequential_slots) DESC, S.ltpa ASC
//         LIMIT 1
//       `, [semester]);

//       if (!subjectsRes.length) {
//         log("🎉 All subjects assigned successfully.");
//         return;
//       }

//       const S = subjectsRes[0];
//       const tutor_id = S.user_id;
//       const subject_id = S.subject_id;

//       let sequential_slots = [];
//       try {
//         if (S.sequential_slots) {
//           const parsed = JSON.parse(S.sequential_slots);
//           sequential_slots = Array.isArray(parsed) ? parsed.map(n=>Number(n)).filter(n=>!isNaN(n)) : [];
//         }
//       } catch { sequential_slots = []; }

//       const slotsNeeded = sequential_slots.length ? Math.max(...sequential_slots) : 2;

//       const program_type = S.program_type;
//       const program_code = S.program_code;
//       const mixParts = program_code.split("+").map(p => p.trim());

//       let subjectAssigned = false;

//       for (const day of DAYS) {
//         const arrange = dayToArrange[day];
//         const dayLower = day.toLowerCase();

//         const [venues] = S.type_prac_or_theory === "Lab"
//           ? await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department])
//           : await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);

//         for (const venue of venues) {
//           for (let i = 1; i <= 18 - slotsNeeded; i++) {
//             let slotCols = [];
//             let canAssign = true;

//             for (let j = 0; j < slotsNeeded; j++) {
//               const col = `${dayLower}_slot${i+j}`;
//               const statusCol = `${col}_status`;
//               const slotTime = venue[col];

//               slotCols.push({ col, statusCol, slotTime });

//               if (!slotTime || venue[statusCol] === "used" || !programSlotMatch(program_type, slotTime)) {
//                 canAssign = false;
//                 break;
//               }
//             }

//             if (!canAssign) continue;

//             // Collision check
//             let collision = false;
//             for (const s of slotCols) {
//               const [colRes] = await db.query(`
//                 SELECT 1 FROM extracted_timetables
//                 WHERE day=? AND slot=? AND (venue_id=? OR tutor_name=?)
//               `, [day, s.slotTime, venue.venue_id, S.full_name]);
//               if (colRes.length) { collision = true; break; }
//             }
//             if (collision) continue;

//             // Mixed program collision
//             let mixedCollision = false;
//             for (const part of mixParts) {
//               for (const s of slotCols) {
//                 const [mixRes] = await db.query(`
//                   SELECT 1 FROM extracted_timetables
//                   WHERE day=? AND slot=? AND program_code LIKE ?
//                 `, [day, s.slotTime, `%${part}%`]);
//                 if (mixRes.length) { mixedCollision = true; break; }
//               }
//             }
//             if (mixedCollision) continue;

//             // Assign slots
//             for (const s of slotCols) {
//               const [startTime, endTime] = s.slotTime.split("-");

//               await db.query(`
//                 INSERT INTO extracted_timetables (
//                   day, slot, start_time, end_time,
//                   subject_code, subject_name, department_name,
//                   venue_id, venue_name, tutor_name, venue_location,
//                   program_name, subject_credit, program_level,
//                   year, venue_type, venue_status,
//                   semester, venue_capacity, program_capacity,
//                   program_type, total_hours_per_week,
//                   arrange, program_code, created_by, created_at
//                 ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//               `, [
//                 day, s.slotTime, startTime, endTime,
//                 S.subject_code, S.title, S.subject_department,
//                 venue.venue_id, venue.venue_name, S.full_name, venue.location,
//                 S.program_name, S.subject_credit, S.program_level,
//                 S.year, venue.type, "used",
//                 S.semester, venue.capacity, S.program_capacity,
//                 program_type, S.total_hours_per_week,
//                 arrange, program_code, tutor_id, new Date()
//               ]);

//               await db.query(`UPDATE venues SET ${s.statusCol}='used' WHERE venue_id=?`, [venue.venue_id]);
//             }

//             await db.query(`UPDATE subjects SET ltpa = ltpa + ? WHERE subject_id=?`, [(slotsNeeded*0.75), subject_id]);

//             log(`✔ Assigned subject_id=${subject_id} → ${slotsNeeded} consecutive slots in venue ${venue.venue_id}`);
//             subjectAssigned = true;
//             break;
//           }
//           if (subjectAssigned) break;
//         }
//         if (subjectAssigned) break;
//       }

//       if (!subjectAssigned) {
//         log(`⚠ Could not assign subject_id=${subject_id}. Deferred.`);
//       }
//     }

//   } catch (err) {
//     fs.appendFileSync("models/timetable-logs.txt", `${new Date().toISOString()} - ❌ ERROR: ${err.message}\n`);
//     throw err;
//   }
// }

// ==============================
// addtimetable.js
// // ==============================

// import fs from "fs";


// export async function addtimetable({ semester }) {
//   try {
//     // ===== LOG FILE SETUP =====
//     const logPath = "models/timetable-logs.txt";
//     if (fs.existsSync(logPath)) fs.unlinkSync(logPath); // clear previous logs
//     const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

//     log("=== STARTING AUTO TIMETABLE GENERATION (Consecutive slots based on sequential_slots) ===");

//     const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
//     const dayToArrange = {
//       "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3, "THURSDAY": 4, "FRIDAY": 5
//     };

//     const SLOT_RANGES = {
//       "full-time": ["07:30-08:15","08:15-09:00","09:00-09:45","09:45-10:30","10:30-11:15","11:15-12:00","12:00-12:45","12:45-13:30","13:30-14:15","14:15-15:00","15:00-15:45","15:45-16:30","16:30-17:15","17:10-17:55"],
//       "evening": ["17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10","20:10-20:55","20:55-21:40","21:40-22:25","22:25-23:10"],
//       "VETA": ["14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"],
//       "full-evening": ["16:25-17:10","17:10-17:55"]
//     };

//     const programSlotMatch = (programType, slotTime) => {
//       if ((programType.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime))) return true;
//       if ((programType.includes("evening") && SLOT_RANGES["evening"].includes(slotTime))) return true;
//       if ((programType.includes("VETA") && SLOT_RANGES["VETA"].includes(slotTime))) return true;
//       if ((programType.includes("full-time") && programType.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime))) return true;
//       return false;
//     };

//     // ===== MAIN LOOP =====
//     while (true) {
//          const [subjectsRes] = await db.query(`
//   SELECT subjects.*, u.full_name
//   FROM subjects 
//   JOIN users u ON subjects.user_id = u.user_id
//   WHERE (0.75 + ltpa) <= total_hours_per_week
//     AND semester=?
//   ORDER BY JSON_LENGTH(sequential_slots) DESC, ltpa ASC
//   LIMIT 1
// `, [semester]);


//       if (!subjectsRes.length) {
//         log("🎉 All subjects assigned!");
//         return;
//       }

//       const S = subjectsRes[0];
//       const subject_id = S.subject_id;
//       const tutor_id = S.user_id;
//       const tutor_name=S.full_name;
//       const program_id = S.program_id;
//       const subject_type = S.type_prac_or_theory;
//       const department = S.subject_department;

//       // ===== SAFE PARSE sequential_slots =====
//       let sequential_slots = [];
//       try {
//         if (S.sequential_slots) {
//           const parsed = JSON.parse(S.sequential_slots);
//           if (Array.isArray(parsed)) sequential_slots = parsed.map(Number).filter(n => !isNaN(n));
//         }
//       } catch(e) {
//         sequential_slots = [];
//       }

//       const slotsNeeded = sequential_slots.length ? Math.max(...sequential_slots) : 2; // default double slot

//       // Load program info
//       const [progRes] = await db.query(`SELECT * FROM subjects WHERE program_id=? LIMIT 1`, [program_id]);
//       if (!progRes.length) continue;
//       const PROG = progRes[0];
//       const program_code = PROG.program_code;
//       const program_type = PROG.program_type;
//       const program_capacity = PROG.program_capacity;
//       const mixParts = program_code.includes("+") ? program_code.split("+").map(p=>p.trim()) : [program_code];

//       let subjectAssigned = false;

//       for (const day of DAYS) {
//         const arrange = dayToArrange[day] || 0;

//         // Load venues (Lab or Theory) ordered by capacity desc
//         const [venues] = subject_type === "Lab"
//           ? await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [department])
//           : await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);

//         if (!venues.length) continue;

//         for (const venue of venues) {
//           const dayLower = day.toLowerCase();

//           for (let i = 1; i <= 18 - slotsNeeded; i++) {
//             const slotCols = [];
//             let canAssign = true;

//             for (let j = 0; j < slotsNeeded; j++) {
//               const col = `${dayLower}_slot${i+j}`;
//               const statusCol = `${dayLower}_slot${i+j}_status`;
//               slotCols.push({ slot: venue[col], statusCol, status: venue[statusCol] });

//               if (!venue[col] || venue[statusCol] === "used" || !programSlotMatch(program_type, venue[col])) {
//                 canAssign = false;
//                 break;
//               }
//             }

//             if (!canAssign) continue;

//             // Collision check
//             let collision = false;
//             for (const s of slotCols) {
//               const [colRes] = await db.query(`
//                 SELECT 1 FROM extracted_timetables
//                 WHERE day=? AND slot=? AND (venue_id=? OR tutor_name=?)
//               `, [day, s.slot, venue.venue_id, tutor_id]);
//               if (colRes.length) { collision = true; break; }
//             }
//             if (collision) continue;

//             // Mixed program check
//             let mixedConflict = false;
//             for (const part of mixParts) {
//               for (const s of slotCols) {
//                 const [mixRes] = await db.query(`
//                   SELECT 1 FROM extracted_timetables
//                   WHERE day=? AND slot=? AND program_code LIKE ?
//                 `, [day, s.slot, `%${part}%`]);
//                 if (mixRes.length) { mixedConflict = true; break; }
//               }
//               if (mixedConflict) break;
//             }
//             if (mixedConflict) continue;

//             // Assign slots
//             for (const s of slotCols) {
//               await db.query(`
//                 INSERT INTO extracted_timetables (
//                   day, slot, subject_code, subject_name, department_name,
//                   venue_id, venue_name, tutor_name, venue_location,
//                   program_name, subject_credit, program_level,
//                   year, venue_type, venue_status, semester,
//                   venue_capacity, program_capacity, program_type,
//                   total_hours_per_week, arrange, program_code,
//                   created_by, created_at
//                 ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//               `, [
//                 day, s.slot, S.subject_code, S.title, department,
//                 venue.venue_id, venue.venue_name, tutor_name, venue.location,
//                 PROG.program_name, S.subject_credit, PROG.program_level,
//                 PROG.year, venue.type, "used", semester,
//                 venue.capacity, program_capacity, program_type,
//                 S.total_hours_per_week, arrange, program_code,
//                 tutor_id, new Date()
//               ]);

//               await db.query(`UPDATE venues SET ${s.statusCol}='used' WHERE venue_id=?`, [venue.venue_id]);
//             }

//             const assignedHours = slotsNeeded * 0.75;
//             await db.query(`UPDATE subjects SET ltpa = ltpa + ? WHERE subject_id=?`, [assignedHours, subject_id]);

//             log(`✔ Assigned subject_id=${subject_id} to ${slotsNeeded} consecutive slots starting slot${i} in venue ${venue.venue_id}`);
//             subjectAssigned = true;
//             break;
//           }
//           if (subjectAssigned) break;
//         }
//         if (subjectAssigned) break;
//       }

//       if (!subjectAssigned) {
//         log(`⚠ Could not place subject_id=${subject_id} (semester=${semester}) - deferred for next round`);
//       }
//     }

//   } catch (err) {
//     fs.appendFileSync("models/timetable-logs.txt", `${new Date().toISOString()} - ❌ Error generating timetable: ${err.message}\n`);
//     throw err;
//   }
// }


// export async function addtimetable({ semester }) {
//   try {
//     console.log("=== STARTING AUTO TIMETABLE GENERATION (Double slots 90min) ===");

//     const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];
//     const MAX_DURATION = 24 * 60 * 60 * 1000; // 24 hours safety cap
//     const startTime = Date.now();

//     const dayToArrange = {
//       "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3, "THURSDAY": 4,
//       "FRIDAY": 5, "SATURDAY": 6, "SUNDAY": 7
//     };

//     // Define slot ranges
//     const SLOT_RANGES = {
//       "full-time": ["07:30-08:15","08:15-09:00","09:00-09:45","09:45-10:30","10:30-11:15","11:15-12:00","12:00-12:45","12:45-13:30","13:30-14:15","14:15-15:00","15:00-15:45","15:45-16:30","16:30-17:15","17:10-17:55"],
//       "evening": ["17:10-17:55","17:55-18:40","18:40-19:25","19:25-20:10","20:10-20:55","20:55-21:40","21:40-22:25","22:25-23:10"],
//       "VETA": ["14:00-14:45","14:45-15:30","15:30-16:15","16:15-17:00","17:00-17:55"],
//       "full-evening": ["16:25-17:10","17:10-17:55"]
//     };

//     const programSlotMatch = (programType, slotTime) => {
//       if ((programType.includes("full-time") && SLOT_RANGES["full-time"].includes(slotTime))) return true;
//       if ((programType.includes("evening") && SLOT_RANGES["evening"].includes(slotTime))) return true;
//       if ((programType.includes("VETA") && SLOT_RANGES["VETA"].includes(slotTime))) return true;
//       if ((programType.includes("full-time") && programType.includes("evening") && SLOT_RANGES["full-evening"].includes(slotTime))) return true;
//       return false;
//     };

//     while (true) {
//       if (Date.now() - startTime > MAX_DURATION) throw new Error("⛔ Runtime exceeded 24h");

//       // 1️⃣ Pick a subject to assign
//       const [subjectList] = await db.query(`
//         SELECT * FROM subjects
//         WHERE semester=? AND ((0.75 + ltpa) <= total_hours_per_week)
//         ORDER BY ltpa ASC LIMIT 1
//       `, [semester]);

//       if (!subjectList.length) {
//         console.log("🎉 All subjects assigned!");
//         return;
//       }

//       const S = subjectList[0];
//       const subject_id = S.subject_id;
//       const tutor_id = S.user_id || S.tutor_id;
//       const program_id = S.program_id;
//       const subject_type = S.type_prac_or_theory; // Lab/Theory
//       const department = S.subject_department;

//       // 2️⃣ Load program data
//       const [progRes] = await db.query(`SELECT * FROM subjects WHERE program_id=? LIMIT 1`, [program_id]);
//       if (!progRes.length) continue;
//       const PROG = progRes[0];
//       const program_code = PROG.program_code;
//       const program_capacity = PROG.program_capacity;
//       const program_type = PROG.program_type;
//       const mixParts = program_code.includes("+") ? program_code.split("+").map(p=>p.trim()) : [program_code];

//       let subjectAssigned = false;

//       // 3️⃣ Loop over days
//       for (const day of DAYS) {
//         const arrange = dayToArrange[day] || 0;

//         // Load venues
//         const [venues] = subject_type === "Lab"
//           ? await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY venue_id ASC`, [department])
//           : await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY venue_id ASC`);

//         if (!venues.length) continue;

//         for (const venue of venues) {
//           // Loop slots dynamically: check for double consecutive slots
//           for (let i = 1; i <= 17; i++) { // 18th slot has no next slot
//             const slot1_col = `${day.toLowerCase()}_slot${i}`;
//             const slot2_col = `${day.toLowerCase()}_slot${i+1}`;
//             const status1_col = `${day.toLowerCase()}_slot${i}_status`;
//             const status2_col = `${day.toLowerCase()}_slot${i+1}_status`;

//             const slot1 = venue[slot1_col];
//             const slot2 = venue[slot2_col];
//             const status1 = venue[status1_col];
//             const status2 = venue[status2_col];

//             if (!slot1 || !slot2) continue;
//             if (status1 === "used" || status2 === "used") continue;
//             if (!programSlotMatch(program_type, slot1)) continue;

//             // ✅ Collision check for double slot
//             const [collision] = await db.query(`
//               SELECT 1 FROM extracted_timetables
//               WHERE day=? AND slot IN (?,?) AND (venue_id=? OR tutor_name=?)
//             `, [day, slot1, slot2, venue.venue_id, tutor_id]);
//             if (collision.length) continue;

//             // ✅ Mixed program check
//             let mixedConflict = false;
//             for (const part of mixParts) {
//               const [mixRes] = await db.query(`
//                 SELECT 1 FROM extracted_timetables
//                 WHERE day=? AND slot IN (?,?) AND program_code LIKE ?
//               `, [day, slot1, slot2, `%${part}%`]);
//               if (mixRes.length) { mixedConflict = true; break; }
//             }
//             if (mixedConflict) continue;

//             // ✅ Assign double slots
//             for (const [slot, statusCol] of [[slot1,status1_col],[slot2,status2_col]]) {
//               await db.query(`
//                 INSERT INTO extracted_timetables (
//                   day, slot, subject_code, subject_name, department_name,
//                   venue_id, venue_name, tutor_name, venue_location,
//                   program_name, subject_credit, program_level,
//                   year, venue_type, venue_status, semester,
//                   venue_capacity, program_capacity, program_type,
//                   total_hours_per_week, arrange, program_code,
//                   created_by, created_at
//                 ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
//               `, [
//                 day, slot, S.subject_code, S.subject_name, department,
//                 venue.venue_id, venue.venue_name, tutor_id, venue.location,
//                 PROG.program_name, S.subject_credit, PROG.program_level,
//                 PROG.year, venue.type, status1, semester,
//                 venue.capacity, program_capacity, program_type,
//                 S.total_hours_per_week, arrange, program_code,
//                 tutor_id, new Date()
//               ]);

//               // Mark slot as used
//               await db.query(`UPDATE venues SET ${statusCol}='used' WHERE venue_id=?`, [venue.venue_id]);
//             }

//             // ✅ Update ltpa for 90min
//             await db.query(`UPDATE subjects SET ltpa = ltpa + 1.5 WHERE subject_id=?`, [subject_id]);

//             console.log(`✔ Assigned subject_id=${subject_id} to slots ${slot1},${slot2} in venue ${venue.venue_id}`);
//             subjectAssigned = true;
//             break; // move to next subject after double assign
//           }
//           if (subjectAssigned) break;
//         }
//         if (subjectAssigned) break;
//       }

//       // ⚠ Deferred if not assigned
//       if (!subjectAssigned) {
//         console.warn(`⚠ Could not place subject_id=${subject_id} (semester=${semester}). Deferred for next round.`);
//       }

//     } // while

//   } catch (err) {
//     console.error("❌ Error generating timetable:", err);
//     throw err;
//   }
// }



// export async function addtimetable({ semester }) {
//   try {
//     console.log("=== STARTING AUTO TIMETABLE GENERATION (slots = time ranges) ===");

//     const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
//     const MAX_DURATION = 24 * 60 * 60 * 1000; // 24 hours safety cap
//     const startTime = Date.now();

//     while (true) {
//       if (Date.now() - startTime > MAX_DURATION) {
//         throw new Error("⛔ Runtime exceeded 24 hours. Restart process.");
//       }

//       // 1. Pick a subject
//       const [subjectList] = await db.query(`
//         SELECT *
//         FROM subjects
//         WHERE semester = ? AND ((0.75 + ltpa) <= total_hours_per_week)
//         ORDER BY ltpa ASC
//         LIMIT 1
//       `, [semester]);

//       if (!subjectList.length) {
//         console.log("🎉 All subjects assigned!");
//         return;
//       }

//       const S = subjectList[0];
//       const subject_id = S.subject_id;
//       const tutor_id = S.user_id || S.tutor_id;
//       const program_id = S.program_id;

//       // 2. Load program data
//       const [progRes] = await db.query(`SELECT * FROM subjects WHERE program_id = ? LIMIT 1`, [program_id]);
//       if (!progRes.length) continue;

//       const PROG = progRes[0];
//       const program_code = PROG.program_code;
//       const program_capacity = PROG.program_capacity;
//       const program_type = PROG.program_type;
//       const mixParts = program_code.includes("+") ? program_code.split("+").map(p => p.trim()) : [program_code];

//       let subjectAssigned = false;

//       // 3. Loop over days
//       for (const day of DAYS) {
//         if (subjectAssigned) break;

//         // Load all venues
//         const [venues] = await db.query(`SELECT * FROM venues ORDER BY venue_id ASC`);
//         if (!venues.length) throw new Error("No venues in DB");

//         for (const venue of venues) {
//           if (subjectAssigned) break;

//           // Loop slots in this venue dynamically
//           for (let i = 1; i <= 18; i++) {
//             const slot_col = `${day.toLowerCase()}_slot${i}`;
//             const slot_status_col = `${day.toLowerCase()}_slot${i}_status`;
//             const slotTime = venue[slot_col];
//             const slotStatus = venue[slot_status_col];

//             if (!slotTime || slotStatus === "used") continue; // skip used slot

//             // COLLISION: venue
//             const [venueOcc] = await db.query(`
//               SELECT 1 FROM extracted_timetables
//               WHERE day=? AND slot=? AND venue_id=? LIMIT 1
//             `, [day, slotTime, venue.venue_id]);
//             if (venueOcc.length > 0) continue;

//             // COLLISION: tutor
//             if (tutor_id) {
//               const [tutorOcc] = await db.query(`
//                 SELECT 1 FROM extracted_timetables
//                 WHERE day=? AND slot=? AND tutor_name=? LIMIT 1
//               `, [day, slotTime, tutor_id]);
//               if (tutorOcc.length > 0) continue;
//             }

//             // COLLISION: program exact
//             const [progOcc] = await db.query(`
//               SELECT 1 FROM extracted_timetables
//               WHERE day=? AND slot=? AND program_code=? LIMIT 1
//             `, [day, slotTime, program_code]);
//             if (progOcc.length > 0) continue;

//             // COLLISION: mixed program
//             let mixedConflict = false;
//             for (const part of mixParts) {
//               const [mixRes] = await db.query(`
//                 SELECT 1 FROM extracted_timetables
//                 WHERE day=? AND slot=? AND program_code LIKE ? LIMIT 1
//               `, [day, slotTime, `%${part}%`]);
//               if (mixRes.length > 0) {
//                 mixedConflict = true;
//                 break;
//               }
//             }
//             if (mixedConflict) continue;

//             // PASS: assign slot
//             await db.query(`
//               INSERT INTO extracted_timetables (
//                 day, slot, subject_code, subject_name, department_name,
//                 venue_id, venue_name, tutor_name, venue_location,
//                 program_name, subject_credit, program_level,
//                 year, venue_type, venue_status, semester,
//                 venue_capacity, program_capacity, program_type,
//                 total_hours_per_week, arrange, program_code,
//                 created_by, created_at
//               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `, [
//               day,
//               slotTime, // time range
//               S.subject_code,
//               S.subject_name,
//               S.department_name,
//               venue.venue_id,
//               venue.venue_name,
//               tutor_id,
//               venue.location,
//               PROG.program_name,
//               S.subject_credit,
//               PROG.program_level,
//               PROG.year,
//               venue.type,
//               slotStatus,
//               semester,
//               venue.capacity,
//               program_capacity,
//               program_type,
//               S.total_hours_per_week,
//               S.arrange,
//               program_code,
//               tutor_id,
//               new Date()
//             ]);

//             // Mark venue slot as used
//             await db.query(`UPDATE venues SET ${slot_status_col}='used' WHERE venue_id=?`, [venue.venue_id]);

//             // Update subject ltpa
//             await db.query(`UPDATE subjects SET ltpa = ltpa + 0.75 WHERE subject_id=?`, [subject_id]);

//             console.log(`✔ Assigned: DAY=${day}, SLOT=${slotTime}, SUBJECT_ID=${subject_id}, PROGRAM=${program_code}, VENUE_ID=${venue.venue_id}, TUTOR=${tutor_id}`);
//             subjectAssigned = true;
//             break; // break slot loop
//           } // end slot loop
//         } // end venue loop
//       } // end day loop

//       if (!subjectAssigned) {
//         console.warn(`⚠ Could not place subject_id=${subject_id} (semester=${semester}). Deferred.`);
//         await db.query(`UPDATE subjects SET ltpa = ltpa + 0.00 WHERE subject_id = ?`, [subject_id]);
//       }
//     } // while loop

//   } catch (err) {
//     console.error("❌ Error generating timetable:", err);
//     throw err;
//   }
// }




// /* ========================================================================
//    📌 PERFECT COLLISION ENGINE (DB VERSION) – NO INDEX
//    ======================================================================== */
// export const autoCollisionMonitor = async () => {
//   try {
//     console.log("🔍 Checking timetable collisions...");

//     // 1️⃣ Precompute colliding entries into a temporary table
//     await db.query(`DROP TEMPORARY TABLE IF EXISTS tmp_collisions`);
//     await db.query(`
//       CREATE TEMPORARY TABLE tmp_collisions AS
//       SELECT t1.id AS colliding_id
//       FROM extracted_timetables t1
//       JOIN extracted_timetables t2
//         ON t1.day = t2.day
//         AND t1.id >= t2.id
//         AND NOT (t1.end_time <= t2.start_time OR t1.start_time >= t2.end_time)
//       WHERE NOT (
//             t1.subject_code = t2.subject_code
//             AND t1.tutor_name = t2.tutor_name
//             AND t1.venue_id = t2.venue_id
//             AND t1.program_name != t2.program_name
//       )
//       AND (
//             t1.tutor_name = t2.tutor_name AND t1.subject_code != t2.subject_code
//          OR t1.program_name = t2.program_name AND t1.subject_code != t2.subject_code
//          OR t1.venue_id = t2.venue_id AND (t1.program_name != t2.program_name OR t1.subject_code != t2.subject_code)
//          OR t1.subject_code = t2.subject_code AND t1.tutor_name != t2.tutor_name
//       )
//     `);

//     // 2️⃣ Backup only colliding entries into timetable_history with reason
//     const backupResult = await db.query(`
//       INSERT INTO timetable_history
//       (timetable_id, swapped_with, day, start_time, end_time, subject_code,
//        subject_name, venue_name, tutor_name, venue_location, department_name,
//        program_name, subject_credit, program_level, venue_type, venue_status,
//        year, total_hours_per_week, program_type, venue_id, semester,
//        venue_capacity, program_capacity, arrange, created_by, created_at,
//        updated_by, updated_at, program_code, reason)
//       SELECT t.id, NULL, t.day, t.start_time, t.end_time, t.subject_code,
//              t.subject_name, t.venue_name, t.tutor_name, t.venue_location, t.department_name,
//              t.program_name, t.subject_credit, t.program_level, t.venue_type, t.venue_status,
//              t.year, t.total_hours_per_week, t.program_type, t.venue_id, t.semester,
//              t.venue_capacity, t.program_capacity, t.arrange, t.created_by, t.created_at,
//              t.updated_by, t.updated_at, t.program_code,
//              CONCAT('Removed due to collision: LTPA reduced by 0.75')
//       FROM extracted_timetables t
//       JOIN tmp_collisions c ON t.id = c.colliding_id
//     `);
//     console.log(`📦 Backed up ${backupResult[0].affectedRows} colliding entries`);

//     // 3️⃣ Update LTPA for colliding subjects
//     const updateResult = await db.query(`
//       UPDATE subjects s
//       JOIN extracted_timetables t
//         ON s.subject_code = t.subject_code
//       JOIN tmp_collisions c
//         ON t.id = c.colliding_id
//       SET s.ltpa = GREATEST(s.ltpa - 0.75, 0)
//     `);
//     console.log(`🔧 Updated LTPA for ${updateResult[0].affectedRows} subjects`);

//     // 4️⃣ Delete colliding entries from extracted_timetables
//     const deleteResult = await db.query(`
//       DELETE t
//       FROM extracted_timetables t
//       JOIN tmp_collisions c
//         ON t.id = c.colliding_id
//     `);
//     console.log(`🗑 Deleted ${deleteResult[0].affectedRows} colliding entries`);

//     // 5️⃣ Drop temporary table
//     await db.query(`DROP TEMPORARY TABLE IF EXISTS tmp_collisions`);
//     console.log("✅ Collision processing complete");

//   } catch (error) {
//     console.error("❌ autoCollisionMonitor ERROR:", error);
//   }
// };