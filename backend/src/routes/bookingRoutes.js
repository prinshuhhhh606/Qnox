const express = require('express');
const router = express.Router();
const {
  bookClass,
  cancelBooking,
  getMyBookings,
  getAllBookings,
  markAttendance,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/', protect, bookClass);
router.put('/:id/cancel', protect, cancelBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/all', protect, authorize('Admin', 'Super Admin'), getAllBookings);
router.put('/:id/attendance', protect, authorize('Admin', 'Super Admin', 'Trainer'), markAttendance);

module.exports = router;
