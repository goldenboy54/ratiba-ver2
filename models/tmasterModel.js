import db from '../db.js';
import fs from "fs";

/**
 * Auto timetable assignment - FINAL VERSION
 * - Evening: slots 13–18 only (18:00 onwards)
 * - Full-time: slots 1–12 only
 * - Double slots preferred (2 consecutive = 1.5 hours)
 * - Prevents LTPA from exceeding total_hours_per_week
 * - Safe partial assignment if only 1 slot fits remaining hours
 */
export async function addtimetable({ semester }) {
  const logPath = "models/timetable-logs.txt";
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
  const log = (msg) => fs.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);

  log("=== STARTING AUTO TIMETABLE GENERATION (Safe LTPA Limits + Evening Slot 13-18) ===");
  log(`Semester: ${semester}`);

  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const dayToArrange = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5 };

  const SLOT_RANGES = {
    "full-time": [
      "07:30-08:15","08:15-09:00","09:05-09:50","09:50-10:35","11:00-11:45",
      "11:45-12:30","13:15-14:00","14:00-14:45","14:50-15:35","15:35-16:20",
      "16:25-17:10","17:10-17:55"
    ],
    "evening": [
      "16:25-17:10", "17:10-17:55","18:00-18:45", "18:45-19:30", "19:35-20:20", "20:20-21:05", "21:10-21:55", "21:55-22:40"
    ],
    "VETA": ["14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00", "17:00-17:55"],
    "full-evening": ["16:25-17:10", "17:10-17:55"]
  };

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

  try {
    let subjectsPending = true;

    while (subjectsPending) {
      const [subjectsRes] = await db.query(`
        SELECT S.*, u.full_name
        FROM subjects S
        JOIN users u ON S.user_id = u.user_id
        WHERE COALESCE(S.ltpa, 0) < S.total_hours_per_week
          AND S.semester = ?
        ORDER BY (S.total_hours_per_week - COALESCE(S.ltpa,0)) DESC, COALESCE(S.ltpa,0) ASC
      `, [semester]);

      log(`Fetched ${subjectsRes.length} subjects still needing assignment.`);

      if (!subjectsRes.length) {
        log("🎉 All subjects fully assigned within their hour limits!");
        subjectsPending = false;
        break;
      }

      for (const S of subjectsRes) {
        const tutor_id = S.user_id;
        const subject_id = S.subject_id;
        const program_capacity = Number(S.program_capacity) || 0;
        const program_code = (S.program_code || "").trim();
        const mixParts = program_code ? program_code.split("+").map(p => p.trim()) : [];
        const program_type = S.program_type;

        // Current assigned + remaining
        const currentLtpa = Number(S.ltpa || 0);
        const totalHours = Number(S.total_hours_per_week);
        let remainingHours = totalHours - currentLtpa;

        if (remainingHours <= 0) continue; // Safety

        log(`Processing subject_id=${subject_id} | ${S.subject_code} - ${S.title} | Tutor: ${S.full_name} | Type: ${program_type} | Assigned: ${currentLtpa}h / ${totalHours}h (Remaining: ${remainingHours}h)`);

        let assignedThisRound = false;

        for (const day of DAYS) {
          if (remainingHours <= 0) break;

          const arrange = dayToArrange[day];
          const dayLower = day.toLowerCase();

          log(`  - Trying day: ${day}`);

          let venues = [];
          if (S.type_prac_or_theory === "Lab") {
            [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`, [S.subject_department, program_capacity]);
            if (!venues.length) {
              [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department]);
            }
          } else {
            [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`, [program_capacity]);
            if (!venues.length) {
              [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);
            }
          }

          if (!venues.length) continue;

          for (const venue of venues) {
            if (remainingHours <= 0) break;

            const MAX_SLOTS = 18;
            const FULL_BLOCK_HOURS = 1.5;  // 2 slots = 1.5 hours
            const SINGLE_SLOT_HOURS = 0.75; // 1 slot = 0.75 hours

            // Prefer double slots if possible
            const preferredSlots = remainingHours >= FULL_BLOCK_HOURS ? 2 : (remainingHours >= SINGLE_SLOT_HOURS ? 1 : 0);
            if (preferredSlots === 0) continue;

            for (let slotsNeeded = preferredSlots; slotsNeeded >= 1; slotsNeeded--) {
              if (remainingHours < (slotsNeeded * 0.75)) continue;

              for (let i = 1; i <= MAX_SLOTS - slotsNeeded + 1; i++) {
                if (remainingHours <= 0) break;

                // Friday break skip
                if (day === "FRIDAY" && i >= 6 && i <= 8) continue;

                const slotCols = [];
                let canAssign = true;

                for (let j = 0; j < slotsNeeded; j++) {
                  const colIndex = i + j;
                  if (day === "FRIDAY" && colIndex >= 6 && colIndex <= 8) {
                    canAssign = false;
                    break;
                  }

                  const col = `${dayLower}_slot${colIndex}`;
                  const statusCol = `${col}_status`;
                  if (!(col in venue)) { canAssign = false; break; }

                  const slotTime = venue[col];
                  if (!slotTime) { canAssign = false; break; }
                  if (venue[statusCol]?.toLowerCase() === "used") { canAssign = false; break; }
                  if (!programSlotMatch(program_type, slotTime)) { canAssign = false; break; }

                  slotCols.push({ col, statusCol, slotTime });
                }

                if (!canAssign || slotCols.length < slotsNeeded) continue;

                // Collision check
                let collision = false;
                for (const s of slotCols) {
                  const [tutorRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND tutor_name=? LIMIT 1`, [day, s.slotTime, S.full_name]);
                  if (tutorRes.length) { collision = true; break; }

                  const [venueRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND venue_id=? LIMIT 1`, [day, s.slotTime, venue.venue_id]);
                  if (venueRes.length) { collision = true; break; }

                  if (mixParts.length) {
                    for (const part of mixParts) {
                      const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code LIKE ? LIMIT 1`, [day, s.slotTime, `%${part}%`]);
                      if (progRes.length) { collision = true; break; }
                    }
                  } else {
                    const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code=? LIMIT 1`, [day, s.slotTime, program_code]);
                    if (progRes.length) { collision = true; break; }
                  }
                  if (collision) break;
                }

                if (collision) continue;

                // SAFE ASSIGNMENT
                const ltpaIncrement = slotsNeeded * 0.75;
                if (currentLtpa + ltpaIncrement > totalHours) {
                  log(`        - Would exceed total hours (${currentLtpa} + ${ltpaIncrement} > ${totalHours}). Skipping.`);
                  continue;
                }

                try {
                  await db.query("START TRANSACTION");

                  for (const s of slotCols) {
                    const [startTime, endTime] = s.slotTime.split("-");
                    await db.query(`
                      INSERT INTO extracted_timetables (
                        day, slot, start_time, end_time, subject_code, subject_name, department_name,
                        venue_id, venue_name, tutor_name, venue_location, program_name, subject_credit,
                        program_level, year, venue_type, venue_status, semester, venue_capacity,
                        program_capacity, program_type, total_hours_per_week, arrange, program_code,
                        created_by, created_at
                      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    `, [
                      day, s.slotTime, startTime.trim(), endTime.trim(),
                      S.subject_code, S.title, S.subject_department,
                      venue.venue_id, venue.venue_name, S.full_name, venue.location,
                      S.program_name, S.subject_credit, S.program_level, S.year,
                      venue.type, "used", S.semester, venue.capacity,
                      S.program_capacity, program_type, totalHours,
                      arrange, program_code, tutor_id, new Date()
                    ]);

                    await db.query(`UPDATE venues SET \`${s.statusCol}\` = 'used' WHERE venue_id = ?`, [venue.venue_id]);
                  }

                  await db.query(`UPDATE subjects SET ltpa = COALESCE(ltpa, 0) + ? WHERE subject_id = ?`, [ltpaIncrement, subject_id]);
                  await db.query("COMMIT");

                  remainingHours -= ltpaIncrement;
                  assignedThisRound = true;

                  log(`✔ ASSIGNED ${slotsNeeded === 2 ? 'DOUBLE' : 'SINGLE'} slot(s) → subject_id=${subject_id} | ${day} | slots ${i}-${i+slotsNeeded-1} | Venue: ${venue.venue_name} | +${ltpaIncrement}h | New total: ${currentLtpa + ltpaIncrement}/${totalHours}h`);

                  // Break out of slot loops if we assigned something
                  if (slotsNeeded === 2) i = MAX_SLOTS; // Force exit inner loop
                } catch (txErr) {
                  await db.query("ROLLBACK");
                  log(`❌ FAILED to assign subject ${subject_id}: ${txErr.message}`);
                }
              }

              if (assignedThisRound && preferredSlots === 2) break; // Prefer double, stop trying single if double succeeded
            }
          }
        }

        if (remainingHours > 0) {
          log(`⚠ Subject ${subject_id} partially assigned. Remaining: ${remainingHours.toFixed(2)} hours (out of ${totalHours}).`);
        } else {
          log(`✅ Subject ${subject_id} fully assigned!`);
        }
      }
    }

    log("=== TIMETABLE GENERATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    log(`FATAL ERROR: ${err.message}\n${err.stack}`);
    throw err;
  }
}