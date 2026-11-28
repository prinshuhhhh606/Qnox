const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
const Counter = require('../models/Counter');
const GymOwnerApplication = require('../models/GymOwnerApplication');
const AuditLog = require('../models/AuditLog');
const emailService = require('../services/emailService');
const invoiceService = require('../services/invoiceService');
const { computeLiveStatus } = require('./clubController');
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
    const { name, phone, address, city, state, contactEmail, logo } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (contactEmail) updateData.contactEmail = contactEmail;
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

    // Enrich branches with counts of active trainers and members, plus liveStatus
    const enrichedBranches = await Promise.all(
      branches.map(async (b) => {
        const [trainerCount, memberCount] = await Promise.all([
          Trainer.countDocuments({ organization: orgId, branch: b._id }),
          User.countDocuments({ organization: orgId, assignedBranch: b._id, role: 'Gym Member' }),
        ]);
        const branchObj = b.toObject();
        branchObj.trainersCount = trainerCount;
        branchObj.membersCount = memberCount;
        branchObj.liveStatus = computeLiveStatus(b);
        return branchObj;
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedBranches.length,
      data: enrichedBranches,
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

    const isDraft = req.body.action === 'DRAFT' || req.body.isDraft === true;

    const branchData = {
      ...req.body,
      organization: orgId,
      gymType: 'SaaS-Partner',
      isCompanyOwned: false,
      verificationStatus: isDraft ? 'DRAFT' : 'PENDING_VERIFICATION',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      isActive: false,
    };

    if (!branchData.slug) {
      branchData.slug = branchData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    }
    if (!branchData.branchCode) {
      branchData.branchCode = 'BR-' + Math.floor(1000 + Math.random() * 9000);
    }
    if (!branchData.tagline) {
      branchData.tagline = `${branchData.name} - Luxury Wellness Sanctuary`;
    }
    if (!branchData.description) {
      branchData.description = `${branchData.name} private fitness and wellness facilities.`;
    }
    if (!branchData.heroImage) {
      branchData.heroImage = branchData.media?.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80';
    }

    // Map media structure if gallery passed
    if (branchData.gallery && !branchData.media?.interiorGallery) {
      branchData.media = {
        ...(branchData.media || {}),
        heroImage: branchData.heroImage,
        interiorGallery: branchData.gallery,
      };
    }

    const branch = await Club.create(branchData);

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Gym Owner',
        action: isDraft ? 'BRANCH_SAVED_AS_DRAFT' : 'BRANCH_SUBMITTED_FOR_VERIFICATION',
        details: isDraft
          ? `Branch "${branch.name}" (${branch.branchCode}) saved as draft by owner.`
          : `Branch "${branch.name}" (${branch.branchCode}) submitted for Super Admin verification by owner.`,
        newValue: {
          branchId: branch._id,
          branchCode: branch.branchCode,
          verificationStatus: branch.verificationStatus,
          operationalStatus: branch.operationalStatus,
          publicationStatus: branch.publicationStatus,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch create warning]:', logErr.message);
    }

    const branchObj = branch.toObject();
    branchObj.liveStatus = computeLiveStatus(branch);

    res.status(201).json({
      success: true,
      message: isDraft
        ? 'Branch saved as draft successfully.'
        : 'Branch application submitted for verification. Super Admin will review documentation and territory.',
      data: branchObj,
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

// @desc    Toggle Branch Active Status
// @route   PUT /api/saas/branches/:id/toggle-status
// @access  Private (Gym Owner, Company Admin)
exports.toggleTenantBranchStatus = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }
    branch.isActive = !branch.isActive;
    branch.status = branch.isActive ? 'OPEN' : 'MAINTENANCE';
    await branch.save();

    res.status(200).json({
      success: true,
      message: `Branch status updated to ${branch.isActive ? 'Active' : 'Deactivated'}.`,
      data: branch,
    });
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

// @desc    Complete Branch Setup Wizard (Gym Owner after Super Admin Approval)
// @route   PUT /api/saas/branches/:id/setup
// @access  Private (Gym Owner, Company Admin)
exports.completeBranchSetup = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }

    if (branch.verificationStatus !== 'APPROVED' && branch.verificationStatus !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Branch setup can only be completed for approved branches. Current verification status: ${branch.verificationStatus}`,
      });
    }

    const {
      assignedManagerName,
      assignedManagerEmail,
      assignedTrainerIds,
      openingHours,
      operatingDays,
      facilitiesBreakdown,
      capacity,
      pricingNotes,
      settlementRatePerVisit,
      gallery,
      media,
      emergencyContact,
    } = req.body;

    if (assignedManagerName) branch.assignedManagerName = assignedManagerName;
    if (assignedManagerEmail) branch.assignedManagerEmail = assignedManagerEmail;
    if (openingHours) branch.openingHours = openingHours;
    if (operatingDays && Array.isArray(operatingDays)) branch.operatingDays = operatingDays;
    if (facilitiesBreakdown) {
      branch.facilitiesBreakdown = {
        ...(branch.facilitiesBreakdown || {}),
        ...facilitiesBreakdown,
      };
    }
    if (capacity) branch.capacity = Number(capacity) || branch.capacity;
    if (settlementRatePerVisit) branch.settlementRatePerVisit = Number(settlementRatePerVisit) || branch.settlementRatePerVisit;
    if (gallery && Array.isArray(gallery)) branch.gallery = gallery;
    if (media) {
      branch.media = {
        ...(branch.media || {}),
        ...media,
      };
      if (media.heroImage) branch.heroImage = media.heroImage;
      if (media.interiorGallery && (!gallery || gallery.length === 0)) branch.gallery = media.interiorGallery;
    }
    if (emergencyContact) {
      branch.documents = branch.documents || {};
      branch.documents.emergencyContact = emergencyContact;
    }

    // Link trainers to this branch if provided
    if (Array.isArray(assignedTrainerIds) && assignedTrainerIds.length > 0) {
      await Trainer.updateMany(
        { _id: { $in: assignedTrainerIds }, organization: orgId },
        { branch: branch._id }
      );
    }

    branch.setupChecklist = {
      managerConfigured: true,
      trainersAssigned: true,
      operatingHoursSet: true,
      facilitiesConfigured: true,
      pricingConfigured: true,
      completed: true,
      completedAt: new Date(),
    };

    branch.operationalStatus = 'ACTIVE';
    branch.publicationStatus = 'READY_TO_PUBLISH';
    branch.isActive = true;
    branch.status = 'OPEN';

    await branch.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Gym Owner',
        action: 'BRANCH_SETUP_COMPLETED',
        details: `Gym Owner completed full operational setup wizard for branch "${branch.name}". Branch is now READY_TO_PUBLISH.`,
        newValue: {
          branchId: branch._id,
          operationalStatus: branch.operationalStatus,
          publicationStatus: branch.publicationStatus,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch setup warning]:', logErr.message);
    }

    const branchObj = branch.toObject();
    branchObj.liveStatus = computeLiveStatus(branch);

    res.status(200).json({
      success: true,
      message: 'Branch setup completed successfully! It is now Ready to Publish.',
      data: branchObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Publish Branch to Public Website
// @route   PUT /api/saas/branches/:id/publish
// @access  Private (Gym Owner, Company Admin)
exports.publishTenantBranch = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }

    if (branch.verificationStatus !== 'APPROVED' && branch.verificationStatus !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish branch: verification has not been approved by Super Admin.',
      });
    }

    if (branch.operationalStatus === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish branch: this branch has been suspended by Super Admin.',
      });
    }

    branch.publicationStatus = 'PUBLISHED';
    branch.publishedAt = new Date();
    branch.publishedBy = req.user._id;
    branch.operationalStatus = 'ACTIVE';
    branch.isActive = true;
    branch.status = 'OPEN';
    await branch.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Gym Owner',
        action: 'BRANCH_PUBLISHED',
        details: `Branch "${branch.name}" was published to public website by Gym Owner.`,
        newValue: {
          branchId: branch._id,
          publicationStatus: 'PUBLISHED',
          publishedAt: branch.publishedAt,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog publish warning]:', logErr.message);
    }

    const branchObj = branch.toObject();
    branchObj.liveStatus = computeLiveStatus(branch);

    res.status(200).json({
      success: true,
      message: `Branch "${branch.name}" is now live and published on QNOX public website!`,
      data: branchObj,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unpublish Branch from Public Website
// @route   PUT /api/saas/branches/:id/unpublish
// @access  Private (Gym Owner, Company Admin)
exports.unpublishTenantBranch = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const branch = await Club.findOne({ _id: req.params.id, organization: orgId });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found or unauthorized.' });
    }

    branch.publicationStatus = 'UNPUBLISHED';
    branch.unpublishedAt = new Date();
    branch.unpublishedBy = req.user._id;
    await branch.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Gym Owner',
        action: 'BRANCH_UNPUBLISHED',
        details: `Branch "${branch.name}" unpublished from public website by Gym Owner. Existing operations & members remain intact.`,
        newValue: {
          branchId: branch._id,
          publicationStatus: 'UNPUBLISHED',
          unpublishedAt: branch.unpublishedAt,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog unpublish warning]:', logErr.message);
    }

    const branchObj = branch.toObject();
    branchObj.liveStatus = computeLiveStatus(branch);

    res.status(200).json({
      success: true,
      message: `Branch "${branch.name}" has been unpublished. It is now hidden from the public website.`,
      data: branchObj,
    });
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
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Coach added successfully.', data: trainer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update Trainer Profile under Gym Owner's Organization
// @route   PUT /api/saas/trainers/:id
// @access  Private (Gym Owner, Company Admin)
exports.updateTenantTrainer = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const trainer = await Trainer.findOne({ _id: req.params.id, organization: orgId });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found or unauthorized.' });
    }

    const updated = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('branch');
    res.status(200).json({ success: true, message: 'Coach profile updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Trainer Active Status
// @route   PUT /api/saas/trainers/:id/toggle-status
// @access  Private (Gym Owner, Company Admin)
exports.toggleTenantTrainerStatus = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const trainer = await Trainer.findOne({ _id: req.params.id, organization: orgId });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found or unauthorized.' });
    }
    trainer.isActive = !trainer.isActive;
    await trainer.save();

    res.status(200).json({
      success: true,
      message: `Coach status updated to ${trainer.isActive ? 'Active' : 'Inactive'}.`,
      data: trainer,
    });
  } catch (err) {
    next(err);
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

// @desc    Get Gym Owner's Registered Members (with search & filter)
// @route   GET /api/saas/my-members
// @access  Private (Gym Owner, Company Admin)
exports.getMyMembers = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const { search, branchId, status } = req.query;

    const query = { organization: orgId, role: 'Gym Member' };

    if (branchId) {
      query.assignedBranch = branchId;
    }
    if (status) {
      query['membership.status'] = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    const members = await User.find(query)
      .populate('assignedBranch')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: members.length, data: members });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Single Member Dossier / Details
// @route   GET /api/saas/members/:id
// @access  Private (Gym Owner, Company Admin)
exports.getTenantMemberDossier = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const member = await User.findOne({ _id: req.params.id, organization: orgId, role: 'Gym Member' })
      .populate('assignedBranch assignedTrainer')
      .select('-password');

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found or unauthorized.' });
    }

    res.status(200).json({ success: true, data: member });
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

    const { name, email, phone, password, branchId, dateOfBirth, gender, planName, durationMonths } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required for member.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Member with this email already exists.' });
    }

    const memberId = 'QNX-M-' + Math.floor(100000 + Math.random() * 900000);
    const months = Number(durationMonths) || 1;
    const startDate = new Date();
    const endDate = new Date(Date.now() + months * 30 * 86400000);

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
      gender: gender || 'Not Specified',
      membership: {
        planName: planName || 'Sanctuary Standard Residency',
        status: 'Active',
        startDate,
        endDate,
        autoRenew: true,
      },
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
        membership: member.membership,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update Member Information under Gym Owner's Organization
// @route   PUT /api/saas/members/:id
// @access  Private (Gym Owner, Company Admin)
exports.updateTenantMember = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const member = await User.findOne({ _id: req.params.id, organization: orgId, role: 'Gym Member' });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found or unauthorized.' });
    }

    const { name, email, phone, branchId, gender, dateOfBirth, status } = req.body;
    if (name) member.name = name;
    if (email) member.email = email.toLowerCase();
    if (phone) member.phone = phone;
    if (branchId !== undefined) member.assignedBranch = branchId || null;
    if (gender) member.gender = gender;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (status) {
      if (!member.membership) member.membership = {};
      member.membership.status = status;
    }

    await member.save();
    res.status(200).json({ success: true, message: 'Member updated successfully.', data: member });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Member Active Status (Activate / Suspend)
// @route   PUT /api/saas/members/:id/toggle-status
// @access  Private (Gym Owner, Company Admin)
exports.toggleTenantMemberStatus = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;
    const member = await User.findOne({ _id: req.params.id, organization: orgId, role: 'Gym Member' });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found or unauthorized.' });
    }

    const currentStatus = member.membership?.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    if (!member.membership) member.membership = {};
    member.membership.status = newStatus;
    member.isArchived = newStatus === 'Suspended';
    await member.save();

    res.status(200).json({
      success: true,
      message: `Member status set to ${newStatus}.`,
      data: member,
    });
  } catch (err) {
    next(err);
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

// @desc    Get Gym Owner's Private Analytics, Revenue & Branch Performance
// @route   GET /api/saas/analytics
// @access  Private (Gym Owner, Company Admin)
exports.getTenantAnalytics = async (req, res, next) => {
  try {
    const orgId = req.tenantOrgId || req.user.organization;

    const [branches, totalMembers, totalAttendance, payments, recentMembers, recentInvoices] = await Promise.all([
      Club.find({ organization: orgId }).select('_id name currentOccupancy capacity branchCode location address isActive'),
      User.countDocuments({ organization: orgId, role: 'Gym Member' }),
      Attendance.countDocuments({ organization: orgId }),
      Payment.find({ organization: orgId, status: { $in: ['Completed', 'Paid'] } }),
      User.find({ organization: orgId, role: 'Gym Member' }).sort({ createdAt: -1 }).limit(5).select('name email memberId createdAt membership assignedBranch'),
      Invoice.find({ organization: orgId }).sort({ createdAt: -1 }).limit(5).select('invoiceNumber pricing status createdAt subscriptionDetails'),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Calculate branch-wise live performance
    const branchPerformance = await Promise.all(
      branches.map(async (b) => {
        const [membersCount, trainersCount] = await Promise.all([
          User.countDocuments({ organization: orgId, assignedBranch: b._id, role: 'Gym Member' }),
          Trainer.countDocuments({ organization: orgId, branch: b._id }),
        ]);
        return {
          _id: b._id,
          name: b.name,
          branchCode: b.branchCode,
          location: b.location,
          capacity: b.capacity,
          currentOccupancy: b.currentOccupancy,
          isActive: b.isActive,
          membersCount,
          trainersCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalBranches: branches.length,
        totalMembers,
        totalAttendance,
        totalRevenue,
        branchPerformance,
        recentActivities: {
          members: recentMembers,
          invoices: recentInvoices,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Gym Owner Secure Password Change
// @route   PUT /api/saas/change-password
// @access  Private (Gym Owner, Company Admin)
exports.changeOwnerPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated securely.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Gym Owner Profile (Name, Phone)
// @route   PUT /api/saas/owner-profile
// @access  Private (Gym Owner, Company Admin)
exports.updateOwnerProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    if (req.user.organization && name) {
      await Organization.findByIdAndUpdate(req.user.organization, { ownerName: name });
    }

    res.status(200).json({
      success: true,
      message: 'Owner profile updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
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

// ==========================================
// PRE-APPROVAL GYM OWNER ONBOARDING WORKFLOW
// ==========================================

// =========================================================================
// GPS Territory Protection & Geocoding Calculation Utilities
// =========================================================================

// High-confidence fallback coordinates for major metropolitan centers
const METRO_GEO_REGISTRY = {
  // UK / Europe HQ
  'mayfair': { lat: 51.5118, lon: -0.1473 },
  'soho': { lat: 51.5133, lon: -0.1322 },
  'canary wharf': { lat: 51.5033, lon: -0.0197 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'manchester': { lat: 53.4808, lon: -2.2426 },
  'birmingham': { lat: 52.4862, lon: -1.8904 },
  // India Metropolitan Hubs
  'bandra': { lat: 19.0596, lon: 72.8295 },
  'andheri': { lat: 19.1136, lon: 72.8697 },
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'connaught place': { lat: 28.6315, lon: 77.2167 },
  'saket': { lat: 28.5244, lon: 77.2166 },
  'new delhi': { lat: 28.6139, lon: 77.2090 },
  'delhi': { lat: 28.6139, lon: 77.2090 },
  'indiranagar': { lat: 12.9784, lon: 77.6408 },
  'koramangala': { lat: 12.9352, lon: 77.6245 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'pune': { lat: 18.5204, lon: 73.8567 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'gurugram': { lat: 28.4595, lon: 77.0266 },
  'gurgaon': { lat: 28.4595, lon: 77.0266 },
  'noida': { lat: 28.5355, lon: 77.3910 },
  'chandigarh': { lat: 30.7333, lon: 76.7794 },
  // International Hubs
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'new york': { lat: 40.7128, lon: -74.0060 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
};

function resolveFacilityCoordinates(latitude, longitude, city, address) {
  let lat = Number(latitude);
  let lon = Number(longitude);

  if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    return { lat, lon, isExactGPS: true };
  }

  const normalized = `${address || ''} ${city || ''}`.toLowerCase();
  for (const [key, coords] of Object.entries(METRO_GEO_REGISTRY)) {
    if (normalized.includes(key)) {
      return { lat: coords.lat, lon: coords.lon, isExactGPS: false };
    }
  }

  // Global default: Mayfair Sanctuary HQ
  return { lat: 51.5118, lon: -0.1473, isExactGPS: false };
}

// Great-circle distance between two GPS coordinates using Haversine formula
exports.calculateHaversineDistanceKm = function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth mean radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};
const calculateHaversineDistanceKm = exports.calculateHaversineDistanceKm;

// @desc    Submit Public Gym Owner Partnership Application (Pre-Approval with Territory Protection)
// @route   POST /api/saas/apply
// @access  Public
exports.applyGymOwner = async (req, res, next) => {
  try {
    const {
      ownerName,
      email,
      phone,
      gymName,
      gymAddress,
      city,
      state,
      country = 'India',
      branchCount = 1,
      expectedMembers = 100,
      businessDescription = '',
      partnershipType = 'QNOX Franchise Gym',
      latitude,
      longitude,
      businessType = 'Private Limited',
      businessAddress = '',
      gstNumber = '',
      password = '',
      documents = [],
      emailVerified = true,
      phoneVerified = true,
    } = req.body;

    if (!ownerName || !email || !phone || !gymName || !gymAddress || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, email, phone, gym name, facility address, city, and state are required.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in or use another email.',
      });
    }

    // Check for existing pending/conflict application
    const existingApp = await GymOwnerApplication.findOne({
      email: email.toLowerCase().trim(),
      status: { $in: ['PENDING_APPROVAL', 'TERRITORY_CONFLICT'] },
    });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `An application (${existingApp.applicationId}) with this email is already under review.`,
      });
    }

    // 1. Resolve GPS Coordinates
    const coords = resolveFacilityCoordinates(latitude, longitude, city, gymAddress);

    // 2. Fetch all company-owned branches with territory protection active
    const companyBranches = await Club.find({
      $or: [{ gymType: 'Company-Owned' }, { isCompanyOwned: true }],
      isActive: true,
      isTerritoryProtected: { $ne: false },
    });

    // 3. Compute Distance against Company-Owned Branches
    let minDistanceKm = Infinity;
    let nearestBranch = null;
    let conflictBranch = null;
    let hasTerritoryConflict = false;

    for (const branch of companyBranches) {
      const bLat = branch.latitude ?? 51.5118;
      const bLon = branch.longitude ?? -0.1473;
      const protectedRadius = branch.protectionRadiusKm || 5;

      const dist = calculateHaversineDistanceKm(coords.lat, coords.lon, bLat, bLon);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        nearestBranch = branch;
      }
      if (dist <= protectedRadius && !conflictBranch) {
        hasTerritoryConflict = true;
        conflictBranch = branch;
      }
    }

    // 4. Evaluate Policy: Franchise vs SaaS
    // QNOX Franchise Gym: Strictly territory protected
    // QNOX SaaS Partner Gym: Independent software customer; franchise territory restriction is NOT automatically applied
    const isFranchise = partnershipType === 'QNOX Franchise Gym';
    const effectiveConflict = isFranchise && hasTerritoryConflict;
    const initialStatus = effectiveConflict ? 'TERRITORY_CONFLICT' : 'PENDING_APPROVAL';

    // 5. Generate sequential application ID
    const currentYear = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
      `gym_app_${currentYear}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const formattedSeq = String(counter.seq).padStart(6, '0');
    const applicationId = `QNOX-APP-${currentYear}-${formattedSeq}`;

    const application = await GymOwnerApplication.create({
      applicationId,
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      gymName: gymName.trim(),
      gymAddress: gymAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      partnershipType,
      latitude: coords.lat,
      longitude: coords.lon,
      hasTerritoryConflict: effectiveConflict,
      conflictingBranch: effectiveConflict ? conflictBranch?._id : null,
      conflictingBranchName: effectiveConflict ? (conflictBranch?.name || '') : '',
      conflictDistanceKm: effectiveConflict ? minDistanceKm : (nearestBranch ? minDistanceKm : null),
      branchCount: Math.max(1, Number(branchCount) || 1),
      expectedMembers: Math.max(1, Number(expectedMembers) || 100),
      businessDescription: (businessDescription || '').trim(),
      businessType: businessType || 'Private Limited',
      businessAddress: (businessAddress || gymAddress).trim(),
      gstNumber: (gstNumber || '').trim(),
      password: password ? await bcrypt.hash(password, 10) : undefined,
      documents: Array.isArray(documents) ? documents : [],
      emailVerified: Boolean(emailVerified),
      phoneVerified: Boolean(phoneVerified),
      status: initialStatus,
    });

    // Send confirmation email
    try {
      await emailService.sendGymOwnerApplicationSubmittedEmail({ application });
    } catch (mailErr) {
      console.warn('[Application Submitted Email Notice]:', mailErr.message);
    }

    const responseMessage = effectiveConflict
      ? `Your gym location falls within the protected territory of an existing QNOX Luxury Gym branch (${conflictBranch?.name || 'Company Branch'}, ${minDistanceKm} KM away, protected radius ${conflictBranch?.protectionRadiusKm || 5} KM). Your application requires special management review.`
      : 'Partnership application submitted successfully. Our executive board will review your credentials and issue a private invitation link.';

    res.status(201).json({
      success: true,
      message: responseMessage,
      hasTerritoryConflict: effectiveConflict,
      data: {
        applicationId: application.applicationId,
        ownerName: application.ownerName,
        gymName: application.gymName,
        email: application.email,
        partnershipType: application.partnershipType,
        status: application.status,
        latitude: application.latitude,
        longitude: application.longitude,
        hasTerritoryConflict: application.hasTerritoryConflict,
        conflictingBranchName: application.conflictingBranchName,
        conflictDistanceKm: application.conflictDistanceKm,
        createdAt: application.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Gym Owner Applications (Super Admin)
// @route   GET /api/saas/admin/applications
// @access  Private (Super Admin)
exports.getAdminGymOwnerApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { applicationId: regex },
        { ownerName: regex },
        { email: regex },
        { gymName: regex },
        { phone: regex },
        { city: regex },
      ];
    }

    const applications = await GymOwnerApplication.find(query)
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');

    const counts = {
      total: await GymOwnerApplication.countDocuments(),
      pending: await GymOwnerApplication.countDocuments({ status: 'PENDING_APPROVAL' }),
      conflicts: await GymOwnerApplication.countDocuments({ $or: [{ status: 'TERRITORY_CONFLICT' }, { hasTerritoryConflict: true }] }),
      approved: await GymOwnerApplication.countDocuments({ status: 'APPROVED' }),
      rejected: await GymOwnerApplication.countDocuments({ status: 'REJECTED' }),
      registered: await GymOwnerApplication.countDocuments({ status: 'REGISTERED' }),
    };

    res.status(200).json({
      success: true,
      count: applications.length,
      counts,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Gym Owner Application Details by ID (Super Admin)
// @route   GET /api/saas/admin/applications/:id
// @access  Private (Super Admin)
exports.getAdminGymOwnerApplicationById = async (req, res, next) => {
  try {
    const application = await GymOwnerApplication.findById(req.params.id)
      .populate('reviewedBy', 'name email')
      .populate('registeredUser', 'name email')
      .populate('registeredOrganization', 'name status');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    res.status(200).json({ success: true, data: application });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve Gym Owner Application & Issue Secure Invitation Token (with Territory Protection & Exceptional Override)
// @route   PUT /api/saas/admin/applications/:id/approve
// @access  Private (Super Admin)
exports.approveGymOwnerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      adminNotes,
      exceptionalApproval = false,
      exceptionalApprovalJustification = '',
    } = req.body;

    const application = await GymOwnerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // 1. Enforce Territory Protection Policy
    const hasConflict = application.hasTerritoryConflict || application.status === 'TERRITORY_CONFLICT';
    if (hasConflict) {
      if (!exceptionalApproval || !exceptionalApprovalJustification || exceptionalApprovalJustification.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Territory Protection Conflict: This gym location falls within the protected zone of a company-owned branch. Approval requires explicit exceptional authorization and a mandatory detailed justification (min 10 characters).',
          hasTerritoryConflict: true,
          conflictingBranchName: application.conflictingBranchName,
          conflictDistanceKm: application.conflictDistanceKm,
        });
      }

      application.exceptionalApproval = true;
      application.exceptionalApprovalJustification = exceptionalApprovalJustification.trim();
      application.exceptionalApprovedBy = req.user._id;

      // Log in AuditLog
      try {
        await AuditLog.create({
          adminId: req.user._id,
          adminName: req.user.name || 'Super Admin',
          action: 'TERRITORY_OVERRIDE_APPROVAL',
          details: `Super Admin exceptional override approved for application ${application.applicationId} (${application.gymName}). Protected Branch: ${application.conflictingBranchName} (${application.conflictDistanceKm} KM away). Justification: ${exceptionalApprovalJustification.trim()}`,
          previousValue: { status: application.status, hasTerritoryConflict: true },
          newValue: { status: 'APPROVED', exceptionalApproval: true },
        });
      } catch (logErr) {
        console.warn('[AuditLog territory override warning]:', logErr.message);
      }
    }

    // Generate random 32-byte secure invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    application.status = 'APPROVED';
    application.invitationToken = hashedToken;
    application.invitationExpiresAt = expiresAt;
    application.invitationUsed = false;
    if (adminNotes) application.adminNotes = adminNotes.trim();
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    // Construct invitation link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const invitationUrl = `${clientUrl}/gym-owner/onboard?token=${rawToken}`;

    // Send Approval Email
    try {
      await emailService.sendGymOwnerApplicationApprovedEmail({
        application,
        invitationUrl,
        expiresAt,
      });
    } catch (mailErr) {
      console.warn('[Approval Email Notice]:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Application ${application.applicationId} approved. Invitation dispatched to ${application.email}.`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        exceptionalApproval: application.exceptionalApproval,
        expiresAt,
        invitationUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject Gym Owner Application
// @route   PUT /api/saas/admin/applications/:id/reject
// @access  Private (Super Admin)
exports.rejectGymOwnerApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required for professional compliance.',
      });
    }

    const application = await GymOwnerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    application.status = 'REJECTED';
    application.rejectionReason = rejectionReason.trim();
    if (adminNotes) application.adminNotes = adminNotes.trim();
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.invitationToken = undefined;
    application.invitationExpiresAt = undefined;
    await application.save();

    // Send Rejection Notice Email
    try {
      await emailService.sendGymOwnerApplicationRejectedEmail({
        application,
        rejectionReason: application.rejectionReason,
      });
    } catch (mailErr) {
      console.warn('[Rejection Email Notice]:', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Application ${application.applicationId} rejected. Notification dispatched.`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Invitation Token & Fetch Pre-Approved Application Details
// @route   GET /api/saas/verify-invitation/:token
// @access  Public
exports.verifyInvitationToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token is missing.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const application = await GymOwnerApplication.findOne({
      invitationToken: hashedToken,
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation link. Please request a valid invitation or contact support.',
      });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `This application is in ${application.status} status. Registration not permitted.`,
      });
    }

    if (application.invitationUsed) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link has already been used to register an account. Please sign in.',
      });
    }

    if (application.invitationExpiresAt && application.invitationExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link has expired. Please contact Super Admin for a fresh invitation.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        applicationId: application.applicationId,
        ownerName: application.ownerName,
        email: application.email,
        phone: application.phone,
        gymName: application.gymName,
        gymAddress: application.gymAddress,
        city: application.city,
        state: application.state,
        country: application.country,
        branchCount: application.branchCount,
        expectedMembers: application.expectedMembers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Complete Registration for Approved Gym Owner
// @route   POST /api/saas/register-approved
// @access  Public
exports.registerApprovedGymOwner = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Invitation token and password are required.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const application = await GymOwnerApplication.findOne({ invitationToken: hashedToken });

    if (!application) {
      return res.status(400).json({ success: false, message: 'Invalid invitation link.' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'This application is not approved.' });
    }

    if (application.invitationUsed) {
      return res.status(400).json({ success: false, message: 'This invitation has already been used.' });
    }

    if (application.invitationExpiresAt && application.invitationExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This invitation link has expired.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: application.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered. Please sign in.',
      });
    }

    // Slug for organization
    const slug = (application.gymName || 'gym')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30) + '-' + Math.random().toString(36).substring(2, 6);

    // Create Organization in 'Pending-Payment' state
    const organization = await Organization.create({
      name: application.gymName,
      slug,
      type: 'SaaS-Partner',
      status: 'Pending-Payment',
      subscriptionStatus: 'PENDING_PAYMENT',
      onboardingStage: 'PAYMENT_PENDING',
      businessType: application.businessType || 'Private Limited',
      businessAddress: application.businessAddress || application.gymAddress,
      gstNumber: application.gstNumber || '',
      businessDocuments: application.documents || [],
      contactEmail: application.email,
      phone: application.phone,
      address: application.gymAddress,
      city: application.city,
      state: application.state,
      branchesLimit: Math.max(1, application.branchCount || 1),
      trainersLimit: 5,
      membersLimit: Math.max(100, application.expectedMembers || 100),
    });

    // Create User (role: Gym Owner)
    const user = await User.create({
      name: application.ownerName,
      email: application.email,
      phone: application.phone,
      password,
      role: 'Gym Owner',
      organization: organization._id,
    });

    organization.owner = user._id;
    organization.ownerName = user.name;
    organization.ownerEmail = user.email;
    await organization.save();

    // Mark application as REGISTERED
    application.status = 'REGISTERED';
    application.invitationUsed = true;
    application.invitationUsedAt = new Date();
    application.registeredUser = user._id;
    application.registeredOrganization = organization._id;
    await application.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, organization: organization._id },
      process.env.JWT_SECRET || 'qnox_luxury_jwt_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account provisioned successfully. Please select your SaaS subscription plan to activate your dashboard.',
      data: {
        token: jwtToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: organization._id,
        },
        organization,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate SaaS Checkout & Generate Razorpay Order
// @route   POST /api/saas/initiate-checkout
// @access  Private (Gym Owner)
exports.initiateSaaSCheckout = async (req, res, next) => {
  try {
    const { planCode, billingCycle = 'monthly' } = req.body;
    const orgId = req.user.organization || req.tenantOrgId;

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Tenant organization not found in session.' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization record not found.' });
    }

    const plan = await SaaSSubscriptionPlan.findOne({ code: (planCode || 'starter').toLowerCase(), isActive: true });
    if (!plan) {
      return res.status(404).json({ success: false, message: `Plan '${planCode}' not found or inactive.` });
    }

    const now = new Date();
    const periodDays = billingCycle === 'yearly' ? 365 : 30;
    const currentPeriodEnd = new Date(now.getTime() + periodDays * 86400000);

    // Create proforma Invoice
    const invoice = await invoiceService.createSaaSInvoice({
      organization: org,
      user: req.user,
      plan,
      billingCycle,
      startDate: now,
      endDate: currentPeriodEnd,
    });

    // Create Razorpay Order
    let razorpayOrder = null;
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(invoice.pricing.totalPayable * 100),
        currency: 'INR',
        receipt: `saas_${org._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          organizationId: org._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          planCode: plan.code,
          billingCycle,
        },
      });
    } catch (rzpErr) {
      console.warn('[Razorpay Order Fallback]:', rzpErr.message);
      razorpayOrder = {
        id: `order_saas_${Date.now()}`,
        amount: Math.round(invoice.pricing.totalPayable * 100),
        currency: 'INR',
      };
    }

    res.status(200).json({
      success: true,
      data: {
        organization: org,
        plan,
        invoice,
        billingCycle,
        razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_qnox_luxury_key',
      },
    });
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// Super Admin Territory Protection & Geofencing Management
// =========================================================================

// @desc    Get Territory Protection Management Data (Super Admin)
// @route   GET /api/saas/admin/territories
// @access  Private (Super Admin)
exports.getAdminTerritories = async (req, res, next) => {
  try {
    const branches = await Club.find({
      $or: [{ gymType: 'Company-Owned' }, { isCompanyOwned: true }],
    }).sort({ name: 1 });

    const applications = await GymOwnerApplication.find()
      .populate('conflictingBranch', 'name location latitude longitude protectionRadiusKm')
      .sort({ createdAt: -1 });

    const conflicts = applications.filter(
      (app) => app.hasTerritoryConflict || app.status === 'TERRITORY_CONFLICT'
    );

    res.status(200).json({
      success: true,
      data: {
        branches,
        applications,
        conflicts,
        stats: {
          totalBranches: branches.length,
          protectedBranches: branches.filter((b) => b.isTerritoryProtected !== false).length,
          totalConflicts: conflicts.length,
          pendingReviewCount: conflicts.filter((c) => c.status === 'TERRITORY_CONFLICT').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Branch Territory Protection Radius and Coordinates (Super Admin)
// @route   PUT /api/saas/admin/territories/branch/:id
// @access  Private (Super Admin)
exports.updateBranchTerritory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, protectionRadiusKm, isTerritoryProtected } = req.body;

    const branch = await Club.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    const previousRadius = branch.protectionRadiusKm || 5;
    const previousLat = branch.latitude;
    const previousLon = branch.longitude;

    if (latitude !== undefined) branch.latitude = Number(latitude);
    if (longitude !== undefined) branch.longitude = Number(longitude);
    if (protectionRadiusKm !== undefined) {
      branch.protectionRadiusKm = Math.max(0.5, Math.min(50, Number(protectionRadiusKm)));
    }
    if (isTerritoryProtected !== undefined) {
      branch.isTerritoryProtected = Boolean(isTerritoryProtected);
    }

    await branch.save();

    // Create Audit Log
    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'TERRITORY_CONFIG_UPDATE',
        details: `Updated territory protection for company-owned branch "${branch.name}": Protected Radius ${previousRadius} KM -> ${branch.protectionRadiusKm} KM, Protection: ${branch.isTerritoryProtected ? 'Active' : 'Disabled'}`,
        previousValue: { radius: previousRadius, latitude: previousLat, longitude: previousLon },
        newValue: {
          radius: branch.protectionRadiusKm,
          latitude: branch.latitude,
          longitude: branch.longitude,
          isTerritoryProtected: branch.isTerritoryProtected,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog territory config notice]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Territory protection updated for branch "${branch.name}". Protected radius is now ${branch.protectionRadiusKm} KM.`,
      data: branch,
    });
  } catch (err) {
    next(err);
  }
};

// =========================================================================
// Gym Owner Onboarding Workflow & Final Branch Verification (Gateway 2)
// =========================================================================

// @desc    Request Additional Information for Application (Gateway 1)
// @route   PUT /api/saas/admin/applications/:id/request-info
// @access  Private (Super Admin)
exports.requestAdditionalInfoApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, requestedDocuments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A detailed message explaining what information or documents are required is mandatory.',
      });
    }

    const application = await GymOwnerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const prevStatus = application.status;
    application.status = 'ADDITIONAL_INFORMATION_REQUIRED';
    application.additionalInfoRequested = {
      requested: true,
      message: message.trim(),
      requestedDocuments: Array.isArray(requestedDocuments) ? requestedDocuments : [],
      requestedAt: new Date(),
    };

    if (!application.history) application.history = [];
    application.history.push({
      status: 'ADDITIONAL_INFORMATION_REQUIRED',
      changedAt: new Date(),
      changedBy: req.user._id,
      notes: message.trim(),
    });

    await application.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'APPLICATION_INFO_REQUESTED',
        details: `Requested additional information for application ${application.applicationId} (${application.gymName}): ${message.trim()}`,
        previousValue: { status: prevStatus },
        newValue: { status: application.status, message: message.trim() },
      });
    } catch (logErr) {
      console.warn('[AuditLog info request warning]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Additional information requested from ${application.ownerName} (${application.email}).`,
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit Initial Gym Branch for Verification (Post-Payment Setup)
// @route   POST /api/saas/branches/submit-initial
// @access  Private (Gym Owner)
exports.submitInitialGymBranch = async (req, res, next) => {
  try {
    const orgId = req.user.organization || req.tenantOrgId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'Tenant organization not found in session.' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization record not found.' });
    }

    // Check subscription status
    if (org.subscriptionStatus !== 'ACTIVE' && org.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'Active SaaS subscription required before submitting gym branch details.',
      });
    }

    const {
      name,
      displayName,
      tagline,
      description,
      logo,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      latitude,
      longitude,
      openingHours,
      amenities,
      features,
      heroImage,
      gallery,
      locationDocuments,
    } = req.body;

    if (!name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Gym name, address, city, and state are mandatory fields.',
      });
    }

    // Check branch quota limit
    await enforceQuotaLimit(org, 'branch');

    // Resolve GPS coordinates
    const coords = resolveFacilityCoordinates(latitude, longitude, city, address);

    // Geofencing Check against Company-Owned Branches
    const companyBranches = await Club.find({
      $or: [{ gymType: 'Company-Owned' }, { isCompanyOwned: true }],
      isActive: true,
      isTerritoryProtected: { $ne: false },
    });

    let minDistanceKm = Infinity;
    let conflictBranch = null;
    let hasConflict = false;

    for (const cb of companyBranches) {
      const bLat = cb.latitude ?? 51.5118;
      const bLon = cb.longitude ?? -0.1473;
      const radius = cb.protectionRadiusKm || 5;

      const dist = calculateHaversineDistanceKm(coords.lat, coords.lon, bLat, bLon);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
      }
      if (dist <= radius && !conflictBranch) {
        hasConflict = true;
        conflictBranch = cb;
      }
    }

    // Branch Slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)}-${Math.random().toString(36).substring(2, 6)}`;

    const initialVerificationStatus = hasConflict ? 'TERRITORY_REVIEW' : 'PENDING_VERIFICATION';

    const club = await Club.create({
      name: name.trim(),
      displayName: displayName ? displayName.trim() : name.trim(),
      slug,
      organization: org._id,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: (postalCode || '').trim(),
      location: `${city.trim()}, ${state.trim()}`,
      phone: (phone || org.phone || '').trim(),
      email: (email || org.contactEmail || '').trim(),
      logo: logo || '',
      tagline: tagline || `Sanctuary of ${name.trim()}`,
      description: description || `Premier athletic sanctuary branch of ${name.trim()}.`,
      heroImage: heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
      gallery: Array.isArray(gallery) ? gallery : [],
      amenities: Array.isArray(amenities) ? amenities : ['Strength Equipment', 'Cardio Suite', 'Locker Rooms'],
      features: features || { pool: false, altitudeChamber: false, cryotherapy: false, spaAndRecovery: true, valet: false },
      openingHours: openingHours || { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
      latitude: coords.lat,
      longitude: coords.lon,
      isCompanyOwned: false,
      isTerritoryProtected: false,
      gymType: 'SaaS-Partner',
      status: 'COMING SOON',
      isActive: false, // Activated only upon Super Admin Gateway 2 approval
      verificationStatus: initialVerificationStatus,
      locationDocuments: Array.isArray(locationDocuments) ? locationDocuments : [],
    });

    // Update organization stage
    org.onboardingStage = hasConflict ? 'TERRITORY_REVIEW' : 'GYM_VERIFICATION';
    await org.save();

    // Log in AuditLog
    try {
      await AuditLog.create({
        adminName: req.user.name || 'Gym Owner',
        action: 'BRANCH_SUBMITTED_FOR_VERIFICATION',
        details: `Gym branch "${club.name}" submitted for verification. Initial status: ${club.verificationStatus}. Nearest company branch: ${minDistanceKm !== Infinity ? minDistanceKm + ' KM' : 'None nearby'}.`,
        newValue: { clubId: club._id, status: club.verificationStatus },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch submit warning]:', logErr.message);
    }

    const message = hasConflict
      ? `Your gym location falls within the protected territory of an existing QNOX Luxury Gym branch (${conflictBranch?.name}, ${minDistanceKm} KM away). Your submission requires special management review.`
      : 'Gym branch submitted successfully for final verification. Super Admin will review your location documents and activate your sanctuary.';

    res.status(201).json({
      success: true,
      message,
      hasTerritoryConflict: hasConflict,
      data: {
        club,
        onboardingStage: org.onboardingStage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Gym Verifications Queue (Super Admin Gateway 2)
// @route   GET /api/saas/admin/gym-verifications
// @access  Private (Super Admin)
exports.getAdminGymVerifications = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {
      isCompanyOwned: { $ne: true },
    };

    if (status && status !== 'All') {
      query.verificationStatus = status;
    }

    const clubs = await Club.find(query)
      .populate('organization', 'name status onboardingStage subscriptionStatus contactEmail phone')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    // Fetch company-owned branches for distance reference
    const companyBranches = await Club.find({
      $or: [{ gymType: 'Company-Owned' }, { isCompanyOwned: true }],
      isActive: true,
    });

    const enrichedClubs = clubs.map((c) => {
      let nearest = null;
      let minDistance = Infinity;

      for (const cb of companyBranches) {
        const dist = calculateHaversineDistanceKm(
          c.latitude ?? 51.5118,
          c.longitude ?? -0.1473,
          cb.latitude ?? 51.5118,
          cb.longitude ?? -0.1473
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearest = cb;
        }
      }

      return {
        ...c.toObject(),
        nearestCompanyBranch: nearest ? { name: nearest.name, distanceKm: minDistance, radiusKm: nearest.protectionRadiusKm || 5 } : null,
      };
    });

    const counts = {
      total: clubs.length,
      pending: clubs.filter((c) => c.verificationStatus === 'PENDING_VERIFICATION').length,
      territoryReview: clubs.filter((c) => c.verificationStatus === 'TERRITORY_REVIEW').length,
      changesRequested: clubs.filter((c) => c.verificationStatus === 'CHANGES_REQUESTED').length,
      approved: clubs.filter((c) => c.verificationStatus === 'APPROVED' || c.verificationStatus === 'ACTIVE').length,
      rejected: clubs.filter((c) => c.verificationStatus === 'REJECTED').length,
      suspended: clubs.filter((c) => c.operationalStatus === 'SUSPENDED').length,
    };

    res.status(200).json({
      success: true,
      counts,
      data: enrichedClubs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve and Activate Gym Branch (Super Admin Gateway 2)
// @route   PUT /api/saas/admin/gym-verifications/:clubId/approve
// @access  Private (Super Admin)
exports.approveAndActivateGymBranch = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { adminNotes, exceptionalApproval = false, exceptionalApprovalJustification = '' } = req.body;

    const club = await Club.findById(clubId).populate('organization');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Gym branch not found.' });
    }

    if (club.verificationStatus === 'TERRITORY_REVIEW' && !exceptionalApproval) {
      if (!exceptionalApprovalJustification || exceptionalApprovalJustification.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Territory Review Conflict: This gym requires explicit exceptional approval and a detailed justification (min 10 characters).',
        });
      }
    }

    club.verificationStatus = 'APPROVED';
    club.verifiedBy = req.user._id;
    club.verifiedAt = new Date();
    if (adminNotes) {
      club.rejectionReason = '';
      club.changeRequestNotes = '';
    }

    // Determine operational readiness
    if (club.setupChecklist && club.setupChecklist.completed) {
      club.operationalStatus = 'ACTIVE';
      club.publicationStatus = 'READY_TO_PUBLISH';
      club.status = 'OPEN';
      club.isActive = true;
    } else {
      club.operationalStatus = 'INACTIVE';
      club.publicationStatus = 'DRAFT';
      club.status = 'COMING SOON';
      club.isActive = false;
    }

    await club.save();

    // Update Organization Onboarding Stage to ACTIVE_COMPLETED
    if (club.organization) {
      await Organization.findByIdAndUpdate(club.organization._id || club.organization, {
        onboardingStage: 'ACTIVE_COMPLETED',
        status: 'Active',
      });
    }

    // Create Audit Log
    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'BRANCH_VERIFICATION_APPROVED',
        details: `Super Admin approved verification for branch "${club.name}". Exceptional override: ${exceptionalApproval ? 'Yes (' + exceptionalApprovalJustification + ')' : 'No'}.`,
        newValue: {
          clubId: club._id,
          verificationStatus: 'APPROVED',
          operationalStatus: club.operationalStatus,
          publicationStatus: club.publicationStatus,
        },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch activate warning]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Gym branch "${club.name}" verification approved! Owner can now complete operational setup.`,
      data: club,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject Gym Branch Verification (Super Admin Gateway 2)
// @route   PUT /api/saas/admin/gym-verifications/:clubId/reject
// @access  Private (Super Admin)
exports.rejectGymBranch = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required for compliance.',
      });
    }

    const club = await Club.findById(clubId).populate('organization');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Gym branch not found.' });
    }

    club.verificationStatus = 'REJECTED';
    club.operationalStatus = 'INACTIVE';
    club.publicationStatus = 'DRAFT';
    club.status = 'MAINTENANCE';
    club.isActive = false;
    club.rejectionReason = rejectionReason.trim();
    await club.save();

    if (club.organization) {
      await Organization.findByIdAndUpdate(club.organization._id || club.organization, {
        onboardingStage: 'GYM_REJECTED',
      });
    }

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'BRANCH_VERIFICATION_REJECTED',
        details: `Rejected gym branch "${club.name}". Reason: ${rejectionReason.trim()}`,
        newValue: { clubId: club._id, verificationStatus: 'REJECTED', operationalStatus: 'INACTIVE' },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch reject warning]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Gym branch "${club.name}" rejected.`,
      data: club,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request Changes on Gym Branch Application (Super Admin)
// @route   PUT /api/saas/admin/gym-verifications/:clubId/request-changes
// @access  Private (Super Admin)
exports.requestChangesBranch = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { changeRequestNotes } = req.body;

    if (!changeRequestNotes || !changeRequestNotes.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Details/notes on required corrections are required.',
      });
    }

    const club = await Club.findById(clubId).populate('organization');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Gym branch not found.' });
    }

    club.verificationStatus = 'CHANGES_REQUESTED';
    club.changeRequestNotes = changeRequestNotes.trim();
    club.operationalStatus = 'INACTIVE';
    club.publicationStatus = 'DRAFT';
    club.status = 'MAINTENANCE';
    club.isActive = false;
    await club.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'BRANCH_CHANGES_REQUESTED',
        details: `Requested changes for gym branch "${club.name}". Notes: ${changeRequestNotes.trim()}`,
        newValue: { clubId: club._id, verificationStatus: 'CHANGES_REQUESTED' },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch changes warning]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Correction requested for "${club.name}". Gym owner has been notified to revise.`,
      data: club,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Suspend Gym Branch (Super Admin)
// @route   PUT /api/saas/admin/gym-verifications/:clubId/suspend
// @access  Private (Super Admin)
exports.suspendBranch = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const { suspensionReason } = req.body;

    if (!suspensionReason || !suspensionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A suspension reason is required for compliance audit.',
      });
    }

    const club = await Club.findById(clubId).populate('organization');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Gym branch not found.' });
    }

    club.operationalStatus = 'SUSPENDED';
    club.suspensionReason = suspensionReason.trim();
    club.suspendedAt = new Date();
    club.suspendedBy = req.user._id;
    club.status = 'MAINTENANCE';
    club.isActive = false;
    await club.save();

    try {
      await AuditLog.create({
        adminId: req.user._id,
        adminName: req.user.name || 'Super Admin',
        action: 'BRANCH_SUSPENDED',
        details: `Suspended gym branch "${club.name}". Reason: ${suspensionReason.trim()}`,
        newValue: { clubId: club._id, operationalStatus: 'SUSPENDED' },
      });
    } catch (logErr) {
      console.warn('[AuditLog branch suspend warning]:', logErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Branch "${club.name}" suspended. It is immediately unlisted from public access.`,
      data: club,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Real-Time Onboarding Status & Visual Progress Tracking
// @route   GET /api/saas/onboarding-status
// @access  Private (Gym Owner)
exports.getGymOwnerOnboardingStatus = async (req, res, next) => {
  try {
    const orgId = req.user.organization || req.tenantOrgId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: 'No organization attached to session.' });
    }

    const org = await Organization.findById(orgId).populate('subscription');
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found.' });
    }

    const latestClub = await Club.findOne({ organization: org._id }).sort({ createdAt: -1 });

    const subscription = org.subscription || null;

    // Build standard 6-stage tracker
    // Stages: 1. Registration, 2. Admin Verification, 3. SaaS Subscription, 4. Branch Setup, 5. Territory Geofence Audit, 6. Live & Active
    const stage = org.onboardingStage || 'PAYMENT_PENDING';

    const stages = [
      {
        id: 1,
        key: 'REGISTRATION',
        title: 'Gym Owner Registration',
        description: 'Account profile and business credentials submitted.',
        status: 'COMPLETED',
      },
      {
        id: 2,
        key: 'ADMIN_VERIFICATION',
        title: 'Admin Verification (Gateway 1)',
        description: 'Super Admin credentials approval & invitation access granted.',
        status: 'COMPLETED',
      },
      {
        id: 3,
        key: 'SAAS_SUBSCRIPTION',
        title: 'SaaS Subscription & Payment',
        description: 'Choose tier (Starter, Pro, Enterprise) and verify payment.',
        status:
          org.subscriptionStatus === 'ACTIVE'
            ? 'COMPLETED'
            : stage === 'PAYMENT_PENDING'
            ? 'CURRENT'
            : 'PENDING',
      },
      {
        id: 4,
        key: 'BRANCH_SETUP',
        title: 'Initial Branch & Facility Setup',
        description: 'Facility address, GPS location, operating hours, and documents.',
        status: latestClub
          ? 'COMPLETED'
          : org.subscriptionStatus === 'ACTIVE'
          ? 'CURRENT'
          : 'PENDING',
      },
      {
        id: 5,
        key: 'TERRITORY_AUDIT',
        title: 'Territory Geofence Audit',
        description: 'Haversine distance verification vs company-owned luxury branches.',
        status: !latestClub
          ? 'PENDING'
          : latestClub.verificationStatus === 'TERRITORY_REVIEW'
          ? 'WARNING'
          : 'COMPLETED',
      },
      {
        id: 6,
        key: 'LIVE_ACTIVE',
        title: 'Final Activation (Gateway 2)',
        description: 'Super Admin facility review & full dashboard access.',
        status:
          latestClub && (latestClub.verificationStatus === 'ACTIVE' || org.onboardingStage === 'ACTIVE_COMPLETED')
            ? 'COMPLETED'
            : latestClub && latestClub.verificationStatus === 'REJECTED'
            ? 'FAILED'
            : latestClub
            ? 'CURRENT'
            : 'PENDING',
      },
    ];

    res.status(200).json({
      success: true,
      data: {
        organization: org,
        subscription,
        latestClub,
        onboardingStage: stage,
        stages,
      },
    });
  } catch (err) {
    next(err);
  }
};

