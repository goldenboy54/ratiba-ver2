import db from "../db.js";

const freedSlotsModel = {
  async getAllVenues() {
    const [rows] = await db.query("SELECT DISTINCT venue_id, venue_name FROM freed_slots ORDER BY venue_name");
    return rows;
  },

  async getFilteredSlots(venue_id, day, limit, offset) {
    let query = "SELECT * FROM freed_slots WHERE 1=1";
    const params = [];

    if (venue_id) {
      query += " AND venue_id = ?";
      params.push(venue_id);
    }

    if (day) {
      query += " AND day = ?";
      params.push(day);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [freed] = await db.query(query, params);

    // Count total rows for pagination
    let countQuery = "SELECT COUNT(*) AS total FROM freed_slots WHERE 1=1";
    const countParams = [];

    if (venue_id) {
      countQuery += " AND venue_id = ?";
      countParams.push(venue_id);
    }
    if (day) {
      countQuery += " AND day = ?";
      countParams.push(day);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    return { freed, total };
  },
};



// // ✅ List all venues for filtering freed slots
// export const listVenues = async () => {
//   const [rows] = await db.query(
//     "SELECT DISTINCT venue_id, venue_name FROM freed_slots ORDER BY venue_name"
//   );
//   return rows;
// };

// // ✅ Get freed slots optionally filtered by venue/day
// export const listFreedSlots = async (venue_id, day) => {
//   let query = "SELECT * FROM freed_slots WHERE 1=1";
//   const params = [];

//   if (venue_id) {
//     query += " AND venue_id = ?";
//     params.push(venue_id);
//   }
//   if (day) {
//     query += " AND day = ?";
//     params.push(day);
//   }

//   query += " ORDER BY created_at DESC";

//   const [rows] = await db.query(query, params);
//   return rows;
// };


export default freedSlotsModel;
