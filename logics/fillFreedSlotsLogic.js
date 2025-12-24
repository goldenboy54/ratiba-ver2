import { getEligibleSubjects, getFreedSlots, addToExtractedTimetable } from "../models/fillFreedSlotsModel.js";

export const renderFillFreedSlots = async (req, res) => {
  try {
    const currentSemester = req.query.semester || "1"; // adjust as needed
    const subjects = await getEligibleSubjects(currentSemester);
    const slots = await getFreedSlots();
    res.render("fillFreedSlots", { subjects, slots, success: null, error: null });
  } catch (err) {
    res.render("fillFreedSlots", { subjects: [], slots: [], success: null, error: err.message });
  }
};

export const handleAddTimetable = async (req, res) => {
  let { subject_id, freed_slot_id } = req.body;
  if (!Array.isArray(subject_id)) subject_id = [subject_id]; // Allow multiple selection
  const created_by = req.user?.name || "System";

  try {
    const result = await addToExtractedTimetable(subject_id, freed_slot_id, created_by);
    const currentSemester = req.query.semester || "1";
    const subjects = await getEligibleSubjects(currentSemester);
    const slots = await getFreedSlots();
    res.render("fillFreedSlots", { subjects, slots, success: result.message, error: null });
  } catch (err) {
    const currentSemester = req.query.semester || "1";
    const subjects = await getEligibleSubjects(currentSemester);
    const slots = await getFreedSlots();
    res.render("fillFreedSlots", { subjects, slots, success: null, error: err.message });
  }
};
