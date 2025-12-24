import db from '../db.js';


export const addtimetable = async ({ semester }) => {
  // A function to generate the timetable for the selected semester name
  try {
    // Define the days of the week for the timetable
    let days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
 
    let reset = 4; // Reset condition for days loop
// Initialize a counter or variable if needed
   let cs = 0;
    // Infinite loop using a for loop
    for (let j = 0; ; j++) { // The second condition is omitted for infinite loop
      // Reset index if it exceeds the length of the days array
      if (j > reset) {
        j = 0; // Reset to Monday
      }

      let day = days[j];
      console.log(day); // Log the current day

  
  console.log(day);

  // Query to fetch a random subject based on the semester
  const subjectQuery = `
    SELECT subject_id, total_hours_per_week, type_prac_or_theory, subject_department
    FROM subjects 
    WHERE semester = ? AND ((0.75+ltpa) <= total_hours_per_week)
    ORDER BY RAND()
  `;

  // Execute the query with the given semester
  const [selectedSubject] = await db.query(subjectQuery, [semester]);

  // Check if any subject is found
  if (!selectedSubject || selectedSubject.length === 0) {
    throw new Error("ASSIGNMENT COMPLETED..,,! No subjects found for the specified semester. THANK YOU!.");
  }

  


  // Iterate through the selected subjects
  for (let k = 0; k < selectedSubject.length; k++) {
    const { subject_id, total_hours_per_week, type_prac_or_theory, subject_department } = selectedSubject[k];
    console.log(`Subject ID: ${subject_id}, Total Hours: ${total_hours_per_week}`);

    // Calculate the total number of slots based on 45-minute periods
    const total_slots = (total_hours_per_week * 60) / 45;
console.log(`Total Slots: ${total_slots}`);
    
    // Query to fetch a random available venue
    const venueQuery1 = `
      SELECT venue_id 
      FROM venues 
      WHERE mnos > 0 OR tnos > 0 OR wnos > 0 OR thnos > 0 OR frnos > 0 
      ORDER BY RAND() 
      LIMIT 1
    `;
    const [selectedVenue] = await db.query(venueQuery1);

    if (!selectedVenue || selectedVenue.length === 0) {
      throw new Error("No venues available for scheduling.");
    }

    const venue_id = selectedVenue[0].venue_id;

    // Fetch the venue details based on type and department
    let venueQuery;
    let venue;

    let start_time, end_time;


    if (type_prac_or_theory === "Lab") {
      venueQuery = `
        SELECT *, mnos, tnos, wnos, thnos, frnos, satnos, sunnos, department, capacity 
        FROM venues 
        WHERE venue_id = ? AND type = "Lab"  OR type= "Lab_Theory" AND department = ?
      `;
      [venue] = await db.query(venueQuery, [venue_id, subject_department]);
    } else {
      venueQuery = `
        SELECT *, mnos, tnos, wnos, thnos, frnos, satnos, sunnos, department, capacity 
        FROM venues 
        WHERE venue_id = ? AND type != "Lab"
      `;
      [venue] = await db.query(venueQuery, [venue_id]);
    }

    if (!venue || venue.length === 0) {
      console.error("The venue is not found or is full. Please choose another.");
      continue;
    }

    const { type: venue_type, location: venue_location, capacity: venue_capacity, department: venue_department } = venue[0];

    // Fetch program details for the subject
    const programQuery = `
      SELECT *, p.program_type AS program_type 
      FROM subjects s 
      JOIN programs p ON s.program_id = p.program_id  
      WHERE subject_id = ?
    `;
    const [programData] = await db.query(programQuery, [subject_id]);
  //let program_capacity=programData[0].program_capacity;
let program_type=programData[0].program_type;

   let program_capacity = programData[0]?.program_capacity;
    if (!program_capacity) {
      console.error("Program data is missing for the subject.");
      continue;
    }

    // Handle day-specific venue slots
    let mnos,tnos,wnos,thnos,frnos,satnos,sunnos;
    switch (day) {
      case "MONDAY":
        mnos = venue[0].mnos;
        break;
      case "TUESDAY":
        tnos = venue[0].tnos;
        break;
      case "WEDNESDAY":
       wnos = venue[0].wnos;
        break;
      case "THURSDAY":
       thnos = venue[0].thnos;
        break;
      case "FRIDAY":
        frnos = venue[0].frnos;
        break;
      case "SATURDAY":
        satnos = venue[0].satnos;
        break;
      case "SUNDAY":
        sunnos = venue[0].sunnos;
        break;
      default:
        throw new Error("Invalid day provided.");
    }

   // console.log(`Slots available on ${day}: ${slotsAvailable}`);
    console.log(`Venue: ${venue_type}, Location: ${venue_location}, Capacity: ${venue_capacity}`);


//  let tnos=venue[0].tnos;
// let wnos=venue[0].wnos;
// let thnos=venue[0].thnos;
// let frnos=venue[0].frnos;
// let satnos=venue[0].satnos;
// let sunnos=venue[0].sunnos;
// No subjects found for the specified semester
    let i=1;
    for (i = 1; i <= 2; i++) { //simple for loop for the aim to update number of slots based on day
      // Logic to assign time slots based on mnos and menos
    
      if (programData[0].program_type === "full-time" || programData[0].program_type === "evening") {
        // //console.log(programData[0].program_type)
        //console.log(day)

        if (((day === "MONDAY" && mnos === 1) || (day === "TUESDAY" && tnos === 1) || 
            (day === "WEDNESDAY" && wnos === 1) || (day === "THURSDAY" && thnos === 1) || 
            (day === "FRIDAY" && frnos === 1) || (day === "SATURDAY" && satnos === 1) || 
            (day === "SUNDAY" && sunnos === 1) ) && programData[0].program_type === "full-time") {


              // //console.log(programData[0].program_type)
              // //console.log(day)
             // }


          start_time = "07:30";
          end_time = "08:15";

          if (mnos===1) { mnos++; } else if (tnos===1) { tnos++; } else if (wnos===1) { wnos++; } else if (thnos===1) { thnos++; } else if (frnos===1) { frnos++; } else if (satnos===1) { satnos++; } else if (sunnos===1) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 2) || (day === "TUESDAY" && tnos === 2) || 
                   (day === "WEDNESDAY" && wnos === 2) || (day === "THURSDAY" && thnos === 2) || 
                   (day === "FRIDAY" && frnos === 2) || (day === "SATURDAY" && satnos === 2) || 
                   (day === "SUNDAY" && sunnos === 2)) && programData[0].program_type === "full-time") {
          
          start_time = "08:20";
          end_time = "09:05";
          if (mnos===2) { mnos++; } else if (tnos===2) { tnos++; } else if (wnos===2) { wnos++; } else if (thnos===2) { thnos++; } else if (frnos===2) { frnos++; } else if (satnos===2) { satnos++; } else if (sunnos===2) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 3) || (day === "TUESDAY" && tnos === 3) || 
                   (day === "WEDNESDAY" && wnos === 3) || (day === "THURSDAY" && thnos === 3) || 
                   (day === "FRIDAY" && frnos === 3) || (day === "SATURDAY" && satnos === 3) || 
                   (day === "SUNDAY" && sunnos === 3)) && programData[0].program_type === "full-time") {
          
          start_time = "09:10";
          end_time = "09:55";
          if (mnos===3) { mnos++; } else if (tnos===3) { tnos++; } else if (wnos===3) { wnos++; } else if (thnos===3) { thnos++; } else if (frnos===3) { frnos++; } else if (satnos===3) { satnos++; } else if (sunnos===3) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 4) || (day === "TUESDAY" && tnos === 4) || 
                   (day === "WEDNESDAY" && wnos === 4) || (day === "THURSDAY" && thnos === 4) || 
                   (day === "FRIDAY" && frnos === 4) || (day === "SATURDAY" && satnos === 4) || 
                   (day === "SUNDAY" && sunnos === 4)) && programData[0].program_type === "full-time") {
          
          start_time = "10:00";
          end_time = "10:45";
          if (mnos===4) { mnos++; } else if (tnos===4) { tnos++; } else if (wnos===4) { wnos++; } else if (thnos===4) { thnos++; } else if (frnos===4) { frnos++; } else if (satnos===4) { satnos++; } else if (sunnos===4) { sunnos++; } else {  }
          

        } else if (((day === "MONDAY" && mnos === 5) || (day === "TUESDAY" && tnos === 5) || 
                   (day === "WEDNESDAY" && wnos === 5) || (day === "THURSDAY" && thnos === 5) || 
                   (day === "FRIDAY" && frnos === 5) || (day === "SATURDAY" && satnos === 5) || 
                   (day === "SUNDAY" && sunnos === 5)) && programData[0].program_type === "full-time") {
          
                    
          start_time = "11:10";
          end_time = "11:55";
          if (mnos===5) { mnos++; } else if (tnos===5) { tnos++; } else if (wnos===5) { wnos++; } else if (thnos===5) { thnos++; } else if (frnos===5) { frnos++; } else if (satnos===5) { satnos++; } else if (sunnos===5) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 6) || (day === "TUESDAY" && tnos === 6) || 
                   (day === "WEDNESDAY" && wnos === 6) || (day === "THURSDAY" && thnos === 6) || 
                   (day === "FRIDAY" && frnos === 6) || (day === "SATURDAY" && satnos === 6) || 
                   (day === "SUNDAY" && sunnos === 6)) && programData[0].program_type === "full-time") {
          
          start_time = "12:00";
          end_time = "12:45";
          if (mnos===6) { mnos++; } else if (tnos===6) { tnos++; } else if (wnos===6) { wnos++; } else if (thnos===6) { thnos++; } else if (frnos===6) { frnos++; } else if (satnos===6) { satnos++; } else if (sunnos===6) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 7) || (day === "TUESDAY" && tnos === 7) || 
                   (day === "WEDNESDAY" && wnos === 7) || (day === "THURSDAY" && thnos === 7) || 
                   (day === "FRIDAY" && frnos === 7) || (day === "SATURDAY" && satnos === 7) || 
                   (day === "SUNDAY" && sunnos === 7)) && programData[0].program_type === "full-time") {
          
          start_time = "13:35";
          end_time = "14:20";
          if (mnos===7) { mnos++; } else if (tnos===7) { tnos++; } else if (wnos===7) { wnos++; } else if (thnos===7) { thnos++; } else if (frnos===7) { frnos++; } else if (satnos===7) { satnos++; } else if (sunnos===7) { sunnos++; } else {  }
          
        } 
        

        
        
        else if (((day === "MONDAY" && mnos === 8) || (day === "TUESDAY" && tnos === 8) || 
                   (day === "WEDNESDAY" && wnos === 8) || (day === "THURSDAY" && thnos === 8) || 
                   (day === "FRIDAY" && frnos === 8) || (day === "SATURDAY" && satnos === 8) || 
                   (day === "SUNDAY" && sunnos === 8)) && (programData[0].program_type === "full-time" || programData[0].program_type === "evening")) {
          
          start_time = "14:25";
          end_time = "15:10";
          if (mnos===8) { mnos++; } else if (tnos===8) { tnos++; } else if (wnos===8) { wnos++; } else if (thnos===8) { thnos++; } else if (frnos===8) { frnos++; } else if (satnos===8) { satnos++; } else if (sunnos===8) { sunnos++; } else {  }
          
        }
      
        else if (((day === "MONDAY" && mnos === 9) || (day === "TUESDAY" && tnos === 9) ||
         (day === "WEDNESDAY" && wnos === 9) || (day === "THURSDAY" && thnos === 9) || 
         (day === "FRIDAY" && frnos === 9) || (day === "SATURDAY" && satnos === 9) ||
          (day === "SUNDAY" && sunnos === 9)) && (programData[0].program_type === "full-time" || programData[0].program_type === "evening")) {
          start_time = "15:15";
          end_time = "16:00";
          if (mnos===9) { mnos++; } else if (tnos===9) { tnos++; } else if (wnos===9) { wnos++; } else if (thnos===9) { thnos++; } else if (frnos===9) { frnos++; } else if (satnos===9) { satnos++; } else if (sunnos===9) { sunnos++; } else {  }
        }
      
      else if (((day === "MONDAY" && mnos === 10) || (day === "TUESDAY" && tnos === 10) ||
       (day === "WEDNESDAY" && wnos === 10) || (day === "THURSDAY" && thnos === 10) || 
       (day === "FRIDAY" && frnos === 10) || (day === "SATURDAY" && satnos === 10) || 
       (day === "SUNDAY" && sunnos === 10)) && (programData[0].program_type === "full-time" || programData[0].program_type === "evening")) {
          start_time = "16:05";
          end_time = "16:50";
          if (mnos===10) { mnos++; } else if (tnos===10) { tnos++; } else if (wnos===10) { wnos++; } else if (thnos===10) { thnos++; } else if (frnos===10) { frnos++; } else if (satnos===10) { satnos++; } else if (sunnos===10) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 11) || (day === "TUESDAY" && tnos === 11) || 
      (day === "WEDNESDAY" && wnos === 11) || (day === "THURSDAY" && thnos === 11) || 
      (day === "FRIDAY" && frnos === 11) || (day === "SATURDAY" && satnos === 11) ||
       (day === "SUNDAY" && sunnos === 11)) && (programData[0].program_type === "full-time" || programData[0].program_type === "evening")) {
          start_time = "16:55";
          end_time = "17:40";
          if (mnos===11) { mnos++; } else if (tnos===11) { tnos++; } 
          else if (wnos===11) { wnos++; } else if (thnos===11) { thnos++; } 
          else if (frnos===11) { frnos++; } else if (satnos===11) { satnos++; } 
          else if (sunnos===11) { sunnos++; } else {  }
        }
      
      else if (((day === "MONDAY" && mnos === 12) || (day === "TUESDAY" && tnos === 12) || 
      (day === "WEDNESDAY" && wnos === 12) || (day === "THURSDAY" && thnos === 12) || 
      (day === "FRIDAY" && frnos === 12) || (day === "SATURDAY" && satnos === 12) || 
      (day === "SUNDAY" && sunnos === 12)) && (programData[0].program_type === "full-time" || programData[0].program_type === "evening")) {
          start_time = "17:45";
          end_time = "18:30";
          if (mnos===12) { mnos++; } else if (tnos===12) { tnos++; } else if (wnos===12) 
          { wnos++; } else if (thnos===12) { thnos++; } else if (frnos===12) { frnos++; }
           else if (satnos===12) { satnos++; } else if (sunnos===12) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 13) || (day === "TUESDAY" && tnos === 13) || 
      (day === "WEDNESDAY" && wnos === 13) || (day === "THURSDAY" && thnos === 13) || 
      (day === "FRIDAY" && frnos === 13) || (day === "SATURDAY" && satnos === 13) || 
      (day === "SUNDAY" && sunnos === 13)) && (programData[0].program_type === "evening")) {
          start_time = "18:35";
          end_time = "19:20";
          if (mnos===13) { mnos++; } else if (tnos===13) { tnos++; } 
          else if (wnos===13) { wnos++; } else if (thnos===13) { thnos++; } 
          else if (frnos===13) { frnos++; } else if (satnos===13) { satnos++; } 
          else if (sunnos===13) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 14) || (day === "TUESDAY" && tnos === 14) || 
      (day === "WEDNESDAY" && wnos === 14) || (day === "THURSDAY" && thnos === 14) ||
       (day === "FRIDAY" && frnos === 14) || (day === "SATURDAY" && satnos === 14) || 
       (day === "SUNDAY" && sunnos === 14)) && (programData[0].program_type === "evening")) {
          start_time = "19:25";
          end_time = "20:10";
          if (mnos===14) { mnos++; } else if (tnos===14) { tnos++; }
           else if (wnos===14) { wnos++; } else if (thnos===14) { thnos++; }
            else if (frnos===14) { frnos++; } else if (satnos===14) { satnos++; } 
            else if (sunnos===14) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 15) || (day === "TUESDAY" && tnos === 15) || 
      (day === "WEDNESDAY" && wnos === 15) || (day === "THURSDAY" && thnos === 15) || 
      (day === "FRIDAY" && frnos === 15) || (day === "SATURDAY" && satnos === 15) || 
      (day === "SUNDAY" && sunnos === 15)) && (programData[0].program_type === "evening")) {
          start_time = "20:15";
          end_time = "21:00";
          if (mnos===15) { mnos++; } else if (tnos===15) { tnos++; }
           else if (wnos===15) { wnos++; } else if (thnos===15) { thnos++; } 
           else if (frnos===15) { frnos++; } else if (satnos===15) { satnos++; } 
           else if (sunnos===15) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 16) || (day === "TUESDAY" && tnos === 16) ||
       (day === "WEDNESDAY" && wnos === 16) || (day === "THURSDAY" && thnos === 16) ||
        (day === "FRIDAY" && frnos === 16) || (day === "SATURDAY" && satnos === 16) || 
        (day === "SUNDAY" && sunnos === 16)) && (programData[0].program_type === "evening")) {
          start_time = "21:05";
          end_time = "21:50";
          if (mnos===16) { mnos++; } else if (tnos===16) { tnos++; }
           else if (wnos===16) { wnos++; } else if (thnos===16) { thnos++; }
            else if (frnos===16) { frnos++; } else if (satnos===16) { satnos++; } 
            else if (sunnos===16) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 17) || (day === "TUESDAY" && tnos === 17) || 
      (day === "WEDNESDAY" && wnos === 17) || (day === "THURSDAY" && thnos === 17) || 
      (day === "FRIDAY" && frnos === 17) || (day === "SATURDAY" && satnos === 17) || 
      (day === "SUNDAY" && sunnos === 17)) && (programData[0].program_type === "evening")) {
          start_time = "21:55";
          end_time = "22:40";
          if (mnos===17) { mnos++; } else if (tnos===17) { tnos++; } 
          else if (wnos===17) { wnos++; } else if (thnos===17) { thnos++; } 
          else if (frnos===17) { frnos++; } else if (satnos===17) { satnos++; } 
          else if (sunnos===17) { sunnos++; } else {  }
          
        }
      
      else if (((day === "MONDAY" && mnos === 18) || (day === "TUESDAY" && tnos === 18) || 
      (day === "WEDNESDAY" && wnos === 18) || (day === "THURSDAY" && thnos === 18) ||
       (day === "FRIDAY" && frnos === 18) || (day === "SATURDAY" && satnos === 18) ||
        (day === "SUNDAY" && sunnos === 18)) && (programData[0].program_type === "evening")) {
          start_time = "22:45";
          end_time = "23:30";
          if (mnos===18) { mnos++; } else if (tnos===18) { tnos++; } 
          else if (wnos===18) { wnos++; } else if (thnos===18) { thnos++; } 
          else if (frnos===18) { frnos++; } else if (satnos===18) { satnos++; }
           else if (sunnos===18) { sunnos++; } else {  }
          
        }
      



        else if (((day === "MONDAY" && mnos === 1) || (day === "TUESDAY" && tnos === 1) || 
            (day === "WEDNESDAY" && wnos === 1) || (day === "THURSDAY" && thnos === 1) || 
            (day === "FRIDAY" && frnos === 1) || (day === "SATURDAY" && satnos === 1) || 
            (day === "SUNDAY" && sunnos === 1)) && programData[0].program_type === "evening") {


              // //console.log(programData[0].program_type)
              // //console.log(day)


         
              start_time = "14:25";
              end_time = "15:10";
          
          if (mnos===1) { mnos++; } else if (tnos===1) { tnos++; } else if (wnos===1) { wnos++; } else if (thnos===1) { thnos++; } else if (frnos===1) { frnos++; } else if (satnos===1) { satnos++; } else if (sunnos===1) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 2) || (day === "TUESDAY" && tnos === 2) || 
                   (day === "WEDNESDAY" && wnos === 2) || (day === "THURSDAY" && thnos === 2) || 
                   (day === "FRIDAY" && frnos === 2) || (day === "SATURDAY" && satnos === 2) || 
                   (day === "SUNDAY" && sunnos === 2)) && programData[0].program_type === "evening") {
                  
                    start_time = "15:15";
                    end_time = "16:00";

          if (mnos===2) { mnos++; } else if (tnos===2) { tnos++; } else if (wnos===2) { wnos++; }
           else if (thnos===2) { thnos++; } else if (frnos===2) { frnos++; } 
           else if (satnos===2) { satnos++; } else if (sunnos===2) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 3) || (day === "TUESDAY" && tnos === 3) || 
                   (day === "WEDNESDAY" && wnos === 3) || (day === "THURSDAY" && thnos === 3) || 
                   (day === "FRIDAY" && frnos === 3) || (day === "SATURDAY" && satnos === 3) || 
                   (day === "SUNDAY" && sunnos === 3)) && programData[0].program_type === "evening") {
         
                    start_time = "16:05";
                     end_time = "16:50";

          if (mnos===3) { mnos++; } else if (tnos===3) { tnos++; } else if (wnos===3) { wnos++; } else if (thnos===3) { thnos++; } else if (frnos===3) { frnos++; } else if (satnos===3) { satnos++; } else if (sunnos===3) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 4) || (day === "TUESDAY" && tnos === 4) || 
                   (day === "WEDNESDAY" && wnos === 4) || (day === "THURSDAY" && thnos === 4) || 
                   (day === "FRIDAY" && frnos === 4) || (day === "SATURDAY" && satnos === 4) || 
                   (day === "SUNDAY" && sunnos === 4))&& programData[0].program_type === "evening") {
          
                    start_time = "16:55";
                    end_time = "17:40";
          if (mnos===4) { mnos++; } else if (tnos===4) { tnos++; } else if (wnos===4) { wnos++; } else if (thnos===4) { thnos++; } else if (frnos===4) { frnos++; } else if (satnos===4) { satnos++; } else if (sunnos===4) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 5) || (day === "TUESDAY" && tnos === 5) || 
                   (day === "WEDNESDAY" && wnos === 5) || (day === "THURSDAY" && thnos === 5) || 
                   (day === "FRIDAY" && frnos === 5) || (day === "SATURDAY" && satnos === 5) || 
                   (day === "SUNDAY" && sunnos === 5)) && programData[0].program_type === "evening") {
          
                    start_time = "17:45";
                    end_time = "18:30";
          if (mnos===5) { mnos++; } else if (tnos===5) { tnos++; } else if (wnos===5) { wnos++; } else if (thnos===5) { thnos++; } else if (frnos===5) { frnos++; } else if (satnos===5) { satnos++; } else if (sunnos===5) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 6) || (day === "TUESDAY" && tnos === 6) || 
                   (day === "WEDNESDAY" && wnos === 6) || (day === "THURSDAY" && thnos === 6) || 
                   (day === "FRIDAY" && frnos === 6) || (day === "SATURDAY" && satnos === 6) || 
                   (day === "SUNDAY" && sunnos === 6)) && programData[0].program_type === "evening") {
                  
          start_time = "18:35";
          end_time = "19:20";

          if (mnos===6) { mnos++; } else if (tnos===6) { tnos++; } else if (wnos===6) { wnos++; } else if (thnos===6) { thnos++; } else if (frnos===6) { frnos++; } else if (satnos===6) { satnos++; } else if (sunnos===6) { sunnos++; } else {  }
          
        } else if (((day === "MONDAY" && mnos === 7) || (day === "TUESDAY" && tnos === 7) || 
                   (day === "WEDNESDAY" && wnos === 7) || (day === "THURSDAY" && thnos === 7) || 
                   (day === "FRIDAY" && frnos === 7) || (day === "SATURDAY" && satnos === 7) || 
                   (day === "SUNDAY" && sunnos === 7)) && programData[0].program_type === "evening") {
          
                    start_time = "19:25";
                    end_time = "20:10";
          if (mnos===7) { mnos++; } else if (tnos===7) { tnos++; } else if (wnos===7) { wnos++; } else if (thnos===7) { thnos++; } else if (frnos===7) { frnos++; } else if (satnos===7) { satnos++; } else if (sunnos===7) { sunnos++; } else {  }
          
        }




