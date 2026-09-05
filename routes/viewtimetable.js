import express from 'express';
// import { viewtimetable, getDistinctValues } from '../logics/viewtimetableLogic.js';
import { viewtimetable, getDistinctValues, getDistinctPrograms } from '../logics/viewtimetableLogic.js';

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

    const uniqueDays = [...new Set(timetables.map(t => t.day))];
    const uniqueTimes = [...new Set(timetables.map(t => `${t.start_time} - ${t.end_time}`))];

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

    uniqueTimes.forEach(timeSlot => {
      timetableHTML += `<tr><td><b>${timeSlot}</b></td>`;

      uniqueDays.forEach(day => {
        // A co-taught session puts one row per tutor into extracted_timetables, all sharing
        // the same day/slot/subject/program - filter() (not find()) collects every one of
        // them instead of silently dropping all but the first.
        const entries = timetables.filter(t => `${t.start_time} - ${t.end_time}` === timeSlot && t.day === day);
        const entry = entries[0];
        const tutorNames = [...new Set(entries.map(e => e.tutor_name).filter(Boolean))].join(' & ');
        timetableHTML += `<td>`;
        if (entry) {
          timetableHTML += `
            <b>Venue:</b> ${entry.venue_name} (${entry.venue_type})<br>
            <b>Subject:</b> ${entry.subject_name} (${entry.subject_code})<br>
            <b>Tutor:</b> ${tutorNames}<br>
            <b>Program:</b> ${entry.program_name} (${entry.program_level})<br>
          `;
        } else {
          timetableHTML += `<i>-</i>`;
        }
        timetableHTML += `</td>`;
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
