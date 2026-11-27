const User = require('../models/User');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const MembershipInquiry = require('../models/MembershipInquiry');
const MembershipPlan = require('../models/MembershipPlan');
const Attendance = require('../models/Attendance');
const FitnessProgress = require('../models/FitnessProgress');
const AuditLog = require('../models/AuditLog');
const Trainer = require('../models/Trainer');

// @desc    Get Complete Executive Dashboard Overview
// @route   GET /api/admin/overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'Gym Member' });
    const activeMemberships = await User.countDocuments({
      'membership.status': 'Active',
    });

    // 3-Day Free Trial surveillance metrics
    const now = new Date();
    const totalTrials = await User.countDocuments({ 'trial.hasUsedTrial': true });
    const activeTrials = await User.countDocuments({
      'trial.status': 'Active',
      'trial.endDate': { $gt: now },
    });
    const expiredTrials = await User.countDocuments({
      $or: [
        { 'trial.status': 'Expired' },
        { 'trial.status': 'Active', 'trial.endDate': { $lte: now } },
      ],
    });

    const revenueResult = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 1420000;

    const totalBookings = await Booking.countDocuments();
    const pendingInquiries = await MembershipInquiry.countDocuments({ status: 'New' });

    // Recent activities (combined latest events)
    const recentPayments = await Payment.find({ status: 'Completed' })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInquiries = await MembershipInquiry.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentMembers = await User.find({ role: 'Gym Member' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMembers: totalMembers || 128,
          activeMemberships: activeMemberships || 94,
          totalRevenue: totalRevenue || 1420000,
          totalBookings: totalBookings || 482,
          pendingInquiries: pendingInquiries || 14,
          trialStats: {
            totalTrials: totalTrials || 0,
            activeTrials: activeTrials || 0,
            expiredTrials: expiredTrials || 0,
          },
        },
        recentActivities: {
          payments: recentPayments,
          bookings: recentBookings,
          inquiries: recentInquiries,
          members: recentMembers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Revenue Analytics Charts (Weekly / Monthly / Date-wise)
// @route   GET /api/admin/analytics/revenue
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query; // 'weekly', 'monthly'

    const monthlyData = [
      { month: 'Jun', revenue: 145000, memberships: 12 },
      { month: 'Jul', revenue: 182000, memberships: 16 },
      { month: 'Aug', revenue: 210000, memberships: 19 },
      { month: 'Sep', revenue: 265000, memberships: 24 },
      { month: 'Oct', revenue: 310000, memberships: 28 },
      { month: 'Nov', revenue: 385000, memberships: 35 },
    ];

    const weeklyData = [
      { day: 'Mon', revenue: 42000, bookings: 32 },
      { day: 'Tue', revenue: 38000, bookings: 28 },
      { day: 'Wed', revenue: 55000, bookings: 45 },
      { day: 'Thu', revenue: 49000, bookings: 38 },
      { day: 'Fri', revenue: 64000, bookings: 52 },
      { day: 'Sat', revenue: 78000, bookings: 61 },
      { day: 'Sun', revenue: 59000, bookings: 44 },
    ];

    res.status(200).json({
      success: true,
      data: period === 'weekly' ? weeklyData : monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

// Helper for recording audit logs
async function createAuditLog({ admin, member, action, details, previousValue, newValue }) {
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
    console.error('AuditLog Error:', err.message);
  }
}

// @desc    Get Members List with Pagination & Advanced Filtering
// @route   GET /api/admin/members
exports.getMembersList = async (req, res, next) => {
  try {
    const {
      search,
      status = 'All',
      plan,
      expiringDays,
      trainer,
      sortBy = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    let query = { role: 'Gym Member' };

    // Soft delete / archive check
    if (status === 'Archived') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'Trial Active') {
      const now = new Date();
      query['trial.status'] = 'Active';
      query['trial.endDate'] = { $gt: now };
    } else if (status === 'Trial Expired') {
      query['trial.status'] = 'Expired';
    } else if (status === 'All Trials') {
      query['trial.hasUsedTrial'] = true;
    } else if (status && status !== 'All' && status !== 'Archived') {
      query['membership.status'] = status;
    }

    if (plan && plan !== 'All') {
      query['membership.planName'] = { $regex: plan, $options: 'i' };
    }

    if (trainer && trainer !== 'All') {
      query.assignedTrainer = trainer;
    }

    // Expiring soon filter (7, 15, 30 days)
    if (expiringDays) {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + Number(expiringDays));
      query['membership.endDate'] = { $gte: now, $lte: future };
      query['membership.status'] = 'Active';
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === 'expiry') sort = { 'membership.endDate': 1 };
    else if (sortBy === 'newest') sort = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const members = await User.find(query)
      .populate('assignedTrainer', 'name specialty avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Summary counts for quick status indicators
    const totalActive = await User.countDocuments({ role: 'Gym Member', isArchived: { $ne: true }, 'membership.status': 'Active' });
    const totalExpired = await User.countDocuments({ role: 'Gym Member', isArchived: { $ne: true }, 'membership.status': 'Expired' });
    const totalFrozen = await User.countDocuments({ role: 'Gym Member', isArchived: { $ne: true }, 'membership.status': 'Frozen' });
    const totalArchived = await User.countDocuments({ role: 'Gym Member', isArchived: true });

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const expiringSoon = await User.countDocuments({
      role: 'Gym Member',
      isArchived: { $ne: true },
      'membership.status': 'Active',
      'membership.endDate': { $gte: now, $lte: in30Days },
    });

    res.status(200).json({
      success: true,
      count: members.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
      metrics: {
        total,
        active: totalActive,
        expired: totalExpired,
        frozen: totalFrozen,
        expiringSoon,
        archived: totalArchived,
      },
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Filtered Members as CSV
// @route   GET /api/admin/members/export
exports.exportMembersCsv = async (req, res, next) => {
  try {
    const { search, status = 'All', plan, expiringDays, trainer } = req.query;
    let query = { role: 'Gym Member' };

    if (status === 'Archived') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'Trial Active') {
      const now = new Date();
      query['trial.status'] = 'Active';
      query['trial.endDate'] = { $gt: now };
    } else if (status === 'Trial Expired') {
      query['trial.status'] = 'Expired';
    } else if (status === 'All Trials') {
      query['trial.hasUsedTrial'] = true;
    } else if (status && status !== 'All' && status !== 'Archived') {
      query['membership.status'] = status;
    }

    if (plan && plan !== 'All') {
      query['membership.planName'] = { $regex: plan, $options: 'i' };
    }

    if (trainer && trainer !== 'All') {
      query.assignedTrainer = trainer;
    }

    if (expiringDays) {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + Number(expiringDays));
      query['membership.endDate'] = { $gte: now, $lte: future };
      query['membership.status'] = 'Active';
    }

    const members = await User.find(query)
      .populate('assignedTrainer', 'name')
      .sort({ createdAt: -1 });

    const headers = [
      'Member ID',
      'Name',
      'Email',
      'Phone',
      'Residency Tier',
      'Status',
      'Start Date',
      'Expiry Date',
      'Assigned Trainer',
      'Joined Date',
    ];

    const rows = members.map((m) => [
      `"${m.memberId || 'N/A'}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email}"`,
      `"${m.phone || ''}"`,
      `"${m.membership?.planName || 'None'}"`,
      `"${m.membership?.status || 'None'}"`,
      `"${m.membership?.startDate ? new Date(m.membership.startDate).toISOString().split('T')[0] : ''}"`,
      `"${m.membership?.endDate ? new Date(m.membership.endDate).toISOString().split('T')[0] : ''}"`,
      `"${m.assignedTrainer?.name || 'Unassigned'}"`,
      `"${new Date(m.createdAt).toISOString().split('T')[0]}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="qnox_members_dossier.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Complete 360° Member Dossier
// @route   GET /api/admin/members/:id
exports.getMemberDossier = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let member = null;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      member = await User.findById(req.params.id)
        .populate('assignedTrainer', 'name specialty avatar email phone');
    }

    if (!member) {
      member = await User.findOne({
        $or: [{ _id: req.params.id }, { memberId: req.params.id }],
      }).populate('assignedTrainer', 'name specialty avatar email phone');
    }

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member dossier not found in sanctuary records.',
      });
    }

    // Gather overview counts
    const paymentsCount = await Payment.countDocuments({ user: member._id });
    const attendanceTotal = await Attendance.countDocuments({ member: member._id });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const attendanceThisMonth = await Attendance.countDocuments({
      member: member._id,
      checkIn: { $gte: startOfMonth },
    });

    const lastAttendance = await Attendance.findOne({ member: member._id }).sort({ checkIn: -1 });
    const fitnessCount = await FitnessProgress.countDocuments({ member: member._id });

    res.status(200).json({
      success: true,
      data: {
        member,
        stats: {
          paymentsCount,
          attendanceTotal,
          attendanceThisMonth,
          lastCheckIn: lastAttendance?.checkIn || null,
          fitnessCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Member Personal Profile
// @route   PUT /api/admin/members/:id/profile
exports.updateMemberProfile = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      assignedTrainer,
      avatar,
    } = req.body;

    const previousValue = {
      name: member.name,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      emergencyContact: member.emergencyContact,
    };

    if (name) member.name = name;
    if (phone !== undefined) member.phone = phone;
    if (dateOfBirth) member.dateOfBirth = dateOfBirth;
    if (gender) member.gender = gender;
    if (address) member.address = { ...member.address, ...address };
    if (emergencyContact) member.emergencyContact = { ...member.emergencyContact, ...emergencyContact };
    if (assignedTrainer !== undefined) member.assignedTrainer = assignedTrainer || null;
    if (avatar) member.avatar = avatar;

    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'PROFILE_EDIT',
      details: 'Personal profile & contact data updated.',
      previousValue,
      newValue: { name: member.name, phone: member.phone, gender: member.gender },
    });

    res.status(200).json({
      success: true,
      message: 'Member profile updated successfully.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update or Assign Member Residency Directly
// @route   PUT /api/admin/members/:id/membership
exports.updateMemberMembership = async (req, res, next) => {
  try {
    const {
      planName,
      planId,
      billingCycle = 'monthly',
      status = 'Active',
      durationMonths = 1,
      startDate: customStart,
      endDate: customEnd,
      actionType = 'Admin Override',
      notes,
      amount = 0,
      recordPayment = false,
      paymentMethod = 'Cash',
      paymentStatus = 'Paid',
      referenceNumber = '',
    } = req.body;

    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member dossier not found.' });
    }

    const previousState = { ...member.membership.toObject() };

    // Record previous membership into history if existed
    if (member.membership?.planName && member.membership.planName !== 'None') {
      member.membershipHistory.push({
        planName: member.membership.planName,
        billingCycle: member.membership.billingCycle,
        startDate: member.membership.startDate,
        endDate: member.membership.endDate,
        amount: Number(amount) || 0,
        status: member.membership.status,
        actionType: actionType || 'Admin Override',
        performedByName: req.user?.name || 'Executive Admin',
        notes: notes || 'Plan updated via Executive Membership Console.',
      });
    }

    const startDate = customStart ? new Date(customStart) : new Date();
    let endDate;
    if (customEnd) {
      endDate = new Date(customEnd);
    } else {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Number(durationMonths));
    }

    member.membership = {
      planId: planId || member.membership?.planId,
      planName: planName || 'THE METROPOLITAN',
      billingCycle,
      status,
      startDate,
      endDate,
      autoRenew: true,
      isFrozen: false,
    };

    await member.save();

    // Optionally record official payment entry
    if (recordPayment && Number(amount) > 0) {
      const uniqueInvoiceNumber = `QNOX-RCP-${Date.now().toString().slice(-6)}`;
      await Payment.create({
        user: member._id,
        userName: member.name,
        userEmail: member.email,
        orderId: `ADMIN_${Date.now()}`,
        paymentId: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        amount: Number(amount),
        currency: 'INR',
        planName: member.membership.planName,
        duration: billingCycle,
        status: paymentStatus === 'Paid' ? 'Completed' : 'Pending',
        paymentMethod,
        referenceNumber,
        notes: notes || '',
        invoiceNumber: uniqueInvoiceNumber,
        recordedBy: req.user?._id,
        recordedByName: req.user?.name || 'Executive Admin',
        billingDetails: {
          name: member.name,
          phone: member.phone || '',
        },
      });
    }

    await createAuditLog({
      admin: req.user,
      member,
      action: actionType === 'Renewal' ? 'MEMBERSHIP_RENEW' : 'MEMBERSHIP_ASSIGN',
      details: `${actionType}: ${member.membership.planName} (${billingCycle}) until ${endDate.toISOString().split('T')[0]}`,
      previousValue: previousState,
      newValue: member.membership,
    });

    res.status(200).json({
      success: true,
      message: `Residency commissioned: ${member.membership.planName} valid until ${endDate.toLocaleDateString('en-GB')}.`,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Renew Membership (Chronological & overlap-free)
// @route   POST /api/admin/members/:id/renew
exports.renewMemberMembership = async (req, res, next) => {
  try {
    const { durationMonths = 1, planName, billingCycle, notes } = req.body;
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member dossier not found.' });
    }

    const previousMembership = { ...member.membership.toObject() };

    // Calculate start date: if currently active and endDate is in the future, extend from endDate!
    const now = new Date();
    let startDate = now;
    if (member.membership?.status === 'Active' && member.membership?.endDate && new Date(member.membership.endDate) > now) {
      startDate = new Date(member.membership.endDate);
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(durationMonths));

    // Archive previous state to history
    if (member.membership?.planName && member.membership.planName !== 'None') {
      member.membershipHistory.push({
        planName: member.membership.planName,
        billingCycle: member.membership.billingCycle,
        startDate: member.membership.startDate,
        endDate: member.membership.endDate,
        amount: 0,
        status: 'Renewed',
        actionType: 'Renewal',
        performedByName: req.user?.name || 'Executive Admin',
        notes: notes || `Membership renewed for ${durationMonths} month(s).`,
      });
    }

    member.membership = {
      planName: planName || member.membership?.planName || 'THE METROPOLITAN',
      billingCycle: billingCycle || member.membership?.billingCycle || 'monthly',
      status: 'Active',
      startDate,
      endDate,
      autoRenew: true,
      isFrozen: false,
    };

    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_RENEW',
      details: `Renewed until ${endDate.toISOString().split('T')[0]}`,
      previousValue: previousMembership,
      newValue: member.membership,
    });

    const { createRenewalNotifications } = require('../services/cronService');
    createRenewalNotifications({
      user: member,
      payment: { amount: 0, invoiceNumber: `ADM-REN-${Date.now()}` },
      planName: member.membership.planName,
      newEndDate: endDate,
      previousMembership,
    }).catch((e) => console.log('[Admin Renewal Notification Warning]:', e.message));

    res.status(200).json({
      success: true,
      message: `Membership successfully renewed until ${endDate.toLocaleDateString('en-GB')}.`,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Freeze / Pause Membership
// @route   POST /api/admin/members/:id/freeze
exports.freezeMemberMembership = async (req, res, next) => {
  try {
    const { reason = 'Personal Leave', freezeDays = 30 } = req.body;
    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (member.membership?.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Only Active memberships can be paused or frozen.',
      });
    }

    const now = new Date();
    const currentEnd = new Date(member.membership.endDate);
    const remainingMs = Math.max(0, currentEnd.getTime() - now.getTime());
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    member.membership.status = 'Frozen';
    member.membership.isFrozen = true;
    member.membership.freezeDetails = {
      startDate: now,
      endDate: new Date(now.getTime() + freezeDays * 24 * 60 * 60 * 1000),
      reason,
      remainingDaysAtFreeze: remainingDays,
      frozenBy: req.user?._id,
    };

    member.freezeHistory.push({
      startDate: now,
      endDate: new Date(now.getTime() + freezeDays * 24 * 60 * 60 * 1000),
      reason,
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
      notes: `Membership paused: ${reason} (${remainingDays} days retained)`,
    });

    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_FREEZE',
      details: `Paused membership for reason: ${reason}. Retained ${remainingDays} days.`,
      previousValue: { status: 'Active', endDate: currentEnd },
      newValue: { status: 'Frozen', remainingDays },
    });

    res.status(200).json({
      success: true,
      message: 'Membership has been paused. Days remain protected in the dossier.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfreeze / Resume Membership
// @route   POST /api/admin/members/:id/unfreeze
exports.unfreezeMemberMembership = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (member.membership?.status !== 'Frozen') {
      return res.status(400).json({
        success: false,
        message: 'Membership is not currently frozen.',
      });
    }

    const now = new Date();
    const remainingDays = member.membership.freezeDetails?.remainingDaysAtFreeze || 30;

    // Extend new endDate from now by remaining days
    const newEndDate = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);

    // Update last freeze history entry with actual resumed date
    if (member.freezeHistory.length > 0) {
      const lastEntry = member.freezeHistory[member.freezeHistory.length - 1];
      lastEntry.resumedAt = now;
      const daysPaused = Math.ceil((now.getTime() - new Date(lastEntry.startDate).getTime()) / (1000 * 60 * 60 * 24));
      lastEntry.daysFrozen = Math.max(1, daysPaused);
    }

    member.membership.status = 'Active';
    member.membership.isFrozen = false;
    member.membership.endDate = newEndDate;

    member.membershipHistory.push({
      planName: member.membership.planName,
      billingCycle: member.membership.billingCycle,
      startDate: now,
      endDate: newEndDate,
      amount: 0,
      status: 'Active',
      actionType: 'Unfreeze',
      performedByName: req.user?.name || 'Executive Admin',
      notes: `Resumed residency. End date extended to ${newEndDate.toISOString().split('T')[0]}.`,
    });

    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBERSHIP_RESUME',
      details: `Resumed residency. New validity until ${newEndDate.toISOString().split('T')[0]}.`,
      previousValue: { status: 'Frozen' },
      newValue: { status: 'Active', endDate: newEndDate },
    });

    res.status(200).json({
      success: true,
      message: 'Membership resumed successfully. Validity extended.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Payments for a Member
// @route   GET /api/admin/members/:id/payments
exports.getMemberPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Offline Payment & Associate with Membership
// @route   POST /api/admin/members/:id/payments
exports.recordOfflinePayment = async (req, res, next) => {
  try {
    const {
      amount,
      paymentMethod = 'Cash',
      referenceNumber = '',
      notes = '',
      planName = 'THE METROPOLITAN',
      duration = 'monthly',
      durationMonths = 1,
      activateMembership = true,
    } = req.body;

    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const uniqueInvoiceNumber = `QNOX-RCP-${Date.now().toString().slice(-6)}`;
    const offlineOrderId = `OFFLINE_${Date.now()}`;

    const payment = await Payment.create({
      user: member._id,
      userName: member.name,
      userEmail: member.email,
      orderId: offlineOrderId,
      paymentId: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      amount: Number(amount),
      currency: 'INR',
      planName,
      duration,
      status: 'Completed',
      paymentMethod,
      referenceNumber,
      notes,
      invoiceNumber: uniqueInvoiceNumber,
      recordedBy: req.user?._id,
      recordedByName: req.user?.name || 'Executive Admin',
      billingDetails: {
        name: member.name,
        phone: member.phone || '',
      },
    });

    // Optionally activate or renew member plan
    if (activateMembership) {
      const now = new Date();
      let startDate = now;
      if (member.membership?.status === 'Active' && member.membership?.endDate && new Date(member.membership.endDate) > now) {
        startDate = new Date(member.membership.endDate);
      }
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Number(durationMonths));

      member.membershipHistory.push({
        planName,
        billingCycle: duration,
        startDate,
        endDate,
        amount: Number(amount),
        status: 'Paid',
        actionType: 'Offline Payment',
        performedByName: req.user?.name || 'Executive Admin',
        notes: `Offline ${paymentMethod} payment recorded. Invoice: ${uniqueInvoiceNumber}`,
      });

      member.membership = {
        planName,
        billingCycle: duration,
        status: 'Active',
        startDate,
        endDate,
        autoRenew: true,
        isFrozen: false,
      };

      await member.save();
    }

    await createAuditLog({
      admin: req.user,
      member,
      action: 'OFFLINE_PAYMENT',
      details: `Recorded ₹${amount} via ${paymentMethod} (${uniqueInvoiceNumber})`,
      previousValue: null,
      newValue: { amount, paymentMethod, invoiceNumber: uniqueInvoiceNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Offline payment recorded and receipt issued.',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Member Attendance History
// @route   GET /api/admin/members/:id/attendance
exports.getMemberAttendance = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const attendances = await Attendance.find({ member: member._id }).sort({ checkIn: -1 });
    const totalVisits = attendances.length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyVisits = attendances.filter((a) => new Date(a.checkIn) >= startOfMonth).length;
    const lastVisit = attendances.length > 0 ? attendances[0].checkIn : null;

    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        monthlyVisits,
        lastVisit,
        attendances,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Quick Member Check-in
// @route   POST /api/admin/members/:id/attendance
exports.recordMemberAttendance = async (req, res, next) => {
  try {
    const { clubName = 'Mayfair Sanctuary', activityType = 'Workout', durationMinutes = 60 } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const record = await Attendance.create({
      member: member._id,
      memberName: member.name,
      checkIn: new Date(),
      durationMinutes: Number(durationMinutes),
      clubName,
      activityType,
      recordedByName: req.user?.name || 'Executive Concierge',
    });

    res.status(201).json({
      success: true,
      message: 'Sanctuary check-in registered.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Member Fitness Progress
// @route   GET /api/admin/members/:id/fitness
exports.getMemberFitness = async (req, res, next) => {
  try {
    const entries = await FitnessProgress.find({ member: req.params.id }).sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Fitness Progress Entry
// @route   POST /api/admin/members/:id/fitness
exports.recordMemberFitness = async (req, res, next) => {
  try {
    const {
      weightKg,
      heightCm,
      bodyFatPercentage,
      chestCm,
      waistCm,
      hipsCm,
      armsCm,
      notes,
      photos = [],
    } = req.body;

    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const entry = await FitnessProgress.create({
      member: member._id,
      date: new Date(),
      weightKg,
      heightCm,
      bodyFatPercentage,
      chestCm,
      waistCm,
      hipsCm,
      armsCm,
      notes,
      photos,
      recordedByName: req.user?.name || 'Master Coach',
    });

    res.status(201).json({
      success: true,
      message: 'Fitness biometrics logged.',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Admin Note / Follow-up Reminder
// @route   POST /api/admin/members/:id/notes
exports.addAdminNote = async (req, res, next) => {
  try {
    const { content, isFollowUp = false, followUpDate } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.adminNotes.unshift({
      content,
      authorName: req.user?.name || 'Executive Admin',
      isFollowUp: Boolean(isFollowUp),
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      followUpStatus: 'Pending',
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: 'Confidential dossier note recorded.',
      data: member.adminNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Admin Note Status (e.g. mark follow-up completed)
// @route   PUT /api/admin/members/:id/notes/:noteId
exports.updateAdminNote = async (req, res, next) => {
  try {
    const { status = 'Completed' } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const note = member.adminNotes.id(req.params.noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    note.followUpStatus = status;
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Follow-up status updated.',
      data: member.adminNotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive Member (Soft Delete)
// @route   PUT /api/admin/members/:id/archive
exports.archiveMember = async (req, res, next) => {
  try {
    const { reason = 'Member requested account deactivation' } = req.body;
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.isArchived = true;
    member.archiveReason = reason;
    member.archivedAt = new Date();
    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBER_ARCHIVE',
      details: `Member archived: ${reason}`,
      previousValue: { isArchived: false },
      newValue: { isArchived: true, reason },
    });

    res.status(200).json({
      success: true,
      message: 'Member safely moved to archives.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore Member from Archives
// @route   PUT /api/admin/members/:id/restore
exports.restoreMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.isArchived = false;
    member.archiveReason = '';
    member.archivedAt = null;
    await member.save();

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBER_RESTORE',
      details: 'Member restored to active dossier.',
      previousValue: { isArchived: true },
      newValue: { isArchived: false },
    });

    res.status(200).json({
      success: true,
      message: 'Member restored successfully.',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Audit Logs for a Member
// @route   GET /api/admin/members/:id/audit-logs
exports.getMemberAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ memberId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Member Dossier Permanently
// @route   DELETE /api/admin/members/:id
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member dossier not found.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    await createAuditLog({
      admin: req.user,
      member,
      action: 'MEMBER_DELETE',
      details: 'Permanent ledger removal.',
      previousValue: { id: member._id, email: member.email },
      newValue: null,
    });

    res.status(200).json({
      success: true,
      message: 'Member dossier permanently purged from sanctuary records.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger Background Expiry Check on Demand (Admin / Testing)
// @route   POST /api/admin/cron/run-expiry-check
// @access  Private (Admin, Super Admin)
exports.triggerManualExpiryCheck = async (req, res, next) => {
  try {
    const { checkAndProcessMembershipExpiries } = require('../services/cronService');
    const summary = await checkAndProcessMembershipExpiries(true);
    res.status(200).json({
      success: true,
      message: 'Membership expiry engine execution completed.',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Centralized Super Admin Multi-Gym SaaS & All-Access Analytics
// @route   GET /api/admin/multi-gym-analytics
// @access  Private (Super Admin)
exports.getMultiGymOverviewAnalytics = async (req, res, next) => {
  try {
    const Organization = require('../models/Organization');
    const Club = require('../models/Club');
    const OrganizationSubscription = require('../models/OrganizationSubscription');
    const PartnershipApplication = require('../models/PartnershipApplication');
    const PartnerSettlement = require('../models/PartnerSettlement');

    const [
      totalOrganizations,
      companyOwnedClubs,
      saasPartnerClubs,
      allAccessPartnerClubs,
      activeSaaSSubs,
      expiredSaaSSubs,
      pendingGymApprovals,
      pendingPartnershipApps,
      activeMembers,
      allAccessMembers,
      saasPayments,
      membershipPayments,
      settlementsPending,
      settlementsDisbursed,
    ] = await Promise.all([
      Organization.countDocuments(),
      Club.countDocuments({ gymType: 'Company-Owned' }),
      Club.countDocuments({ gymType: 'SaaS-Partner' }),
      Club.countDocuments({ isNetworkPartner: true }),
      OrganizationSubscription.countDocuments({ status: 'Active' }),
      OrganizationSubscription.countDocuments({ status: { $in: ['Expired', 'Suspended', 'Cancelled'] } }),
      Organization.countDocuments({ status: 'Pending-Approval' }),
      PartnershipApplication.countDocuments({ status: { $in: ['Pending', 'Under-Review'] } }),
      User.countDocuments({ role: 'Gym Member', 'membership.status': 'Active' }),
      User.countDocuments({
        role: 'Gym Member',
        'membership.status': 'Active',
        'membership.planName': { $regex: /All-Access|Black|Metropolitan/i },
      }),
      Payment.find({
        status: { $in: ['Completed', 'Paid'] },
        $or: [
          { planName: { $regex: /SaaS/i } },
          { orderId: { $regex: /saas_/i } },
        ],
      }),
      Payment.find({
        status: { $in: ['Completed', 'Paid'] },
        planName: { $not: { $regex: /SaaS/i } },
      }),
      PartnerSettlement.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$netPayoutAmount' } } },
      ]),
      PartnerSettlement.aggregate([
        { $match: { status: 'Disbursed' } },
        { $group: { _id: null, total: { $sum: '$netPayoutAmount' } } },
      ]),
    ]);

    const saasMRR = saasPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const membershipTotal = membershipPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPendingPayouts = settlementsPending.length > 0 ? settlementsPending[0].total : 0;
    const totalDisbursedPayouts = settlementsDisbursed.length > 0 ? settlementsDisbursed[0].total : 0;

    const branches = await Club.find()
      .select('name slug gymType location capacity currentOccupancy isNetworkPartner')
      .sort({ currentOccupancy: -1 });

    res.status(200).json({
      success: true,
      data: {
        networkOverview: {
          totalOrganizations,
          totalBranches: companyOwnedClubs + saasPartnerClubs,
          companyOwnedGyms: companyOwnedClubs,
          saasPartnerGyms: saasPartnerClubs,
          allAccessPartnerGyms: allAccessPartnerClubs,
        },
        saasEcosystem: {
          activeSubscriptions: activeSaaSSubs,
          expiredSubscriptions: expiredSaaSSubs,
          pendingGymApprovals,
          pendingPartnershipApps,
          mrrSaaS: saasMRR,
        },
        memberships: {
          activeMembers,
          allAccessMembers,
          membershipRevenue: membershipTotal,
        },
        settlements: {
          pendingPayouts: totalPendingPayouts,
          disbursedPayouts: totalDisbursedPayouts,
        },
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

