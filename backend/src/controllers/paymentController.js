const Payment = require('../models/Payment');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');
const { sendPaymentReceiptEmail } = require('../services/emailService');

// @desc    Initiate Membership Checkout Order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { planId, duration = 'monthly', billingDetails } = req.body;
    const user = req.user;

    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership tier not found.',
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This membership tier is currently closed for new admissions.',
      });
    }

    const price = plan.pricing[duration];
    if (!price) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing duration: ${duration}. Choose monthly, quarterly, halfYearly, or yearly.`,
      });
    }

    const receipt = `qnx_rec_${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await createRazorpayOrder({
      amount: price,
      currency: 'INR',
      receipt,
      notes: {
        userId: user._id.toString(),
        planId: plan._id.toString(),
        duration,
        invoiceNumber,
      },
    });

    // Save pending payment record in DB
    const payment = await Payment.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      orderId: order.id,
      amount: price,
      currency: 'INR',
      planId: plan._id,
      planName: plan.name,
      duration,
      status: 'Pending',
      invoiceNumber,
      billingDetails: billingDetails || { name: user.name, phone: user.phone },
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        duration,
        invoiceNumber,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_qnox_luxury_key',
        isSimulated: order.isSimulated,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Backend Payment Signature & Activate Membership
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, isSimulated } = req.body;
    const user = req.user;

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Order record not located in payment audit.',
      });
    }

    if (payment.status === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and active.',
        data: payment,
      });
    }

    // Verify cryptographic signature on the backend
    let isValid = false;
    if (isSimulated && !process.env.RAZORPAY_KEY_SECRET) {
      isValid = true; // In development simulation
    } else {
      isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
    }

    if (!isValid) {
      payment.status = 'Failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Cryptographic signature mismatch. Payment verification rejected.',
      });
    }

    // Payment Verified Successfully
    payment.paymentId = paymentId || `pay_${Date.now()}`;
    payment.signature = signature || 'verified_dev_signature';
    payment.status = 'Completed';
    await payment.save();

    // Calculate Membership Duration
    const durationMonthsMap = {
      monthly: 1,
      quarterly: 3,
      halfYearly: 6,
      yearly: 12,
    };
    const monthsToAdd = durationMonthsMap[payment.duration] || 1;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    // Activate User's Membership
    user.membership = {
      planId: payment.planId,
      planName: payment.planName,
      planCode: payment.planName.toUpperCase().replace(/\s+/g, '_'),
      billingCycle: payment.duration,
      status: 'Active',
      startDate,
      endDate,
      autoRenew: true,
    };
    await user.save();

    // Send Luxury Receipt Email
    sendPaymentReceiptEmail(payment, user).catch((e) => console.log(e.message));

    res.status(200).json({
      success: true,
      message: `Residency activated for ${payment.planName} (${payment.duration}).`,
      data: {
        payment,
        membership: user.membership,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User's Payment History
// @route   GET /api/payments/my-payments
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Payments (Admin)
// @route   GET /api/payments/all
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Printable Invoice Details
// @route   GET /api/payments/invoice/:invoiceNumber
exports.getInvoice = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ invoiceNumber: req.params.invoiceNumber }).populate('user');
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found.',
      });
    }
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Refund (Admin)
// @route   POST /api/payments/:id/refund
exports.initiateRefund = async (req, res, next) => {
  try {
    const { reason, refundAmount } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found.',
      });
    }

    if (payment.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded.',
      });
    }

    payment.status = 'Refunded';
    payment.refundDetails = {
      refundId: `rfnd_${Date.now()}`,
      refundAmount: refundAmount || payment.amount,
      refundedAt: new Date(),
      reason: reason || 'Member initiated cancellation request',
    };
    await payment.save();

    // Deactivate member's active residency
    await User.findByIdAndUpdate(payment.user, {
      'membership.status': 'Cancelled',
    });

    res.status(200).json({
      success: true,
      message: 'Refund executed successfully. Membership residency terminated.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
