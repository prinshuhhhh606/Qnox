const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Unique slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Company-Owned', 'SaaS-Partner'],
      default: 'Company-Owned',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ownerName: {
      type: String,
      default: '',
    },
    ownerEmail: {
      type: String,
      default: '',
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganizationSubscription',
    },
    status: {
      type: String,
      enum: ['Active', 'Pending-Approval', 'Suspended', 'Cancelled'],
      default: 'Active',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    // Quota limits (enforced for SaaS, unlimited/high for Company-Owned)
    branchesLimit: {
      type: Number,
      default: 10,
    },
    trainersLimit: {
      type: Number,
      default: 50,
    },
    membersLimit: {
      type: Number,
      default: 5000,
    },
    // Phase 3: All-Access Gym Network Partnership status
    allAccessPartnerStatus: {
      type: String,
      enum: ['None', 'Applied', 'Approved', 'Suspended'],
      default: 'None',
    },
    allAccessApplicationDate: {
      type: Date,
    },
    allAccessApprovedAt: {
      type: Date,
    },
    settlementRatePerVisit: {
      type: Number,
      default: 250, // in INR (configurable by Super Admin)
    },
    settlementPercentage: {
      type: Number,
      default: 70, // % of member visit value
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

OrganizationSchema.index({ type: 1, status: 1 });
OrganizationSchema.index({ allAccessPartnerStatus: 1 });

module.exports = mongoose.model('Organization', OrganizationSchema);
