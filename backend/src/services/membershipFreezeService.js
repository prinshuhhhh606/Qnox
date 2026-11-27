const User = require('../models/User');
const MembershipFreezeRequest = require('../models/MembershipFreezeRequest');
const MembershipRequest = require('../models/MembershipRequest');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Configurable Default Policy
const DEFAULT_POLICY = {
  MIN_DAYS: 7,
  MAX_DAYS_PER_REQUEST: 30,
  ANNUAL_LIMIT_DAYS: 60,
};

/**
 * Generate a unique, professional Request ID (e.g. FRZ-8A2D3C)
 */
const generateRequestId = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FRZ-${code}`;
};

/**
 * Normalize date to midnight (00:00:00.000) for consistent daily calendar calculations
 */
const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Calculate total freeze days used by a member in the rolling past 365 days
 */
const getAnnualFreezeDaysUsed = async (memberId) => {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const pastRequests = await MembershipFreezeRequest.find({
    member: memberId,
    status: { $in: ['Approved', 'Frozen', 'Resumed'] },
    createdAt: { $gte: oneYearAgo },
  });

  return pastRequests.reduce((total, r) => total + (r.approvedDuration || r.requestedDuration || 0), 0);
};

/**
 * Submit Freeze Request (Member Panel)
 */
const submitFreezeRequest = async ({
  userId,
  requestedStartDate,
  requestedDuration,
  reason,
  additionalNotes = '',
  supportingDocument = '',
}) => {
  const user = await User.findById(userId).populate('membership.planId');
  if (!user) {
    throw new Error('Member record not found.');
  }

  // 1. Validate membership status
  const currentStatus = user.membership?.status;
  if (!['Active', 'Expiring Soon'].includes(currentStatus)) {
    throw new Error(`Only active memberships are eligible for freeze privileges. Current status is ${currentStatus || 'None'}.`);
  }

  const now = new Date();
  const membershipEnd = user.membership?.endDate ? new Date(user.membership.endDate) : null;
  if (membershipEnd && membershipEnd <= now) {
    throw new Error('Your membership has already expired and cannot be frozen.');
  }

  // 2. Validate dates & duration
  const duration = Number(requestedDuration);
  if (!duration || duration < DEFAULT_POLICY.MIN_DAYS || duration > DEFAULT_POLICY.MAX_DAYS_PER_REQUEST) {
    throw new Error(`Freeze duration must be between ${DEFAULT_POLICY.MIN_DAYS} and ${DEFAULT_POLICY.MAX_DAYS_PER_REQUEST} days per request.`);
  }

  const startDate = startOfDay(requestedStartDate || now);
  const today = startOfDay(now);
  if (startDate < today) {
    throw new Error('Requested freeze start date cannot be in the past.');
  }

  if (membershipEnd && startDate >= membershipEnd) {
    throw new Error('Requested freeze start date must be before your membership expiry date.');
  }

  // 3. Check annual freeze limits
  const daysUsedThisYear = await getAnnualFreezeDaysUsed(user._id);
  const remainingAnnualQuota = Math.max(0, DEFAULT_POLICY.ANNUAL_LIMIT_DAYS - daysUsedThisYear);
  if (duration > remainingAnnualQuota) {
    throw new Error(
      `Annual freeze limit exceeded. You have used ${daysUsedThisYear}/${DEFAULT_POLICY.ANNUAL_LIMIT_DAYS} days. Maximum days currently available to request: ${remainingAnnualQuota} days.`
    );
  }

  // 4. Prevent overlapping / duplicate active requests
  const existingActive = await MembershipFreezeRequest.findOne({
    member: user._id,
    status: { $in: ['Pending', 'Approved', 'Frozen'] },
  });

  if (existingActive) {
    if (existingActive.status === 'Pending') {
      throw new Error(`A freeze request (${existingActive.requestId}) is already pending review. Please wait for concierge approval or cancel it.`);
    }
    if (existingActive.status === 'Approved') {
      throw new Error(`You already have an approved freeze scheduled (${existingActive.requestId}) starting ${new Date(existingActive.scheduledStartDate).toLocaleDateString('en-GB')}.`);
    }
    if (existingActive.status === 'Frozen') {
      throw new Error(`Your membership is currently frozen under request ${existingActive.requestId}.`);
    }
  }

  // Calculate scheduled end date
  const scheduledEndDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

  // Generate unique request ID
  let requestId = generateRequestId();
  let duplicate = await MembershipFreezeRequest.findOne({ requestId });
  while (duplicate) {
    requestId = generateRequestId();
    duplicate = await MembershipFreezeRequest.findOne({ requestId });
  }

  const clubName = user.homeClubName || 'Mayfair Sanctuary';
  const memberIdCode = user.memberId || `QNX-${user._id.toString().slice(-6).toUpperCase()}`;

  const freezeRequest = await MembershipFreezeRequest.create({
    requestId,
    member: user._id,
    memberId: memberIdCode,
    memberName: user.name,
    memberEmail: user.email,
    membership: {
      planId: user.membership?.planId?._id || user.membership?.planId,
      planName: user.membership?.planName || 'Residency Plan',
      planCode: user.membership?.planCode || 'METRO',
      billingCycle: user.membership?.billingCycle || 'monthly',
      startDate: user.membership?.startDate,
      endDate: user.membership?.endDate,
    },
    club: user.homeClub,
    clubName,
    requestedStartDate: startDate,
    requestedDuration: duration,
    approvedDuration: duration,
    scheduledStartDate: startDate,
    scheduledEndDate,
    reason: reason || 'Personal Reasons',
    additionalNotes: additionalNotes || '',
    supportingDocument: supportingDocument || '',
    status: 'Pending',
    history: [
      {
        status: 'Pending',
        changedAt: new Date(),
        changedByName: user.name,
        note: `Submitted freeze request for ${duration} days starting ${startDate.toLocaleDateString('en-GB')}.`,
      },
    ],
  });

  // Also sync with legacy MembershipRequest for system compatibility
  await MembershipRequest.create({
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    memberId: memberIdCode,
    type: 'Freeze',
    reason: reason || 'Personal Reasons',
    freezeStartDate: startDate,
    freezeEndDate: scheduledEndDate,
    freezeDays: duration,
    status: 'Pending',
  }).catch(() => null);

  // Notify Admins
  const admins = await User.find({ role: { $in: ['Admin', 'Super Admin'] } }).select('_id');
  const adminNotifs = admins.map((admin) => ({
    recipient: admin._id,
    recipientRole: 'Admin',
    customerId: user._id,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone || '',
    membershipPlan: user.membership?.planName || 'Residency',
    type: 'MEMBERSHIP_FREEZE_REQUESTED',
    title: 'Membership Freeze Requested',
    message: `${user.name} (${memberIdCode}) has submitted a ${duration}-day freeze request [${requestId}]. Reason: ${reason}.`,
    actionUrl: '/admin?tab=requests',
    actionLabel: 'Review Freeze Request',
    data: { requestId: freezeRequest._id, code: requestId },
  }));

  if (adminNotifs.length > 0) {
    await Notification.insertMany(adminNotifs).catch(console.error);
  }

  // Member in-app notification
  await Notification.create({
    recipient: user._id,
    recipientRole: 'Gym Member',
    type: 'MEMBERSHIP_FREEZE_REQUESTED',
    title: 'Freeze Request Submitted',
    message: `Your membership freeze request [${requestId}] for ${duration} days has been submitted and is awaiting executive review.`,
    actionUrl: '/membership',
    actionLabel: 'View Freeze History',
  }).catch(console.error);

  // Send Email Confirmation
  sendEmail({
    to: user.email,
    subject: `QNOX GYM // Freeze Request Logged [${requestId}]`,
    html: `
      <div style="font-family: sans-serif; background: #0c0c0c; color: #e5e5e5; padding: 30px; border-radius: 8px;">
        <h2 style="color: #c5a880; font-family: serif; letter-spacing: 2px;">QNOX SANCTUARY // FREEZE REQUEST LOGGED</h2>
        <p>Dear ${user.name},</p>
        <p>Your request to pause your membership residency has been successfully registered under dossier code <strong>${requestId}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; color: #ccc;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222;">Plan:</td><td style="font-weight: bold; color: #fff;">${user.membership?.planName}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222;">Requested Start:</td><td style="color: #c5a880;">${startDate.toLocaleDateString('en-GB')}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222;">Duration:</td><td>${duration} Days</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #222;">Reason:</td><td>${reason}</td></tr>
          <tr><td style="padding: 8px 0;">Status:</td><td style="color: #38bdf8; font-weight: bold;">PENDING CONCIERGE REVIEW</td></tr>
        </table>
        <p style="font-size: 12px; color: #888;">Note: Your membership remains fully ACTIVE until the approved freeze start date.</p>
      </div>
    `,
  }).catch((e) => console.warn('[Freeze Email Warning]:', e.message));

  return freezeRequest;
};

