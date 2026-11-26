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
      required: false,
      index: true,
    },
    assessmentType: {
      type: String,
      default: 'Monthly',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    bmi: { type: Number },
    bodyFatPercentage: { type: Number, default: 15 },
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
    circumferences: {
      chest: { type: Number, default: 0 },
      waist: { type: Number, default: 0 },
      hips: { type: Number, default: 0 },
      leftArm: { type: Number, default: 0 },
      rightArm: { type: Number, default: 0 },
      leftThigh: { type: Number, default: 0 },
      rightThigh: { type: Number, default: 0 },
      shoulders: { type: Number, default: 0 },
    },
    performanceTests: {
      pushupsCount: { type: Number, default: 35 },
      plankSeconds: { type: Number, default: 90 },
      vo2Max: { type: Number, default: 46 },
      restingHeartRate: { type: Number, default: 62 },
      flexibilityScore: { type: String, default: 'Good' },
    },
    transformationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
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
  if (!this.assessmentDate && this.date) {
    this.assessmentDate = this.date;
  }
  next();
});

module.exports = mongoose.model('FitnessAssessment', FitnessAssessmentSchema);
