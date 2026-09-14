// One-time production migration + backfill for extracted_timetables.session_group_id.
//
// Run this ONCE, on the production server, after deploying the 14 code files but before
// letting anyone use the timetable pages (booking/edit/exchange/delete all read/write this
// column now). Take a database backup first.
//
// Usage (from the production app's project directory, so it picks up the production .env):
//   node migrate-session-group-id.mjs
//
// What it does, in order:
//   1. Adds extracted_timetables.session_group_id as a NULLable column, if it doesn't
//      already exist.
//   2. Backfills every row currently missing a value: groups rows into "double slots" (a
//      class's two consecutive 45-minute periods) - rows sharing
//      day/subject_code/created_by/venue_id/program_code/semester, chained ONLY when one
//      row's end_time exactly equals the next row's start_time. This is exactly how the
//      app itself creates a booking's two rows, so it recovers the original booking
//      groupings from the existing data.
//   3. Once every row has a value, locks the column to NOT NULL and adds an index.
//   4. Prints a verification summary - total rows, total groups, and a group-size
//      histogram. Every group should be size 1 or 2; anything larger means something
//      unexpected in the data and should be investigated before using the app.
//
// Safe to re-run: step 1 and step 3 check first and skip if already done; step 2 only
// touches rows that still have session_group_id IS NULL.
import crypto from 'crypto';
import db from './db.js';

async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].c > 0;
}

async function indexExists(table, indexName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return rows[0].c > 0;
}

console.log('=== Step 1: Ensure session_group_id column exists ===');
if (await columnExists('extracted_timetables', 'session_group_id')) {
  console.log('Column already exists - skipping ADD COLUMN.');
} else {
  await db.query(`ALTER TABLE extracted_timetables ADD COLUMN session_group_id VARCHAR(36) NULL`);
  console.log('Added session_group_id column (nullable for now - locked to NOT NULL in step 3).');
}

console.log('\n=== Step 2: Backfill rows missing a session_group_id ===');
const [rows] = await db.query(
  `SELECT id, day, start_time, end_time, subject_code, created_by, venue_id, program_code, semester
   FROM extracted_timetables
   WHERE session_group_id IS NULL
   ORDER BY day, subject_code, created_by, venue_id, program_code, semester, start_time`
);
console.log(`Found ${rows.length} row(s) needing a session_group_id.`);

if (rows.length > 0) {
  const buckets = new Map();
  for (const r of rows) {
    const key = [r.day, r.subject_code, r.created_by, r.venue_id, r.program_code, r.semester].join('|');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  }

  const updates = []; // { id, session_group_id }
  let groupCount = 0;

  for (const [, bucketRows] of buckets) {
    let i = 0;
    while (i < bucketRows.length) {
      const current = bucketRows[i];
      const next = bucketRows[i + 1];
      const groupId = crypto.randomUUID();
      groupCount++;

      if (next && current.end_time === next.start_time) {
        // Genuinely contiguous - the two rows of one double-slot booking.
        updates.push({ id: current.id, session_group_id: groupId });
        updates.push({ id: next.id, session_group_id: groupId });
        i += 2;
      } else {
        // No contiguous partner - a singleton (a single-period booking).
        updates.push({ id: current.id, session_group_id: groupId });
        i += 1;
      }
    }
  }

  console.log(`Formed ${groupCount} group(s) across ${buckets.size} bucket(s), covering ${updates.length} row(s).`);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const u of updates) {
      await conn.query(`UPDATE extracted_timetables SET session_group_id = ? WHERE id = ?`, [u.session_group_id, u.id]);
    }
    await conn.commit();
    console.log('Backfill committed.');
  } catch (err) {
    await conn.rollback();
    console.error('Backfill failed and was rolled back. The column stays nullable - safe to investigate and re-run this script.');
    console.error(err);
    process.exit(1);
  } finally {
    conn.release();
  }
} else {
  console.log('Nothing to backfill.');
}

console.log('\n=== Step 3: Lock the column (NOT NULL + index) ===');
const [[{ remaining }]] = await db.query(
  `SELECT COUNT(*) AS remaining FROM extracted_timetables WHERE session_group_id IS NULL`
);
if (remaining > 0) {
  console.error(`ABORTING before locking the column: ${remaining} row(s) still have no session_group_id.`);
  console.error('Not safe to add the NOT NULL constraint yet - investigate those rows, then re-run this script.');
  process.exit(1);
}

if (await indexExists('extracted_timetables', 'idx_session_group_id')) {
  console.log('Index already exists - column presumably already locked. Skipping.');
} else {
  await db.query(
    `ALTER TABLE extracted_timetables
       MODIFY session_group_id VARCHAR(36) NOT NULL,
       ADD INDEX idx_session_group_id (session_group_id)`
  );
  console.log('Column locked to NOT NULL and indexed.');
}

console.log('\n=== Step 4: Verification ===');
const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM extracted_timetables`);
const [groupSizes] = await db.query(
  `SELECT session_group_id, COUNT(*) AS c FROM extracted_timetables GROUP BY session_group_id`
);
const sizeHistogram = {};
groupSizes.forEach(g => { sizeHistogram[g.c] = (sizeHistogram[g.c] || 0) + 1; });

console.log(`Total rows: ${total}`);
console.log(`Total groups: ${groupSizes.length}`);
console.log('Group size histogram (size -> number of groups with that size):', sizeHistogram);

const maxSize = groupSizes.length ? Math.max(...groupSizes.map(g => g.c)) : 0;
console.log(`Max group size: ${maxSize} (expected: 2 - a class booked as a single 45-min period would show as 1, which is also fine)`);
if (maxSize > 2) {
  console.warn('\n⚠️  WARNING: found a group larger than 2. That means some rows unexpectedly share the same day/subject_code/created_by/venue_id/program_code/semester and are exactly back-to-back. Look into this before relying on edit/exchange/delete for those rows.');
}

process.exit(0);
