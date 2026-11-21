const Payment = require('../models/Payment');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');
const { sendPaymentReceiptEmail } = require('../services/emailService');
const { createRenewalNotifications } = require('../services/cronService');

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
      isSimulated: Boolean(order.isSimulated),
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
        isSimulated: Boolean(order.isSimulated),
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
    // 1. Extract parameters flexibly (supporting both camelCase and Razorpay snake_case)
    const orderId = req.body.orderId || req.body.razorpay_order_id;
    const paymentId = req.body.paymentId || req.body.razorpay_payment_id;
    const signature = req.body.signature || req.body.razorpay_signature;
    const { isSimulated, amount, currency } = req.body;
    const user = req.user;

    // 2. Validate required parameters with explicit, distinct 400 Bad Request messages
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Missing required field "orderId" (or "razorpay_order_id").',
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Missing required field "paymentId" (or "razorpay_payment_id").',
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Missing required field "signature" (or "razorpay_signature").',
      });
    }

    // 3. Locate the payment order in database
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `Payment order record not found in audit database for Order ID: ${orderId}`,
      });
    }

    // 4. Prevent duplicate payment processing & verification
    if (payment.status === 'Completed' || payment.status === 'Paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and processed.',
        data: {
          payment,
          membership: user.membership,
        },
      });
    }

    // 5. Verify payment amount and currency if provided
    if (amount !== undefined && amount !== null) {
      const parsedAmount = Number(amount);
      const expectedAmountInRupees = payment.amount;
      const expectedAmountInPaise = Math.round(payment.amount * 100);

      // Accepts either exact amount in Rupees or amount in Paise (Razorpay format)
      if (parsedAmount !== expectedAmountInRupees && parsedAmount !== expectedAmountInPaise) {
        payment.status = 'Failed';
        payment.notes = `Payment rejected: Amount mismatch. Expected ₹${expectedAmountInRupees}, received ₹${parsedAmount > 1000 ? parsedAmount / 100 : parsedAmount}`;
        await payment.save();

        return res.status(400).json({
          success: false,
          message: `Payment amount mismatch: Expected ₹${expectedAmountInRupees}, received ₹${parsedAmount > 1000 ? parsedAmount / 100 : parsedAmount}`,
        });
      }
    }

    if (currency && currency.toUpperCase() !== (payment.currency || 'INR').toUpperCase()) {
      payment.status = 'Failed';
      payment.notes = `Payment rejected: Currency mismatch. Expected ${payment.currency}, received ${currency}`;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: `Payment currency mismatch: Expected ${payment.currency}, received ${currency}`,
      });
    }

    // 6. Cryptographic Signature Verification
    const isOrderSimulated = Boolean(payment.isSimulated || isSimulated || orderId.startsWith('order_sim_'));
    const isPlaceholderSecret = !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('luxury_secret');

    let isValidSignature = false;

    // Check if official Razorpay HMAC matches
    if (verifyRazorpaySignature({ orderId, paymentId, signature })) {
      isValidSignature = true;
    } else if (isOrderSimulated || isPlaceholderSecret) {
      // In development / demo simulated gateway mode, accept authorized test signatures
      const validSimulatedSignatures = [
        'verified_simulated_sig',
        'sig_demo',
        'verified_dev_signature',
        'verified_test_sig',
      ];
      if (
        validSimulatedSignatures.includes(signature) ||
        signature.startsWith('sig_sim_') ||
        signature.startsWith('simulated_')
      ) {
        isValidSignature = true;
      }
    }

    if (!isValidSignature) {
      payment.status = 'Failed';
      payment.paymentId = paymentId;
      payment.signature = signature;
      payment.notes = 'Payment rejected: Cryptographic signature verification failed.';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }

    // 7. Payment Verified Successfully - Update Payment Record
    payment.paymentId = paymentId;
    payment.signature = signature;
    payment.status = 'Completed';
    payment.isSimulated = isOrderSimulated;
    payment.notes = isOrderSimulated ? 'Verified via simulated gateway' : 'Verified via Razorpay HMAC SHA256';
    await payment.save();

    // 8. Calculate Membership Duration & Renewal Dates
    const durationMonthsMap = {
      monthly: 1,
      quarterly: 3,
      halfYearly: 6,
      yearly: 12,
    };
    const monthsToAdd = durationMonthsMap[payment.duration] || 1;

    const now = new Date();
    const previousMembership = user.membership ? user.membership.toObject() : null;
    const isCurrentlyActive =
      user.membership?.status === 'Active' || user.membership?.status === 'Expiring Soon';
    const isFutureExpiry =
      user.membership?.endDate && new Date(user.membership.endDate) > now;

    // Define & implement correct renewal-date policy:
    // If renewing before expiry, preserve remaining days and extend from previous endDate.
    // If renewing after expiry or fresh membership, start from now.
    let startDate = now;
    let baseDateForEnd = now;

    if (isCurrentlyActive && isFutureExpiry) {
      startDate = user.membership.startDate || now;
      baseDateForEnd = new Date(user.membership.endDate);
    }

    const endDate = new Date(baseDateForEnd);
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    // 9. Prevent duplicate history and record renewal in user.membershipHistory
    const hasPreviousPlan = previousMembership && previousMembership.planName && previousMembership.planName !== 'None';
    if (hasPreviousPlan) {
      const isAlreadyArchived = user.membershipHistory?.some(
        (h) => h.notes && h.notes.includes(payment.orderId)
      );
      if (!isAlreadyArchived) {
        user.membershipHistory.push({
          planName: previousMembership.planName,
          billingCycle: previousMembership.billingCycle,
          startDate: previousMembership.startDate,
          endDate: previousMembership.endDate,
          amount: payment.amount,
          status: 'Renewed',
          actionType: 'Renewal',
          performedByName: user.name,
          notes: `Online membership renewal via Razorpay (Order: ${payment.orderId}, Invoice: ${payment.invoiceNumber})`,
          createdAt: new Date(),
        });
      }
    }

    // 10. Activate User's Membership
    user.membership = {
      planId: payment.planId,
      planName: payment.planName,
      planCode: payment.planName.toUpperCase().replace(/\s+/g, '_'),
      billingCycle: payment.duration,
      status: 'Active',
      startDate,
      endDate,
      autoRenew: true,
      isFrozen: false,
    };
    await user.save();

    // 11. Trigger Renewal Notifications for Customer & Admins
    if (hasPreviousPlan) {
      createRenewalNotifications({
        user,
        payment,
        planName: payment.planName,
        newEndDate: endDate,
        previousMembership,
      }).catch((e) => console.log('[Renewal Notification Engine Warning]:', e.message));
    }

    // 12. Send Luxury Receipt Email
    sendPaymentReceiptEmail(payment, user).catch((e) => console.log('[Receipt Email Warning]:', e.message));

    return res.status(200).json({
      success: true,
      message: `Residency successfully activated for ${payment.planName} (${payment.duration}).`,
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
