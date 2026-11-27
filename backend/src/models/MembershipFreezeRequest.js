const mongoose = require('mongoose');

const MembershipFreezeRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberId: {
      type: String,
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    memberEmail: {
      type: String,
      required: true,
    },
    membership: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan' },
      planName: { type: String, required: true },
      planCode: { type: String, default: 'METRO' },
      billingCycle: { type: String, default: 'monthly' },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    clubName: {
      type: String,
      default: 'Mayfair Sanctuary',
      index: true,
    },
    requestedStartDate: {
      type: Date,
      required: [true, 'Please provide requested freeze start date'],
    },
    requestedDuration: {
      type: Number,
      required: [true, 'Please provide requested freeze duration in days'],
      min: [7, 'Minimum freeze duration is 7 days'],
      max: [30, 'Maximum freeze duration per request is 30 days'],
    },
    approvedDuration: {
      type: Number,
      min: [7, 'Approved freeze duration cannot be less than 7 days'],
      max: [30, 'Approved freeze duration cannot exceed 30 days'],
    },
    scheduledStartDate: {
      type: Date,
    },
    scheduledEndDate: {
      type: Date,
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    resumedAt: {
      type: Date,
    },
    reason: {
      type: String,
      enum: ['Travelling', 'Medical', 'Personal Reasons', 'Work Commitments', 'Other'],
      required: [true, 'Please select a valid freeze reason'],
      default: 'Personal Reasons',
    },
    additionalNotes: {
      type: String,
      default: '',
      trim: true,
    },
    supportingDocument: {
      type: String, // Document URL or reference
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Frozen', 'Resumed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
    originalExpiryDate: {
      type: Date,
    },
    extendedExpiryDate: {
      type: Date,
    },
    history: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String, default: 'System' },
        note: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for query performance
MembershipFreezeRequestSchema.index({ member: 1, status: 1 });
MembershipFreezeRequestSchema.index({ clubName: 1, status: 1 });
MembershipFreezeRequestSchema.index({ requestedStartDate: 1, scheduledStartDate: 1 });
MembershipFreezeRequestSchema.index({ scheduledEndDate: 1, status: 1 });

module.exports = mongoose.model('MembershipFreezeRequest', MembershipFreezeRequestSchema);
