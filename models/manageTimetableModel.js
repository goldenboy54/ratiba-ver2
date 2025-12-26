import db from "../db.js";

// Get one timetable row
export const getTimetableById = async (id) => {
  const [rows] = await db.query("SELECT * FROM extracted_timetables WHERE id=?", [id]);
  return rows[0];
};

// List tutors
export const listTutors = async () => {
  const [rows] = await db.query("SELECT DISTINCT tutor_name FROM extracted_timetables ORDER BY tutor_name");
  return rows;
};

// List subjects by tutor
export const listSubjectsByTutor = async (tutor) => {
  const [rows] = await db.query(
    "SELECT DISTINCT subject_code, subject_name FROM extracted_timetables WHERE tutor_name=? ORDER BY subject_code",
    [tutor]
  );
  return rows;
};

// List slots by subject
export const listSlotsBySubject = async (subject_code) => {
  const [rows] = await db.query(
    "SELECT * FROM extracted_timetables WHERE subject_code=? ORDER BY day,start_time",
    [subject_code]
  );
  return rows;
};

// List programs by tutor & subject
export const listProgramsByTutorAndSubject = async (tutor_name, subject_code) => {
  const [rows] = await db.query(
    `SELECT *, id, program_name, program_code, subject_name, subject_code, day, start_time, end_time, venue_name, venue_location, venue_id
     FROM extracted_timetables
     WHERE tutor_name=? AND subject_code=? ORDER BY program_name, day, start_time`,
    [tutor_name, subject_code]
  );
  return rows;
};

