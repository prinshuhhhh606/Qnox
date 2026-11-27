const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const MembershipRequest = require('../models/MembershipRequest');
const MembershipFreezeRequest = require('../models/MembershipFreezeRequest');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');
const {
  DEFAULT_POLICY,
  getAnnualFreezeDaysUsed,
  submitFreezeRequest: serviceSubmitFreeze,
  approveFreezeRequest: serviceApproveFreeze,
  rejectFreezeRequest: serviceRejectFreeze,
  cancelPendingFreezeRequest: serviceCancelFreeze,
  resumeFreeze: serviceResumeFreeze,
} = require('../services/membershipFreezeService');

// Helper to create audit logs
const createAudit = async ({ admin, member, action, details, previousValue, newValue }) => {
  try {
    await AuditLog.create({
      adminId: admin?._id,
      adminName: admin?.name || 'Executive Admin',
      memberId: member._id,
      memberName: member.name,
      action,
      details,
      previousValue,
      newValue,
    });
  } catch (err) {
    console.warn('[Audit Log Warning]:', err.message);
  }
};

// ==========================================
// MEMBER ENDPOINTS
// ==========================================

// @desc    Get Current User's Membership Details
// @route   GET /api/memberships/my-membership
// @access  Private (Gym Member)
exports.getMyMembership = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('membership.planId');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member profile not found.' });
    }

    const membership = user.membership || {};
    const now = new Date();
    let daysRemaining = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (membership.endDate) {
      const end = new Date(membership.endDate);
      const diffTime = end.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 0) {
        isExpired = true;
      } else if (daysRemaining <= 7) {
        isExpiringSoon = true;
      }
    }

    // Backend Trial Expiration Engine: Check and update trial status automatically
    let trial = user.trial || { isActive: false, status: 'None', hasUsedTrial: false };
    if (trial.status === 'Active' && trial.endDate) {
      if (now > new Date(trial.endDate)) {
        trial.isActive = false;
        trial.status = 'Expired';
        user.trial.isActive = false;
        user.trial.status = 'Expired';
        await user.save({ validateBeforeSave: false });
      }
    }

    let trialRemainingMs = 0;
    if (trial.status === 'Active' && trial.endDate) {
      trialRemainingMs = Math.max(0, new Date(trial.endDate).getTime() - now.getTime());
    }

    // Check for active or pending requests
    const pendingRequest = await MembershipRequest.findOne({
      user: req.user._id,
      status: 'Pending',
    }).sort({ createdAt: -1 });

    const activeFreezeRequest = await MembershipFreezeRequest.findOne({
      member: req.user._id,
      status: { $in: ['Pending', 'Approved', 'Frozen'] },
    }).sort({ createdAt: -1 });

    const daysUsedThisYear = await getAnnualFreezeDaysUsed(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        membership,
        status: membership.status || 'None',
        daysRemaining: daysRemaining !== null ? Math.max(0, daysRemaining) : null,
        isExpired,
        isExpiringSoon,
        isFrozen: membership.isFrozen || false,
        isSuspended: membership.status === 'Suspended',
        freezeDetails: membership.freezeDetails,
        suspensionDetails: membership.suspensionDetails,
        cancellationDetails: membership.cancellationDetails,
        autoRenew: membership.autoRenew !== false,
        pendingRequest: pendingRequest || null,
        activeFreezeRequest: activeFreezeRequest || null,
        freezeQuota: {
          minDays: DEFAULT_POLICY.MIN_DAYS,
          maxDaysPerRequest: DEFAULT_POLICY.MAX_DAYS_PER_REQUEST,
          annualLimitDays: DEFAULT_POLICY.ANNUAL_LIMIT_DAYS,
          daysUsedThisYear,
          remainingAnnualDays: Math.max(0, DEFAULT_POLICY.ANNUAL_LIMIT_DAYS - daysUsedThisYear),
        },
        membershipHistory: user.membershipHistory || [],
        trial: {
          isActive: trial.isActive || false,
          status: trial.status || 'None',
          trialType: trial.trialType || '3-Day VIP Sanctuary Trial',
          startDate: trial.startDate,
          endDate: trial.endDate,
          hasUsedTrial: trial.hasUsedTrial || false,
          activatedAt: trial.activatedAt,
          remainingMs: trialRemainingMs,
          remainingHours: Math.floor(trialRemainingMs / (1000 * 60 * 60)),
          remainingMinutes: Math.floor((trialRemainingMs % (1000 * 60 * 60)) / (1000 * 60)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start 3-Day Free Trial (Strict 72-Hour VIP Pass)
// @route   POST /api/memberships/start-trial
// @access  Private (Registered Member)
exports.startFreeTrial = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // 1. One-time restriction check
    if (user.trial && (user.trial.hasUsedTrial || user.trial.status === 'Active' || user.trial.status === 'Expired')) {
      return res.status(400).json({
        success: false,
        message: 'You have already utilized your one-time 3-Day Free Trial on this account.',
      });
    }

    // 2. Prevent trial activation if user already holds an active paid membership
    if (user.membership && user.membership.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Active members already have full sanctuary privileges and cannot activate a trial.',
      });
    }

    // 3. Exact 72 Hours calculation on server (never trust client)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 72 * 60 * 60 * 1000); // exactly 72 hours (3 days)

    user.trial = {
      isActive: true,
      status: 'Active',
      trialType: '3-Day VIP Sanctuary Trial',
      startDate,
      endDate,
      hasUsedTrial: true,
      activatedAt: startDate,
    };

    await user.save({ validateBeforeSave: false });

    // Send Welcome Notification
    try {
      await Notification.create({
        recipient: user._id,
        recipientRole: 'Gym Member',
        title: '🌟 3-Day VIP Sanctuary Trial Activated',
        message: `Welcome to QNOX GYM. Your 72-hour all-access sanctuary pass is active until ${endDate.toLocaleString('en-GB')}. Explore our classes and master facilities.`,
        type: 'CUSTOM',
      });
    } catch (notifErr) {
      console.warn('[Notification Warning]:', notifErr.message);
    }

    // Log to Audit trail
    await createAudit({
      admin: null,
      member: user,
      action: 'Trial Activated',
      details: 'Member started one-time 3-Day VIP Free Trial pass.',
      previousValue: 'None',
      newValue: 'Active 72-Hour Trial',
    });

    res.status(200).json({
      success: true,
      message: 'Your 3-Day Free Trial has been activated successfully! Enjoy 72 hours of full sanctuary access.',
      data: {
        trial: user.trial,
        remainingHours: 72,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Live Trial Status & Time Remaining
// @route   GET /api/memberships/trial-status
// @access  Private (Gym Member)
exports.getTrialStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let trial = user.trial || { isActive: false, status: 'None', hasUsedTrial: false };
    const now = new Date();

    // Check expiration on every access
    if (trial.status === 'Active' && trial.endDate) {
      if (now > new Date(trial.endDate)) {
        trial.isActive = false;
        trial.status = 'Expired';
        user.trial.isActive = false;
        user.trial.status = 'Expired';
        await user.save({ validateBeforeSave: false });
      }
    }

    const remainingMs = trial.status === 'Active' && trial.endDate
      ? Math.max(0, new Date(trial.endDate).getTime() - now.getTime())
      : 0;

    res.status(200).json({
      success: true,
      data: {
        isActive: trial.isActive || false,
        status: trial.status || 'None',
        trialType: trial.trialType || '3-Day VIP Sanctuary Trial',
        startDate: trial.startDate,
        endDate: trial.endDate,
        hasUsedTrial: trial.hasUsedTrial || false,
        activatedAt: trial.activatedAt,
        remainingMs,
        remainingHours: Math.floor(remainingMs / (1000 * 60 * 60)),
        remainingMinutes: Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)),
        isEligible: !trial.hasUsedTrial && (!user.membership || user.membership.status !== 'Active'),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Membership Freeze Request
// @route   POST /api/memberships/freeze-request
// @access  Private (Gym Member)
exports.requestFreeze = async (req, res, next) => {
  try {
    const {
      startDate,
      requestedStartDate,
      freezeDays,
      requestedDuration,
      reason,
      additionalNotes,
      supportingDocument,
    } = req.body;

    const request = await serviceSubmitFreeze({
      userId: req.user._id,
      requestedStartDate: requestedStartDate || startDate,
      requestedDuration: requestedDuration || freezeDays,
      reason,
      additionalNotes,
      supportingDocument,
    });

    res.status(201).json({
      success: true,
      message: 'Your membership freeze request has been submitted successfully and is awaiting approval.',
      data: request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit freeze request',
    });
  }
};

// @desc    Get Member Freeze Request History
// @route   GET /api/memberships/freeze-history
// @access  Private (Gym Member)
exports.getMyFreezeHistory = async (req, res, next) => {
  try {
    const history = await MembershipFreezeRequest.find({ member: req.user._id }).sort({ createdAt: -1 });
    const daysUsedThisYear = await getAnnualFreezeDaysUsed(req.user._id);

    res.status(200).json({
      success: true,
      data: history,
      meta: {
        minDays: DEFAULT_POLICY.MIN_DAYS,
        maxDaysPerRequest: DEFAULT_POLICY.MAX_DAYS_PER_REQUEST,
        annualLimitDays: DEFAULT_POLICY.ANNUAL_LIMIT_DAYS,
        daysUsedThisYear,
        remainingAnnualDays: Math.max(0, DEFAULT_POLICY.ANNUAL_LIMIT_DAYS - daysUsedThisYear),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel Pending Freeze Request
// @route   POST /api/memberships/freeze-requests/:id/cancel
// @access  Private (Gym Member)
exports.cancelMyFreezeRequest = async (req, res, next) => {
  try {
    const cancelled = await serviceCancelFreeze({
      requestId: req.params.id,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: `Freeze request ${cancelled.requestId} has been cancelled successfully.`,
      data: cancelled,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel freeze request',
    });
  }
};

// @desc    Get Freeze Policy Config & Limits
// @route   GET /api/memberships/freeze-policy
// @access  Private
exports.getFreezePolicy = async (req, res, next) => {
  try {
    const daysUsedThisYear = req.user ? await getAnnualFreezeDaysUsed(req.user._id) : 0;
    res.status(200).json({
      success: true,
      data: {
        minDays: DEFAULT_POLICY.MIN_DAYS,
        maxDaysPerRequest: DEFAULT_POLICY.MAX_DAYS_PER_REQUEST,
        annualLimitDays: DEFAULT_POLICY.ANNUAL_LIMIT_DAYS,
        daysUsedThisYear,
        remainingAnnualDays: Math.max(0, DEFAULT_POLICY.ANNUAL_LIMIT_DAYS - daysUsedThisYear),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Membership Cancellation Request
// @route   POST /api/memberships/cancellation-request
// @access  Private (Gym Member)
exports.requestCancellation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (!['Active', 'Frozen', 'Expiring Soon'].includes(user.membership?.status)) {
      return res.status(400).json({
        success: false,
        message: 'No active or frozen membership found to cancel.',
      });
    }

    const existing = await MembershipRequest.findOne({
      user: user._id,
      type: 'Cancellation',
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A cancellation request is already pending concierge review.',
      });
    }

    const request = await MembershipRequest.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      memberId: user.memberId || '',
      type: 'Cancellation',
      reason: reason || 'Personal relocation / voluntary departure',
      status: 'Pending',
    });

    // Notify Admins
    const admins = await User.find({ role: { $in: ['Admin', 'Super Admin'] } }).select('_id');
    const adminNotifs = admins.map((admin) => ({
      recipient: admin._id,
      recipientRole: 'Admin',
      customer: user._id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      membershipPlan: user.membership?.planName || 'Residency',
      type: 'MEMBERSHIP_EXPIRED',
      title: 'Membership Cancellation Requested',
      message: `${user.name} (${user.memberId || user.email}) has requested residency cancellation. Reason: ${reason || 'Personal reasons'}.`,
      actionUrl: '/admin?tab=requests',
      actionLabel: 'Review Request',
      data: { requestId: request._id, type: 'Cancellation' },
    }));

    if (adminNotifs.length > 0) {
      await Notification.insertMany(adminNotifs);
    }

    res.status(201).json({
      success: true,
      message: 'Your cancellation inquiry has been received. Our concierge will review your dossier.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Auto-Renewal Preference
// @route   PATCH /api/memberships/auto-renew
// @access  Private (Gym Member)
exports.toggleAutoRenew = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    user.membership.autoRenew = !user.membership.autoRenew;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Auto-renewal preference set to ${user.membership.autoRenew ? 'ENABLED' : 'DISABLED'}.`,
      data: { autoRenew: user.membership.autoRenew },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// @desc    Get Detailed Membership Analytics & Lifecycle Stats
// @route   GET /api/memberships/admin/stats
// @access  Private (Admin, Super Admin)
exports.getMembershipStats = async (req, res, next) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'Gym Member', isArchived: { $ne: true } });
    const active = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Active', isArchived: { $ne: true } });
    const expiringSoon = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Expiring Soon', isArchived: { $ne: true } });
    const expired = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Expired', isArchived: { $ne: true } });
    const frozen = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Frozen', isArchived: { $ne: true } });
    const suspended = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Suspended', isArchived: { $ne: true } });
    const pending = await User.countDocuments({ role: 'Gym Member', 'membership.status': 'Pending', isArchived: { $ne: true } });

    const pendingRequests = await MembershipRequest.countDocuments({ status: 'Pending' });

    // Revenue
    const payments = await Payment.find({ status: { $in: ['Completed', 'Paid'] } }).select('amount');
    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Renewals Count
    const renewedMembers = await User.aggregate([
      { $match: { role: 'Gym Member' } },
      { $unwind: '$membershipHistory' },
      { $match: { 'membershipHistory.actionType': 'Renewal' } },
      { $count: 'renewals' },
    ]);
    const renewalsCount = renewedMembers[0]?.renewals || 0;

    res.status(200).json({
      success: true,
      data: {
        totalMembers,
        active,
        expiringSoon,
        expired,
        frozen,
        suspended,
        pending,
        pendingRequests,
        totalRevenue,
        renewalsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Membership Requests (Freeze / Cancel)
// @route   GET /api/memberships/admin/requests
// @access  Private (Admin, Super Admin)
exports.getMembershipRequests = async (req, res, next) => {
  try {
    const { status = 'All', type = 'All', club, search } = req.query;

    let filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }

    // Role-based club authorization: Club managers are filtered to their club; Super Admin can view all
    if (req.user.role === 'Admin' && req.user.assignedClub) {
      filter.club = req.user.assignedClub;
    } else if (club && club !== 'All') {
      filter.clubName = { $regex: club, $options: 'i' };
    }

    let freezeItems = [];
    if (type === 'All' || type === 'Freeze') {
      let fQuery = { ...filter };
      if (search && search.trim()) {
        const sRegex = new RegExp(search.trim(), 'i');
        fQuery.$or = [
          { memberName: sRegex },
          { memberEmail: sRegex },
          { memberId: sRegex },
          { requestId: sRegex },
        ];
      }
      const rawFreezes = await MembershipFreezeRequest.find(fQuery)
        .populate('member', 'name email phone memberId avatar')
        .populate('club', 'name location')
        .sort({ createdAt: -1 });

      freezeItems = rawFreezes.map((f) => ({
        _id: f._id,
        requestId: f.requestId,
        userId: f.member?._id || f.member,
        userName: f.memberName || f.member?.name,
        userEmail: f.memberEmail || f.member?.email,
        memberId: f.memberId || f.member?.memberId,
        membershipName: f.membership?.planName || 'Residency Plan',
        clubName: f.clubName || f.club?.name || 'Mayfair Sanctuary',
        type: 'Freeze',
        requestedStartDate: f.requestedStartDate,
        requestedDuration: f.requestedDuration,
        approvedDuration: f.approvedDuration,
        scheduledStartDate: f.scheduledStartDate,
        scheduledEndDate: f.scheduledEndDate,
        actualStartDate: f.actualStartDate,
        actualEndDate: f.actualEndDate,
        resumedAt: f.resumedAt,
        reason: f.reason,
        additionalNotes: f.additionalNotes,
        supportingDocument: f.supportingDocument,
        status: f.status,
        adminRemarks: f.adminRemarks,
        rejectionReason: f.rejectionReason,
        reviewedBy: f.reviewedByName,
        reviewedAt: f.reviewedAt,
        originalExpiryDate: f.originalExpiryDate,
        extendedExpiryDate: f.extendedExpiryDate,
        createdAt: f.createdAt,
        history: f.history || [],
      }));
    }

    let cancelItems = [];
    if (type === 'All' || type === 'Cancellation') {
      let cQuery = { type: 'Cancellation' };
      if (status && status !== 'All') {
        cQuery.status = status;
      }
      if (search && search.trim()) {
        const sRegex = new RegExp(search.trim(), 'i');
        cQuery.$or = [
          { userName: sRegex },
          { userEmail: sRegex },
          { memberId: sRegex },
        ];
      }
      const rawCancels = await MembershipRequest.find(cQuery)
        .populate('user', 'name email phone memberId')
        .sort({ createdAt: -1 });

      cancelItems = rawCancels.map((c) => ({
        _id: c._id,
        requestId: `CAN-${c._id.toString().slice(-6).toUpperCase()}`,
        userId: c.user?._id || c.user,
        userName: c.userName || c.user?.name,
        userEmail: c.userEmail || c.user?.email,
        memberId: c.memberId || c.user?.memberId,
        membershipName: 'Residency Plan',
        clubName: 'Mayfair Sanctuary',
        type: 'Cancellation',
        reason: c.reason,
        status: c.status,
        refundAmount: c.refundAmount || 0,
        adminRemarks: c.adminNotes,
        rejectionReason: c.rejectionReason,
        reviewedBy: c.reviewedByName,
        reviewedAt: c.reviewedAt,
        createdAt: c.createdAt,
      }));
    }

    const combined = [...freezeItems, ...cancelItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      count: combined.length,
      data: combined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Membership Request (Freeze or Cancellation)
// @route   POST /api/memberships/admin/requests/:id/approve
// @access  Private (Admin, Super Admin)
exports.approveMembershipRequest = async (req, res, next) => {
  try {
    const {
      adminNotes,
      adminRemarks,
      refundAmount = 0,
      approvedDuration,
      freezeDays,
      scheduledStartDate,
    } = req.body;

    // Check if it exists in MembershipFreezeRequest
    let freezeReq = await MembershipFreezeRequest.findById(req.params.id);
    if (!freezeReq) {
      // Check if it's referenced by legacy MembershipRequest
      const legacy = await MembershipRequest.findById(req.params.id);
      if (legacy && legacy.type === 'Freeze') {
        freezeReq = await MembershipFreezeRequest.findOne({
          member: legacy.user,
          status: 'Pending',
        });
      }
    }

    if (freezeReq) {
      const result = await serviceApproveFreeze({
        requestId: freezeReq._id,
        adminUser: req.user,
        approvedDuration: Number(approvedDuration || freezeDays) || freezeReq.requestedDuration,
        scheduledStartDate,
        adminRemarks: adminRemarks || adminNotes,
      });

      return res.status(200).json({
        success: true,
        message: `Membership freeze request [${result.requestId}] approved successfully.`,
        data: result,
      });
    }

    // Otherwise handle Cancellation request
    const request = await MembershipRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Membership request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request has already been processed.' });
    }

    const member = await User.findById(request.user);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member dossier not found.' });
    }

    const previousState = { ...member.membership.toObject() };

    if (request.type === 'Cancellation') {
      member.membership.status = 'Cancelled';
      member.membership.cancellationDetails = {
        isCancelled: true,
        cancelledAt: new Date(),
        reason: request.reason,
        refundAmount: Number(refundAmount) || 0,
        cancelledBy: req.user._id,
      };

      member.membershipHistory.push({
        planName: member.membership.planName,
        billingCycle: member.membership.billingCycle,
        startDate: member.membership.startDate,
        endDate: member.membership.endDate,
        amount: Number(refundAmount) || 0,
        status: 'Cancelled',
        actionType: 'Cancellation',
        performedByName: req.user?.name || 'Executive Admin',
        notes: `Cancellation approved: ${request.reason}. Refund: ₹${refundAmount}`,
      });

      await member.save();

      await createAudit({
        admin: req.user,
        member,
        action: 'MEMBERSHIP_CANCEL',
        details: `Cancellation approved. Refund: ₹${refundAmount}. Reason: ${request.reason}`,
        previousValue: previousState,
        newValue: member.membership,
      });

      await Notification.create({
        recipient: member._id,
        recipientRole: 'Gym Member',
        type: 'MEMBERSHIP_EXPIRED',
        title: 'Membership Cancellation Confirmed',
        message: `Your residency cancellation has been processed.${refundAmount > 0 ? ` A refund of ₹${Number(refundAmount).toLocaleString('en-IN')} has been initiated.` : ''}`,
        actionUrl: '/membership',
        actionLabel: 'View Sanctuary Plans',
      });
    }

    request.status = 'Approved';
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    request.adminNotes = adminRemarks || adminNotes || '';
    request.refundAmount = Number(refundAmount) || 0;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Membership ${request.type.toLowerCase()} request successfully approved.`,
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reject Membership Request
// @route   POST /api/memberships/admin/requests/:id/reject
// @access  Private (Admin, Super Admin)
exports.rejectMembershipRequest = async (req, res, next) => {
  try {
    const { rejectionReason, adminRemarks, adminNotes } = req.body;
    const reasonText = (rejectionReason || adminRemarks || adminNotes || '').trim();

    if (!reasonText) {
      return res.status(400).json({ success: false, message: 'Please provide an official rejection reason.' });
    }

    let freezeReq = await MembershipFreezeRequest.findById(req.params.id);
    if (!freezeReq) {
      const legacy = await MembershipRequest.findById(req.params.id);
      if (legacy && legacy.type === 'Freeze') {
        freezeReq = await MembershipFreezeRequest.findOne({
          member: legacy.user,
          status: 'Pending',
        });
      }
    }

    if (freezeReq) {
      const result = await serviceRejectFreeze({
        requestId: freezeReq._id,
        adminUser: req.user,
        rejectionReason: reasonText,
        adminRemarks: adminRemarks || adminNotes,
      });

      return res.status(200).json({
        success: true,
        message: `Membership freeze request [${result.requestId}] has been rejected.`,
        data: result,
      });
    }

    const request = await MembershipRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Membership request not found.' });
    }

    request.status = 'Rejected';
    request.rejectionReason = reasonText;
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Membership request successfully rejected.`,
      data: request,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Modify Approved Freeze Duration or Parameters (Admin)
// @route   POST /api/memberships/admin/freeze-requests/:id/modify
// @access  Private (Admin, Super Admin)
exports.modifyFreezeRequestAdmin = async (req, res, next) => {
  try {
    const { approvedDuration, scheduledStartDate, adminRemarks } = req.body;
    const freezeReq = await MembershipFreezeRequest.findById(req.params.id);
    if (!freezeReq) {
      return res.status(404).json({ success: false, message: 'Freeze request not found.' });
    }

    if (approvedDuration) {
      const dur = Number(approvedDuration);
      if (dur < DEFAULT_POLICY.MIN_DAYS || dur > DEFAULT_POLICY.MAX_DAYS_PER_REQUEST) {
        return res.status(400).json({
          success: false,
          message: `Duration must be between ${DEFAULT_POLICY.MIN_DAYS} and ${DEFAULT_POLICY.MAX_DAYS_PER_REQUEST} days.`,
        });
      }
      freezeReq.approvedDuration = dur;
      if (freezeReq.scheduledStartDate) {
        freezeReq.scheduledEndDate = new Date(
          new Date(freezeReq.scheduledStartDate).getTime() + dur * 24 * 60 * 60 * 1000
        );
      }
    }

    if (scheduledStartDate) {
      const start = new Date(scheduledStartDate);
      freezeReq.scheduledStartDate = start;
      const dur = freezeReq.approvedDuration || 14;
      freezeReq.scheduledEndDate = new Date(start.getTime() + dur * 24 * 60 * 60 * 1000);
    }

    if (adminRemarks) freezeReq.adminRemarks = adminRemarks;

    freezeReq.history.push({
      status: freezeReq.status,
      changedAt: new Date(),
      changedBy: req.user._id,
      changedByName: req.user.name,
      note: `Concierge modified parameters: Duration ${freezeReq.approvedDuration}d.`,
    });

    await freezeReq.save();
    res.status(200).json({
      success: true,
      message: `Freeze request [${freezeReq.requestId}] updated successfully.`,
      data: freezeReq,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Unfreeze Active Freeze Request Ahead of Schedule (Admin)
// @route   POST /api/memberships/admin/freeze-requests/:id/unfreeze-now
// @access  Private (Admin, Super Admin)
exports.unfreezeActiveRequestAdmin = async (req, res, next) => {
  try {
    const freezeReq = await MembershipFreezeRequest.findById(req.params.id);
    if (!freezeReq) {
      return res.status(404).json({ success: false, message: 'Freeze request not found.' });
    }

    if (freezeReq.status !== 'Frozen') {
      return res.status(400).json({
        success: false,
        message: `Only currently frozen requests can be unfreezed early. Current status is ${freezeReq.status}.`,
      });
    }

    await serviceResumeFreeze(freezeReq, null, req.user);
    res.status(200).json({
      success: true,
      message: `Membership residency has been resumed successfully ahead of schedule.`,
      data: freezeReq,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Extend Membership Validity (Admin Goodwill / Compensation)
// @route   POST /api/memberships/admin/:userId/extend
// @access  Private (Admin, Super Admin)
exports.extendMembership = async (req, res, next) => {
  try {
    const { days = 30, reason = 'Executive courtesy extension' } = req.body;
    const member = await User.findById(req.params.userId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const previousEnd = member.membership?.endDate ? new Date(member.membership.endDate) : new Date();
    const newEnd = new Date(previousEnd.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    const previousState = { ...member.membership.toObject() };
    member.membership.endDate = newEnd;

    // If was expired or expiring soon, verify if now active
    if (newEnd > new Date()) {
      member.membership.status = 'Active';
    }

    member.membershipHistory.push({
      planName: member.membership.planName || 'Extended Residency',
      billingCycle: member.membership.billingCycle || 'monthly',
      startDate: member.membership.startDate || new Date(),
      endDate: newEnd,
      amount: 0,
      status: 'Active',
      actionType: 'Extension',
      performedByName: req.user?.name || 'Executive Admin',
      notes: `Residency extended by ${days} days. Reason: ${reason}`,
    });

    await member.save();

    await createAudit({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_EXTEND',
      details: `Extended membership by ${days} days until ${newEnd.toISOString().split('T')[0]}. Reason: ${reason}`,
      previousValue: previousState,
      newValue: member.membership,
    });

    await Notification.create({
      recipient: member._id,
      recipientRole: 'Gym Member',
      type: 'CUSTOM',
      title: 'Residency Courtesy Extension',
      message: `Your QNOX GYM residency has been extended by ${days} days as an executive courtesy. New expiry date: ${newEnd.toLocaleDateString('en-GB')}.`,
      actionUrl: '/membership',
      actionLabel: 'View Dossier',
    });

    res.status(200).json({
      success: true,
      message: `Membership validity extended by ${days} days until ${newEnd.toLocaleDateString('en-GB')}.`,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend Membership (Disciplinary or Non-Compliance)
// @route   POST /api/memberships/admin/:userId/suspend
// @access  Private (Admin, Super Admin)
exports.suspendMembership = async (req, res, next) => {
  try {
    const { reason = 'Disciplinary review or facility rule breach' } = req.body;
    const member = await User.findById(req.params.userId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const previousState = { ...member.membership.toObject() };

    member.membership.status = 'Suspended';
    member.membership.suspensionDetails = {
      isSuspended: true,
      suspendedAt: new Date(),
      reason,
      suspendedBy: req.user._id,
    };

    member.membershipHistory.push({
      planName: member.membership.planName || 'Residency',
      billingCycle: member.membership.billingCycle || 'monthly',
      startDate: member.membership.startDate,
      endDate: member.membership.endDate,
      amount: 0,
      status: 'Suspended',
      actionType: 'Admin Override',
      performedByName: req.user?.name || 'Executive Admin',
      notes: `Residency suspended: ${reason}`,
    });

    await member.save();

    await createAudit({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_SUSPEND',
      details: `Suspended membership. Reason: ${reason}`,
      previousValue: previousState,
      newValue: member.membership,
    });

    await Notification.create({
      recipient: member._id,
      recipientRole: 'Gym Member',
      type: 'CUSTOM',
      title: 'Residency Privileges Suspended',
      message: `Your sanctuary residency has been suspended. Reason: ${reason}. Please schedule a meeting with club management.`,
      actionUrl: '/membership',
      actionLabel: 'View Status',
    });

    res.status(200).json({
      success: true,
      message: 'Member residency privileges have been suspended.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reactivate Suspended Membership
// @route   POST /api/memberships/admin/:userId/reactivate
// @access  Private (Admin, Super Admin)
exports.reactivateMembership = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.userId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (member.membership?.status !== 'Suspended') {
      return res.status(400).json({ success: false, message: 'Membership is not currently suspended.' });
    }

    const previousState = { ...member.membership.toObject() };

    const now = new Date();
    const isStillValid = member.membership?.endDate && new Date(member.membership.endDate) > now;
    const newStatus = isStillValid ? 'Active' : 'Expired';

    member.membership.status = newStatus;
    member.membership.suspensionDetails = {
      isSuspended: false,
      suspendedAt: null,
      reason: '',
      suspendedBy: null,
    };

    member.membershipHistory.push({
      planName: member.membership.planName,
      billingCycle: member.membership.billingCycle,
      startDate: member.membership.startDate,
      endDate: member.membership.endDate,
      amount: 0,
      status: newStatus,
      actionType: 'Admin Override',
      performedByName: req.user?.name || 'Executive Admin',
      notes: 'Residency reactivated following management review.',
    });

    await member.save();

    await createAudit({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_REACTIVATE',
      details: `Reactivated membership to status: ${newStatus}`,
      previousValue: previousState,
      newValue: member.membership,
    });

    await Notification.create({
      recipient: member._id,
      recipientRole: 'Gym Member',
      type: 'CUSTOM',
      title: 'Residency Privileges Restored',
      message: 'Your sanctuary membership privileges have been fully restored. Welcome back to QNOX GYM.',
      actionUrl: '/membership',
      actionLabel: 'View Dossier',
    });

    res.status(200).json({
      success: true,
      message: `Membership privileges restored to ${newStatus}.`,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send Renewal Reminder Manually (1-Click Admin)
// @route   POST /api/memberships/admin/:userId/send-reminder
// @access  Private (Admin, Super Admin)
exports.sendRenewalReminderAdmin = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.userId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const planName = member.membership?.planName || 'THE METROPOLITAN';
    const expiryStr = member.membership?.endDate
      ? new Date(member.membership.endDate).toLocaleDateString('en-GB')
      : 'Shortly';

    const notif = await Notification.create({
      recipient: member._id,
      recipientRole: 'Gym Member',
      customerId: member._id,
      customerName: member.name,
      customerEmail: member.email,
      customerPhone: member.phone || '',
      membershipPlan: planName,
      membershipStartDate: member.membership?.startDate,
      membershipEndDate: member.membership?.endDate,
      type: 'EXPIRY_REMINDER_3D',
      stage: '3_DAYS_BEFORE',
      title: 'Membership Renewal Reminder',
      message: `Dear ${member.name}, your ${planName} residency is scheduled to expire on ${expiryStr}. Renew now to maintain uninterrupted access to our luxury London sanctuaries.`,
      actionUrl: '/membership',
      actionLabel: 'Renew Membership',
    });

    // Send personalized email safely without blocking
    try {
      if (typeof sendEmail === 'function') {
        sendEmail({
          to: member.email,
          subject: `QNOX GYM // Action Required: Renew Your ${planName} Residency`,
          html: `
            <div style="background-color: #050505; color: #ffffff; padding: 40px; font-family: sans-serif;">
              <h2 style="color: #c5a880; font-family: serif; letter-spacing: 2px;">QNOX GYM</h2>
              <p>Dear ${member.name},</p>
              <p>Your sanctuary residency (<strong>${planName}</strong>) is due for renewal on <strong>${expiryStr}</strong>.</p>
              <p>Renew today to ensure seamless biometric access, priority booking, and full access to slate pools, altitude suites, and private trainers.</p>
              <div style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://qnox.vercel.app'}/membership" style="background-color: #c5a880; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: inline-block;">RENEW MEMBERSHIP</a>
              </div>
            </div>
          `,
        }).catch((e) => console.log('[Reminder Email Warning]:', e.message));
      }
    } catch (emailErr) {
      console.warn('[Reminder Email Non-blocking]:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Personalized renewal reminder dispatched to ${member.name} (${member.email}).`,
      data: notif,
    });
  } catch (error) {
    next(error);
  }
};
