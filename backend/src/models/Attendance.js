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
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    passType: {
      type: String,
      enum: ['Home-Club', 'All-Access-Network', 'Day-Pass', 'Guest'],
      default: 'Home-Club',
    },
    verificationMethod: {
      type: String,
      enum: ['QR-Dynamic', 'Biometric', 'Desk-Manual', 'NFC'],
      default: 'QR-Dynamic',
    },
    status: {
      type: String,
      enum: ['Approved', 'Denied', 'Flagged'],
      default: 'Approved',
    },
    denialReason: {
      type: String,
      default: '',
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
