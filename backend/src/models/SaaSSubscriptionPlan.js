const mongoose = require('mongoose');

const SaaSSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['Starter', 'Professional', 'Enterprise'],
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxBranches: {
      type: Number,
      required: true,
      default: 1,
    },
    maxTrainers: {
      type: Number,
      required: true,
      default: 5,
    },
    maxMembers: {
      type: Number,
      required: true,
      default: 200,
    },
    modules: {
      aiWorkout: { type: Boolean, default: true },
      ptBooking: { type: Boolean, default: true },
      biometrics: { type: Boolean, default: false },
      analytics: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      qrAccess: { type: Boolean, default: true },
      dietPlanning: { type: Boolean, default: false },
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SaaSSubscriptionPlan', SaaSSubscriptionPlanSchema);
