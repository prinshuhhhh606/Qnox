const SaaSSubscriptionPlan = require('../models/SaaSSubscriptionPlan');
const Organization = require('../models/Organization');
const OrganizationSubscription = require('../models/OrganizationSubscription');
const Club = require('../models/Club');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const {
  registerGymOwnerAndOrg,
  verifyAndActivateSaaSSubscription,
  enforceQuotaLimit,
} = require('../services/saasService');

// @desc    Get all public SaaS Subscription Plans
// @route   GET /api/saas/plans
// @access  Public
exports.getSaaSPlans = async (req, res, next) => {
  try {
    const plans = await SaaSSubscriptionPlan.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register Independent Gym Owner & Initiate SaaS Onboarding
// @route   POST /api/saas/register-owner
// @access  Public
exports.registerGymOwner = async (req, res, next) => {
  try {
    const { ownerName, email, phone, password, gymName, location, address, planCode, billingCycle } = req.body;

    if (!ownerName || !email || !password || !gymName || !planCode) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, email, password, gym name, and subscription plan are required.',
      });
    }

    const result = await registerGymOwnerAndOrg({
      ownerName,
      email,
      phone,
      password,
      gymName,
      location,
      address,
      planCode: planCode.toLowerCase(),
      billingCycle: billingCycle || 'monthly',
    });

    res.status(201).json({
      success: true,
      message: 'Gym owner account created. Complete payment to activate your sanctuary dashboard.',
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Verify Razorpay Payment & Activate SaaS Subscription
// @route   POST /api/saas/verify-payment
// @access  Public (or Gym Owner)
exports.verifySaaSPayment = async (req, res, next) => {
  try {
    const { organizationId, razorpayOrderId, razorpayPaymentId, razorpaySignature, planCode, billingCycle, adminBypass } = req.body;

    if (!organizationId || !planCode) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID and plan code are required.',
      });
    }

    const result = await verifyAndActivateSaaSSubscription({
      organizationId,
      razorpayOrderId: razorpayOrderId || `order_${Date.now()}`,
      razorpayPaymentId: razorpayPaymentId || `pay_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'mock_saas_signature',
      planCode: planCode.toLowerCase(),
      billingCycle: billingCycle || 'monthly',
      adminBypass: Boolean(adminBypass),
    });

    res.status(200).json({
      success: true,
      message: 'SaaS subscription successfully verified and activated. Welcome to QNOX Network.',
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get Gym Owner's Private Organization Details & Quotas
// @route   GET /api/saas/my-organization
// @access  Private (Gym Owner, Company Admin)
exports.getMyOrganization = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const org = await Organization.findById(orgId).populate('subscription owner');

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization profile not found.',
      });
    }

    // Live counts for tenant quota tracking
    const [branchCount, trainerCount, memberCount] = await Promise.all([
      Club.countDocuments({ organization: org._id }),
      Trainer.countDocuments({ organization: org._id }),
      User.countDocuments({ organization: org._id, role: 'Gym Member' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        organization: org,
        subscription: org.subscription,
        quotas: {
          branches: { current: branchCount, max: org.branchesLimit },
          trainers: { current: trainerCount, max: org.trainersLimit },
          members: { current: memberCount, max: org.membersLimit },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Gym Owner's Branches
// @route   GET /api/saas/my-branches
// @access  Private (Gym Owner, Company Admin)
exports.getMyBranches = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branches = await Club.find({ organization: orgId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a New Branch under Gym Owner's Organization
// @route   POST /api/saas/branches
// @access  Private (Gym Owner, Company Admin)
exports.createTenantBranch = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    await enforceQuotaLimit(orgId, 'branch');

    const branchData = {
      ...req.body,
      organization: orgId,
      gymType: 'SaaS-Partner',
    };

    if (!branchData.slug) {
      branchData.slug = branchData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    }

    const branch = await Club.create(branchData);

    res.status(201).json({
      success: true,
      message: 'Branch commissioned successfully within subscription quota.',
      data: branch,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get Gym Owner's Private Analytics & Revenue
// @route   GET /api/saas/analytics
// @access  Private (Gym Owner, Company Admin)
exports.getTenantAnalytics = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;

    const [branches, totalMembers, totalAttendance, payments] = await Promise.all([
      Club.find({ organization: orgId }).select('_id name currentOccupancy capacity'),
      User.countDocuments({ organization: orgId, role: 'Gym Member' }),
      Attendance.countDocuments({ organization: orgId }),
      Payment.find({ organization: orgId, status: { $in: ['Completed', 'Paid'] } }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalBranches: branches.length,
        totalMembers,
        totalAttendance,
        totalRevenue,
        branches,
      },
    });
  } catch (err) {
    next(err);
  }
};
