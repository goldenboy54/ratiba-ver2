import express from "express";
import { renderFillFreedSlots, handleAddTimetable } from "../logics/fillFreedSlotsLogic.js";

const router = express.Router();

router.get("/", renderFillFreedSlots);
router.post("/add", handleAddTimetable);

export default router;
