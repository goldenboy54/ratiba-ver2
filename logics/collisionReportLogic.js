// controllers/collisionReportController.js
import { fetchAllSlots } from "../models/collisionReportModel.js";

/**
 * Helper utilities
 */
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [hh, mm] = t.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
};

const overlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

const parseProgramCodes = (program_code) => {
  if (!program_code) return [];
  return program_code
    .split("+")
    .map(p => p.trim())
    .filter(Boolean);
};

const slotLabel = (s) =>
  `#${s.id} | ${s.day} ${s.start_time}-${s.end_time} | ${s.venue_name || '—'} | ${s.subject_code} - ${s.subject_name} | Tutor: ${s.tutor_name || '—'} | ProgCode: ${s.program_code || '—'}`;

/**
 * Main Collision Report Controller - Fully Fixed & Reliable Version
 */
export const showCollisionReport = async (req, res) => {
  try {
    const slots = await fetchAllSlots();

    // Enrich slots with normalized data for reliable comparison
    const enriched = slots.map(s => ({
      ...s,
      startMin: timeToMinutes(s.start_time),
      endMin: timeToMinutes(s.end_time),
      parsedPrograms: parseProgramCodes(s.program_code),
      label: slotLabel(s),
      // Normalized fields for accurate collision detection
      normVenue: s.venue_name ? s.venue_name.trim() : '',
      normTutor: s.tutor_name ? s.tutor_name.trim().toLowerCase() : '',
      normProgramName: s.program_name ? s.program_name.trim().toLowerCase() : ''
    }));

    const programCollisions = [];
    const tutorCollisions = [];
    const venueCollisions = [];
    const seen = new Set();

    // Pairwise comparison - Reliable version
    for (let i = 0; i < enriched.length; i++) {
      const a = enriched[i];
      for (let j = i + 1; j < enriched.length; j++) {
        const b = enriched[j];

        // Basic filters
        if (a.day !== b.day) continue;
        if (!overlap(a.startMin, a.endMin, b.startMin, b.endMin)) continue;

        // ====================== 1. VENUE COLLISION (FIXED - Using venue_name) ======================
        if (a.normVenue && b.normVenue && 
            a.normVenue.toLowerCase() === b.normVenue.toLowerCase()) {
          
          const key = `venue::${[a.id, b.id].sort().join("-")}`;
          if (!seen.has(key)) {
            seen.add(key);
            venueCollisions.push({
              type: "venue",
              ids: [a.id, b.id],
              day: a.day,
              venue_name: a.venue_name,
              overlapTime: `${a.start_time} - ${b.end_time}`,
              slots: [a, b].map(x => ({
                id: x.id,
                label: x.label,
                venue: x.venue_name,
                program_type: x.program_type || '—'
              })),
            });
          }
        }

        // ====================== 2. TUTOR COLLISION ======================
        if (a.normTutor && b.normTutor && a.normTutor === b.normTutor) {
          
          const key = `tutor::${[a.id, b.id].sort().join("-")}`;
          if (!seen.has(key)) {
            seen.add(key);
            tutorCollisions.push({
              type: "tutor",
              ids: [a.id, b.id],
              day: a.day,
              tutor: a.tutor_name,
              slots: [a, b].map(x => ({
                id: x.id,
                label: x.label,
                venue: x.venue_name || '—',
                program_type: x.program_type || '—'
              })),
            });
          }
        }

        // ====================== 3. PROGRAM COLLISION ======================
        const aProgs = a.parsedPrograms;
        const bProgs = b.parsedPrograms;
        let programOverlap = false;
        let matched = [];

        if (aProgs.length && bProgs.length) {
          for (const pa of aProgs) {
            for (const pb of bProgs) {
              if (pa.toLowerCase() === pb.toLowerCase()) {
                programOverlap = true;
                matched.push(pa);
              }
            }
          }
        } 
        else if (!aProgs.length && !bProgs.length) {
          // Fallback: compare program_name
          if (a.normProgramName && b.normProgramName && 
              a.normProgramName === b.normProgramName) {
            programOverlap = true;
            matched.push(a.program_name.trim());
          }
        } 
        else {
          // Mixed case: program codes vs program_name
          if (aProgs.length && b.program_name) {
            for (const pa of aProgs) {
              if (b.program_name.toLowerCase().includes(pa.toLowerCase())) {
                programOverlap = true;
                matched.push(pa);
              }
            }
          }
          if (bProgs.length && a.program_name) {
            for (const pb of bProgs) {
              if (a.program_name.toLowerCase().includes(pb.toLowerCase())) {
                programOverlap = true;
                matched.push(pb);
              }
            }
          }
        }

        if (programOverlap) {
          const key = `program::${[a.id, b.id].sort().join("-")}`;
          if (!seen.has(key)) {
            seen.add(key);
            programCollisions.push({
              type: "program",
              ids: [a.id, b.id],
              day: a.day,
              matchedPrograms: [...new Set(matched)],
              slots: [a, b].map(x => ({
                id: x.id,
                label: x.label,
                venue: x.venue_name || '—',
                program_type: x.program_type || '—'
              })),
            });
          }
        }
      }
    }

    // Final Report Object
    const report = {
      generatedAt: new Date().toISOString(),
      totals: {
        scanned: enriched.length,
        programCollisions: programCollisions.length,
        tutorCollisions: tutorCollisions.length,
        venueCollisions: venueCollisions.length,
      },
      details: {
        programCollisions,
        tutorCollisions,
        venueCollisions
      },
      rawSlots: enriched
    };

    // Render view with embedded JSON for client-side features
    return res.render("collisionReport", { 
      title: "Collision Report", 
      report: JSON.stringify(report) 
    });

  } catch (err) {
    console.error("Error generating collision report:", err);
    return res.status(500).send("Error generating collision report: " + err.message);
  }
};



