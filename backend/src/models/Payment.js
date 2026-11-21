const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
    },
    signature: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    },
    planName: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      enum: ['monthly', 'quarterly', 'halfYearly', 'yearly'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Paid', 'Failed', 'Refunded', 'Partial'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      enum: ['Razorpay', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'],
      default: 'Razorpay',
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    referenceNumber: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordedByName: {
      type: String,
      default: '',
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billingDetails: {
      name: String,
      phone: String,
      address: String,
      city: String,
      gstin: String,
    },
    refundDetails: {
      refundId: String,
      refundAmount: Number,
      refundedAt: Date,
      reason: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', PaymentSchema);
