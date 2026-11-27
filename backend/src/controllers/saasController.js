const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const SaaSSubscriptionPlan = require('../models/SaaSSubscriptionPlan');
const Organization = require('../models/Organization');
const OrganizationSubscription = require('../models/OrganizationSubscription');
const Club = require('../models/Club');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const invoiceService = require('../services/invoiceService');
const {
  registerGymOwnerAndOrg,
  verifyAndActivateSaaSSubscription,
  enforceQuotaLimit,
} = require('../services/saasService');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_qnox_luxury_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_qnox_luxury_secret',
});

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

    const token = jwt.sign(
      { id: result.owner._id, role: result.owner.role, organization: result.organization._id },
      process.env.JWT_SECRET || 'qnox_luxury_jwt_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Gym owner account created. Complete payment to activate your sanctuary dashboard.',
      data: {
        ...result,
        user: result.owner,
        token,
      },
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

// @desc    Update Gym Owner's Organization Profile
// @route   PUT /api/saas/my-organization
// @access  Private (Gym Owner, Company Admin)
exports.updateMyOrganization = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const { name, phone, address, city, logo } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (logo) updateData.logo = logo;

    const org = await Organization.findByIdAndUpdate(orgId, updateData, { new: true, runValidators: true });
    res.status(200).json({
      success: true,
      message: 'Gym profile updated successfully.',
      data: org,
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

    if (!branchData.tagline) {
      branchData.tagline = `${branchData.name} - Luxury Wellness Sanctuary`;
    }
    if (!branchData.description) {
      branchData.description = `${branchData.name} private fitness and wellness facilities.`;
    }
    if (!branchData.heroImage) {
      branchData.heroImage = 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80';
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

// @desc    Update Branch under Gym Owner's Organization
// @route   PUT /api/saas/branches/:id
// @access  Private (Gym Owner, Company Admin)
exports.updateTenantBranch = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }
    const updated = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Branch updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Branch under Gym Owner's Organization
// @route   DELETE /api/saas/branches/:id
// @access  Private (Gym Owner, Company Admin)
exports.deleteTenantBranch = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }
    await Club.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Branch decommissioned successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Gym Owner's Trainers
// @route   GET /api/saas/my-trainers
// @access  Private (Gym Owner, Company Admin)
exports.getMyTrainers = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const trainers = await Trainer.find({ organization: orgId }).populate('branch').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: trainers.length, data: trainers });
  } catch (err) {
    next(err);
  }
};

// @desc    Create/Onboard Trainer under Gym Owner's Organization
// @route   POST /api/saas/trainers
// @access  Private (Gym Owner, Company Admin)
exports.createTenantTrainer = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    await enforceQuotaLimit(orgId, 'trainer');

    const { name, role, title, email, phone, bio, photo, specialties, certifications, branchId, workingHours, password } = req.body;
    if (!name || !role || !title) {
      return res.status(400).json({ success: false, message: 'Trainer name, role, and title are required.' });
    }

    let userAccount = null;
    if (email && password) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
      }
      userAccount = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role: 'Trainer',
        organization: orgId,
        assignedBranch: branchId || null,
      });
    }

    const trainer = await Trainer.create({
      name,
      role,
      title,
      email: email ? email.toLowerCase() : '',
      phone,
      bio: bio || `${name} is an elite coach committed to luxury wellness excellence.`,
      photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      specialties: Array.isArray(specialties) ? specialties : (specialties ? String(specialties).split(',').map(s => s.trim()) : ['Strength & Conditioning']),
      certifications: Array.isArray(certifications) ? certifications : (certifications ? String(certifications).split(',').map(c => c.trim()) : ['CSCS', 'NASM-CPT']),
      organization: orgId,
      branch: branchId || null,
      user: userAccount ? userAccount._id : null,
      workingHours: workingHours || '06:00 AM - 02:00 PM',
    });

    res.status(201).json({ success: true, message: 'Coach added successfully.', data: trainer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete Trainer under Gym Owner's Organization
// @route   DELETE /api/saas/trainers/:id
// @access  Private (Gym Owner, Company Admin)
exports.deleteTenantTrainer = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const trainer = await Trainer.findOne({ _id: req.params.id, organization: orgId });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found or unauthorized.' });
    }
    if (trainer.user) {
      await User.findByIdAndDelete(trainer.user);
    }
    await Trainer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Trainer removed successfully.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Gym Owner's Registered Members
// @route   GET /api/saas/my-members
// @access  Private (Gym Owner, Company Admin)
exports.getMyMembers = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const members = await User.find({ organization: orgId, role: 'Gym Member' })
      .populate('assignedBranch')
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Member under Gym Owner's Organization
// @route   POST /api/saas/members
// @access  Private (Gym Owner, Company Admin)
exports.createTenantMember = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    await enforceQuotaLimit(orgId, 'member');

    const { name, email, phone, password, branchId, dateOfBirth, gender } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required for member.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Member with this email already exists.' });
    }

    const memberId = 'QNX-M-' + Math.floor(100000 + Math.random() * 900000);
    const member = await User.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: password || 'Member@QNOX2026!',
      role: 'Gym Member',
      organization: orgId,
      assignedBranch: branchId || null,
      memberId,
      dateOfBirth,
      gender,
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully within plan capacity.',
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        memberId: member.memberId,
        organization: member.organization,
        assignedBranch: member.assignedBranch,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get Gym Owner's Invoices
