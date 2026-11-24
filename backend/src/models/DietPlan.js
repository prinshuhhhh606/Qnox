const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema(
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
    dietaryPreference: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'High Protein', 'Custom'],
      default: 'High Protein',
    },
    dailyCalorieTarget: {
      type: Number,
      required: true,
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
          enum: ['Early Morning', 'Breakfast', 'Mid-Morning', 'Lunch', 'Evening Snacks', 'Pre-Workout', 'Post-Workout', 'Dinner'],
          required: true,
        },
        time: { type: String, default: '08:00 AM' },
        items: { type: String, required: true },
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fats: { type: Number, default: 0 },
        instructions: { type: String, default: '' },
      },
    ],
    isAiGenerated: {
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
