import express from 'express';
import db from '../db.js';
import { CALENDAR_MONTHS, normalizeMonthToken, normalizeSemesterToken } from '../models/semesterCalendar.js';

const router = express.Router();

export const canMutateSemesterCalendar = (role = '') => {
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'admin' || normalized === 'tmaster';
};

const ensureSchema = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS semester_calendar_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      scope_type VARCHAR(30) NOT NULL DEFAULT 'global',
      scope_key VARCHAR(120) NOT NULL DEFAULT 'global',
      semester VARCHAR(60) NOT NULL DEFAULT 'I',
      program_type VARCHAR(120) NOT NULL DEFAULT 'NON_VETA',
      calendar_months JSON NOT NULL,
      capacity_threshold_percent INT NOT NULL DEFAULT 20,
      underutilization_threshold DECIMAL(5,3) NOT NULL DEFAULT 0.300,
      active TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_semester_scope (scope_type, scope_key, semester, program_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const normalizeSetting = (row) => ({
  ...row,
  calendar_months: typeof row.calendar_months === 'string'
    ? JSON.parse(row.calendar_months)
    : row.calendar_months || [],
  capacity_threshold_percent: Number(row.capacity_threshold_percent || 20),
  underutilization_threshold: Number(row.underutilization_threshold || 0.3),
  active: Number(row.active) === 1,
});

router.get('/', async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await db.query(`
      SELECT *
      FROM semester_calendar_settings
      WHERE active = 1
      ORDER BY scope_type, scope_key, semester, program_type
    `);

    res.render('semester-settings', {
      settings: rows.map(normalizeSetting),
      canEdit: canMutateSemesterCalendar(req.user?.role),
      error: null,
      success: null,
    });
  } catch (error) {
    console.error('SEMESTER_SETTINGS_PAGE_ERROR', error);
    res.status(500).render('semester-settings', {
      settings: [],
      canEdit: false,
      error: error.message || 'Unable to load semester settings',
      success: null,
    });
  }
});

router.get('/api', async (req, res) => {
  try {
    await ensureSchema();
    const [rows] = await db.query(`
      SELECT *
      FROM semester_calendar_settings
      WHERE active = 1
      ORDER BY scope_type, scope_key, semester, program_type
    `);
    res.json({ success: true, settings: rows.map(normalizeSetting) });
  } catch (error) {
    console.error('SEMESTER_SETTINGS_GET_ERROR', error);
    res.status(500).json({ error: error.message || 'Unable to load semester settings' });
  }
});

router.post('/api', async (req, res) => {
  try {
    if (!canMutateSemesterCalendar(req.user?.role)) {
      return res.status(403).json({ error: 'Only admin or timetable master can edit semester settings.' });
    }

    await ensureSchema();
    const payload = req.body || {};
    const scopeType = String(payload.scope_type || 'global').trim().toLowerCase();
    const scopeKey = String(payload.scope_key || 'global').trim().toLowerCase();
    const semester = normalizeSemesterToken(payload.semester || 'I');
    const programType = String(payload.program_type || 'NON_VETA').trim().toUpperCase();
    const rawMonths = Array.isArray(payload.calendar_months)
      ? payload.calendar_months
      : String(payload.calendar_months || '').split(',');
    const months = [...new Set(rawMonths.map(normalizeMonthToken).filter(Boolean))];

    if (!['I', 'II'].includes(semester)) {
      return res.status(400).json({ error: 'Semester must be I or II.' });
    }
    if (!months.length) {
      return res.status(400).json({ error: 'At least one calendar month is required.' });
    }
    if (rawMonths.some((month) => String(month).trim() && !normalizeMonthToken(month))) {
      return res.status(400).json({
        error: `Invalid month. Use only: ${CALENDAR_MONTHS.join(', ')}.`,
      });
    }

    if (payload.id) {
      await db.query(`
        UPDATE semester_calendar_settings
        SET scope_type = ?, scope_key = ?, semester = ?, program_type = ?,
            calendar_months = ?, capacity_threshold_percent = ?,
            underutilization_threshold = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND active = 1
      `, [
        scopeType,
        scopeKey,
        semester,
        programType,
        JSON.stringify(months),
        Number(payload.capacity_threshold_percent ?? 20),
        Number(payload.underutilization_threshold ?? 0.3),
        payload.id,
      ]);
    } else {
      await db.query(`
        INSERT INTO semester_calendar_settings
          (scope_type, scope_key, semester, program_type, calendar_months,
           capacity_threshold_percent, underutilization_threshold, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          calendar_months = VALUES(calendar_months),
          capacity_threshold_percent = VALUES(capacity_threshold_percent),
          underutilization_threshold = VALUES(underutilization_threshold),
          active = 1
      `, [
        scopeType,
        scopeKey,
        semester,
        programType,
        JSON.stringify(months),
        Number(payload.capacity_threshold_percent ?? 20),
        Number(payload.underutilization_threshold ?? 0.3),
      ]);
    }

    res.json({ success: true, message: 'Semester calendar setting saved.' });
  } catch (error) {
    console.error('SEMESTER_SETTINGS_POST_ERROR', error);
    res.status(500).json({ error: error.message || 'Unable to save semester settings' });
  }
});

router.post('/api/delete', async (req, res) => {
  try {
    if (!canMutateSemesterCalendar(req.user?.role)) {
      return res.status(403).json({ error: 'Only admin or timetable master can delete semester settings.' });
    }

    await ensureSchema();
    await db.query('UPDATE semester_calendar_settings SET active = 0 WHERE id = ?', [req.body?.id]);
    res.json({ success: true, message: 'Semester calendar setting deleted.' });
  } catch (error) {
    console.error('SEMESTER_SETTINGS_DELETE_ERROR', error);
    res.status(500).json({ error: error.message || 'Unable to delete semester setting' });
  }
});

export default router;
