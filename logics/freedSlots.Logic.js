import freedSlotsModel from "../models/freedSlotsModel.js";

export const getFreedSlots = async (venue_id, day, limit, offset) => {
  const venues = await freedSlotsModel.getAllVenues();
  const { freed, total } = await freedSlotsModel.getFilteredSlots(venue_id, day, limit, offset);
  return { freed, venues, total };
};
