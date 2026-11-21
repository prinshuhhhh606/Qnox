const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide membership plan name'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide plan code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricing: {
      monthly: { type: Number, required: true },
      quarterly: { type: Number, required: true },
      halfYearly: { type: Number, required: true },
      yearly: { type: Number, required: true },
    },
    benefits: [
      {
        type: String,
        required: true,
      },
    ],
    features: {
      accessType: { type: String, default: 'Single Club' },
      poolAccess: { type: Boolean, default: true },
      altitudeChamber: { type: Boolean, default: false },
      cryotherapy: { type: Boolean, default: false },
      valetParking: { type: Boolean, default: false },
      guestPassesPerQuarter: { type: Number, default: 2 },
      priorityBookingDays: { type: Number, default: 7 },
    },
    freezeAllowanceDays: {
      type: Number,
      default: 30,
    },
    taxRate: {
      type: Number,
      default: 18,
    },
    discountPricing: {
      monthly: { type: Number, default: 0 },
      quarterly: { type: Number, default: 0 },
      halfYearly: { type: Number, default: 0 },
      yearly: { type: Number, default: 0 },
    },
    renewalEligibility: {
      type: Boolean,
      default: true,
    },
    autoRenewEligibility: {
      type: Boolean,
      default: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'hidden', 'invite-only'],
      default: 'public',
    },
    terms: {
      type: String,
      default: 'Residency privileges are personal and subject to sanctuary rules.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    tag: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
