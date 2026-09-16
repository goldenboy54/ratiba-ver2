import express from 'express';
import { handleAddtimetable } from '../logics/tmasterLogic.js';
import { getSemesterOptions } from '../models/semesterCalendar.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.get('/semesters', async (req, res) => {
  try {
    res.json({ semesters: await getSemesterOptions() });
  } catch (error) {
    console.error('TMASTER_SEMESTERS_ERROR', error);
    res.status(500).json({ error: error.message || 'Unable to load semesters' });
  }
});

// POST: Start timetable generation
router.post('/add', handleAddtimetable);

// GET: Stream logs in real-time using SSE
router.get('/stream-logs', (req, res) => {
  const { semester } = req.query;
  if (!semester) return res.status(400).send('Semester required');

  const logPath = path.join(process.cwd(), 'models', 'timetable-logs.txt');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, '');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  res.write(`data: 🚀 Starting timetable generation for Semester ${semester}...\n\n`);

  let lastLineCount = 0;
  let finished = false;
  let poll;

  const finish = (message, event) => {
    if (finished) return;
    finished = true;
    if (message) res.write(`data: ${message}\n\n`);
    res.write(`data: ${event}\n\n`);
    if (poll) clearInterval(poll);
    res.end();
  };

  const sendLogs = () => {
    if (finished || !fs.existsSync(logPath)) return;

    const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
    for (const line of lines.slice(lastLineCount)) {
      if (!line.trim()) continue;
      res.write(`data: ${line}\n\n`);
      if (line.includes('=== TIMETABLE GENERATION COMPLETED SUCCESSFULLY ===')) {
        finish(`✅ Timetable generation completed for semester ${semester}`, '[DONE]');
        return;
      }
      if (line.includes('FATAL ERROR:')) {
        finish(`[ERROR] ${line}`, `[ERROR] ${line}`);
        return;
      }
    }
    lastLineCount = lines.length;
  };

  poll = setInterval(sendLogs, 500);

  req.on('close', () => {
    if (!finished) {
      finished = true;
      clearInterval(poll);
    }
  });
});

export default router;