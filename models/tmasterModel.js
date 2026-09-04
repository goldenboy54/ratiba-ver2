import db from '../db.js';
import fs from "fs";

// ==================== SEMESTER CALENDAR (VETA vs NON-VETA) ====================
// A `semester` label ("I"/"II") only tells you which of a student's OWN two
// semesters an entry belongs to - it does NOT tell you the real calendar months,
// because VETA's academic calendar no longer lines up with everyone else's. Same
// mapping as models/manualTimetableModel.js and routes/timetables.js, confirmed
// against the real 2026/2027 ATC/VETA academic calendar; duplicated here rather
// than shared, matching this codebase's existing style for small per-file
// collision helpers.
const SEMESTER_CALENDAR = {
  NON_VETA:  { I: ["OCT", "NOV", "DEC", "JAN", "FEB"], II: ["MAR", "APR", "MAY", "JUN", "JUL"] },
  VETA_L1L2: { I: ["JAN", "FEB", "MAR", "APR", "MAY"], II: ["JUL", "AUG", "SEP", "OCT", "NOV"] },
  VETA_L3:   { I: ["AUG", "SEP", "OCT", "NOV"],        II: ["JAN", "FEB", "MAR", "APR", "MAY"] },
};

// Which row of SEMESTER_CALENDAR a subject/timetable entry belongs to. VETA Level 3
// runs on its own calendar, offset from VETA Levels 1 & 2, so program_type alone
// ("VETA") isn't enough to tell them apart - program_level is what distinguishes them.
function getProgramGroup(programType, programLevel) {
  const type = (programType || "").trim().toUpperCase();
  if (type === "VETA") {
    return String(programLevel || "").trim() === "3" ? "VETA_L3" : "VETA_L1L2";
  }
  return "NON_VETA";
}

// Two entries can only really collide if their semesters run during the same real
// months - "same semester label" stopped being a safe proxy for that once VETA's
// calendar diverged from everyone else's (see SEMESTER_CALENDAR above). Falls back
// to "overlapping" (the cautious answer) if either side's group/semester isn't
// recognized, instead of silently letting an unrecognized case slip through as safe.
function semestersOverlap(typeA, levelA, semA, typeB, levelB, semB) {
  const monthsA = SEMESTER_CALENDAR[getProgramGroup(typeA, levelA)]?.[semA];
  const monthsB = SEMESTER_CALENDAR[getProgramGroup(typeB, levelB)]?.[semB];
  if (!monthsA || !monthsB) return true;
  return monthsA.some(m => monthsB.includes(m));
}

// Same tolerance values as models/manualTimetableModel.js's capacity check - kept in
// sync rather than shared, matching this codebase's existing style for small per-file
// collision helpers. A class is allowed to exceed a venue's rated capacity by up to
// this fraction (e.g. a 100-seat venue accepts a class of up to 120) before that venue
// is excluded as too small. Below UNDERUTILIZATION_THRESHOLD, the assignment still goes
// ahead but gets logged as a poor use of the room.
const CAPACITY_TOLERANCE = 0.20;
const UNDERUTILIZATION_THRESHOLD = 0.30;

// Co-teaching: at most this many distinct tutors may share one session (same subject,
// cohort and overlapping program code, same real day/slot) - see isSameSession below.
// Kept in sync with models/manualTimetableModel.js's MAX_CO_TEACHERS.
const MAX_CO_TEACHERS = 5;

