const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide exercise name'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Chest Workout',
        'Back Workout',
        'Shoulder Workout',
        'Biceps Workout',
        'Triceps Workout',
        'Leg Workout',
        'Abs Workout',
        'Cardio Workout',
        'Full Body Workout',
        'Strength Training',
        'Fat Loss Workout',
        'Muscle Gain Workout',
      ],
    },
    targetMuscle: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryMuscles: [{ type: String }],
    equipment: {
      type: String,
      required: true,
      enum: [
        'Dumbbells',
        'Barbells',
        'Cable Machines',
        'Smith Machine',
        'Treadmill',
        'Bench Press',
        'Leg Press',
        'Resistance Bands',
        'Bodyweight Exercises',
        'Kettlebells',
        'Other',
      ],
      default: 'Dumbbells',
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    defaultSets: {
      type: Number,
      default: 3,
    },
    defaultReps: {
      type: String,
      default: '10-12 reps',
    },
    restTimeSec: {
      type: Number,
      default: 60,
    },
    instructions: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', ExerciseSchema);
