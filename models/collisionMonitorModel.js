// models/collisionMonitorModel.js
import db from "../db.js";

/**
 * Get all slots ordered by day, start_time, then creation
 */
export const getAllSlots = async () => {
  const [rows] = await db.query(
    `SELECT *
     FROM extracted_timetables
     ORDER BY FIELD(day,'MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'),
              start_time, created_at`
  );
  return rows;
};

/**
 * Get all slots for a given venue on a given day
 */
export const getSlotsByVenueAndDay = async (venue_id, day) => {
  const [rows] = await db.query(
    `SELECT *
     FROM extracted_timetables
     WHERE venue_id=? AND day=?
     ORDER BY start_time`,
    [venue_id, day]
  );
  return rows;
};

/**
 * Relocate a slot to new day/start/end
 */
export const relocateSlot = async (slotId, newDay, newStart, newEnd, movedBy) => {
  const [res] = await db.query(
    `UPDATE extracted_timetables
     SET day=?, start_time=?, end_time=?, updated_by=?, updated_at=NOW()
     WHERE id=?`,
    [newDay, newStart, newEnd, movedBy || "collision_monitor", slotId]
  );
  return res;
};

/**
 * Get all venues of a given type and capacity (used for smart relocation)
 * venue_type: 'theory' or 'lab'
 * capacity: number
 */
export const getVenuesByTypeAndCapacity = async (venue_type, capacity) => {
  const [rows] = await db.query(
    `SELECT *
     FROM venues
     WHERE type=? AND capacity>=?
     ORDER BY capacity ASC`,
    [venue_type, capacity]
  );
  return rows;
};

/**
 * Optional: get a single slot by ID
 */
export const getSlotById = async (slotId) => {
  const [rows] = await db.query(
    `SELECT * FROM extracted_timetables WHERE id=?`,
    [slotId]
  );
  return rows[0] || null;
};
