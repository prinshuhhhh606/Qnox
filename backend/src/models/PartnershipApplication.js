const mongoose = require('mongoose');

const PartnershipApplicationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    clubName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    offeredFacilities: [
      {
        type: String,
      },
    ],
    allAccessHours: {
      type: String,
      default: '07:00 - 21:00',
    },
    maxDailyNetworkVisitors: {
      type: Number,
      default: 30,
    },
    requestedRatePerVisit: {
      type: Number,
      default: 250,
    },
    agreedRatePerVisit: {
      type: Number,
      default: 250,
    },
    verificationDocs: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        verified: { type: Boolean, default: false },
      },
    ],
    agreementAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Under-Review', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending',
      index: true,
    },
    adminRemarks: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PartnershipApplication', PartnershipApplicationSchema);
