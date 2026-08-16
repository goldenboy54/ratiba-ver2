import { getEligibleSubjects, getFreedSlots, addToExtractedTimetable } from "../models/fillFreedSlotsModel.js";

// export const renderFillFreedSlots = async (req, res) => {
//   try {
//     const currentSemester = req.query.semester || "II" || "I" || "1" || "2"  ; // adjust as needed
//     const subjects = await getEligibleSubjects(currentSemester);
//     const slots = await getFreedSlots();
//     res.render("fillFreedSlots", { subjects, slots, success: null, error: null });
//   } catch (err) {
//     res.render("fillFreedSlots", { subjects: [], slots: [], success: null, error: err.message });
//   }
// };

export const renderFillFreedSlots = async (req, res) => {
  try {
    const currentSemester = req.query.semester || "I"; // weka default thabiti, usiweke || mingi
    console.log("Current semester being queried:", currentSemester); // ← angalia console

    const subjects = await getEligibleSubjects(currentSemester);
    console.log("Subjects fetched:", subjects.length, "rows");     // ← angalia idadi
    console.log("First subject (if any):", subjects[0] || "NO SUBJECTS"); // ← angalia content

    const slots = await getFreedSlots();
    console.log("Freed slots:", slots.length);

    res.render("fillFreedSlots", { 
      subjects, 
      slots, 
      currentSemester,   // ← ongeza hii ili view iweze kuitumia
      success: null, 
      error: null 
    });
  } catch (err) {
    console.error("Error in renderFillFreedSlots:", err);
    res.render("fillFreedSlots", { 
      subjects: [], 
      slots: [], 
      currentSemester: req.query.semester || "I",
      success: null, 
      error: err.message 
    });
  }
};

export const handleAddTimetable = async (req, res) => {
  let { subject_id, freed_slot_id } = req.body;
  if (!Array.isArray(subject_id)) subject_id = [subject_id]; // Allow multiple selection
  const created_by = req.user?.name || "System";

  try {
    const result = await addToExtractedTimetable(subject_id, freed_slot_id, created_by);
    const currentSemester = req.query.semester || "II" || "I" || "1" || "2"  ; // adjust as needed
    const subjects = await getEligibleSubjects(currentSemester);
    const slots = await getFreedSlots();
    res.render("fillFreedSlots", { subjects, slots, success: result.message, error: null });
  } catch (err) {
    const currentSemester = req.query.semester || "II" || "I" || "1" || "2" ; // adjust as needed;
    const subjects = await getEligibleSubjects(currentSemester);
    const slots = await getFreedSlots();
    res.render("fillFreedSlots", { subjects, slots, success: null, error: err.message });
  }
};
