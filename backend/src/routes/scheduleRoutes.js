const express = require('express');
const router = express.Router();
const { getSchedules, bookClassSpot } = require('../controllers/scheduleController');

router.route('/')
  .get(getSchedules);

router.route('/:classId/book')
  .post(bookClassSpot);

module.exports = router;