// // controllers/collisionReportController.js
// import { fetchAllSlots } from "../models/collisionReportModel.js";

// /**
//  * Helper utilities (same logic used server-side to compute collisions,
//  * but actual filtering/export happens client-side)
//  */
// const timeToMinutes = (t) => {
//   if (!t) return 0;
//   const [hh, mm] = t.split(":").map(Number);
//   return hh * 60 + mm;
// };
// const overlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

// const parseProgramCodes = (program_code) => {
//   if (!program_code) return [];
//   return program_code
//     .split("+")
//     .map(p => p.trim())
//     .filter(Boolean);
// };

// const slotLabel = (s) =>
//   `#${s.id} | ${s.day} ${s.start_time}-${s.end_time} | ${s.venue_name} | ${s.subject_code} - ${s.subject_name} | Tutor: ${s.tutor_name} | ProgCode: ${s.program_code || ""}`;

// /**
//  * This server controller computes the raw collision lists and passes them to the view
//  * as JSON embedded on the page. The client-side will enable filtering, CSV & PDF export.
//  */
// export const showCollisionReport = async (req, res) => {
//   try {
//     const slots = await fetchAllSlots();

//     // enrich slots with minute ranges and parsed program codes
//     const enriched = slots.map(s => ({
//       ...s,
//       startMin: timeToMinutes(s.start_time),
//       endMin: timeToMinutes(s.end_time),
//       parsedPrograms: parseProgramCodes(s.program_code),
//       label: slotLabel(s)
//     }));

//     const programCollisions = [];
//     const tutorCollisions = [];
//     const venueCollisions = [];
//     const seen = new Set();

//     // pairwise comparison O(n^2) - OK for typical timetable sizes
//     for (let i = 0; i < enriched.length; i++) {
//       const a = enriched[i];
//       for (let j = i + 1; j < enriched.length; j++) {
//         const b = enriched[j];

//         if (a.day !== b.day) continue;
//         if (!overlap(a.startMin, a.endMin, b.startMin, b.endMin)) continue;

