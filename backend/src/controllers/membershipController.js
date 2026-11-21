const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const MembershipRequest = require('../models/MembershipRequest');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

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

    // Check for active or pending requests
    const pendingRequest = await MembershipRequest.findOne({
      user: req.user._id,
      status: 'Pending',
    }).sort({ createdAt: -1 });

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
        membershipHistory: user.membershipHistory || [],
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
    const { startDate, endDate, freezeDays = 30, reason } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (user.membership?.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Only active memberships are eligible for freeze privileges.',
      });
    }

    // Check if pending request already exists
    const existing = await MembershipRequest.findOne({
      user: user._id,
      type: 'Freeze',
      status: 'Pending',
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A membership freeze request is already pending concierge review.',
      });
    }

    const calculatedStart = startDate ? new Date(startDate) : new Date();
    const calculatedDays = Number(freezeDays) || 30;
    const calculatedEnd = endDate
      ? new Date(endDate)
      : new Date(calculatedStart.getTime() + calculatedDays * 24 * 60 * 60 * 1000);

    const request = await MembershipRequest.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      memberId: user.memberId || '',
      type: 'Freeze',
      reason: reason || 'Personal / Travel Leave',
      freezeStartDate: calculatedStart,
      freezeEndDate: calculatedEnd,
      freezeDays: calculatedDays,
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
      type: 'MEMBERSHIP_EXPIRING_SOON', // Reusing notification system
      title: 'Membership Freeze Requested',
      message: `${user.name} (${user.memberId || user.email}) has requested a ${calculatedDays}-day membership freeze. Reason: ${reason || 'Personal leave'}.`,
      actionUrl: '/admin?tab=requests',
      actionLabel: 'Review Request',
      data: { requestId: request._id, type: 'Freeze' },
    }));

    if (adminNotifs.length > 0) {
      await Notification.insertMany(adminNotifs);
    }

    res.status(201).json({
      success: true,
      message: 'Your membership freeze request has been submitted for Executive review.',
      data: request,
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
    const { status = 'All', type = 'All' } = req.query;
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (type && type !== 'All') query.type = type;

    const requests = await MembershipRequest.find(query)
      .populate('user', 'name email phone memberId membership')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
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
    const { adminNotes, refundAmount = 0 } = req.body;
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

    if (request.type === 'Freeze') {
      const now = new Date();
      const currentEnd = new Date(member.membership.endDate);
      const remainingMs = Math.max(0, currentEnd.getTime() - now.getTime());
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

      member.membership.status = 'Frozen';
      member.membership.isFrozen = true;
      member.membership.freezeDetails = {
        startDate: request.freezeStartDate || now,
        endDate: request.freezeEndDate || new Date(now.getTime() + (request.freezeDays || 30) * 24 * 60 * 60 * 1000),
        reason: request.reason,
        remainingDaysAtFreeze: remainingDays,
        frozenBy: req.user._id,
      };

      member.freezeHistory.push({
        startDate: request.freezeStartDate || now,
        endDate: request.freezeEndDate,
        reason: request.reason,
        daysFrozen: 0,
        performedByName: req.user?.name || 'Executive Admin',
      });

      member.membershipHistory.push({
        planName: member.membership.planName,
        billingCycle: member.membership.billingCycle,
        startDate: member.membership.startDate,
        endDate: member.membership.endDate,
        amount: 0,
        status: 'Frozen',
        actionType: 'Freeze',
        performedByName: req.user?.name || 'Executive Admin',
        notes: `Freeze request approved: ${request.reason} (${remainingDays} days retained)`,
      });

      await member.save();

      // Log Audit
      await createAudit({
        admin: req.user,
        member,
        action: 'MEMBERSHIP_FREEZE',
        details: `Freeze request approved. Retained ${remainingDays} days.`,
        previousValue: previousState,
        newValue: member.membership,
      });

      // Dispatch Member Notification
      await Notification.create({
        recipient: member._id,
        recipientRole: 'Gym Member',
        type: 'CUSTOM',
        title: 'Membership Freeze Approved',
        message: `Your request to pause your residency for ${request.freezeDays || 30} days has been approved. Your remaining ${remainingDays} days remain protected.`,
        actionUrl: '/membership',
        actionLabel: 'View Residency Dossier',
      });

      // Send Email
      sendEmail({
        to: member.email,
        subject: 'QNOX GYM // Membership Freeze Approved',
        html: `<p>Dear ${member.name},</p><p>Your request to freeze your membership residency has been approved. Your remaining days are protected until your planned return.</p>`,
      }).catch((e) => console.log('[Freeze Email Error]:', e.message));

    } else if (request.type === 'Cancellation') {
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
    request.adminNotes = adminNotes || '';
    request.refundAmount = Number(refundAmount) || 0;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Membership ${request.type.toLowerCase()} request successfully approved.`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject Membership Request
// @route   POST /api/memberships/admin/requests/:id/reject
// @access  Private (Admin, Super Admin)
exports.rejectMembershipRequest = async (req, res, next) => {
  try {
    const { rejectionReason = 'Policy non-compliance or minimum tenure not reached' } = req.body;
    const request = await MembershipRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Membership request not found.' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request has already been processed.' });
    }

    request.status = 'Rejected';
    request.rejectionReason = rejectionReason;
    request.reviewedBy = req.user._id;
    request.reviewedByName = req.user.name;
    request.reviewedAt = new Date();
    await request.save();

    // Notify member
    await Notification.create({
      recipient: request.user,
      recipientRole: 'Gym Member',
      type: 'CUSTOM',
      title: `Membership ${request.type} Request Update`,
      message: `Your ${request.type.toLowerCase()} request could not be approved at this time. Reason: ${rejectionReason}. Please contact executive concierge.`,
      actionUrl: '/membership',
      actionLabel: 'Contact Concierge',
    });

    res.status(200).json({
      success: true,
      message: `Membership ${request.type.toLowerCase()} request has been rejected.`,
      data: request,
    });
  } catch (error) {
    next(error);
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
