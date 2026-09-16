import db from '../db.js';

export function normalizeSemesterToken(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim().toUpperCase();
  if (!raw) return '';

  const compact = raw
    .replace(/SEMESTER/g, '')
    .replace(/SEM/g, '')
    .replace(/\s+/g, '')
    .replace(/[-_]+/g, '')
    .replace(/[()]/g, '');

  if (compact === '1' || compact === 'I' || compact === 'ONE') return 'I';
  if (compact === '2' || compact === 'II' || compact === 'TWO') return 'II';
  if (compact.startsWith('II')) return 'II';
  if (compact.startsWith('I')) return 'I';
  return raw;
}

export const CALENDAR_MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export function normalizeMonthToken(value) {
  const token = String(value || '').trim().toUpperCase().replace(/\.$/, '');
  const aliases = {
    JANUARY: 'JAN', FEBRUARY: 'FEB', MARCH: 'MAR', APRIL: 'APR',
    MAY: 'MAY', JUNE: 'JUN', JULY: 'JUL', AUGUST: 'AUG',
    SEPTEMBER: 'SEP', OCTOBER: 'OCT', NOVEMBER: 'NOV', DECEMBER: 'DEC',
  };
  return aliases[token] || (CALENDAR_MONTHS.includes(token) ? token : '');
}

export function getProgramGroup(programType, programLevel) {
  const type = String(programType || '').trim().toUpperCase();
  if (type === 'VETA') {
    return String(programLevel || '').trim() === '3' ? 'VETA_L3' : 'VETA_L1L2';
  }
  return 'NON_VETA';
}

function normalizeMonths(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeMonthToken).filter(Boolean))];
  }

  if (typeof value === 'string') {
    try {
      return normalizeMonths(JSON.parse(value));
    } catch {
      return normalizeMonths(value.split(','));
    }
  }

  return [];
}

export async function loadSemesterCalendarSettings() {
  try {
    const [rows] = await db.query(`
      SELECT scope_type, scope_key, semester, program_type, calendar_months,
             capacity_threshold_percent, underutilization_threshold
      FROM semester_calendar_settings
      WHERE active = 1
    `);
    return rows;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') return [];
    throw error;
  }
}

function scopeKeys(entry = {}) {
  return [
    ['subject', entry.subject_id],
    ['program', entry.program_id],
    ['program', entry.program_code],
    ['program', entry.program_name],
    ['department', entry.subject_department || entry.department_name],
    ['program_type', entry.program_type],
    ['global', 'global'],
  ].filter(([, key]) => key !== null && key !== undefined && String(key).trim() !== '');
}

export function createSemesterCalendarResolver(rows = []) {
  const settings = rows.map((row) => ({
    ...row,
    scope_type: String(row.scope_type || '').trim().toLowerCase(),
    scope_key: String(row.scope_key || '').trim().toLowerCase(),
    semester: normalizeSemesterToken(row.semester),
    program_type: String(row.program_type || 'NON_VETA').trim().toUpperCase(),
    calendar_months: normalizeMonths(row.calendar_months),
  }));

  return (entryA = {}, semesterA, entryB = {}, semesterB) => {
    const resolveMonths = (entry, semester) => {
      const normalizedSemester = normalizeSemesterToken(semester);
      const group = getProgramGroup(entry.program_type, entry.program_level);
      const keys = scopeKeys(entry).map(([type, key]) => [
        type,
        String(key).trim().toLowerCase(),
      ]);

      const match = settings.find((row) =>
        row.semester === normalizedSemester &&
        (row.program_type === group ||
          row.program_type === String(entry.program_type || '').trim().toUpperCase()) &&
        keys.some(([type, key]) => row.scope_type === type && row.scope_key === key)
      );

      return match?.calendar_months || null;
    };

    const monthsA = resolveMonths(entryA, semesterA);
    const monthsB = resolveMonths(entryB, semesterB);
    if (!monthsA || !monthsB) return true;
    return monthsA.some((month) => monthsB.includes(month));
  };
}

export function getSchedulingThresholds(rows = []) {
  const global = rows.find((row) =>
    String(row.scope_type || '').toLowerCase() === 'global' &&
    String(row.scope_key || '').toLowerCase() === 'global'
  );

  return {
    capacityTolerance: Number(global?.capacity_threshold_percent ?? 20) / 100,
    underutilizationThreshold: Number(global?.underutilization_threshold ?? 0.3),
  };
}

export async function getSemesterOptions() {
  const [rows] = await db.query(`
    SELECT DISTINCT semester
    FROM subjects
    WHERE semester IS NOT NULL AND TRIM(semester) <> ''
    ORDER BY semester
  `);

  return rows
    .map((row) => normalizeSemesterToken(row.semester))
    .filter((value, index, values) => value && values.indexOf(value) === index);
}