//         // venue collision: same venue id & overlapping
//         if (a.venue_id && b.venue_id && a.venue_id === b.venue_id) {
//           const key = `venue::${[a.id, b.id].sort().join("-")}`;
//           if (!seen.has(key)) {
//             seen.add(key);
//             venueCollisions.push({
//               ids: [a.id, b.id],
//               day: a.day,
//               venue_id: a.venue_id,
//               venue_name: a.venue_name,
//               overlapRange: `${Math.max(a.startMin,b.startMin)} - ${Math.min(a.endMin,b.endMin)}`,
//               slots: [a, b].map(x => ({ id: x.id, label: x.label, program_type: x.program_type })),
//             });
//           }
//         }

//         // tutor collision: same tutor scheduled overlap but different venue
//         if (a.tutor_name && b.tutor_name && a.tutor_name.trim() === b.tutor_name.trim() && a.venue_id !== b.venue_id) {
//           const key = `tutor::${[a.id,b.id].sort().join("-")}`;
//           if (!seen.has(key)) {
//             seen.add(key);
//             tutorCollisions.push({
//               ids: [a.id,b.id],
//               day: a.day,
//               tutor: a.tutor_name,
//               slots: [a,b].map(x => ({ id: x.id, label: x.label, venue: x.venue_name, program_type: x.program_type })),
//             });
//           }
//         }

//         // program collision: any program code in a matches any in b (after parsing)
//         // consider different venues (same program scheduled same time in different venue)
//         const aProgs = a.parsedPrograms;
//         const bProgs = b.parsedPrograms;
//         let programOverlap = false;
//         let matched = [];

//         if (aProgs.length && bProgs.length) {
//           for (const pa of aProgs) {
//             for (const pb of bProgs) {
//               if (pa.toLowerCase() === pb.toLowerCase()) {
//                 programOverlap = true;
//                 matched.push(pa);
//               }
//             }
//           }
//         } else if (!aProgs.length && !bProgs.length) {
//           // fallback: compare program_name
//           if (a.program_name && b.program_name && a.program_name.trim().toLowerCase() === b.program_name.trim().toLowerCase()) {
//             programOverlap = true;
//             matched.push(a.program_name.trim());
//           }
//         } else {
//           // mixed: try to match program_name to codes
//           if (aProgs.length && b.program_name) {
//             for (const pa of aProgs) {
//               if (b.program_name.toLowerCase().includes(pa.toLowerCase())) { programOverlap = true; matched.push(pa); }
//             }
//           }
//           if (bProgs.length && a.program_name) {
//             for (const pb of bProgs) {
//               if (a.program_name.toLowerCase().includes(pb.toLowerCase())) { programOverlap = true; matched.push(pb); }
//             }
//           }
//         }

//         if (programOverlap && a.venue_id !== b.venue_id) {
//           const key = `program::${[a.id,b.id].sort().join("-")}`;
//           if (!seen.has(key)) {
//             seen.add(key);
//             programCollisions.push({
//               ids: [a.id,b.id],
//               day: a.day,
//               matchedPrograms: [...new Set(matched)],
//               slots: [a,b].map(x => ({ id: x.id, label: x.label, venue: x.venue_name, program_type: x.program_type })),
//             });
//           }
//         }
//       }
//     }

//     const report = {
//       generatedAt: new Date().toISOString(),
//       totals: {
//         scanned: enriched.length,
//         programCollisions: programCollisions.length,
//         tutorCollisions: tutorCollisions.length,
//         venueCollisions: venueCollisions.length,
//       },
//       details: {
//         programCollisions,
//         tutorCollisions,
//         venueCollisions
//       },
//       rawSlots: enriched // pass raw slots for client-side filtering/search
//     };

//     // Render the view and embed the report JSON for client-side interactivity
//     return res.render("collisionReport", { title: "Collision Report", report: JSON.stringify(report) });
//   } catch (err) {
//     console.error("Error generating collision report:", err);
//     return res.status(500).send("Error generating collision report: " + err.message);
//   }
// };
