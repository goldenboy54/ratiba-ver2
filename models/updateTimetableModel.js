import db from '../db.js';

// Fetch timetable for filter or display
export const listTimetables = async (filter={}) => {
  let sql = "SELECT * FROM extracted_timetables WHERE 1=1";
  const params = [];
  if(filter.tutor_name) { sql += " AND tutor_name=?"; params.push(filter.tutor_name); }
  if(filter.subject_code) { sql += " AND subject_code=?"; params.push(filter.subject_code); }
  sql += " ORDER BY FIELD(day,'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'), start_time";
  const [rows] = await db.query(sql, params);
  return rows;
};

export const getTimetableById = async (id) => {
  const [rows] = await db.query("SELECT * FROM extracted_timetables WHERE id=?", [id]);
  return rows[0];
};

export const updateTimetableSlot = async (id, data) => {
  const query = `UPDATE extracted_timetables
                 SET day=?, start_time=?, end_time=?, venue_name=?, tutor_name=?, subject_name=?, subject_code=?, program_name=?, program_level=?
                 WHERE id=?`;
  const [res] = await db.query(query, [
    data.day, data.start_time, data.end_time, data.venue_name,
    data.tutor_name, data.subject_name, data.subject_code,
    data.program_name, data.program_level, id
  ]);
  return res;
};

// Mix programs into target
export const mixPrograms = async (targetId, programIds) => {
  const [targetRows] = await db.query("SELECT * FROM extracted_timetables WHERE id=?", [targetId]);
  if(!targetRows.length) throw new Error("Target slot not found");
  const target = targetRows[0];

  const [programs] = await db.query("SELECT * FROM extracted_timetables WHERE id IN (?)", [programIds]);
  if(!programs.length) throw new Error("Programs not found");

  const mixedName = [target.subject_name, ...programs.map(p=>p.subject_name)].join(" + ");
  const mixedCode = [target.subject_code, ...programs.map(p=>p.subject_code)].join(",");

  await db.query("UPDATE extracted_timetables SET subject_name=?, subject_code=? WHERE id=?", [mixedName, mixedCode, targetId]);
  return { mixedName, mixedCode };
};

// Delete program from slot
export const removeProgramFromMix = async (targetId, removeCode) => {
  const slot = await getTimetableById(targetId);
  const codes = slot.subject_code.split(",");
  const names = slot.subject_name.split(" + ");
  const index = codes.indexOf(removeCode);
  if(index !== -1) {
    codes.splice(index,1);
    names.splice(index,1);
  }
  const mixedName = names.join(" + ");
  const mixedCode = codes.join(",");
  await db.query("UPDATE extracted_timetables SET subject_name=?, subject_code=? WHERE id=?", [mixedName, mixedCode, targetId]);
  return { mixedName, mixedCode };
};

// List freed slots (optional)
export const listFreedSlots = async () => {
  const [rows] = await db.query("SELECT * FROM freed_slots ORDER BY created_at DESC LIMIT 100");
  return rows;
};

// Save freed slot
export const saveFreedSlot = async (data) => {
  const query = `INSERT INTO freed_slots (venue_id, venue_name, day, start_time, end_time, released_by, reason)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const [res] = await db.query(query, [data.venue_id, data.venue_name, data.day, data.start_time, data.end_time, data.released_by, data.reason]);
  return res;
};

// List all tutors
export const listTutors = async () => {
  const [rows] = await db.query("SELECT DISTINCT tutor_name FROM extracted_timetables ORDER BY tutor_name");
  return rows;
};

// List subjects by tutor
export const listSubjectsByTutor = async (tutor) => {
  const [rows] = await db.query("SELECT DISTINCT subject_code, subject_name FROM extracted_timetables WHERE tutor_name=? ORDER BY subject_code", [tutor]);
  return rows;
};

// List slots per subject code
export const listSlotsBySubject = async (subject_code) => {
  const [rows] = await db.query("SELECT * FROM extracted_timetables WHERE subject_code=? ORDER BY day,start_time", [subject_code]);
  return rows;
};
