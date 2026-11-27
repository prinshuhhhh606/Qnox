const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ClassSchedule = require('../models/ClassSchedule');
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../services/emailService');

// @desc    Book a Masterclass Spot (Atomic Capacity Check & Duplicate Prevention)
// @route   POST /api/bookings
exports.bookClass = async (req, res, next) => {
  try {
    let { classId, classDate, classTitle, clubName, trainerName, day, startTime, durationMinutes, category } = req.body;
    const user = req.user;

    // Handle nested payload if frontend passed object inside classId
    if (typeof classId === 'object' && classId !== null) {
      classTitle = classTitle || classId.classTitle || classId.title;
      clubName = clubName || classId.clubName;
      trainerName = trainerName || classId.trainerName || classId.trainer?.name;
      day = day || classId.day;
      startTime = startTime || classId.startTime;
      durationMinutes = durationMinutes || classId.durationMinutes;
      category = category || classId.category;
      classDate = classDate || classId.classDate;
      classId = classId.classId || classId._id;
    }

    const selectedDate = classDate || new Date().toISOString().split('T')[0];

    // Check Membership & 3-Day Trial Gating (Admins and Trainers exempt)
    const User = require('../models/User');
    const freshUser = await User.findById(user._id);
    const now = new Date();

    if (freshUser && !['Admin', 'Super Admin', 'Trainer'].includes(freshUser.role)) {
      if (freshUser.membership?.status === 'Frozen' || freshUser.membership?.isFrozen) {
        return res.status(403).json({
          success: false,
          code: 'MEMBERSHIP_FROZEN',
          message: 'Your membership residency is currently frozen. Sanctuary class and session bookings are suspended during the freeze period.',
        });
      }

      const isPaidActive = freshUser.membership?.status === 'Active' && (!freshUser.membership.endDate || new Date(freshUser.membership.endDate) >= now);

      let isTrialActive = false;
      if (freshUser.trial?.status === 'Active' && freshUser.trial.endDate) {
        if (now > new Date(freshUser.trial.endDate)) {
          // Auto-expire trial on protected access
          freshUser.trial.isActive = false;
          freshUser.trial.status = 'Expired';
          await freshUser.save({ validateBeforeSave: false });
        } else {
          isTrialActive = true;
        }
      }

      if (!isPaidActive && !isTrialActive) {
        if (freshUser.trial?.status === 'Expired' || (freshUser.trial?.endDate && now > new Date(freshUser.trial.endDate))) {
          return res.status(403).json({
            success: false,
            code: 'TRIAL_EXPIRED',
            message: 'Your 3-Day Free Trial has expired. Choose a membership plan to continue.',
          });
        }
        return res.status(403).json({
          success: false,
          code: 'NO_ACTIVE_MEMBERSHIP',
          message: 'An active membership or active 3-Day Free Trial is required to reserve sanctuary sessions.',
        });
      }
    }

    // 1. Prevent duplicate bookings by the same user for this class on this date
    try {
      const existingBooking = await Booking.findOne({
        user: user._id,
        classId: String(classId),
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
    } catch (e) {
      // Non-blocking query fallback
    }

    // 2. Atomic check and increment for class capacity if valid ObjectId
    let scheduledClass = null;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(classId);

    if (isValidObjectId) {
      scheduledClass = await ClassSchedule.findOneAndUpdate(
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
        const fullCheck = await ClassSchedule.findById(classId);
        if (fullCheck && fullCheck.bookedSpots >= fullCheck.capacity) {
          return res.status(400).json({
            success: false,
            message: 'This session is strictly at full capacity. Reservation unavailable.',
          });
        }
      }
    } else {
      // For string IDs (e.g. cls_1), find by title or update if exists
      scheduledClass = await ClassSchedule.findOne({
        title: classTitle || 'METCON HYPOXIC 3000',
      });
      if (scheduledClass) {
        if (scheduledClass.bookedSpots >= scheduledClass.capacity) {
          return res.status(400).json({
            success: false,
            message: 'This session is strictly at full capacity. Reservation unavailable.',
          });
        }
        scheduledClass.bookedSpots += 1;
        await scheduledClass.save();
      }
    }

    // 3. Generate unique luxury reservation code
    const reservationCode = `QNX-${Math.floor(100000 + Math.random() * 900000)}`;

    const finalTitle = scheduledClass?.title || classTitle || 'Sanctuary Masterclass';
    const finalCategory = scheduledClass?.category || category || 'Hypoxic Athletic';
    const finalClubName = scheduledClass?.clubName || clubName || 'QNOX Mayfair Sanctuary';
    const finalTrainerName = scheduledClass?.trainer?.name || trainerName || 'Sanctuary Master Trainer';
    const finalDay = scheduledClass?.day || day || 'Monday';
    const finalStartTime = scheduledClass?.startTime || startTime || '07:00';
    const finalDuration = scheduledClass?.durationMinutes || durationMinutes || 50;

    const booking = await Booking.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      classId: scheduledClass?._id || classId || new mongoose.Types.ObjectId(),
      classTitle: finalTitle,
      category: finalCategory,
      clubName: finalClubName,
      trainerName: finalTrainerName,
      classDate: selectedDate,
      day: finalDay,
      startTime: finalStartTime,
      durationMinutes: finalDuration,
      reservationCode,
      status: 'Confirmed',
    });

    // 4. Send Confirmation Email asynchronously
    sendBookingConfirmationEmail(booking).catch((e) => console.log('[Email]', e.message));

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${finalTitle}.`,
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

    // Atomically release seat on the class schedule if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(booking.classId)) {
      await ClassSchedule.findByIdAndUpdate(booking.classId, {
        $inc: { bookedSpots: -1 },
      });
    }

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
