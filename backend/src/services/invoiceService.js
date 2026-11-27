const Counter = require('../models/Counter');
const Invoice = require('../models/Invoice');

/**
 * Atomically generates the next unique sequential invoice number
 * Format: QNOX-INV-YYYY-XXXXXX (e.g. QNOX-INV-2026-000001)
 */
exports.generateNextInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `invoice_${currentYear}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formattedSeq = String(counter.seq).padStart(6, '0');
  return `QNOX-INV-${currentYear}-${formattedSeq}`;
};

/**
 * Creates and saves an Invoice record in MongoDB for SaaS Subscriptions
 */
exports.createSaaSInvoice = async ({
  organization,
  user,
  plan,
  billingCycle = 'monthly',
  startDate,
  endDate,
  discountAmount = 0,
}) => {
  const invoiceNumber = await exports.generateNextInvoiceNumber();

  // Pricing calculations
  // Monthly price: plan.monthlyPrice
  // Yearly price: plan.monthlyPrice * 12 with 20% discount if not explicitly set
  const basePrice = billingCycle === 'yearly'
    ? (plan.yearlyPrice || plan.monthlyPrice * 12)
    : plan.monthlyPrice;

  // 18% GST calculation (GST inclusive or exclusive; let's treat basePrice as net or inclusive, standard GST calculation)
  // Let's calculate standard: Net = basePrice, Tax (18%) = basePrice * 0.18, Total = Net + Tax - Discount
  const discount = Number(discountAmount) || 0;
  const taxableAmount = Math.max(0, basePrice - discount);
  const taxPercent = 18;
  const taxAmount = Math.round(taxableAmount * 0.18);
  const totalPayable = taxableAmount + taxAmount;

  const invoice = await Invoice.create({
    invoiceNumber,
    organization: organization._id || organization,
    user: user._id || user,
    customerDetails: {
      businessName: organization.name || 'Sanctuary Partner',
      ownerName: user.name || organization.ownerName || 'Gym Owner',
      email: user.email || organization.ownerEmail || organization.contactEmail,
      phone: user.phone || organization.phone || '',
      address: organization.address || organization.city || '',
    },
    subscriptionDetails: {
      planCode: plan.code,
      planName: plan.name,
      billingCycle,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 86400000),
    },
    pricing: {
      baseAmount: basePrice,
      discountAmount: discount,
      taxPercent,
      taxAmount,
      totalPayable,
      currency: 'INR',
    },
    status: 'Unpaid',
  });

  return invoice;
};

/**
 * Updates an invoice to Paid after successful payment verification
 */
exports.markInvoicePaid = async (invoiceNumberOrId, paymentData = {}) => {
  const query = typeof invoiceNumberOrId === 'string' && invoiceNumberOrId.startsWith('QNOX-INV-')
    ? { invoiceNumber: invoiceNumberOrId }
    : { _id: invoiceNumberOrId };

  const invoice = await Invoice.findOne(query);
  if (!invoice) return null;

  invoice.status = 'Paid';
  invoice.paymentDetails = {
    orderId: paymentData.orderId || invoice.paymentDetails.orderId,
    paymentId: paymentData.paymentId || invoice.paymentDetails.paymentId,
    paymentMethod: paymentData.paymentMethod || 'Razorpay',
    paidAt: new Date(),
  };

  await invoice.save();
  return invoice;
};
