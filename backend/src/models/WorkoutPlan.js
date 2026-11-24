const mongoose = require('mongoose');

const WorkoutPlanSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      enum: ['Fat Loss', 'Muscle Gain', 'Strength Training', 'General Fitness', 'Athletic Performance', 'Recovery & Mobility'],
      default: 'Muscle Gain',
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    durationWeeks: {
      type: Number,
      default: 8,
    },
    weeklySchedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        focus: {
          type: String,
          default: 'Rest',
        },
        isRestDay: {
          type: Boolean,
          default: false,
        },
        exercises: [
          {
            name: { type: String, required: true },
            category: { type: String, default: 'General' },
            targetMuscle: { type: String, default: 'Full Body' },
            equipment: { type: String, default: 'Dumbbells' },
            sets: { type: Number, default: 3 },
            reps: { type: String, default: '10-12' },
            weightKg: { type: Number, default: 0 },
            restSeconds: { type: Number, default: 60 },
            instructions: { type: String, default: '' },
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Draft', 'Assigned', 'Active', 'Completed'],
      default: 'Active',
    },
    trainerNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutPlan', WorkoutPlanSchema);
