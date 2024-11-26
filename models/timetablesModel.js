import pool from '../db.js';

// Fetch all timetables
export const getAlltimetables = async () => {
  try {
    const dbQuery = 'SELECT * FROM extracted_timetables';
    const [results] = await pool.execute(dbQuery);
    return results;
  } catch (err) {
    console.error(err);
    throw err;
  }
};



// Add timetable
export const addtimetable = async (timetable) => {
  try {
    const { generate, semester } = timetable;

    // Validate input
    if (!['I', 'II'].includes(semester)) {
      throw new Error('Invalid semester value. Please provide "I" or "II".');
    }

    // Determine the semester condition
    const semesterCondition = semester === 'I' ? 'I' : 'II';

    // SQL query to fetch data
    const query = `
     SELECT s.subject_code AS subject_code,s.subject_department AS department_name, s.title AS subject_name, s.credit AS subject_credit,s.type_prac_or_theory AS subject_type, v.venue_name, v.location AS venue_location,
           u.full_name AS tutor_name, p.program_name, p.program_type,p.level AS program_level, p.duration AS year, v.type AS venue_type,
           v.status AS venue_status,v.department, s.total_hours_per_week
    FROM venues v,subjects s
    JOIN users u ON s.user_id = u.user_id
    JOIN programs p ON s.program_id = p.program_id
    WHERE s.user_id IS NOT NULL AND s.semester = ?
    `;

    const [results] = await pool.execute(query, [semester]);

    // Generate timetable
    const generatedTimetable = generateTimetable(results);

    // Save timetable to database
    await saveTimetable(generatedTimetable);

    return { message: 'Timetable generated and saved successfully.' };
  } catch (err) {
    console.error('Error generating timetable:', err);
    throw err;
  }
};


