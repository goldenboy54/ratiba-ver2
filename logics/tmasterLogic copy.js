
import { addtimetable } from '../models/tmasterModel.js';

export const handleAddtimetable = async (req, res) => {
  let {semester} = req.body;


console.log(semester)

  if (!semester) {
      return res.status(400).send('Missing required field:SEMESTER');
  }

  try {
      // Pass the parameters correctly to the model function
      await addtimetable({semester }); // Pass as an object
      res.redirect('/tmaster');
  } catch (error) {
      res.status(500).send('Error adding timetable: ' + error.message);
  }
};
