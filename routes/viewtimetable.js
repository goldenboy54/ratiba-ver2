import express from 'express';
import { viewtimetable, getDistinctValues } from '../logics/viewtimetableLogic.js';
import pdf from 'html-pdf'; // Ensure this line is present

const router = express.Router();

// Route to search for timetables based on various criteria
router.get('/viewtimetable', async (req, res) => {
  try {
    // Extract search criteria from query parameters
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

    // Perform search based on criteria
    const timetables = await viewtimetable(criteria);

    // Fetch distinct values for filters
    const programs = await getDistinctValues('program_name');
    const venues = await getDistinctValues('venue_name');
    const subjects = await getDistinctValues('subject_name');
    const tutors = await getDistinctValues('tutor_name');
    const departments = await getDistinctValues('department_name');
    const levels = await getDistinctValues('program_level');
    const semesters = await getDistinctValues('semester');
    const ptypes = await getDistinctValues('program_type');

    // Render the search results page with the fetched data
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
    // Handle and log errors
    res.status(500).send('Error searching timetables: ' + error.message);
  }
});

// Route to download timetables as a CSV file
router.get('/download-timetable', async (req, res) => {
  try {
    // Extract search criteria from query parameters
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      subject_name: req.query.subject,
    };

    // Perform search based on criteria
    const timetables = await viewtimetable(criteria);

    // Convert timetables data to CSV format
    const csvContent = 'Program, Venue, Tutor, Department\n' + 
      timetables.map(t => `${t.program_name}, ${t.venue_name}, ${t.tutor_name}, ${t.department_name}, ${t.subject_name}`).join('\n');

    // Send the CSV file as response
    res.header('Content-Type', 'text/csv');
    res.attachment('timetables.csv');
    res.send(csvContent);
  } catch (error) {
    // Handle and log errors
    res.status(500).send('Error downloading timetable: ' + error.message);
  }
});






// Route to download timetables as a PDF file
router.get('/download-timetable-pdf', async (req, res) => {
  try {
    // Extract search criteria from query parameters
    const criteria = {
      department_name: req.query.department,
      program_name: req.query.program,
      subject_name: req.query.subject,
      venue_name: req.query.venue,
      tutor_name: req.query.tutor,
      program_level: req.query.level,
    };

    // Perform search based on criteria
    const timetables = await viewtimetable(criteria);

    // Create an array of unique days from the timetable data
    const uniqueDays = [...new Set(timetables.map(t => t.day))];
    
    // Create an array of unique timeslots from the timetable data
    const uniqueTimes = [...new Set(timetables.map(t => `${t.start_time} - ${t.end_time}`))];

    // Generate the timetable HTML content dynamically
    let timetableHTML = `
      <html>
        <head>
          <title>Timetable PDF</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #343a40; color: #fff; }
            tbody tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>ARUSHA TECHNICAL COLLEGE</h1>
          <h1>TIMETABLE</h1>
          <table>
            <thead>
              <tr>
                <th>TIME</th>`;

    // Add the days as columns in the table header
    uniqueDays.forEach(day => {
      timetableHTML += `<th>${day.toUpperCase()}</th>`;
    });

    timetableHTML += `</tr>
            </thead>
            <tbody>`;

    // Loop through each unique time slot and fill the timetable rows
    uniqueTimes.forEach(timeSlot => {
      timetableHTML += `<tr><td><b>${timeSlot}</b></td>`;

      // For each unique day, find if there's an entry for the current time slot and day
      uniqueDays.forEach(day => {
        const entry = timetables.find(t => `${t.start_time} - ${t.end_time}` === timeSlot && t.day === day);

        timetableHTML += `<td>`;
        if (entry) {
          timetableHTML += `
            <b>Venue:</b> ${entry.venue_name} (${entry.venue_type})<br>
            <b>Subject:</b> ${entry.subject_name} (${entry.subject_code})<br>
            <b>Tutor:</b> ${entry.tutor_name}<br>
            <b>Program:</b> ${entry.program_name} (${entry.program_level})<br>
          `;
        } else {
          timetableHTML += `<i>          </i>`;
        }
        timetableHTML += `</td>`;
      });

      timetableHTML += `</tr>`;
    });

    timetableHTML += `</tbody>
          </table>
        </body>
      </html>`;

    // Generate the PDF from the HTML content
    pdf.create(timetableHTML).toStream((err, stream) => {
      if (err) {
        return res.status(500).send('Error generating PDF: ' + err.message);
      }
      res.setHeader('Content-disposition', 'attachment; filename="ATC-timetable.pdf"');
      res.setHeader('Content-type', 'application/pdf');
      stream.pipe(res);
    });

  } catch (error) {
    res.status(500).send('Error downloading timetable as PDF: ' + error.message);
  }
});

export default router;
