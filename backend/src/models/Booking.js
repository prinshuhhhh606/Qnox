const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userPhone: {
      type: String,
    },
    classId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'ClassSchedule',
      required: true,
    },
    classTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    clubName: {
      type: String,
      required: true,
    },
    trainerName: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    classDate: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 50,
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Cancelled', 'Attended', 'No-Show'],
      default: 'Confirmed',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