/**
 * Approve Freeze Request (Admin Panel)
 */
const approveFreezeRequest = async ({
  requestId,
  adminUser,
  approvedDuration,
  scheduledStartDate,
  adminRemarks = '',
}) => {
  const freezeRequest = await MembershipFreezeRequest.findById(requestId);
  if (!freezeRequest) {
    throw new Error('Freeze request record not found.');
  }

  if (freezeRequest.status !== 'Pending') {
    throw new Error(`This request has already been ${freezeRequest.status.toLowerCase()}.`);
  }

  const member = await User.findById(freezeRequest.member);
  if (!member) {
    throw new Error('Member dossier not found.');
  }

  // Club-level permission check
  if (adminUser.role === 'Admin' && adminUser.assignedClub && freezeRequest.club) {
    if (adminUser.assignedClub.toString() !== freezeRequest.club.toString()) {
      throw new Error('Access denied: You do not hold supervisory clearance for this sanctuary club.');
    }
  }

  const duration = Number(approvedDuration) || freezeRequest.requestedDuration || 30;
  if (duration < DEFAULT_POLICY.MIN_DAYS || duration > DEFAULT_POLICY.MAX_DAYS_PER_REQUEST) {
    throw new Error(`Approved duration must be between ${DEFAULT_POLICY.MIN_DAYS} and ${DEFAULT_POLICY.MAX_DAYS_PER_REQUEST} days.`);
  }

  // Re-verify annual quota
  const daysUsed = await getAnnualFreezeDaysUsed(member._id);
  if (daysUsed + duration > DEFAULT_POLICY.ANNUAL_LIMIT_DAYS + 5) { // grace margin of past records
    console.warn(`[Freeze Notice] Member ${member.name} approaching annual limit (${daysUsed + duration}/${DEFAULT_POLICY.ANNUAL_LIMIT_DAYS})`);
  }

  const now = new Date();
  const today = startOfDay(now);
  const start = scheduledStartDate ? startOfDay(scheduledStartDate) : startOfDay(freezeRequest.requestedStartDate || now);
  const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

  freezeRequest.approvedDuration = duration;
  freezeRequest.scheduledStartDate = start;
  freezeRequest.scheduledEndDate = end;
  freezeRequest.adminRemarks = adminRemarks;
  freezeRequest.reviewedBy = adminUser._id;
  freezeRequest.reviewedByName = adminUser.name || 'Executive Admin';
  freezeRequest.reviewedAt = new Date();
  freezeRequest.originalExpiryDate = member.membership?.endDate;

  // Decision: Immediate activation vs Future scheduled freeze
  const isStartTodayOrPast = start <= today;

  if (isStartTodayOrPast) {
    // Activate immediately
    await activateFreeze(freezeRequest, member, adminUser);
  } else {
    // Schedule for future
    freezeRequest.status = 'Approved';
    freezeRequest.history.push({
      status: 'Approved',
      changedAt: new Date(),
      changedBy: adminUser._id,
      changedByName: adminUser.name || 'Executive Admin',
      note: `Approved for ${duration} days starting ${start.toLocaleDateString('en-GB')}. Scheduled for automatic activation.`,
    });
    await freezeRequest.save();

    // Member remains ACTIVE! Just update freezeDetails on member for awareness
    if (member.membership) {
      member.membership.freezeDetails = {
        startDate: start,
        endDate: end,
        reason: freezeRequest.reason,
        remainingDaysAtFreeze: 0,
        approvedDuration: duration,
        requestId: freezeRequest.requestId,
        frozenBy: adminUser._id,
      };
      await member.save();
    }

    // Member notification
    await Notification.create({
      recipient: member._id,
      recipientRole: 'Gym Member',
      type: 'MEMBERSHIP_FREEZE_APPROVED',
      title: 'Freeze Request Approved',
      message: `Your ${duration}-day freeze request [${freezeRequest.requestId}] has been approved. It is scheduled to activate on ${start.toLocaleDateString('en-GB')}.`,
      actionUrl: '/membership',
      actionLabel: 'View Schedule',
    }).catch(console.error);

    // Email
    sendEmail({
      to: member.email,
      subject: `QNOX GYM // Membership Freeze Approved [${freezeRequest.requestId}]`,
      html: `
        <div style="font-family: sans-serif; background: #0c0c0c; color: #e5e5e5; padding: 30px; border-radius: 8px;">
          <h2 style="color: #c5a880; font-family: serif; letter-spacing: 2px;">QNOX SANCTUARY // FREEZE SCHEDULED</h2>
          <p>Dear ${member.name},</p>
          <p>Your request to freeze your membership residency has been approved by the Concierge.</p>
          <p>Your residency remains <strong>ACTIVE</strong> until <strong>${start.toLocaleDateString('en-GB')}</strong>, when it will automatically pause for ${duration} days.</p>
          <p style="color: #888;">Dossier Code: <strong>${freezeRequest.requestId}</strong></p>
        </div>
      `,
    }).catch(console.error);
  }

  // Also sync legacy MembershipRequest
  await MembershipRequest.findOneAndUpdate(
    { user: member._id, type: 'Freeze', status: 'Pending' },
    {
      status: 'Approved',
      freezeDays: duration,
      freezeStartDate: start,
      freezeEndDate: end,
      reviewedBy: adminUser._id,
      reviewedByName: adminUser.name,
      reviewedAt: new Date(),
      adminNotes: adminRemarks,
    }
  ).catch(() => null);

  return freezeRequest;
};

