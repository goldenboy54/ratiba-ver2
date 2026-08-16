// models/timetable_deletion_logModel.js
import db from '../db.js';
class TimetableDeletionLogModel {

  static async create({
    timetable_id,
    venue_id,
    venue_name = null,
    day,
    start_time,
    end_time,
    subject_code = null,
    tutor_name = null,
    program_name = null,
    deleted_by = 'system',
    reason = 'manual deletion'
  }) {
    try {
      const [result] = await db.execute(
        `INSERT INTO timetable_deletion_log 
         (timetable_id, venue_id, venue_name, day, start_time, end_time, 
          subject_code, tutor_name, program_name, deleted_by, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          timetable_id,
          venue_id,
          venue_name,
          day.toLowerCase(),
          start_time,
          end_time,
          subject_code,
          tutor_name,
          program_name,
          deleted_by,
          reason
        ]
      );

      return result.insertId;
    } catch (err) {
      console.error('[DeletionLogModel] create error:', err.message);
      throw err;
    }
  }

  static async findAll() {
    const [rows] = await db.execute(`
      SELECT * FROM timetable_deletion_log 
      ORDER BY created_at DESC
    `);
    return rows;
  }

  static async deleteById(logId) {
    const [result] = await db.execute(
      'DELETE FROM timetable_deletion_log WHERE log_id = ?',
      [logId]
    );
    return result.affectedRows > 0;
  }

  static async deleteAll() {
    const [result] = await db.execute('DELETE FROM timetable_deletion_log');
    return result.affectedRows;
  }
}

export default TimetableDeletionLogModel;