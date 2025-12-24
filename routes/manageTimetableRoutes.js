import express from "express";
import {
  listTutors,
  listSubjectsByTutor,
  listSlotsBySubject,
  listProgramsByTutorAndSubject,
  getTimetableById,
} from "../models/manageTimetableModel.js";
import { mixTimetableLogic } from "../logics/manageTimetableLogic.js";

const router = express.Router();


// GET manage timetable page
router.get("/", async (req, res) => {
  try {
    const filter = {
      tutor_name: req.query.tutor || "",
      subject_code: req.query.subject_code || "",
    };

    const tutors = await listTutors();
    const subjects = filter.tutor_name
      ? await listSubjectsByTutor(filter.tutor_name)
      : [];
    const slots = filter.subject_code
      ? await listSlotsBySubject(filter.subject_code)
      : [];
    const programs =
      filter.tutor_name && filter.subject_code
        ? await listProgramsByTutorAndSubject(
            filter.tutor_name,
            filter.subject_code,
          )
        : [];

    res.render("manageTimetable", {
      tutors,
      subjects,
      slots,
      programs,
      filter,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    res.render("manageTimetable", {
      tutors: [],
      subjects: [],
      slots: [],
      programs: [],
      filter: {},
      error: err.message,
      success: null,
    });
  }
});


// ✅ POST mix timetable
router.post("/mix", async (req, res) => {
  try {
    let { targetSlotId, selectedProgramIds } = req.body;

    if (!targetSlotId) throw new Error("⚠ Please select a target slot first.");
    if (!selectedProgramIds || selectedProgramIds.length === 0)
      throw new Error("⚠ Please select at least one program to mix.");

    if (!Array.isArray(selectedProgramIds))
      selectedProgramIds = [selectedProgramIds];

    await mixTimetableLogic(
      targetSlotId,
      selectedProgramIds,
      req.user?.full_name || "System"
    );

    res.redirect("/manageTimetable?success= Programs mixed successfully!");
  } catch (err) {
    res.redirect(`/manageTimetable?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
