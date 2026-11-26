const mongoose = require('mongoose');

const WorkoutPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Full Body',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      default: 'Intermediate',
    },
    targetAudience: {
      type: String,
      default: 'Intermediate',
    },
    goal: {
      type: String,
      default: 'Muscle Gain',
    },
    level: {
      type: String,
      default: 'Intermediate',
    },
    targetMuscles: [{ type: String }],
    estimatedDurationMinutes: {
      type: Number,
      default: 45,
    },
    durationWeeks: {
      type: Number,
      default: 4,
    },
    exercises: [
      {
        exerciseName: { type: String, default: '' },
        name: { type: String, default: '' },
        targetMuscle: { type: String, default: 'General' },
        equipment: { type: String, default: 'Dumbbells' },
        sets: { type: Number, default: 3 },
        reps: { type: String, default: '10-12 reps' },
        restTimeSec: { type: Number, default: 60 },
        restSeconds: { type: Number, default: 60 },
        weight: { type: mongoose.Schema.Types.Mixed, default: '' },
        weightKg: { type: mongoose.Schema.Types.Mixed, default: 0 },
        instructions: { type: String, default: '' },
      },
    ],
    weeklySchedule: [
      {
        day: {
          type: String,
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
        estimatedMinutes: {
          type: Number,
          default: 45,
        },
        exercises: [
          {
            name: { type: String, default: '' },
            exerciseName: { type: String, default: '' },
            category: { type: String, default: 'General' },
            targetMuscle: { type: String, default: 'Full Body' },
            equipment: { type: String, default: 'Dumbbells' },
            sets: { type: Number, default: 3 },
            reps: { type: String, default: '10-12' },
            weight: { type: mongoose.Schema.Types.Mixed, default: '' },
            weightKg: { type: mongoose.Schema.Types.Mixed, default: 0 },
            restSeconds: { type: Number, default: 60 },
            restTimeSec: { type: Number, default: 60 },
            instructions: { type: String, default: '' },
            isCompleted: { type: Boolean, default: false },
          },
        ],
      },
    ],
    approvalStatus: {
      type: String,
      enum: ['generated', 'approved', 'active', 'completed', 'draft'],
      default: 'generated',
      index: true,
    },
    isSaved: {
      type: Boolean,
      default: false,
      index: true,
    },
    savedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    activatedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPromptContext: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
