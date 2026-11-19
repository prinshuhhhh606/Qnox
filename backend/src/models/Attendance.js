const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    clubName: {
      type: String,
      default: 'Mayfair Sanctuary',
    },
    activityType: {
      type: String,
      enum: ['Workout', 'Class', 'Spa', 'Private Training'],
      default: 'Workout',
    },
    recordedByName: {
      type: String,
      default: 'Executive Concierge',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
