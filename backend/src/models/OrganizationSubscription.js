const mongoose = require('mongoose');

const OrganizationSubscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaaSSubscriptionPlan',
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['Trial', 'Active', 'Past-Due', 'Suspended', 'Cancelled', 'Expired'],
      default: 'Active',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    gracePeriodEnd: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
      default: '',
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    history: [
      {
        action: { type: String, enum: ['Activation', 'Renewal', 'Upgrade', 'Downgrade', 'Suspension', 'Cancellation'] },
        planName: String,
        amount: Number,
        billingCycle: String,
        date: { type: Date, default: Date.now },
        performedBy: String,
        notes: String,
      },
    ],
  },
  { timestamps: true }
);

OrganizationSubscriptionSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('OrganizationSubscription', OrganizationSubscriptionSchema);