const generateTimetable = (data) => {
  const periodDuration = 45; // Duration of each period in minutes
  const breakInterval = 5; // 5-minute interval between periods

  // Time management settings
  const fullTimeStart = '07:35';
  const fullTimeEnd = '18:30';
  const eveningStart = '14:00';
  const eveningEnd = '22:00';

  // Break times
  const breaks = {
    Monday: [{ start: '10:35', end: '11:00' }, { start: '12:30', end: '13:15' }],
    Tuesday: [{ start: '10:35', end: '11:00' }, { start: '12:30', end: '13:15' }],
    Wednesday: [{ start: '10:35', end: '11:00' }, { start: '12:30', end: '13:15' }],
    Thursday: [{ start: '10:35', end: '11:00' }, { start: '12:30', end: '13:15' }],
    Friday: [{ start: '09:45', end: '10:30' }, { start: '12:00', end: '14:00' }]
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timetable = [];

  // Helper functions
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(1970, 0, 1, hours, minutes);
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const initializeTimeSlots = (startTime, endTime) => {
    const slots = [];
    let currentTime = parseTime(startTime);
    while (currentTime < parseTime(endTime)) {
      const endPeriod = new Date(currentTime.getTime() + periodDuration * 60000);
      slots.push({ start: formatTime(currentTime), end: formatTime(endPeriod) });
      currentTime = new Date(endPeriod.getTime() + breakInterval * 60000);
    }
    return slots;
  };

  // Calculate periods required for each subject
  const subjects = data.reduce((acc, entry) => {
    const periodsRequired = Math.ceil((entry.total_hours_per_week * 60) / periodDuration); // Total periods for the week
    if (!acc[entry.subject_code]) {
      acc[entry.subject_code] = {
        ...entry,
        periodsLeft: periodsRequired,
        assignedToday: 0,
        assignedInVenue: {},
        assignedTwice: false
      };
    }
    return acc;
  }, {});

  const venueSlots = data.reduce((acc, venue) => {
    acc[venue.venue_name] = {
      fullTimeSlots: initializeTimeSlots(fullTimeStart, fullTimeEnd),
      eveningSlots: initializeTimeSlots(eveningStart, eveningEnd)
    };
    return acc;
  }, {});

  // Loop through venues
  for (const venueName in venueSlots) {
    const venue = data.find(v => v.venue_name === venueName);
    const timeSlots = venue.program_type === 'evening'  
      ? venueSlots[venueName].eveningSlots 
      : venueSlots[venueName].fullTimeSlots;

    // Loop through days of the week
    daysOfWeek.forEach((day) => {
      const assignedPrograms = {}; // Track assigned programs for the day

      // Loop through time slots
      timeSlots.forEach((slot) => {
        // Check for theory subject assignment
        if (venue.venue_type === 'Theory') {
          for (const subjectCode in subjects) {
            const subject = subjects[subjectCode];
            const isLabSubject = subject.subject_type === "Lab";

            // Ensure subject can be assigned and has not been assigned twice in the same venue
            if (subject.periodsLeft > 0 && !subject.assignedTwice && subject.assignedToday < 2) {
              const firstSlotEnd = new Date(parseTime(slot.start).getTime() + periodDuration * 60000);
              const secondSlotStart = formatTime(firstSlotEnd); // Start at the end time of the first subject
              const secondSlotEnd = formatTime(new Date(firstSlotEnd.getTime() + periodDuration * 60000));

              // Check if the time slots are free
              const isFirstSlotFree = !timetable.some(entry => 
                entry.venue_name === venueName && 
                entry.start_time === slot.start && 
                entry.end_time === firstSlotEnd
              );

              const isSecondSlotFree = !timetable.some(entry => 
                entry.venue_name === venueName && 
                entry.start_time === secondSlotStart && 
                entry.end_time === secondSlotEnd
              );

              // Check for assignment conflicts
              const hasAssignmentConflict = timetable.some(entry => entry.subject_code === subjectCode &&
                (entry.start_time === slot.start || entry.start_time === secondSlotStart));

              const hasProgramLevelConflict = timetable.some(entry => entry.program_name === subject.program_name && entry.program_level === subject.program_level &&
                (entry.start_time === slot.start || entry.start_time === secondSlotStart));

              const hasTutorProgramConflict = timetable.some((entry => entry.user_id === subject.user_id || entry.program_id === subject.program_id) &&
                ((entry.start_time === slot.start && entry.end_time === firstSlotEnd) ||
                (entry.start_time === secondSlotStart && entry.end_time === secondSlotEnd)));

              const isDuringBreak = breaks[day].some(breakSlot => 
                (slot.start >= breakSlot.start && slot.start < breakSlot.end) || 
                (firstSlotEnd >= breakSlot.start && firstSlotEnd < breakSlot.end) ||
                (secondSlotStart >= breakSlot.start && secondSlotStart < breakSlot.end) || 
                (secondSlotEnd >= breakSlot.start && secondSlotEnd < breakSlot.end));

              // Assign if conditions are met
              if (isFirstSlotFree && isSecondSlotFree && !hasTutorProgramConflict && !hasAssignmentConflict && !isDuringBreak && !hasProgramLevelConflict) {
                // Assign the first slot
                timetable.push({
                  day: day,
                  start_time: slot.start,
                  end_time: firstSlotEnd,
                  subject_code: subject.subject_code,
                  subject_name: subject.subject_name,
                  venue_name: venueName,
                  tutor_name: subject.tutor_name,
                  venue_location: venue.venue_location,
                  program_name: subject.program_name,
                  subject_credit: subject.subject_credit,
                  program_level: subject.program_level,
                  department_name: subject.department_name,
                  year: subject.year,
                  venue_type: venue.venue_type,
                  venue_status: 'Occupied'
                });
                subject.periodsLeft--;
                subject.assignedToday++;

                // Assign the second slot
                timetable.push({
                  day: day,
                  start_time: secondSlotStart,
                  end_time: secondSlotEnd,
                  subject_code: subject.subject_code,
                  subject_name: subject.subject_name,
                  venue_name: venueName,
                  tutor_name: subject.tutor_name,
                  venue_location: venue.venue_location,
                  program_name: subject.program_name,
                  subject_credit: subject.subject_credit,
                  program_level: subject.program_level,
                  department_name: subject.department_name,
                  year: subject.year,
                  venue_type: venue.venue_type,
                  venue_status: 'Occupied'
                });
                subject.periodsLeft--;
                subject.assignedToday++;

                assignedPrograms[subject.program_id] = true; // Mark the program as assigned for the day
                break; // Exit the loop after assigning the subject
              }
            }
          }
        }

        // Check for lab subject assignment
        if (venue.venue_type === 'Lab') {
          for (const subjectCode in subjects) {
            const subject = subjects[subjectCode];
            const isLabSubject = subject.subject_type === "Lab";

            // Ensure subject can be assigned and has not been assigned twice in the same venue
            if (subject.periodsLeft > 0 && !subject.assignedTwice && subject.assignedToday < 2 && isLabSubject) {
              const firstSlotEnd = new Date(parseTime(slot.start).getTime() + periodDuration * 60000);
              const secondSlotStart = formatTime(firstSlotEnd); // Start at the end time of the first subject
              const secondSlotEnd = formatTime(new Date(firstSlotEnd.getTime() + periodDuration * 60000));

              // Check if the time slots are free
              const isFirstSlotFree = !timetable.some(entry => 
                entry.venue_name === venueName && 
                entry.start_time === slot.start && 
                entry.end_time === firstSlotEnd
              );

              const isSecondSlotFree = !timetable.some(entry => 
                entry.venue_name === venueName && 
                entry.start_time === secondSlotStart && 
                entry.end_time === secondSlotEnd
              );

              // Check for assignment conflicts
              const hasAssignmentConflict = timetable.some(entry => entry.subject_code === subjectCode &&
                (entry.start_time === slot.start || entry.start_time === secondSlotStart));

              const hasProgramLevelConflict = timetable.some(entry => entry.program_name === subject.program_name && entry.program_level === subject.program_level &&
                (entry.start_time === slot.start || entry.start_time === secondSlotStart));

              const hasTutorProgramConflict = timetable.some(entry => entry.user_id === subject.user_id || entry.program_id === subject.program_id &&
                ((entry.start_time === slot.start && entry.end_time === firstSlotEnd) ||
                (entry.start_time === secondSlotStart && entry.end_time === secondSlotEnd)));

              const isDuringBreak = breaks[day].some(breakSlot => 
                (slot.start >= breakSlot.start && slot.start < breakSlot.end) || 
                (firstSlotEnd >= breakSlot.start && firstSlotEnd < breakSlot.end) ||
                (secondSlotStart >= breakSlot.start && secondSlotStart < breakSlot.end) || 
                (secondSlotEnd >= breakSlot.start && secondSlotEnd < breakSlot.end));

              // Assign if conditions are met
              if (isFirstSlotFree && isSecondSlotFree && !hasTutorProgramConflict && !hasAssignmentConflict && !isDuringBreak) {
                // Assign the first slot
                timetable.push({
                  day: day,
                  start_time: slot.start,
                  end_time: firstSlotEnd,
                  subject_code: subject.subject_code,
                  subject_name: subject.subject_name,
                  venue_name: venueName,
                  tutor_name: subject.tutor_name,
                  venue_location: venue.venue_location,
                  program_name: subject.program_name,
                  subject_credit: subject.subject_credit,
                  program_level: subject.program_level,
                  department_name: subject.department_name,
                  year: subject.year,
                  venue_type: venue.venue_type,
                  venue_status: 'Occupied'
                });
                subject.periodsLeft--;
                subject.assignedToday++;

                // Assign the second slot
                timetable.push({
                  day: day,
                  start_time: secondSlotStart,
                  end_time: secondSlotEnd,
                  subject_code: subject.subject_code,
                  subject_name: subject.subject_name,
                  venue_name: venueName,
                  tutor_name: subject.tutor_name,
                  venue_location: venue.venue_location,
                  program_name: subject.program_name,
                  subject_credit: subject.subject_credit,
                  program_level: subject.program_level,
                  department_name: subject.department_name,
                  year: subject.year,
                  venue_type: venue.venue_type,
                  venue_status: 'Occupied'
                });
                subject.periodsLeft--;
                subject.assignedToday++;

                assignedPrograms[subject.program_id] = true; // Mark the program as assigned for the day
                break; // Exit the loop after assigning the subject
              }
            }
          }
        }
      });
    });
  }

  return timetable;
};



// Function to save timetable to the database with retry logic
const saveTimetable = async (timetable) => {
  const maxRetries = 3; // Number of retry attempts
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const connection = await pool.getConnection();
      
      try {
        // Begin transaction
        await connection.beginTransaction();

        // Prepare SQL query with placeholders
        const query = `
          INSERT INTO extracted_timetables (
            day, start_time, end_time, subject_code, subject_name, department_name, venue_name, 
            tutor_name, venue_location, program_name, subject_credit, program_level, 
            year, venue_type, venue_status
          ) VALUES ?
        `;

        // Prepare values
        const values = timetable.map(item => [
          item.day, item.start_time, item.end_time, item.subject_code, item.subject_name, 
          item.department_name, item.venue_name, item.tutor_name, item.venue_location, 
          item.program_name, item.subject_credit, item.program_level, item.year, 
          item.venue_type, item.venue_status
        ]);

        // Execute query
        await connection.query(query, [values]);

        // Commit transaction
        await connection.commit();

        console.log('Timetable saved successfully.');
        return; // Exit function if successful
      } catch (err) {
        // Rollback transaction if error occurs
        await connection.rollback();
        throw err;
      } finally {
        // Release connection
        connection.release();
      }
    } catch (err) {
      console.error(`Error saving timetable. Attempt ${attempt + 1} of ${maxRetries}:`, err);
      attempt++;
      if (attempt >= maxRetries) {
        throw err; // Rethrow error if max retries reached
      }
      // Optional: Add delay before retrying
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay of 2 seconds
    }
  }
};


