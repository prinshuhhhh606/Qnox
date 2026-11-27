const PartnershipApplication = require('../models/PartnershipApplication');
const PartnerSettlement = require('../models/PartnerSettlement');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const {
  generateDynamicQRAccessToken,
  verifyAndProcessCheckIn,
  submitPartnershipApplication,
  reviewPartnershipApplication,
} = require('../services/allAccessService');

// @desc    Generate Universal Dynamic QR Access Pass
// @route   GET /api/all-access/my-pass
// @access  Private (Gym Member)
exports.generateMyAccessPass = async (req, res, next) => {
  try {
    const pass = await generateDynamicQRAccessToken(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Universal Access Pass token generated. Scan at any participating sanctuary desk.',
      data: pass,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Staff Scanner Check-In Verification Engine
// @route   POST /api/all-access/verify-check-in
// @access  Private (Staff: Branch Manager, Receptionist, Gym Owner, Super Admin)
exports.verifyMemberCheckIn = async (req, res, next) => {
  try {
    const { qrToken, clubId } = req.body;

    if (!qrToken || !clubId) {
      return res.status(400).json({
        success: false,
        message: 'QR Pass token and club location ID are required for verification.',
      });
    }

    const result = await verifyAndProcessCheckIn({
      qrToken,
      staffUser: req.user,
      clubId,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Gym Owner applies for QNOX All-Access Partnership
// @route   POST /api/all-access/partner-application
// @access  Private (Gym Owner)
exports.applyForPartnership = async (req, res, next) => {
  try {
    const { clubId, facilities, hours, maxVisitors, requestedRate, verificationDocs } = req.body;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required for partnership application.',
      });
    }

    const application = await submitPartnershipApplication({
      organizationId: req.user.organization,
      clubId,
      ownerId: req.user._id,
      facilities,
      hours,
      maxVisitors: Number(maxVisitors) || 30,
      requestedRate: Number(requestedRate) || 250,
      verificationDocs,
    });

    res.status(201).json({
      success: true,
      message: 'All-Access Partnership application submitted for executive concierge review.',
      data: application,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get All-Access Partnership Applications
// @route   GET /api/all-access/partner-applications
// @access  Private (Super Admin, Gym Owner)
exports.getPartnershipApplications = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'Gym Owner') {
      filter.organization = req.user.organization;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await PartnershipApplication.find(filter)
      .populate('club organization owner')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Super Admin Review of All-Access Partnership Application
// @route   POST /api/all-access/partner-applications/:id/review
// @access  Private (Super Admin)
exports.reviewApplication = async (req, res, next) => {
  try {
    const { status, agreedRate, adminRemarks } = req.body;

    if (!['Approved', 'Rejected', 'Suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved, Rejected, or Suspended.',
      });
    }

    const app = await reviewPartnershipApplication({
      applicationId: req.params.id,
      status,
      agreedRate: Number(agreedRate) || undefined,
      adminRemarks,
      reviewerUser: req.user,
    });

    res.status(200).json({
      success: true,
      message: `Partnership application marked as ${status}.`,
      data: app,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get Partner Settlement Ledger
// @route   GET /api/all-access/settlements
// @access  Private (Super Admin, Gym Owner)
exports.getSettlements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'Gym Owner') {
      filter.organization = req.user.organization;
    }
    if (req.query.periodYear) {
      filter.periodYear = Number(req.query.periodYear);
    }
    if (req.query.periodMonth) {
      filter.periodMonth = Number(req.query.periodMonth);
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const settlements = await PartnerSettlement.find(filter)
      .populate('organization partnerClub')
      .sort({ periodYear: -1, periodMonth: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: settlements,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Super Admin Disburses Partner Payout
// @route   POST /api/all-access/settlements/:id/disburse
// @access  Private (Super Admin)
exports.disburseSettlement = async (req, res, next) => {
  try {
    const { paymentReference, notes } = req.body;

    const settlement = await PartnerSettlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement record not found.',
      });
    }

    settlement.status = 'Disbursed';
    settlement.paymentReference = paymentReference || `DISB_${Date.now()}`;
    settlement.paidAt = new Date();
    settlement.approvedBy = req.user._id;
    if (notes) settlement.notes = notes;
    await settlement.save();

    res.status(200).json({
      success: true,
      message: `Settlement of ₹${settlement.netPayoutAmount} marked as disbursed to ${settlement.partnerClubName}.`,
      data: settlement,
    });
  } catch (err) {
    next(err);
  }
};
