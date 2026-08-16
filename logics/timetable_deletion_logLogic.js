// logics/timetable_deletion_logLogic.js
import db from '../db.js';

export const getAllDeletionLogs = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT log_id, timetable_id, venue_id, venue_name, day, start_time, end_time,
             subject_code, tutor_name, program_name, deleted_by, reason, created_at
      FROM timetable_deletion_log
      ORDER BY created_at DESC
    `);

    res.render('timetable_deletion_log', {
      logs: rows,
      message: req.session?.message || null
    });

    if (req.session?.message) delete req.session.message;
  } catch (err) {
    console.error('[Deletion Logs] Fetch error:', err.message);
    res.render('timetable_deletion_log', {
      logs: [],
      message: { type: 'danger', text: 'Unable to load deletion logs at this time' }
    });
  }
};

export const deleteOneLog = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute(
      'DELETE FROM timetable_deletion_log WHERE log_id = ?',
      [id]
    );

    req.session.message = result.affectedRows > 0
      ? { type: 'success', text: `Log entry #${id} deleted successfully` }
      : { type: 'warning', text: `Log entry #${id} not found` };

  } catch (err) {
    console.error('[Deletion Logs] Delete one error:', err.message);
    req.session.message = { type: 'danger', text: 'Failed to delete the selected log entry' };
  }

  res.redirect('/timetable-deletion-logs');
};

export const deleteAllLogs = async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM timetable_deletion_log');

    req.session.message = {
      type: 'success',
      text: `All ${result.affectedRows} deletion log entries cleared successfully`
    };
  } catch (err) {
    console.error('[Deletion Logs] Delete all error:', err.message);
    req.session.message = { type: 'danger', text: 'Failed to clear all deletion logs' };
  }

  res.redirect('/timetable-deletion-logs');
};