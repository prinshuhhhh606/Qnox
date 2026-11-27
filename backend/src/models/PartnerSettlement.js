const mongoose = require('mongoose');

const PartnerSettlementSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    partnerClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
      index: true,
    },
    partnerClubName: {
      type: String,
      required: true,
    },
    periodMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    periodYear: {
      type: Number,
      required: true,
    },
    totalCheckIns: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratePerVisit: {
      type: Number,
      required: true,
      min: 0,
    },
    totalGrossPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    platformCommissionPercent: {
      type: Number,
      default: 20, // 20% platform management commission
    },
    platformFeeAmount: {
      type: Number,
      default: 0,
    },
    netPayoutAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Disbursed', 'Disputed'],
      default: 'Pending',
      index: true,
    },
    paymentReference: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

PartnerSettlementSchema.index({ organization: 1, periodYear: 1, periodMonth: 1 });

module.exports = mongoose.model('PartnerSettlement', PartnerSettlementSchema);
