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
  log(`Semester: ${semester}`);

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

      log(`Fetched ${subjectsRes.length} subjects needing assignment.`);

      if (!subjectsRes.length) {
        log("🎉 All subjects assigned successfully. No more pending subjects.");
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

        log(`Processing subject_id=${subject_id} (code: ${S.subject_code}, title: ${S.title}, tutor: ${S.full_name}, program_type: ${program_type}, remaining_hours: ${remainingHours})`);

        for (const day of DAYS) {
          if (remainingHours <= 0) {
            log(`  - Subject ${subject_id} fully assigned, skipping remaining days.`);
            break;
          }
          const arrange = dayToArrange[day];
          const dayLower = day.toLowerCase();

          log(`  - Trying day: ${day}`);

          // Get venues
          let venues = [];
          if (S.type_prac_or_theory === "Lab") {
            [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`, [S.subject_department, program_capacity]);
            if (!venues.length) {
              log(`    - No exact capacity Lab venues found for dept ${S.subject_department} >= ${program_capacity}. Falling back to any capacity.`);
              [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? ORDER BY capacity DESC`, [S.subject_department]);
            }
          } else {
            [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`, [program_capacity]);
            if (!venues.length) {
              log(`    - No exact capacity non-Lab venues found >= ${program_capacity}. Falling back to any capacity.`);
              [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' ORDER BY capacity DESC`);
            }
          }
          if (!venues.length) {
            log(`    - No suitable venues found for subject ${subject_id} on ${day}. Skipping day.`);
            continue;
          }

          log(`    - Found ${venues.length} potential venues.`);

          for (const venue of venues) {
            log(`      - Trying venue_id=${venue.venue_id} (name: ${venue.venue_name}, type: ${venue.type}, capacity: ${venue.capacity})`);

            const MAX_SLOTS = 18;

            for (let i = 1; i <= MAX_SLOTS - slotsNeeded + 1 && remainingHours > 0; i++) {
              if (day === "FRIDAY" && i >= 6 && i <= 8) {
                log(`        - Skipping slot ${i} on FRIDAY due to break restriction.`);
                continue;
              }

              const slotCols = [];
              let canAssign = true;

              for (let j = 0; j < slotsNeeded; j++) {
                const colIndex = i + j;
                if (day === "FRIDAY" && (colIndex >= 6 && colIndex <= 8)) { 
                  log(`        - Skipping consecutive slot ${colIndex} on FRIDAY due to break overlap.`);
                  canAssign = false; 
                  break; 
                }

                const col = `${dayLower}_slot${colIndex}`;
                const statusCol = `${col}_status`;
                if (!(col in venue)) { 
                  log(`        - Column ${col} not found in venue. Cannot assign.`);
                  canAssign = false; 
                  break; 
                }

                const slotTime = venue[col];
                // Skip full-time late evening slots
                if (program_type.toLowerCase().includes("full-time") && ["21:10-21:55","21:55-22:40"].includes(slotTime)) {
                  log(`        - Skipping slotTime ${slotTime} for full-time program (late evening restriction).`);
                  canAssign = false; 
                  break;
                }

                slotCols.push({ col, statusCol, slotTime });
                if (!slotTime) {
                  log(`        - No slotTime defined for ${col}. Cannot assign.`);
                  canAssign = false; 
                  break;
                }
                if (venue[statusCol] && venue[statusCol].toLowerCase() === "used") {
                  log(`        - Slot ${col} status is 'used'. Cannot assign.`);
                  canAssign = false; 
                  break;
                }
                if (!programSlotMatch(program_type, slotTime)) {
                  log(`        - SlotTime ${slotTime} does not match program_type ${program_type}. Cannot assign.`);
                  canAssign = false; 
                  break;
                }
              }
              if (!canAssign) continue;

              log(`        - Potential assignment: slots ${i} to ${i + slotsNeeded - 1} (${slotCols.map(s => s.slotTime).join(", ")})`);

              // Collision check
              let collision = false;
              for (const s of slotCols) {
                const slotTime = s.slotTime;

                const [tutorRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND tutor_name=? LIMIT 1`, [day, slotTime, S.full_name]);
                if (tutorRes.length) { 
                  log(`          - Collision: Tutor ${S.full_name} already assigned on ${day} at ${slotTime}.`);
                  collision = true; 
                  break; 
                }

                const [venueRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND venue_id=? LIMIT 1`, [day, slotTime, venue.venue_id]);
                if (venueRes.length) { 
                  log(`          - Collision: Venue ${venue.venue_id} already used on ${day} at ${slotTime}.`);
                  collision = true; 
                  break; 
                }

                if (mixParts.length) {
                  for (const part of mixParts) {
                    const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code LIKE ? LIMIT 1`, [day, slotTime, `%${part}%`]);
                    if (progRes.length) { 
                      log(`          - Collision: Program part ${part} overlaps on ${day} at ${slotTime}.`);
                      collision = true; 
                      break; 
                    }
                  }
                  if (collision) break;
                } else {
                  const [progRes] = await db.query(`SELECT 1 FROM extracted_timetables WHERE day=? AND slot=? AND program_code=? LIMIT 1`, [day, slotTime, program_code]);
                  if (progRes.length) { 
                    log(`          - Collision: Program ${program_code} overlaps on ${day} at ${slotTime}.`);
                    collision = true; 
                    break; 
                  }
                }
              }
              if (collision) {
                log(`        - Cannot assign due to collision. Skipping.`);
                continue;
              }

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
                log(`✔ Assigned subject_id=${subject_id} → ${slotsNeeded} consecutive slots in venue ${venue.venue_id} (day ${day}, slots: ${slotCols.map(s => s.slotTime).join(", ")})`);
                remainingHours -= ltpaIncrement;
                log(`  - Updated remaining hours for subject ${subject_id}: ${remainingHours}`);
              } catch (txErr) {
                await db.query("ROLLBACK");
                log(`❌ ERROR assigning subject_id=${subject_id} in venue ${venue.venue_id} (day ${day}): ${txErr.message}. Stack: ${txErr.stack}`);
              }
            }
          }
        }

        if (remainingHours > 0) log(`⚠ Could not fully assign subject_id=${subject_id}. Remaining hours: ${remainingHours}. Possible reasons: No available venues/slots without collisions, restrictions on days/slots/program types.`);
      }
    }
  } catch (err) {
    log(`❌ GLOBAL ERROR in timetable generation: ${err.message}. Stack: ${err.stack}`);
    throw err;
  }
}