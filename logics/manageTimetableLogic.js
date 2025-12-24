import { getTimetableById, mixPrograms } from "../models/manageTimetableModel.js";

export const mixTimetableLogic = async (targetSlotId, selectedProgramIds, userName) => {
  const targetSlot = await getTimetableById(targetSlotId);
  if (!targetSlot) throw new Error("❌ Target slot not found.");

  const programsToMix = [];

  for (let pid of selectedProgramIds) {
    const prog = await getTimetableById(pid);
    if (!prog) throw new Error(`❌ Program ID ${pid} not found.`);

    // Prevent same slot mix
    if (prog.program_name === targetSlot.program_name) {
      throw new Error(`⚠ Cannot mix same program (${prog.program_name}) with itself.`);
    }

    // Venue & time collision prevention
    if (
      prog.day === targetSlot.day &&
      prog.venue_name === targetSlot.venue_name &&
      prog.start_time === targetSlot.start_time
    ) {
      throw new Error(`⛔ Time collision detected in ${prog.venue_name} at ${prog.start_time}.`);
    }

    programsToMix.push(prog);
  }

  // Mix programs — subject remains same
  return await mixPrograms(targetSlotId, programsToMix, userName);
};
