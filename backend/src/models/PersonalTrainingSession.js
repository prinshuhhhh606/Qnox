const mongoose = require('mongoose');

const PersonalTrainingSessionSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['1-on-1 PT', 'Biometric Audit', 'Functional Movement Screen', 'Strength Coaching', 'Combat Strike', 'Recovery Protocol'],
      default: '1-on-1 PT',
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed'],
      default: 'Scheduled',
    },
    focusArea: {
      type: String,
      default: 'Hypertrophy & Biomechanics',
    },
    trainerNotes: {
      type: String,
      default: '',
    },
    memberNotes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PersonalTrainingSession', PersonalTrainingSessionSchema);
