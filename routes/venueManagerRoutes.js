// routes/venueManagerRoutes.js
import express from 'express';
import multer from 'multer';
import {
  showVenueForm,
  handleAddVenue,
  getEditVenueForm,
  handleUpdateVenue,
  handleDeleteVenue,
  searchVenues,
  getDistinct,
  handleUploadCSV
} from '../logics/venueManagerLogic.js';
import { getAlldepartments } from '../models/departmentsModel.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const standardTimes = [
  "07:30-08:15", "08:15-09:00", "09:05-09:50", "09:50-10:35",
  "11:00-11:45", "11:45-12:30", "13:15-14:00", "14:00-14:45",
  "14:50-15:35", "15:35-16:20", "16:25-17:10", "17:10-17:55",
  "18:00-18:45", "18:45-19:30", "19:35-20:20", "20:20-21:05",
  "21:10-21:55", "21:55-22:40"
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const slots = Array.from({ length: 18 }, (_, i) => i + 1);
const slotStatuses = ['unused', 'used']; // Assumed possible statuses

router.get('/', async (req, res) => {
  try {
    const criteria = {
      venue_name: req.query.venue_name,
      capacity: req.query.capacity,
      location: req.query.location,
      type: req.query.type,
      quality: req.query.quality,
      department: req.query.department,
      status: req.query.status,
      day: req.query.day,
      slot: req.query.slot,
      slot_status: req.query.slot_status
    };
    const Viewvenues = await searchVenues(criteria);

    const Vname = await getDistinct('venue_name');
    const Vcap = await getDistinct('capacity');
    const Vloc = await getDistinct('location');
    const Vtype = await getDistinct('type');
    const Vqual = await getDistinct('quality');
    const Vdep = await getDistinct('department');
    const Vstat = await getDistinct('status');

    const departments = await getAlldepartments();

    res.render('venueManager', {
      Vname, Vcap, Vloc, Vtype, Vqual, Vdep, Vstat,
      Viewvenues, departments, days, slots, slotStatuses, standardTimes,
      ...criteria
    });
  } catch (error) {
    res.status(500).send('Error searching venues: ' + error.message);
  }
});

router.get('/form', showVenueForm);
router.post('/', handleAddVenue);
router.get('/edit/:id', getEditVenueForm);
router.post('/edit/:id', handleUpdateVenue);
router.get('/delete/:id', handleDeleteVenue);
router.post('/upload', upload.single('file'), handleUploadCSV);

export default router;
