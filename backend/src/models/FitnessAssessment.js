const mongoose = require('mongoose');

const FitnessAssessmentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      required: true,
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ['Initial', 'Weekly', 'Monthly'],
      default: 'Initial',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    bmi: { type: Number },
    bodyFatPercentage: { type: Number },
    measurements: {
      chestCm: { type: Number, default: 0 },
      waistCm: { type: Number, default: 0 },
      hipsCm: { type: Number, default: 0 },
      leftArmCm: { type: Number, default: 0 },
      rightArmCm: { type: Number, default: 0 },
      leftThighCm: { type: Number, default: 0 },
      rightThighCm: { type: Number, default: 0 },
      shouldersCm: { type: Number, default: 0 },
    },
    transformationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    beforePhoto: { type: String, default: '' },
    afterPhoto: { type: String, default: '' },
    trainerNotes: { type: String, default: '' },
    clientFeedback: { type: String, default: '' },
  },
  { timestamps: true }
);

FitnessAssessmentSchema.pre('save', function (next) {
  if (this.heightCm && this.weightKg) {
    const heightM = this.heightCm / 100;
    this.bmi = parseFloat((this.weightKg / (heightM * heightM)).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('FitnessAssessment', FitnessAssessmentSchema);