/**
 * Activate Freeze (Switches member to Frozen, suspends biometric access)
 */
const activateFreeze = async (freezeRequest, memberDoc = null, performer = null) => {
  const member = memberDoc || (await User.findById(freezeRequest.member));
  if (!member || !member.membership) return;

  const now = new Date();
  const currentEnd = member.membership.endDate ? new Date(member.membership.endDate) : now;
  const remainingMs = Math.max(0, currentEnd.getTime() - now.getTime());
  const remainingDaysAtFreeze = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  // 1. Update Member Membership state
  member.membership.status = 'Frozen';
  member.membership.isFrozen = true;
  member.biometricAccess = false; // Suspend biometric sanctuary access
  member.membership.freezeDetails = {
    startDate: freezeRequest.scheduledStartDate || now,
    endDate: freezeRequest.scheduledEndDate,
    reason: freezeRequest.reason,
    remainingDaysAtFreeze,
    approvedDuration: freezeRequest.approvedDuration || freezeRequest.requestedDuration,
    requestId: freezeRequest.requestId,
    frozenBy: performer ? performer._id : freezeRequest.reviewedBy,
  };

  member.freezeHistory.push({
    startDate: freezeRequest.scheduledStartDate || now,
    endDate: freezeRequest.scheduledEndDate,
    reason: freezeRequest.reason,
    daysFrozen: 0,
    performedByName: performer ? performer.name : (freezeRequest.reviewedByName || 'System Scheduler'),
  });

  member.membershipHistory.push({
    planName: member.membership.planName,
    billingCycle: member.membership.billingCycle,
    startDate: member.membership.startDate,
    endDate: member.membership.endDate,
    amount: 0,
    status: 'Frozen',
    actionType: 'Freeze',
    performedByName: performer ? performer.name : (freezeRequest.reviewedByName || 'System Scheduler'),
    notes: `Residency paused for ${freezeRequest.approvedDuration} days [${freezeRequest.requestId}]. ${remainingDaysAtFreeze} days safeguarded.`,
  });

  await member.save();

  // 2. Update Freeze Request Record
  freezeRequest.status = 'Frozen';
  freezeRequest.actualStartDate = now;
  freezeRequest.history.push({
    status: 'Frozen',
    changedAt: now,
    changedByName: performer ? performer.name : 'System Scheduler',
    note: `Freeze activated. Biometric access and session bookings paused for ${freezeRequest.approvedDuration} days.`,
  });
  await freezeRequest.save();

  // 3. Dispatch Member Notification
  await Notification.create({
    recipient: member._id,
    recipientRole: 'Gym Member',
    type: 'MEMBERSHIP_FROZEN',
    title: 'Membership Residency Paused',
    message: `Your membership [${freezeRequest.requestId}] is now officially FROZEN. All remaining days are protected. Biometric access will resume on ${new Date(freezeRequest.scheduledEndDate).toLocaleDateString('en-GB')}.`,
    actionUrl: '/membership',
    actionLabel: 'View Residency Details',
  }).catch(console.error);

  // 4. Send Email
  sendEmail({
    to: member.email,
    subject: `QNOX GYM // Residency Paused [${freezeRequest.requestId}]`,
    html: `
      <div style="font-family: sans-serif; background: #0c0c0c; color: #e5e5e5; padding: 30px; border-radius: 8px;">
        <h2 style="color: #38bdf8; font-family: serif; letter-spacing: 2px;">QNOX SANCTUARY // RESIDENCY FROZEN</h2>
        <p>Dear ${member.name},</p>
        <p>Your membership is now FROZEN as approved under protocol <strong>${freezeRequest.requestId}</strong>.</p>
        <p><strong>Freeze Duration:</strong> ${freezeRequest.approvedDuration} Days</p>
        <p><strong>Scheduled Resume Date:</strong> ${new Date(freezeRequest.scheduledEndDate).toLocaleDateString('en-GB')}</p>
        <p style="color: #c5a880;">Your paid days remain fully protected and will be added back upon resumption.</p>
      </div>
    `,
  }).catch(console.error);
};