// An existing entry `e` belongs to one of the OTHER TUTORS on the same co-taught session
// as the subject being placed (`S`) - not a real collision - only if everything identifying
// "the same class" matches and only the tutor differs. Does NOT require the same venue: co-teachers
// may run the session from different rooms, so venue collision only needs this exemption
// when they happen to land in the same one.
//
// `subjects` has no `year` column, so this compares against S.year || S.program_duration -
// the same fallback the INSERT below uses to populate extracted_timetables.year.
function isSameSession(e, S) {
  if (!e.subject_code || !S.subject_code || e.subject_code !== S.subject_code) return false;
  if (String(e.semester) !== String(S.semester)) return false;
  if (String(e.program_level) !== String(S.program_level)) return false;
  if (String(e.year) !== String(S.year || S.program_duration)) return false;
  const eParts = e.program_code ? e.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
  const sParts = S.program_code ? S.program_code.split("+").map(p => p.trim().toLowerCase()) : [];
  return eParts.some(p => sParts.includes(p));
}

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
    "VETA": [
      "07:30-08:15", "08:15-09:00", "09:05-09:50", "09:50-10:35",
      "11:00-11:45",
      "11:45-12:30",
"13:15-14:00",
 "14:00-14:45",
 "14:50-15:35",
 "15:35-16:20",
 "16:25-17:10",
 "17:10-17:55"

],
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

  // Defensive backstop: this function's own logic (each pass re-queries "subjects still
  // needing assignment" and keeps going until that list is empty) has no built-in way to
  // notice "every remaining subject is now impossible to place" - without these guards, a
  // single unplaceable subject (a real constraint clash, bad data, or any future edge case
  // we haven't hit yet) spins this loop forever, hammering the DB with the same failing
  // queries indefinitely rather than ending the request. Two independent safeguards below:
  // stop as soon as a full pass places nothing at all (the fast, correct signal that no
  // amount of further looping will help), and a hard iteration cap as a last-resort ceiling
  // in case some future change breaks the "no progress" detection itself.
  const MAX_GENERATION_PASSES = 50;

  try {
    let subjectsPending = true;
    let passCount = 0;

    while (subjectsPending) {
      passCount++;
      if (passCount > MAX_GENERATION_PASSES) {
        log(`🛑 STOPPING: reached the hard cap of ${MAX_GENERATION_PASSES} passes without finishing. This should only happen if the "no progress" safeguard below somehow failed to catch a stuck state - treat that as a bug to investigate.`);
        break;
      }

      const [subjectsRes] = await db.query(`
        SELECT S.*, u.full_name
        FROM subjects S
        JOIN users u ON S.user_id = u.user_id
        WHERE COALESCE(S.ltpa, 0) < S.total_hours_per_week
          AND S.semester = ?
        ORDER BY (S.total_hours_per_week - COALESCE(S.ltpa,0)) DESC, COALESCE(S.ltpa,0) ASC
      `, [semester]);

      log(`Pass ${passCount}: fetched ${subjectsRes.length} subjects still needing assignment.`);

      if (!subjectsRes.length) {
        log("🎉 All subjects fully assigned within their hour limits!");
        subjectsPending = false;
        break;
      }

      let totalAssignedThisPass = 0;

      // ==================== MOST-CONSTRAINED-SUBJECT-FIRST ORDERING ====================
      // Plain "most hours remaining first" is a weak proxy for difficulty - a subject
      // needing many hours might have plenty of flexible venues, while a subject needing
      // few hours could be the one that's actually hard to place (a single specialty Lab,
      // an evening-only tutor). Whoever gets processed first wins scarce slots regardless
      // of who actually needs them more. Score each pending subject by how many legally-
      // typed, currently-open slots it could use - ignoring the extracted_timetables
      // collision check, which stays an exact, untouched decision in the placement loop
      // below; this score only needs to rank relative difficulty, not predict the outcome -
      // and process the most constrained (fewest options) subjects first. Inspired by FET's
      // documented "most constrained first" heuristic, borrowed as an idea and implemented
      // from scratch here (not a port of FET's AGPLv3 code).
      const venueCache = new Map();
      async function fetchVenuesFor(subj) {
        const capacity = Number(subj.program_capacity) || 0;
        const key = subj.type_prac_or_theory === "Lab"
          ? `lab:${subj.subject_department}:${capacity}`
          : `nonlab:${capacity}`;
        if (venueCache.has(key)) return venueCache.get(key);

        // Fallback (no venue meets capacity outright) still has to respect
        // CAPACITY_TOLERANCE - otherwise this scoring pass would count a grossly
        // undersized venue as a usable option, before the actual placement loop below
        // (which does apply the tolerance floor) disagrees.
        const minAcceptableCapacity = capacity / (1 + CAPACITY_TOLERANCE);
        let rows;
        if (subj.type_prac_or_theory === "Lab") {
          [rows] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`, [subj.subject_department, capacity]);
          if (!rows.length) {
            [rows] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity DESC`, [subj.subject_department, minAcceptableCapacity]);
          }
        } else {
          [rows] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`, [capacity]);
          if (!rows.length) {
            [rows] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity DESC`, [minAcceptableCapacity]);
          }
        }
        venueCache.set(key, rows);
        return rows;
      }

      const scored = [];
      for (const S of subjectsRes) {
        const venues = await fetchVenuesFor(S);
        let openSlots = 0;
        for (const day of DAYS) {
          const dayLower = day.toLowerCase();
          for (const venue of venues) {
            for (let i = 1; i <= 18; i++) { // matches the placement loop's MAX_SLOTS
              if (day === "FRIDAY" && i >= 6 && i <= 8) continue;
              const col = `${dayLower}_slot${i}`;
              const statusCol = `${col}_status`;
              if (!(col in venue) || !venue[col]) continue;
              if (venue[statusCol]?.toLowerCase() === "used") continue;
              if (!programSlotMatch(S.program_type, venue[col])) continue;
              openSlots++;
            }
          }
        }
        scored.push({ S, openSlots });
      }
      scored.sort((a, b) =>
        a.openSlots - b.openSlots ||                                         // fewest options first
        (Number(b.S.total_hours_per_week) - Number(b.S.ltpa || 0)) -         // tie-break: old heuristic
        (Number(a.S.total_hours_per_week) - Number(a.S.ltpa || 0))
      );
      log(`Pass ${passCount} ordering (most constrained first): ${scored.map(x => `${x.S.subject_code}(${x.openSlots} open)`).join(", ")}`);
      const orderedSubjects = scored.map(x => x.S);

      for (const S of orderedSubjects) {
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

          // Fallback (no venue meets capacity outright) is bounded by CAPACITY_TOLERANCE
          // instead of accepting any available venue regardless of size - previously this
          // could silently overcrowd a room far smaller than the class.
          const minAcceptableCapacity = program_capacity / (1 + CAPACITY_TOLERANCE);
          let venues = [];
          let usedToleranceFallback = false;
          if (S.type_prac_or_theory === "Lab") {
            [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity ASC`, [S.subject_department, program_capacity]);
            if (!venues.length) {
              [venues] = await db.query(`SELECT * FROM venues WHERE type='Lab' AND department=? AND capacity >= ? ORDER BY capacity DESC`, [S.subject_department, minAcceptableCapacity]);
              usedToleranceFallback = true;
            }
          } else {
            [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity ASC`, [program_capacity]);
            if (!venues.length) {
              [venues] = await db.query(`SELECT * FROM venues WHERE type!='Lab' AND capacity >= ? ORDER BY capacity DESC`, [minAcceptableCapacity]);
              usedToleranceFallback = true;
            }
          }

          if (!venues.length) {
            log(`  - No venue for ${S.subject_code} on ${day} meets capacity ${program_capacity} even within ${CAPACITY_TOLERANCE * 100}% tolerance. Skipping day.`);
            continue;
          }
          if (usedToleranceFallback) {
            log(`  ⚠ No venue meets capacity ${program_capacity} outright - considering venues down to ${minAcceptableCapacity.toFixed(1)} (${CAPACITY_TOLERANCE * 100}% tolerance).`);
          }

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

                // Collision check - only against entries that actually overlap in real
                // calendar months (see SEMESTER_CALENDAR/semestersOverlap above). A raw
                // day+slot match alone isn't enough once VETA's calendar diverges from
                // everyone else's: two entries can share the exact same day/slot label
                // and tutor/venue/program without ever really colliding, if one runs
                // Aug-Nov and the other Mar-Jul in real time.
                let collision = false;
                for (const s of slotCols) {
                  const [allEntriesThisSlot] = await db.query(
                    `SELECT * FROM extracted_timetables WHERE day=? AND slot=?`,
                    [day, s.slotTime]
                  );

                  const existingEntries = allEntriesThisSlot.filter(e => semestersOverlap(
                    program_type, S.program_level, S.semester,
                    e.program_type, e.program_level, e.semester
                  ));

                  // Co-teaching companions: the other half of the same session as S (see
                  // isSameSession), exempted from venue/program collision below - but only
                  // up to MAX_CO_TEACHERS distinct tutors per session.
                  const sessionCompanions = existingEntries.filter(e =>
                    isSameSession(e, S) && Number(e.created_by) !== Number(tutor_id)
                  );
                  const distinctCoTeachers = new Set(sessionCompanions.map(e => Number(e.created_by)));
                  const withinCoTeachCap = distinctCoTeachers.size < MAX_CO_TEACHERS;
                  const companionSet = withinCoTeachCap ? new Set(sessionCompanions) : new Set();

                  if (existingEntries.some(e => e.tutor_name === S.full_name)) { collision = true; break; }

                  if (existingEntries.some(e => Number(e.venue_id) === Number(venue.venue_id) && !companionSet.has(e))) { collision = true; break; }

                  if (mixParts.length) {
                    if (existingEntries.some(e => e.program_code && !companionSet.has(e) && mixParts.some(part => e.program_code.includes(part)))) {
                      collision = true; break;
                    }
                  } else {
                    if (existingEntries.some(e => e.program_code === program_code && !companionSet.has(e))) { collision = true; break; }
                  }
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
                      S.program_name, S.subject_credit, S.program_level, S.year || S.program_duration || null,
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
                  totalAssignedThisPass += ltpaIncrement;

                  log(`✔ ASSIGNED ${slotsNeeded === 2 ? 'DOUBLE' : 'SINGLE'} slot(s) → subject_id=${subject_id} | ${day} | slots ${i}-${i+slotsNeeded-1} | Venue: ${venue.venue_name} | +${ltpaIncrement}h | New total: ${currentLtpa + ltpaIncrement}/${totalHours}h`);

                  const venueCapacity = Number(venue.capacity) || 0;
                  if (venueCapacity > 0 && program_capacity < venueCapacity * UNDERUTILIZATION_THRESHOLD) {
                    log(`  ℹ Venue ${venue.venue_name} (capacity ${venueCapacity}) is oversized for class of ${program_capacity} - consider a smaller venue.`);
                  }

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

      // No subject in this entire pass gained any hours at all - every remaining subject
      // is genuinely stuck (no legal slot, a real collision, or an unforeseen constraint
      // clash). Re-running the exact same pass again would produce the exact same result
      // forever, since nothing about the DB state changed. Stop now instead of spinning.
      if (totalAssignedThisPass === 0) {
        const stillPending = subjectsRes.map(s => `${s.subject_code} (${s.title}, needs ${(Number(s.total_hours_per_week) - Number(s.ltpa || 0)).toFixed(2)}h)`);
        log(`🛑 STOPPING: pass ${passCount} placed 0 hours across ${subjectsRes.length} pending subject(s) - no further pass can help without a change in venues/constraints. Left unassigned: ${stillPending.join("; ")}`);
        subjectsPending = false;
      }
    }

    log("=== TIMETABLE GENERATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    log(`FATAL ERROR: ${err.message}\n${err.stack}`);
    throw err;
  }
}