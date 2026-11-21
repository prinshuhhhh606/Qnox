const mongoose = require('mongoose');

const SchedulerLockSchema = new mongoose.Schema(
  {
    lockName: {
      type: String,
      required: true,
      unique: true,
    },
    lockedUntil: {
      type: Date,
      required: true,
    },
    lockedBy: {
      type: String,
      default: 'primary-instance',
    },
    lastRunAt: {
      type: Date,
      default: Date.now,
    },
    lastSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SchedulerLock', SchedulerLockSchema);
