import { addtimetable } from '../models/tmasterModel.js';

export const handleAddtimetable = async (req, res) => {
  const { semester } = req.body;

  if (!semester) {
    return res.status(400).json({ error: 'Missing semester' });
  }

  console.log(`🚀 Timetable generation STARTED for semester ${semester}`);

  // Run in background
  addtimetable({ semester })
    .then(() => {
      console.log(`✅ Timetable generation completed for semester ${semester}`);
    })
    .catch(err => {
      console.error(`❌ Timetable generation FAILED for semester ${semester}:`, err.message);
    });

  res.json({ 
    message: 'Timetable generation started successfully',
    semester 
  });
};