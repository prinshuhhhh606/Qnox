const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: false,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dietaryPreference: {
      type: String,
      default: 'High Protein',
    },
    goal: {
      type: String,
      default: 'Muscle Gain',
    },
    dailyCalorieTarget: {
      type: Number,
      default: 2400,
    },
    targetCalories: {
      type: Number,
      default: 2400,
    },
    macros: {
      proteinGrams: { type: Number, default: 150 },
      carbsGrams: { type: Number, default: 200 },
      fatsGrams: { type: Number, default: 60 },
      fiberGrams: { type: Number, default: 30 },
    },
    meals: [
      {
        mealCategory: {
          type: String,
          default: 'Lunch',
        },
        category: {
          type: String,
          default: 'Lunch',
        },
        name: { type: String, default: '' },
        time: { type: String, default: '08:00 AM' },
        items: { type: mongoose.Schema.Types.Mixed, default: '' },
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        instructions: { type: String, default: '' },
      },
    ],
    guidelines: [{ type: String }],
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Assigned'],
      default: 'Active',
    },
    trainerNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DietPlan', DietPlanSchema);