// Update the mnos in the venues table
if (mnos) {
  await db.query("UPDATE venues SET mnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [mnos,mnos, venue_id]);
} else if (tnos) {
  await db.query("UPDATE venues SET tnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [tnos,tnos, venue_id]);
} else if (wnos) {
  await db.query("UPDATE venues SET wnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [wnos,wnos, venue_id]);
} else if (thnos) {
  await db.query("UPDATE venues SET thnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [thnos,thnos, venue_id]);
} else if (frnos) {
  await db.query("UPDATE venues SET frnos = ?, totalnos=totalnos+? WHERE venue_id = ?", [frnos,frnos, venue_id]);
} else if (satnos) {
  await db.query("UPDATE venues SET satnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [satnos,satnos, venue_id]);
} else if (sunnos) {
  await db.query("UPDATE venues SET sunnos = ?,totalnos=totalnos+? WHERE venue_id = ?", [sunnos,sunnos, venue_id]);
} else {
  continue;
}



   
    // //console.log(`Day: ${day}, mnos: ${mnos}, start_time: ${start_time}, end_time: ${end_time}`);


    //for (const subject_id of subject_ids) {
      // //console.log(`Processing subject_id: ${subject_id}`);
      // //console.log(`Day: ${day}, mnos: ${mnos}, start_time: ${start_time}, end_time: ${end_time}`);




      // Fetch subject and related details for each subject_id
      const subjectQuery = `
          SELECT s.subject_code, s.subject_department AS department_name, s.title AS subject_name, 
                 s.credit AS subject_credit, s.type_prac_or_theory AS subject_type,s.semester AS semester, v.venue_id, 
                 v.venue_name, v.location AS venue_location,v.department AS venue_department, u.full_name AS tutor_name, p.program_name, 
                 p.program_type, p.level AS program_level, p.duration AS year,p.program_id AS program_id, s.total_hours_per_week AS total_hours_per_week,
                 v.type AS venue_type, v.status AS venue_status
          FROM subjects s
          JOIN users u ON s.user_id = u.user_id
          JOIN programs p ON s.program_id = p.program_id
          JOIN venues v ON v.venue_id = ?
          WHERE s.subject_id = ?  AND s.subject_id IS NOT NULL
      `;

      const [subjectData] = await db.query(subjectQuery, [venue_id, subject_id]);
      
      // //console.log('Fetched subject data:', subjectData);
      
      if (!subjectData || subjectData.length === 0) {
          console.error(`No subject data found for subject_id: ${subject_id}`);
          continue; // Skip this subject if no data is found
      }

      // Validate subject data fields before inserting
      const {
          subject_code,
          subject_name,
          department_name,
          venue_name,
          tutor_name,
          program_name,
          subject_credit,
          program_level,
          year,
          venue_type,
          venue_status,
          semester,
          total_hours_per_week,
          program_id
      } = subjectData[0]; // Access the first item in the array

      if (!subject_code || !subject_name || !department_name || !venue_name || !tutor_name ||
          !program_id || !subject_credit || !program_level || !year || !start_time || !end_time) {
          console.error(`Incomplete data for subject_id: ${subject_id}. Skipping insertion.`);
          continue; // Skip this subject if any critical field is missing
      }


      //hii itasaidia siku ya jumatatu ianze juu na ijumaa iwe chini wakati wa kuona ratiba
let arrange;
if(day==="MONDAY"){  arrange=1}else if(day==="TUESDAY"){ arrange=2}
else if(day==="WEDNESDAY"){ arrange=3}else if(day==="THURSDAY"){ arrange=4}
else if(day==="FRIDAY"){ arrange=5 }else if(day==="SATURDAY"){ arrange=6} else{ arrange=7}




// Fetch all entries in extracted_timetable to check for collisions
const iscollisionQuery = `SELECT * FROM extracted_timetables`;
const [iscollisionData] = await db.query(iscollisionQuery);

// Flag to track if a collision was found
let collisionFound = false;

for (let entry of iscollisionData) {
    // Check for time overlaps (not just exact matches)
    const timeOverlap = (
        (start_time >= entry.start_time && start_time < entry.end_time) ||  // Overlaps with the start of an existing event
        (end_time > entry.start_time && end_time <= entry.end_time) ||     // Overlaps with the end of an existing event
        (start_time <= entry.start_time && end_time >= entry.end_time)     // Completely overlaps the existing event
    );


    // Check for program, tutor, and venue collisions
    if (
        (timeOverlap && entry.day === day && entry.program_id === program_id && entry.subject_code !== subject_code ) ||
        (timeOverlap && entry.day === day && entry.tutor_name === tutor_name && entry.subject_code !== subject_code) ||
        
        (timeOverlap && entry.day === day && entry.venue_name === venue_name && entry.subject_code !== subject_code)

    ) {
       
        
        collisionFound = true;
         // Collision detected, stop further processing
         console.error(`There is a collision for tutor ${tutor_name} or program ${program_name}. Reassign it.`);
         // Example: Display an error notification using alert
 
        break; // Stop checking further if collision found

    }
}



if (!collisionFound) {
    // No collision, proceed with insertion
    const insertQuery = `
        INSERT INTO extracted_timetables (
            day, start_time, end_time, subject_code, subject_name, department_name, 
            venue_id, venue_name, tutor_name, venue_location, program_name, subject_credit, 
            program_level, year, venue_type, venue_status,semester,venue_capacity,
            program_capacity,program_type,total_hours_per_week,arrange
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)
    `;

    const params = [
        day,
        start_time,
        end_time,
        subject_code,
        subject_name,
        department_name,
        venue_id,
        venue_name,
        tutor_name,
        subjectData[0].venue_location, // Extract venue location
        program_name,
        subject_credit,
        program_level,
        year,
        venue_type,
        venue_status,
        semester,
       venue_capacity,
       program_capacity,
       program_type,
       total_hours_per_week,
       arrange
    ];

    const result = await db.query(insertQuery, params);
    
    // Define the update status query
    const updateQuery = `
      UPDATE subjects
      SET ltpa=ltpa+0.75
      WHERE subject_id=?
    `;
    await db.query(updateQuery,subject_id);

    


    console.log(`Timetable added successfully for subject_id: ${subject_id}`);
} else {
    console.error("There is a collision, reassign it.");
}

   // }



}

else {
// Log an error if the program type is invalid

console.error("Invalid program type.");
 
  } 
  
  
 
}//mabano ya kwenya loop ya for ya kwenye slots
   // } //mabano ya kwenye loop ya if condition
    cs++;
    } //mabano ya kwenya loop ya siku wiki


}

// Output the counter for debugging
console.log(`Total subjects processed: ${cs}`);
  
  }  //mabano ya try

  catch (err) {

      console.error('Error adding timetable:', err.message);
      throw err;
  }
  
}; //mabano ya function addtimetable
  

