// models/collisionReportModel.js
import db from "../db.js";

/**
 * Fetch all timetable slots needed for report.
 * Only select fields required for the report to keep payload small.
 */
export const fetchAllSlots = async (semester = '') => {
  const q = `
    SELECT *,id, day, start_time, end_time,
           subject_code,program_name, subject_name,
           venue_name, venue_id,
           tutor_name,
           program_name, program_code, program_type,
           created_at
    FROM extracted_timetables
    ${semester ? 'WHERE semester = ?' : ''}
    ORDER BY FIELD(day,'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'), start_time, id
  `;
  const [rows] = await db.query(q, semester ? [semester] : []);
  return rows;
};