// Save freed slot info
export const releaseFreedSlot = async (prog, releasedBy, reason) => {
  await db.query(
    `INSERT INTO freed_slots 
     (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      prog.venue_id || null,
      prog.venue_name || "Unknown",
      prog.day,
      prog.start_time,
      prog.end_time,
      releasedBy,
      reason,
    ]
  );
};

/**
 * Check if mixing programs would cause a conflict:
 * - Any of the programs being mixed must not have a DIFFERENT subject at the same time/day.
 */
const checkProgramMixCollision = async (targetSlot, slotsToMix) => {
  const { day, start_time, end_time, subject_code } = targetSlot;

  // Collect all unique program names (or codes) involved in the mix
  const mixingPrograms = [
    ...new Set([
      targetSlot.program_name,
      targetSlot.program_code,
      ...slotsToMix.flatMap(s => [s.program_name, s.program_code])
    ].filter(Boolean))
  ];

  // IDs to exclude: the target + all slots being merged
  const excludeIds = [targetSlot.id, ...slotsToMix.map(s => s.id)];

  // Find all timetable entries on the same day that overlap in time
  const [conflictingRows] = await db.query(
    `SELECT 
       id, program_name, program_code, subject_code, subject_name,
       tutor_name, start_time, end_time, venue_name
     FROM extracted_timetables
     WHERE day = ?
       AND id NOT IN (${excludeIds.map(() => '?').join(',') || 'NULL'})
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND start_time < ?) OR
         (end_time > ? AND end_time <= ?)
       )`,
    [
      day,
      ...excludeIds,
      end_time, start_time,     // overlap condition 1
      start_time, end_time,     // overlap condition 2
      start_time, end_time      // overlap condition 3
    ]
  );

  for (const conflict of conflictingRows) {
    const conflictProgram = conflict.program_name || conflict.program_code;

    // Check if this conflicting entry belongs to any program we're trying to mix
    const isPartOfMix = mixingPrograms.some(p =>
      conflictProgram?.includes(p) || p?.includes(conflictProgram)
    );

    if (isPartOfMix && conflict.subject_code !== subject_code) {
      return {
        found: true,
        conflict,
        reason: `Program "${conflictProgram}" is already assigned a different subject (${conflict.subject_name || conflict.subject_code}) at this time.`
      };
    }
  }

  return { found: false };
};

/**
 * Mix multiple program slots into one target slot
 */
export const mixPrograms = async (targetSlotId, programsToMixIds, userName) => {
  console.log("🟢 mixPrograms called with target:", targetSlotId, "mixing:", programsToMixIds);

  // Normalize input IDs
  if (!Array.isArray(programsToMixIds)) {
    programsToMixIds = [programsToMixIds];
  }

  if (programsToMixIds.length && typeof programsToMixIds[0] === "object") {
    programsToMixIds = programsToMixIds.map(p => p.id || p.id_2 || p.slot_id || p);
  }

  programsToMixIds = [...new Set(programsToMixIds.map(id => Number(id)).filter(id => !isNaN(id)))];

  if (!programsToMixIds.length) {
    throw new Error("❌ No valid program slot IDs provided for mixing.");
  }

  // Fetch target slot
  const [targetRows] = await db.query(
    `SELECT * FROM extracted_timetables WHERE id = ?`,
    [targetSlotId]
  );
  if (!targetRows.length) throw new Error("❌ Target slot not found.");
  const targetSlot = targetRows[0];

  // Fetch slots to mix
  const placeholders = programsToMixIds.map(() => '?').join(',');
  const [slotsToMixRows] = await db.query(
    `SELECT * FROM extracted_timetables WHERE id IN (${placeholders})`,
    programsToMixIds
  );

  if (slotsToMixRows.length === 0) {
    throw new Error("❌ None of the provided slots to mix were found.");
  }

  const slotsToMix = slotsToMixRows;

  // === STRICT COLLISION CHECK ===
  const collision = await checkProgramMixCollision(targetSlot, slotsToMix);

  if (collision.found) {
    throw new Error(
      `🚫 Cannot mix programs: ${collision.reason}\n` +
      `Conflict at: ${collision.conflict.day} ${collision.conflict.start_time}-${collision.conflict.end_time} ` +
      `(Venue: ${collision.conflict.venue_name}, Tutor: ${collision.conflict.tutor_name})`
    );
  }

  // Merge fields
  const allSlots = [targetSlot, ...slotsToMix];

  const mergeField = (field) =>
    [...new Set(allSlots.map(s => s[field]).filter(Boolean))].join(" + ").trim();

  const newProgramName = mergeField("program_name");
  const newProgramCode = mergeField("program_code");
  const newSubjectName = mergeField("subject_name");
  const newSubjectCode = mergeField("subject_code");
  const newProgramLevel = mergeField("program_level");
  const newYear = mergeField("year");
  const newVenueType = mergeField("venue_type");
  const newProgramCapacity = Math.max(...allSlots.map(s => Number(s.program_capacity) || 0));

  console.log("✅ Merged fields:", {
    newProgramName,
    newProgramCode,
    newSubjectName,
    newSubjectCode,
    newProgramCapacity
  });

  // Start transaction
  try {
    await db.query("START TRANSACTION");

    // Update target slot with merged data
    await db.query(
      `UPDATE extracted_timetables
       SET 
         program_name = ?,
         program_code = ?,
         subject_name = ?,
         subject_code = ?,
         program_level = ?,
         year = ?,
         venue_type = ?,
         program_capacity = ?,
         updated_by = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        newProgramName,
        newProgramCode,
        newSubjectName,
        newSubjectCode,
        newProgramLevel,
        newYear,
        newVenueType,
        newProgramCapacity,
        userName,
        targetSlot.id
      ]
    );

    // Record freed slots and delete merged entries
    for (const slot of slotsToMix) {
      await releaseFreedSlot(
        slot,
        userName,
        `Merged into combined class: ${newProgramName} (${newSubjectName})`
      );

      await db.query(`DELETE FROM extracted_timetables WHERE id = ?`, [slot.id]);
    }

    await db.query("COMMIT");

    console.log("✅ Mix completed successfully");

    return {
      success: true,
      targetSlotId: targetSlot.id,
      mergedInto: {
        programName: newProgramName,
        programCode: newProgramCode,
        subjectName: newSubjectName,
        subjectCode: newSubjectCode,
        programLevel: newProgramLevel,
        year: newYear,
        venueType: newVenueType,
        programCapacity: newProgramCapacity
      },
      mergedSlotCount: slotsToMix.length
    };

  } catch (err) {
    await db.query("ROLLBACK");
    console.error("❌ Transaction failed during mix:", err.message);
    throw new Error(`Failed to mix programs: ${err.message}`);
  }
};