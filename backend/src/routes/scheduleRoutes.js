const express = require('express');
const router = express.Router();
const { getSchedules, bookClassSpot } = require('../controllers/scheduleController');

router.route('/')
  .get(getSchedules);

// Alias for weekly timetable schedule
router.route('/week')
  .get(getSchedules);

router.route('/:classId/book')
  .post(bookClassSpot);

module.exports = router;
