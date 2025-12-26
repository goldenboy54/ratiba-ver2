import express from 'express';
import { handleAddtimetable } from '../logics/tmasterLogic.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// POST: Start timetable generation
router.post('/add', handleAddtimetable);

// GET: Stream logs in real-time using SSE
router.get('/stream-logs', (req, res) => {
  const { semester } = req.query;
  if (!semester) return res.status(400).send('Semester required');

  const logPath = path.join(process.cwd(), 'models', 'timetable-logs.txt');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.flushHeaders();

  res.write(`data: 🚀 Starting timetable generation for Semester ${semester}...\n\n`);

  let lastLineCount = 0;

  const sendLogs = () => {
    if (!fs.existsSync(logPath)) return;

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > lastLineCount) {
      const newLines = lines.slice(lastLineCount);
      newLines.forEach(line => {
        if (line.trim()) {
          if (line.includes('All subjects assigned successfully')) {
            res.write(`data: ✅ Timetable generation completed for semester ${semester}\n\n`);
            res.write(`data: [DONE]\n\n`);
            watcher.close();
            res.end();
            return;
          }
          res.write(`data: ${line}\n\n`);
        }
      });
      lastLineCount = lines.length;
    }
  };

  const watcher = fs.watch(logPath, () => {
    sendLogs();
  });

  // Send existing logs first
  sendLogs();

  // Send completion if file has success line already
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf-8');
    if (content.includes('All subjects assigned successfully')) {
      res.write(`data: ✅ Timetable generation completed for semester ${semester}\n\n`);
      res.write(`data: [DONE]\n\n`);
      watcher.close();
      res.end();
    }
  }

  req.on('close', () => {
    watcher.close();
    res.end();
  });
});

export default router;