/**
 * Resume Freeze (Restores Active status, extends expiry date, restores biometric access)
 */
const resumeFreeze = async (freezeRequest, memberDoc = null, performer = null) => {
  const member = memberDoc || (await User.findById(freezeRequest.member));
  if (!member || !member.membership) return;

  const now = new Date();
  const approvedDays = freezeRequest.approvedDuration || freezeRequest.requestedDuration || 15;

  // Consistent Date Calculation Convention:
  // Add approved frozen days to previous expiry date
  const originalEnd = member.membership.endDate ? new Date(member.membership.endDate) : now;
  const newEndDate = new Date(originalEnd.getTime() + approvedDays * 24 * 60 * 60 * 1000);

  // 1. Restore Member State
  member.membership.status = 'Active';
  member.membership.isFrozen = false;
  member.membership.endDate = newEndDate;
  member.biometricAccess = true; // Restore biometric club access

  // Update freeze history with actual resumption date
  const latestFreeze = member.freezeHistory[member.freezeHistory.length - 1];
  if (latestFreeze) {
    latestFreeze.resumedAt = now;
    latestFreeze.daysFrozen = approvedDays;
  }

  member.membershipHistory.push({
    planName: member.membership.planName,
    billingCycle: member.membership.billingCycle,
    startDate: member.membership.startDate,
    endDate: newEndDate,
    amount: 0,
    status: 'Active',
    actionType: 'Unfreeze',
    performedByName: performer ? performer.name : 'System Scheduler',
    notes: `Residency restored. ${approvedDays} frozen days added to validity. New expiry: ${newEndDate.toLocaleDateString('en-GB')}.`,
  });

  await member.save();

  // 2. Update Request Record
  freezeRequest.status = 'Resumed';
  freezeRequest.actualEndDate = now;
  freezeRequest.resumedAt = now;
  freezeRequest.extendedExpiryDate = newEndDate;
  freezeRequest.history.push({
    status: 'Resumed',
    changedAt: now,
    changedByName: performer ? performer.name : 'System Scheduler',
    note: `Residency resumed. Expiry extended by ${approvedDays} days to ${newEndDate.toLocaleDateString('en-GB')}.`,
  });
  await freezeRequest.save();

  // 3. Dispatch Notification
  await Notification.create({
    recipient: member._id,
    recipientRole: 'Gym Member',
    type: 'MEMBERSHIP_RESUMED',
    title: 'Membership Restored & Active',
    message: `Welcome back! Your residency has resumed. Your new membership expiry date is ${newEndDate.toLocaleDateString('en-GB')}. Biometric access is active.`,
    actionUrl: '/membership',
    actionLabel: 'View Active Status',
  }).catch(console.error);

  // 4. Send Email
  sendEmail({
    to: member.email,
    subject: `QNOX GYM // Welcome Back - Membership Resumed!`,
    html: `
      <div style="font-family: sans-serif; background: #0c0c0c; color: #e5e5e5; padding: 30px; border-radius: 8px;">
        <h2 style="color: #34d399; font-family: serif; letter-spacing: 2px;">QNOX SANCTUARY // WELCOME BACK</h2>
        <p>Dear ${member.name},</p>
        <p>Your membership freeze period has successfully concluded. Your residency privileges and biometric access are now fully <strong>ACTIVE</strong>.</p>
        <p><strong>Restored Days Added:</strong> ${approvedDays} Days</p>
        <p><strong>New Membership Expiry Date:</strong> <span style="color: #c5a880; font-weight: bold;">${newEndDate.toLocaleDateString('en-GB')}</span></p>
        <p style="font-size: 12px; color: #888;">We look forward to welcoming you at Mayfair Sanctuary.</p>
      </div>
    `,
  }).catch(console.error);
};

