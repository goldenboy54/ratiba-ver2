
import express from 'express';
import pdf from 'html-pdf'; // Ensure this line is present
import { searchTimetables, getDistinctValues } from '../logics/timetableLogic.js';

const router = express.Router();

// Route to search for timetables based on various criteria
router.get('/', async (req, res) => {
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
    const timetables = await searchTimetables(criteria);

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
    res.render('searchtimetable', {
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
    const timetables = await searchTimetables(criteria);

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

    const timetables = await searchTimetables(criteria);

    // Render the timetable to a string using EJS
    const timetableHTML = `
      <html>
        <head>
          <title>Timetable PDF</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; }
            th { background-color: #c7e1d3; color: #fff; }
            tbody tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
                   <h1>ARUSHA TECHNICAL COLLEGE</h1>
                     <h1>TIMETABLE</h1>
          <table>
           


                 <thead>
                <tr>
                  <th>DAY</th>
                  <th>TIME</th>
                  <th>VENUE</th>
                  <th>SUBJECT</th>
                  <th>TUTOR</th>  
                  <th>PROGRAM</th>
                </tr>  
              </thead>
              <tbody>

              ${timetables.map(timetable => `
                <tr>
                  <td>${timetable.day}</td>
                  <td><b>${timetable.start_time} - ${timetable.end_time}</b></td>
                  <td>
                    Venue Name: <b>${timetable.venue_name}</b><br>
                    Venue Type: ${timetable.venue_type}<br>
                    Venue Location: ${timetable.venue_location}<br>
                    Venue Status: ${timetable.venue_status}<br>
                    Venue Capacity: ${timetable.venue_capacity} students
                  </td>
                  <td>
                    Subject Name: <b>${timetable.subject_name}</b><br>
                    Subject Code: ${timetable.subject_code}<br>
                    Subject Credit: ${timetable.subject_credit}<br>
                    Original Department for Subject: ${timetable.department_name}
                  </td>
                  <td>Tutor Name: <b>${timetable.tutor_name}</b></td>
                  <td>
                    Program Name: <b>${timetable.program_name}</b><br>
                    Program Level: ${timetable.program_level}<br>
                    Program Type: ${timetable.program_type}<br>
                    Program Capacity: ${timetable.program_capacity} students<br>
                    Program Duration: ${timetable.year} yrs
                  </td>
                </tr>
              `).join('')}
              
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Generate PDF using html-pdf
    pdf.create(timetableHTML).toStream((err, stream) => {
      if (err) {
        return res.status(500).send('Error generating PDF: ' + err.message);
      }
      res.setHeader('Content-disposition', 'attachment; filename="atctimetable.pdf"');
      res.setHeader('Content-type', 'application/pdf');
      stream.pipe(res);
    });

    // For puppeteer:
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(timetableHTML);
    // const pdfBuffer = await page.pdf({ format: 'A4' });
    // await browser.close();
    // res.setHeader('Content-disposition', 'attachment; filename="Atctimetable.pdf"');
    // res.setHeader('Content-type', 'application/pdf');
    // res.send(pdfBuffer);

  } catch (error) {
    res.status(500).send('Error downloading timetable as PDF: ' + error.message);
  }
});

export default router;
