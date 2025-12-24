// collisionMonitorRoutes.js
import express from "express";
import { runCollisionMonitor } from "../logics/collisionMonitorLogic.js";

const router = express.Router();

router.get("/collision-monitor", async (req, res) => {
  res.render("collision_monitor", { title: "Collision Monitor" });
});

router.post("/collision-monitor/run", async (req, res) => {
  try {
    const user = req.body.user || req.user?.username || "collision_monitor";
    const result = await runCollisionMonitor({ user });
    res.json({ ok: true, result });
  } catch (err) {
    console.error("Collision monitor error:", err);
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

export default router;
