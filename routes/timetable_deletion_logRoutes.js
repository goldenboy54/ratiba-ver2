// routes/timetable_deletion_logRoutes.js
import express from 'express';
import {
  getAllDeletionLogs,
  deleteOneLog,
  deleteAllLogs
} from '../logics/timetable_deletion_logLogic.js';

const router = express.Router();

// GET /timetable-deletion-logs
router.get('/', getAllDeletionLogs);

// POST /timetable-deletion-logs/:id/delete
router.post('/:id/delete', deleteOneLog);

// POST /timetable-deletion-logs/delete-all
router.post('/delete-all', deleteAllLogs);

export default router;