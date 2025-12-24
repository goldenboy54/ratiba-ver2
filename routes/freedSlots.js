import express from "express";
import { getFreedSlots } from "../logics/freedSlots.Logic.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const venue_id = req.query.venue_id || "";
    const day = req.query.day || "";

    // Get slots and venues
    const { freed, venues, total } = await getFreedSlots(venue_id, day, limit, offset);

    const totalPages = Math.ceil(total / limit);

    // === Stats Calculation ===
    const venueStatsMap = {};
    const timeStatsMap = {};

    freed.forEach(f => {
      // Venue frequency
      venueStatsMap[f.venue_name] = (venueStatsMap[f.venue_name] || 0) + 1;

      // Time slot frequency
      const timeKey = `${f.start_time}-${f.end_time}`;
      timeStatsMap[timeKey] = (timeStatsMap[timeKey] || 0) + 1;
    });

    const venueStats = Object.keys(venueStatsMap).map(k => ({
      venue: k,
      count: venueStatsMap[k],
    }));

    const timeStats = Object.keys(timeStatsMap).map(k => ({
      time: k,
      count: timeStatsMap[k],
    }));

    // === Render template ===
    res.render("freedSlots", {
      freed,
      venues,
      page,
      totalPages,
      venue_id,
      day,
      venueStats,
      timeStats,
    });

  } catch (err) {
    console.error(err);
    res.render("freedSlots", {
      freed: [],
      venues: [],
      page: 1,
      totalPages: 1,
      venue_id: "",
      day: "",
      venueStats: [],
      timeStats: [],
    });
  }
});

export default router;
