const mongoose = require('mongoose');

const FitnessProgressSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    weightKg: {
      type: Number,
    },
    heightCm: {
      type: Number,
    },
    bodyFatPercentage: {
      type: Number,
    },
    chestCm: {
      type: Number,
    },
    waistCm: {
      type: Number,
    },
    hipsCm: {
      type: Number,
    },
    armsCm: {
      type: Number,
    },
    notes: {
      type: String,
      default: '',
    },
    photos: [
      {
        type: String,
      },
    ],
    recordedByName: {
      type: String,
      default: 'Master Coach',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FitnessProgress', FitnessProgressSchema);
