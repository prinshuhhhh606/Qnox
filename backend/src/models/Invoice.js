const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyDetails: {
      name: { type: String, default: 'QNOX LUXURY SANCTUARY NETWORKS PVT LTD' },
      address: { type: String, default: 'The Mayfair Sanctuary, 14 Berkeley Street, Mayfair, London W1J 8DX' },
      email: { type: String, default: 'concierge@qnoxgym.com' },
      phone: { type: String, default: '+44 20 7946 0920' },
      taxId: { type: String, default: 'GB 924 8192 10 / GSTIN: 27AABCQ9281M1Z5' },
    },
    customerDetails: {
      businessName: { type: String, required: true },
      ownerName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    subscriptionDetails: {
      planCode: { type: String, required: true },
      planName: { type: String, required: true },
      billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    pricing: {
      baseAmount: { type: Number, required: true },
      discountAmount: { type: Number, default: 0 },
      taxPercent: { type: Number, default: 18 },
      taxAmount: { type: Number, default: 0 },
      totalPayable: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    paymentDetails: {
      orderId: { type: String, default: '' },
      paymentId: { type: String, default: '' },
      paymentMethod: { type: String, default: 'Razorpay' },
      paidAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['Draft', 'Unpaid', 'Paid', 'Failed', 'Cancelled', 'Refunded'],
      default: 'Unpaid',
      index: true,
    },
    notes: {
      type: String,
      default: 'Commissioned on QNOX Multi-Gym SaaS Network.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
