import express from 'express';
// import { viewtimetable, getDistinctValues } from '../logics/viewtimetableLogic.js';
import { viewtimetable, getDistinctValues, getDistinctPrograms } from '../logics/viewtimetableLogic.js';
import { buildTimetableGrid, BREAKS } from '../logics/timetableGridLogic.js';

import pdf from 'html-pdf'; // html-pdf-node instead of puppeteer

const router = express.Router();

// Route to search for timetables
router.get('/viewtimetable', async (req, res) => {
  try {
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      subject_name: req.query.subject,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      program_level: req.query.level,
      program_type: req.query.program_type,
      semester: req.query.semester,
    };

    const timetables = await viewtimetable(criteria);
    const { uniqueDays, allSlots, grid } = buildTimetableGrid(timetables);

    // const programs = await getDistinctValues('program_name');
    const programs = await getDistinctPrograms();  // Hii ndiyo sahihi
    const venues = await getDistinctValues('venue_name');
    const subjects = await getDistinctValues('subject_name');
    const tutors = await getDistinctValues('tutor_name');
    const departments = await getDistinctValues('department_name');
    const levels = await getDistinctValues('program_level');
    const semesters = await getDistinctValues('semester');
    const ptypes = await getDistinctValues('program_type');

    res.render('viewtimetable', {
      timetables,
      uniqueDays,
      allSlots,
      grid,
      breaks: BREAKS,
      programs,
      venues,
      tutors,
      levels,
      departments,
      subjects,
      semesters,
      ptypes,
      ...criteria,
    });
  } catch (error) {
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});

// Route to download CSV
router.get('/download-timetable', async (req, res) => {
  try {
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      subject_name: req.query.subject,
      semester: req.query.semester,
    };

    const timetables = await viewtimetable(criteria);

    const csvContent =
      'Program, Venue, Tutor, Department, Subject, Semester\n' +
      timetables
        .map(
          t =>
            `${t.program_name}, ${t.venue_name}, ${t.tutor_name}, ${t.department_name}, ${t.subject_name}, ${t.semester}`
        )
        .join('\n');

    // Generate dynamic file name with datetime
    const now = new Date();
    const datetime = now.toISOString().replace(/:/g, '-').split('.')[0]; // YYYY-MM-DDTHH-MM-SS
    const programPart = criteria.program_name ? criteria.program_name.replace(/\s+/g, '_') : 'AllPrograms';
    const semesterPart = criteria.semester ? criteria.semester.replace(/\s+/g, '_') : 'AllSemesters';

    const fileName = `ATC-${programPart}-${semesterPart}-${datetime}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    res.send(csvContent);
  } catch (error) {
    res.status(500).send('Error downloading timetable: ' + error.message);
  }
});

// Route to download PDF using html-pdf-node with datetime in filename
router.get('/download-timetable-pdf', async (req, res) => {
  try {
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      subject_name: req.query.subject,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      program_level: req.query.level,
      semester: req.query.semester,
    };

    const timetables = await viewtimetable(criteria);
    const { uniqueDays, allSlots, grid } = buildTimetableGrid(timetables);

    let timetableHTML = `
      <html>
        <head>
          <title>ATC Timetable PDF</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { text-align: center; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
            th { background-color: #343a40; color: #fff; }
            tbody tr:nth-child(even) { background-color: #f2f2f2; }
            .logo { width: 80px; height: 80px; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Tanzania_Coat_of_Arms.png" class="logo" />
          <h1>ARUSHA TECHNICAL COLLEGE</h1>
          <h2>TIMETABLE ${criteria.semester ? ' - SEMESTER ' + criteria.semester : ''}</h2>
          <table>
            <thead>
              <tr>
                <th>TIME</th>`;

    uniqueDays.forEach(day => {
      timetableHTML += `<th>${day.toUpperCase()}</th>`;
    });

    timetableHTML += `</tr></thead><tbody>`;

    // A class occupying several consecutive slots (session_group_id) gets one taller cell
    // spanning all of them, labeled with its combined time range, instead of repeating the
    // same class in every 45-minute row it covers.
    allSlots.forEach((slot, i) => {
      timetableHTML += `<tr><td><b>${slot}</b></td>`;

      uniqueDays.forEach(day => {
        const cell = grid[day][i];
        if (cell.type === 'skip') return;
        if (cell.type === 'break') { timetableHTML += `<td><i>${cell.label}</i></td>`; return; }
        if (cell.type === 'empty') { timetableHTML += `<td><i>-</i></td>`; return; }

        const entry = cell.entries[0];
        timetableHTML += `<td${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''}>
          <b>Time:</b> ${cell.combinedLabel}<br>
          <b>Venue:</b> ${entry.venue_name} (${entry.venue_type})<br>
          <b>Subject:</b> ${entry.subject_name} (${entry.subject_code})<br>
          <b>Tutor:</b> ${cell.tutorNames}<br>
          <b>Program:</b> ${entry.program_name} (${entry.program_level})<br>
        </td>`;
      });

      timetableHTML += `</tr>`;
    });

    timetableHTML += `</tbody></table></body></html>`;

    const file = { content: timetableHTML };
    const options = { format: 'A4', margin: { top: '20px', bottom: '20px' } };
    const pdfBuffer = await pdf.generatePdf(file, options);

    // Dynamic file name with datetime
    const now = new Date();
    const datetime = now.toISOString().replace(/:/g, '-').split('.')[0]; // YYYY-MM-DDTHH-MM-SS
    const programPart = criteria.program_name ? criteria.program_name.replace(/\s+/g, '_') : 'AllPrograms';
    const semesterPart = criteria.semester ? criteria.semester.replace(/\s+/g, '_') : 'AllSemesters';
    const fileName = `ATC-${programPart}-${semesterPart}-${datetime}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading timetable as PDF: ' + error.message);
  }
});

export default router;
