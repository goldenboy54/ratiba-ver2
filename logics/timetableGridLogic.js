// Shared TIME x DAY grid builder for the timetable display pages (searchtimetable,
// viewtimetable, viewTimetableByProgramCode, and their PDF exports). Collapses consecutive
// slots that are really the same ongoing class into one taller grid cell (HTML rowspan)
// labeled with the combined time range, instead of repeating the same class's details in
// every 45-minute row it occupies.
//
// This is deliberately NOT based on session_group_id: that column always marks exactly one
// double-slot (2 x 45min) booking action, which is what exchange/edit/delete must act on -
// see models/manualTimetableModel.js / tmasterModel.js. A tutor's class often spans several
// separate booking actions back-to-back (e.g. two double-slot bookings made a few seconds
// apart), and those should still display as one continuous block even though they must stay
// separately exchangeable. So "is this the same class continuing" is decided here purely by
// business key (subject + venue + program + semester, matching for the SAME day) - matching
// deliberately excludes tutor_name so genuine co-teaching (several tutors, one class, same
// slot) still merges into one cell, while two different tutors' unrelated classes that
// merely coincide in time stay separate because they're normally in different venues.

export const WEEKDAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const BREAKS = [
  { time: '10:35 - 11:00', type: 'Tea Break' },
  { time: '12:30 - 13:15', type: 'Lunch Break' },
];

const toShort = (t) => (t ? String(t).slice(0, 5) : t);
const slotKeyOf = (t) => {
  const start = toShort(t.start_time);
  const end = toShort(t.end_time);
  return start && end ? `${start} - ${end}` : null;
};
// Deliberately excludes tutor_name (see file header) - identifies "the same class" for both
// merging co-taught tutors within one slot and merging consecutive slots into one block.
const businessKeyOf = (t) => [t.subject_code, t.venue_name, t.program_code, t.semester].join('|');

/**
 * Builds a TIME x DAY grid from raw (ungrouped) timetable rows.
 *
 * Returns:
 *   uniqueDays: weekdays present in the data, in weekday order
 *   allSlots:   every real slot time present in the data, plus the fixed break times,
 *               sorted chronologically
 *   grid:       grid[day][slotIndex] describes what to render for that cell:
 *                 { type: 'break', label }                    - a Tea/Lunch break row
 *                 { type: 'empty' }                            - nothing booked
 *                 { type: 'skip' }                             - covered by a rowspan
 *                                                                 from an earlier row;
 *                                                                 render nothing
 *                 { type: 'entry', rowspan, entries,
 *                   tutorNames, combinedLabel }                - render this cell,
 *                                                                 spanning `rowspan` rows
 */
export function buildTimetableGrid(timetables) {
  const daysInData = new Set(timetables.map(t => t.day));
  const uniqueDays = WEEKDAY_ORDER.filter(d => daysInData.has(d));

  const bySlot = {};
  for (const t of timetables) {
    const key = slotKeyOf(t);
    if (!key) continue;
    if (!bySlot[key]) bySlot[key] = [];
    bySlot[key].push(t);
  }

  const slotSet = new Set(Object.keys(bySlot));
  BREAKS.forEach(b => slotSet.add(b.time));

  const allSlots = [...slotSet].sort((a, b) => {
    const toMinutes = (s) => {
      const [h, m] = s.split(' - ')[0].split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(a) - toMinutes(b);
  });

  const isBreakSlot = (slot) => BREAKS.some(b => b.time === slot);

  const grid = {};
  for (const day of uniqueDays) {
    const col = new Array(allSlots.length).fill(null);
    let i = 0;
    while (i < allSlots.length) {
      const slot = allSlots[i];
      const brk = BREAKS.find(b => b.time === slot);
      if (brk) {
        col[i] = { type: 'break', label: brk.type };
        i++;
        continue;
      }

      // Co-teaching puts one row per tutor into extracted_timetables, all sharing the same
      // business key - filter() (not find()) collects every one of them. Restricting to
      // entries[0]'s own key (not just day+slot) matters for unfiltered/all-tutor views,
      // where two unrelated classes in different venues can coincidentally land in the same
      // slot - those must stay separate, not get merged into one fake "co-taught" entry.
      const dayEntries = (bySlot[slot] || []).filter(t => t.day === day);
      if (!dayEntries.length) {
        col[i] = { type: 'empty' };
        i++;
        continue;
      }

      const key = businessKeyOf(dayEntries[0]);
      const entries = dayEntries.filter(t => businessKeyOf(t) === key);
      let span = 1;
      let j = i + 1;
      while (j < allSlots.length && !isBreakSlot(allSlots[j])) {
        const nextEntries = (bySlot[allSlots[j]] || []).filter(t => t.day === day);
        const continues = nextEntries.some(t => businessKeyOf(t) === key);
        if (!continues) break;
        span++;
        j++;
      }

      const tutorNames = [...new Set(entries.map(e => e.tutor_name).filter(Boolean))].join(' & ');
      const combinedLabel = span > 1
        ? `${slot.split(' - ')[0]} - ${allSlots[i + span - 1].split(' - ')[1]}`
        : slot;

      col[i] = { type: 'entry', rowspan: span, entries, tutorNames, combinedLabel };
      for (let k = 1; k < span; k++) col[i + k] = { type: 'skip' };
      i += span;
    }
    grid[day] = col;
  }

  return { uniqueDays, allSlots, grid };
}
