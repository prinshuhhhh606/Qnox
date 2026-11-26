const mongoose = require('mongoose');

const WorkoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      required: true,
      index: true,
    },
    planTitle: {
      type: String,
      default: 'Sanctuary Athletic Protocol',
    },
    dayName: {
      type: String,
      default: 'Day 1',
    },
    dayFocus: {
      type: String,
      default: 'Full Body Conditioning',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
      index: true,
    },
    exercises: [
      {
        name: { type: String, required: true },
        category: { type: String, default: 'General' },
        targetMuscle: { type: String, default: 'Full Body' },
        equipment: { type: String, default: 'Dumbbells' },
        targetSets: { type: Number, default: 3 },
        targetReps: { type: String, default: '10-12' },
        restSeconds: { type: Number, default: 60 },
        instructions: { type: String, default: '' },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        completedSets: [
          {
            setNumber: { type: Number, required: true },
            reps: { type: Number, default: 10 },
            weightKg: { type: Number, default: 0 },
            completedAt: { type: Date, default: Date.now },
            isCompleted: { type: Boolean, default: true },
          },
        ],
      },
    ],
    totalExercisesCompleted: {
      type: Number,
      default: 0,
    },
    totalSetsCompleted: {
      type: Number,
      default: 0,
    },
    totalRepsCompleted: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    userRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutSession', WorkoutSessionSchema);
