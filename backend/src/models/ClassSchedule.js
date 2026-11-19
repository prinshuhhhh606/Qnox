const mongoose = require('mongoose');

const ClassScheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Combat', 'Strength & Rig', 'Hypoxic Athletic', 'Reformer & Mat', 'Hydro / Swim', 'Cryo Recovery'],
      required: true,
    },
    clubName: {
      type: String,
      required: true,
    },
    trainer: {
      trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
      name: { type: String, required: true },
      title: { type: String, required: true },
      image: { type: String },
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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
    intensity: {
      type: String,
      enum: ['High Athletic', 'Precision & Core', 'Endurance & Breath', 'Restorative'],
      default: 'High Athletic',
    },
    capacity: {
      type: Number,
      default: 16,
    },
    bookedSpots: {
      type: Number,
      default: 4,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClassSchedule', ClassScheduleSchema);