// @route   GET /api/saas/my-invoices
// @access  Private (Gym Owner, Company Admin)
exports.getMyInvoices = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const invoices = await Invoice.find({ organization: orgId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Specific Invoice Details for Print/PDF
// @route   GET /api/saas/invoices/:invoiceNumber
// @access  Private (Gym Owner, Super Admin)
exports.getInvoiceByNumber = async (req, res, next) => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = await Invoice.findOne({ invoiceNumber }).populate('organization user');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    // Verify tenant ownership unless Super Admin
    if (!req.isSuperAdmin && String(invoice.organization._id || invoice.organization) !== String(req.tenantOrgId || req.user.organization)) {
      return res.status(403).json({ success: false, message: 'Access denied: Invoice belongs to another tenant.' });
    }
    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// @desc    Upgrade or Change SaaS Subscription Plan
// @route   POST /api/saas/upgrade-subscription
// @access  Private (Gym Owner, Company Admin)
exports.upgradeSaaSSubscription = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const { planCode, billingCycle } = req.body;
    if (!planCode) {
      return res.status(400).json({ success: false, message: 'Target plan code is required.' });
    }
    const plan = await SaaSSubscriptionPlan.findOne({ code: planCode.toLowerCase(), isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    const org = await Organization.findById(orgId).populate('owner');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    const cycle = billingCycle || 'monthly';
    const invoice = await invoiceService.createSaaSInvoice({
      organization: org,
      user: org.owner,
      plan,
      billingCycle: cycle,
      startDate: new Date(),
      endDate: new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * 86400000),
    });

    let razorpayOrder = null;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(invoice.pricing.totalPayable * 100),
        currency: 'INR',
        receipt: `saas_up_${org._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
        notes: {
          organizationId: org._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          planCode: plan.code,
          billingCycle: cycle,
        },
      });
    } catch (orderErr) {
      razorpayOrder = {
        id: `order_upgrade_${Date.now()}`,
        amount: Math.round(invoice.pricing.totalPayable * 100),
        currency: 'INR',
      };
    }

    res.status(200).json({
      success: true,
      message: 'Upgrade invoice and payment order initialized.',
      data: {
        invoice,
        plan,
        razorpayOrder,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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

// ==========================================
// SUPER ADMIN SAAS PLATFORM MANAGEMENT
// ==========================================

// @desc    Get All Tenants with Subscriptions and Live Statistics
// @route   GET /api/saas/admin/tenants
// @access  Private (Super Admin)
exports.getAdminTenants = async (req, res, next) => {
  try {
    const tenants = await Organization.find().populate('owner subscription').sort({ createdAt: -1 });

    const enrichedTenants = await Promise.all(
      tenants.map(async (t) => {
        const [branchCount, trainerCount, memberCount] = await Promise.all([
          Club.countDocuments({ organization: t._id }),
          Trainer.countDocuments({ organization: t._id }),
          User.countDocuments({ organization: t._id, role: 'Gym Member' }),
        ]);
        return {
          ...t.toObject(),
          liveStats: {
            branches: branchCount,
            trainers: trainerCount,
            members: memberCount,
          },
        };
      })
    );

    const activeSaaSTenants = tenants.filter(t => t.type === 'SaaS-Partner' && t.status === 'Active');
    const mrr = activeSaaSTenants.reduce((sum, t) => {
      const planCode = t.subscription?.planCode || 'starter';
      const monthly = planCode === 'enterprise' ? 24999 : planCode === 'professional' ? 11999 : 4999;
      return sum + monthly;
    }, 0);

    res.status(200).json({
      success: true,
      count: enrichedTenants.length,
      data: enrichedTenants,
      metrics: {
        totalTenants: enrichedTenants.length,
        activeTenants: activeSaaSTenants.length,
        mrr,
        arr: mrr * 12,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Tenant Status (Approve, Suspend, Reactivate)
// @route   PUT /api/saas/admin/tenants/:id/status
// @access  Private (Super Admin)
exports.updateAdminTenantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    if (!['Active', 'Pending-Approval', 'Suspended', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid tenant status.' });
    }

    const org = await Organization.findByIdAndUpdate(id, { status, ...(notes ? { notes } : {}) }, { new: true });
    if (!org) return res.status(404).json({ success: false, message: 'Tenant organization not found.' });

    res.status(200).json({
      success: true,
      message: `Tenant status updated to ${status}.`,
      data: org,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Tenant Limits / Quotas
// @route   PUT /api/saas/admin/tenants/:id/plan
// @access  Private (Super Admin)
exports.updateAdminTenantPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branchesLimit, trainersLimit, membersLimit } = req.body;
    const update = {};
    if (branchesLimit !== undefined) update.branchesLimit = Number(branchesLimit);
    if (trainersLimit !== undefined) update.trainersLimit = Number(trainersLimit);
    if (membersLimit !== undefined) update.membersLimit = Number(membersLimit);

    const org = await Organization.findByIdAndUpdate(id, update, { new: true });
    if (!org) return res.status(404).json({ success: false, message: 'Tenant organization not found.' });

    res.status(200).json({
      success: true,
      message: 'Tenant quotas updated successfully.',
      data: org,
    });
  } catch (err) {
    next(err);
  }
};