/**
 * Reject Freeze Request (Admin Panel)
 */
const rejectFreezeRequest = async ({ requestId, adminUser, rejectionReason, adminRemarks = '' }) => {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Please provide an official reason for rejection.');
  }

  const freezeRequest = await MembershipFreezeRequest.findById(requestId);
  if (!freezeRequest) {
    throw new Error('Freeze request record not found.');
  }

  if (freezeRequest.status !== 'Pending') {
    throw new Error(`This request has already been ${freezeRequest.status.toLowerCase()}.`);
  }

  const member = await User.findById(freezeRequest.member);
  if (!member) {
    throw new Error('Member dossier not found.');
  }

  freezeRequest.status = 'Rejected';
  freezeRequest.rejectionReason = rejectionReason.trim();
  freezeRequest.adminRemarks = adminRemarks.trim();
  freezeRequest.reviewedBy = adminUser._id;
  freezeRequest.reviewedByName = adminUser.name || 'Executive Admin';
  freezeRequest.reviewedAt = new Date();
  freezeRequest.history.push({
    status: 'Rejected',
    changedAt: new Date(),
    changedBy: adminUser._id,
    changedByName: adminUser.name || 'Executive Admin',
    note: `Rejected by concierge: "${rejectionReason.trim()}"`,
  });

  await freezeRequest.save();

  // Clear pending freezeDetails on member
  if (member.membership && member.membership.freezeDetails?.requestId === freezeRequest.requestId) {
    member.membership.freezeDetails = undefined;
    await member.save();
  }

  // Member remains ACTIVE, start and expiry unchanged!
  // Notify Member
  await Notification.create({
    recipient: member._id,
    recipientRole: 'Gym Member',
    type: 'MEMBERSHIP_FREEZE_REJECTED',
    title: 'Freeze Request Non-Approved',
    message: `Your membership freeze request [${freezeRequest.requestId}] could not be approved. Reason: "${rejectionReason}". Your membership remains Active.`,
    actionUrl: '/membership',
    actionLabel: 'View Dossier Details',
  }).catch(console.error);

  // Email
  sendEmail({
    to: member.email,
    subject: `QNOX GYM // Membership Freeze Request Update [${freezeRequest.requestId}]`,
    html: `
      <div style="font-family: sans-serif; background: #0c0c0c; color: #e5e5e5; padding: 30px; border-radius: 8px;">
        <h2 style="color: #f87171; font-family: serif; letter-spacing: 2px;">QNOX SANCTUARY // REQUEST UPDATE</h2>
        <p>Dear ${member.name},</p>
        <p>Your membership freeze request [<strong>${freezeRequest.requestId}</strong>] could not be approved by the Concierge.</p>
        <p><strong>Concierge Decision:</strong> ${rejectionReason}</p>
        <p>Your membership residency remains completely <strong>ACTIVE</strong> with uninterrupted club and masterclass access privileges.</p>
      </div>
    `,
  }).catch(console.error);

  // Sync legacy
  await MembershipRequest.findOneAndUpdate(
    { user: member._id, type: 'Freeze', status: 'Pending' },
    {
      status: 'Rejected',
      rejectionReason: rejectionReason.trim(),
      reviewedBy: adminUser._id,
      reviewedByName: adminUser.name,
      reviewedAt: new Date(),
    }
  ).catch(() => null);

  return freezeRequest;
};

