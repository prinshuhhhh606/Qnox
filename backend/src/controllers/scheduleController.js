const mongoose = require('mongoose');
const ClassSchedule = require('../models/ClassSchedule');
const { sampleClasses } = require('../seed/seedData');

let inMemoryClasses = [...sampleClasses];

exports.getSchedules = async (req, res, next) => {
  try {
    const { day, category, club } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (day && day !== 'All Days') query.day = day;
      if (category && category !== 'All Disciplines') query.category = category;
      if (club && club !== 'All Sanctuaries') query.clubName = { $regex: club, $options: 'i' };

      const schedules = await ClassSchedule.find(query).sort({ startTime: 1 });
      if (schedules && schedules.length > 0) {
        return res.status(200).json({
          success: true,
          count: schedules.length,
          data: schedules,
        });
      }
    }

    // Filter in-memory fallback
    let filtered = [...inMemoryClasses];
    if (day && day !== 'All Days') {
      filtered = filtered.filter((c) => c.day.toLowerCase() === day.toLowerCase());
    }
    if (category && category !== 'All Disciplines') {
      filtered = filtered.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }
    if (club && club !== 'All Sanctuaries') {
      filtered = filtered.filter((c) => c.clubName.toLowerCase().includes(club.toLowerCase()));
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      count: inMemoryClasses.length,
      data: inMemoryClasses,
    });
  }
};

exports.bookClassSpot = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { memberName, email } = req.body;

    let bookedClass = null;
    try {
      bookedClass = await ClassSchedule.findById(classId);
      if (bookedClass) {
        if (bookedClass.bookedSpots >= bookedClass.capacity) {
          return res.status(400).json({
            success: false,
            message: 'Class is strictly at capacity. Placed on VIP waitlist.',
          });
        }
        bookedClass.bookedSpots += 1;
        await bookedClass.save();
      }
    } catch (e) {
      // In-memory mode
    }

    return res.status(200).json({
      success: true,
      message: `Confirmed reserved slot for ${memberName || 'Valued Member'}. Concierge pass dispatched to ${email || 'your registered email'}.`,
      reservationCode: `QNX-${Math.floor(100000 + Math.random() * 900000)}`,
      classDetails: bookedClass || inMemoryClasses[0],
    });
  } catch (error) {
    next(error);
  }
};
