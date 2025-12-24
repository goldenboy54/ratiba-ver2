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
    `SELECT *, id, program_name,program_code, subject_name, subject_code, day, start_time, end_time, venue_name, venue_location, venue_id
     FROM extracted_timetables
     WHERE tutor_name=? AND subject_code=? ORDER BY program_name, day, start_time`,
    [tutor_name, subject_code]
  );
  return rows;
};

// ✅ Save freed slot info
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

export const mixPrograms = async (targetSlotId, programsToMixIds, userName) => {
  console.log("🟢 mixPrograms called");

  // Normalize IDs
  if (!Array.isArray(programsToMixIds)) {
    // Kama ni string moja kama kutoka form POST => weka ndani ya array
    programsToMixIds = [programsToMixIds];
  }

  // Kama zimekuja kama object array => toa id field
  if (programsToMixIds.length && typeof programsToMixIds[0] === "object") {
    programsToMixIds = programsToMixIds.map(p => p.id || p.id_2 || p.slot_id);
  }

  // Safisha duplicates na badilisha kuwa integer
  programsToMixIds = [...new Set(programsToMixIds.map(id => Number(id)).filter(Boolean))];

  if (!programsToMixIds.length) throw new Error("❌ No valid program IDs provided for mixing.");

  console.log("Normalized Program IDs to mix:", programsToMixIds);

  // Fetch target slot
  const [targetRows] = await db.query(
    `SELECT * FROM extracted_timetables WHERE id=?`,
    [targetSlotId]
  );
  if (!targetRows.length) throw new Error("❌ Target slot not found in DB.");
  const targetSlot = targetRows[0];

  // Fetch all other slots
  const [slotsToMix] = await db.query(
    `SELECT * FROM extracted_timetables WHERE id IN (?)`,
    [programsToMixIds]
  );

  if (!slotsToMix.length) throw new Error("❌ No slots found to mix.");

  console.log("Slots fetched to mix:", slotsToMix.map(s => s.id));

  // Check missing IDs
  const fetchedIds = slotsToMix.map(s => s.id);
  const missingIds = programsToMixIds.filter(id => !fetchedIds.includes(id));
  if (missingIds.length) console.warn("⚠ Missing IDs not found in DB:", missingIds);

  // Merge all fields
  const allSlots = [targetSlot, ...slotsToMix];
  const mergeField = (field) =>
    [...new Set(allSlots.map((s) => s[field]).filter(Boolean))].join(" + ");

  const newProgramName = mergeField("program_name");
  const newProgramCode = mergeField("program_code");
  const newSubjectName = mergeField("subject_name");
  const newSubjectCode = mergeField("subject_code");
  const newProgramLevel = mergeField("program_level");
  const newYear = mergeField("year");
  const newVenueType = mergeField("venue_type");
  const newProgramCapacity = mergeField("program_capacity");

  console.log("✅ Merged Data:", {
    newProgramName,
    newSubjectName,
    newSubjectCode,
    newProgramLevel,
    newYear,
    newVenueType,
    newProgramCapacity,
    newProgramCode
  });


  // ⚠️ STRICT MIX COLLISION CHECK
// const collision = await checkProgramMixCollision(targetSlot, slotsToMix);

// if (collision.found) {
//   throw new Error(
//     `🚫 Cannot mix programs. ${collision.reason} at ${collision.conflict.start_time}-${collision.conflict.end_time}, Tutor: ${collision.conflict.tutor_name}`
//   );
// }


  // Update target slot
  const [updateResult] = await db.query(
    `UPDATE extracted_timetables
     SET program_name=?, subject_name=?, subject_code=?, program_level=?, year=?, 
         venue_type=?, program_capacity=?, updated_by=?,program_code=?, updated_at=NOW()
     WHERE id=?`,
    [
      newProgramName,
      newSubjectName,
      newSubjectCode,
      newProgramLevel,
      newYear,
      newVenueType,
      newProgramCapacity,
      userName,
      newProgramCode,
      targetSlot.id,
    ]
  );

  if (updateResult.affectedRows === 0)
    throw new Error("❌ Failed to update target slot — maybe slot is not bound.");

  // Save freed slots & delete merged ones
  for (const slot of slotsToMix) {
    await db.query(
      `INSERT INTO freed_slots 
         (venue_id, venue_name, day, start_time, end_time, released_by, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        slot.venue_id || null,
        slot.venue_name || "Unknown",
        slot.day,
        slot.start_time,
        slot.end_time,
        userName,
        `Program ${slot.program_name} merged into ${newProgramName}`,
      ]
    );

    await db.query(`DELETE FROM extracted_timetables WHERE id=?`, [slot.id]);
  }

  console.log(" Mix completed successfully");
  return {
    subjectName: newSubjectName,
    subjectCode: newSubjectCode,
    newProgramName,
    newProgramCode,
    programLevel: newProgramLevel,
    year: newYear,
    venueType: newVenueType,
    programCapacity: newProgramCapacity,
  };
};



// export const checkProgramMixCollision = async (targetSlot, slotsToMix) => {
//   const { day, start_time, end_time, subject_code } = targetSlot;

//   // Program names to check
//   const programs = [...new Set(slotsToMix.map(s => s.program_name).filter(Boolean))];

//   // Prevent checking against itself AND its merging members
//   const skipTheseIds = [targetSlot.id, ...slotsToMix.map(s => s.id)];

//   const [rows] = await db.query(
//     `SELECT * FROM extracted_timetables
//      WHERE day = ?
//        AND id NOT IN (?)
//        AND (
//           (start_time >= ? AND start_time < ?) OR
//           (end_time > ? AND end_time <= ?) OR
//           (start_time <= ? AND end_time >= ?)
//        )`,
//     [
//       day,
//       skipTheseIds,
//       start_time, end_time,
//       start_time, end_time,
//       start_time, end_time
//     ]
//   );

//   // Check if any program in mixing has another different subject at that time
//   for (const entry of rows) {
//     const isProgramBeingMixed = programs.includes(entry.program_name);

//     if (isProgramBeingMixed && entry.subject_code !== subject_code) {
//       return {
//         found: true,
//         conflict: entry,
//         reason: `Program ${entry.program_name} has another different subject at this time`
//       };
//     }
//   }

//   return { found: false };
// };