/**
 * Cancel Pending Freeze Request (Member Panel)
 */
const cancelPendingFreezeRequest = async ({ requestId, userId }) => {
  const freezeRequest = await MembershipFreezeRequest.findOne({
    _id: requestId,
    member: userId,
  });

  if (!freezeRequest) {
    throw new Error('Freeze request not found or unauthorized.');
  }

  if (freezeRequest.status !== 'Pending') {
    throw new Error(`Only pending freeze requests can be cancelled directly by the member. Current status is ${freezeRequest.status}.`);
  }

  freezeRequest.status = 'Cancelled';
  freezeRequest.history.push({
    status: 'Cancelled',
    changedAt: new Date(),
    changedByName: freezeRequest.memberName,
    note: 'Member voluntarily cancelled pending freeze request.',
  });
  await freezeRequest.save();

  // Clean legacy sync
  await MembershipRequest.findOneAndUpdate(
    { user: userId, type: 'Freeze', status: 'Pending' },
    { status: 'Rejected', rejectionReason: 'Member cancelled request' }
  ).catch(() => null);

  return freezeRequest;
};

/**
 * Automated Cron Processor: Safe, idempotent activation of scheduled freezes and automatic resumptions
 */
const processScheduledFreezes = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const summary = { activated: 0, resumed: 0 };

  try {
    // 1. Process Approved requests whose scheduled start date has arrived (<= today)
    const dueForActivation = await MembershipFreezeRequest.find({
      status: 'Approved',
      scheduledStartDate: { $lte: now },
    });

    for (const req of dueForActivation) {
      try {
        await activateFreeze(req);
        summary.activated++;
      } catch (e) {
        console.error(`[Scheduler Error: Activate Freeze ${req.requestId}]:`, e.message);
      }
    }

    // 2. Process Frozen requests whose scheduled end date has arrived (<= now)
    const dueForResumption = await MembershipFreezeRequest.find({
      status: 'Frozen',
      scheduledEndDate: { $lte: now },
    });

    for (const req of dueForResumption) {
      try {
        await resumeFreeze(req);
        summary.resumed++;
      } catch (e) {
        console.error(`[Scheduler Error: Resume Freeze ${req.requestId}]:`, e.message);
      }
    }

    return summary;
  } catch (err) {
    console.error('[processScheduledFreezes General Error]:', err.message);
    return summary;
  }
};

module.exports = {
  DEFAULT_POLICY,
  generateRequestId,
  getAnnualFreezeDaysUsed,
  submitFreezeRequest,
  approveFreezeRequest,
  rejectFreezeRequest,
  cancelPendingFreezeRequest,
  activateFreeze,
  resumeFreeze,
  processScheduledFreezes,
};
