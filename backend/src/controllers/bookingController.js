const Booking = require('../models/Booking');
const ClassSchedule = require('../models/ClassSchedule');
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../services/emailService');

// @desc    Book a Masterclass Spot (Atomic Capacity Check & Duplicate Prevention)
// @route   POST /api/bookings
exports.bookClass = async (req, res, next) => {
  try {
    const { classId, classDate } = req.body;
    const user = req.user;

    const selectedDate = classDate || new Date().toISOString().split('T')[0];

    // 1. Prevent duplicate bookings by the same user for this class on this date
    const existingBooking = await Booking.findOne({
      user: user._id,
      classId,
      classDate: selectedDate,
      status: 'Confirmed',
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already hold an active reservation for this session.',
        reservationCode: existingBooking.reservationCode,
      });
    }

    // 2. Atomic check and increment for class capacity
    const scheduledClass = await ClassSchedule.findOneAndUpdate(
      {
        _id: classId,
        $expr: { $lt: ['$bookedSpots', '$capacity'] },
      },
      {
        $inc: { bookedSpots: 1 },
      },
      { new: true }
    );

    if (!scheduledClass) {
      return res.status(400).json({
        success: false,
        message: 'This session is strictly at full capacity. Reservation unavailable.',
      });
    }

    // 3. Generate unique luxury reservation code
    const reservationCode = `QNX-${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await Booking.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      classId: scheduledClass._id,
      classTitle: scheduledClass.title,
      category: scheduledClass.category,
      clubName: scheduledClass.clubName,
      trainerName: scheduledClass.trainer?.name || 'Sanctuary Master Trainer',
      classDate: selectedDate,
      day: scheduledClass.day,
      startTime: scheduledClass.startTime,
      durationMinutes: scheduledClass.durationMinutes,
      reservationCode,
      status: 'Confirmed',
    });

    // 4. Send Confirmation Email asynchronously
    sendBookingConfirmationEmail(booking).catch((e) => console.log(e.message));

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${scheduledClass.title}.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a Booking & Automatically Release Seat
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation record not found.',
      });
    }

    // Verify ownership or admin privileges
    if (
      booking.user.toString() !== req.user._id.toString() &&
      !['Admin', 'Super Admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this reservation.',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This reservation is already cancelled.',
      });
    }

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Member schedule adjustment';
    await booking.save();

    // Atomically release seat on the class schedule
    await ClassSchedule.findByIdAndUpdate(booking.classId, {
      $inc: { bookedSpots: -1 },
    });

    // Send Cancellation Email
    sendBookingCancellationEmail(booking).catch((e) => console.log(e.message));

    res.status(200).json({
      success: true,
      message: 'Reservation successfully cancelled. Seat released back to sanctuary.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Bookings
// @route   GET /api/bookings/my-bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Bookings (Admin)
// @route   GET /api/bookings/all
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, club, day } = req.query;
    let query = {};
    if (status) query.status = status;
    if (club) query.clubName = { $regex: club, $options: 'i' };
    if (day) query.day = day;

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Attendance (Admin / Trainer)
// @route   PUT /api/bookings/:id/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Attended' or 'No-Show'
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    booking.status = status || 'Attended';
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Attendance updated to ${booking.status}.`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
