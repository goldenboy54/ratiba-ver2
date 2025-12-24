import express from 'express';
import { handleAddtimetable} from '../logics/tmasterLogic.js';

const router = express.Router();

// Route to add a new timetable
router.post('/add', handleAddtimetable);


export default router;