// Function to update timetable

export const updatetimetable = async (id, timetable) => {
  try {
    const query = `
      UPDATE extracted_timetables SET 
        day = ?, start_time = ?, end_time = ?, subject_code = ?, subject_name = ?, 
        department_name = ?, venue_name = ?, tutor_name = ?, venue_location = ?, 
        program_name = ?, subject_credit = ?, program_level = ?, year = ?, 
        venue_type = ?, venue_status = ? 
      WHERE id = ?
    `;

    // Replace undefined values with null
    const params = [
      timetable.day || null,
      timetable.start_time || null,
      timetable.end_time || null,
      timetable.subject_code || null,
      timetable.subject_name || null,
      timetable.department_name || null,
      timetable.venue_name || null,
      timetable.tutor_name || null,
      timetable.venue_location || null,
      timetable.program_name || null,
      timetable.subject_credit || null,
      timetable.program_level || null,
      timetable.year || null,
      timetable.venue_type || null,
      timetable.venue_status || null,
      id
    ];

    await pool.execute(query, params);
  } catch (err) {
    console.error('Error updating timetable:', err);
    throw err;
  }
};


// Function to delete timetable
export const deletetimetable = async () => {
  try {
    const query = 'TRUNCATE TABLE extracted_timetables';
    await pool.execute(query);

    
    // Define the update status query
    const updateQuery = `
      UPDATE venues
      SET mnos=1,tnos=1,wnos=1,thnos=1,frnos=1,satnos=1,sunnos=1,totalnos=7
      WHERE mnos IS NOT NULL
    `;
    await pool.execute(updateQuery);

    const setQuery = `
    UPDATE subjects
    SET ltpa=0.00
    WHERE ltpa IS NOT NULL
  `;
  await pool.execute(setQuery);



  } catch (err) {
    console.error(err);
    throw err;
  }
};



async function updateVenueStatusAutomatically() {
  const connection = await pool.getConnection();
  try {
    // Begin transaction
    await connection.beginTransaction();

    // Fetch venue statuses from extracted_timetables
    const [rows] = await connection.query(`
      SELECT DISTINCT venue_name, subject_name, start_time, end_time
      FROM extracted_timetables
    `);

    // Define the update status query
    const updateStatusQuery = `
      UPDATE extracted_timetables
      SET venue_status = ?
      WHERE venue_name = ? AND start_time = ? AND end_time = ?
    `;

    for (const row of rows) {
      const venueStatus = row.subject_name === 'N/A' ? 'free' : 'used';
      await connection.query(updateStatusQuery, [venueStatus, row.venue_name, row.start_time, row.end_time]);
    }

    // Commit transaction
    await connection.commit();
    console.log('Venue statuses updated successfully.');
  } catch (error) {
    console.error('Error updating venue statuses:', error);
    await connection.rollback();
  } finally {
    connection.release();
  }
}

// Call the function
updateVenueStatusAutomatically().catch(err => console.error('Function execution error:', err));