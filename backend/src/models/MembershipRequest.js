const mongoose = require('mongoose');

const MembershipRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    memberId: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Freeze', 'Cancellation'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide reason for request'],
    },
    freezeStartDate: {
      type: Date,
    },
    freezeEndDate: {
      type: Date,
    },
    freezeDays: {
      type: Number,
      default: 30,
    },
    refundAmount: {
      type: Number,
      default: 0,
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
    adminNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipRequest', MembershipRequestSchema);
