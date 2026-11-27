const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');
const Attendance = require('../models/Attendance');
const Organization = require('../models/Organization');
const PartnershipApplication = require('../models/PartnershipApplication');
const PartnerSettlement = require('../models/PartnerSettlement');
const { getIO } = require('../sockets/notificationSocket');

const QR_SECRET = process.env.JWT_SECRET || 'qnox_universal_qr_secret_key_2026';

/**
 * 1. Generate Secure, Dynamic, Anti-Replay QR Access Pass
 * Valid for 90 seconds only to prevent screenshot sharing.
 */
exports.generateDynamicQRAccessToken = async (userId) => {
  const user = await User.findById(userId).populate('membership.planId homeClub');
  if (!user) throw new Error('Member not found.');

  const membership = user.membership || {};
  const status = membership.status || 'None';
  const isFrozen = membership.isFrozen || status === 'Frozen';
  const isSuspended = status === 'Suspended';
  const isExpired = status === 'Expired' || (membership.endDate && new Date(membership.endDate) < new Date());

  if (isFrozen) throw new Error('Cannot generate pass: Your residency is currently frozen.');
  if (isSuspended) throw new Error('Cannot generate pass: Facility privileges are suspended.');
  if (isExpired || status !== 'Active') throw new Error('Active membership required to generate access pass.');

  // Check if user's plan is an All-Access Network plan or Home-Club plan
  const planName = (membership.planName || '').toUpperCase();
  const isAllAccess = planName.includes('ALL-ACCESS') || planName.includes('BLACK') || planName.includes('METROPOLITAN');

  const now = Date.now();
  const payload = {
    userId: user._id.toString(),
    memberId: user.memberId || `QNX-${user._id.toString().slice(-6).toUpperCase()}`,
    name: user.name,
    email: user.email,
    isAllAccess,
    homeClubId: user.homeClub ? user.homeClub._id.toString() : null,
    homeClubName: user.homeClubName || 'Mayfair Sanctuary',
    nonce: Math.random().toString(36).substring(2, 10),
    timestamp: now,
  };

  // 90 seconds expiration
  const token = jwt.sign(payload, QR_SECRET, { expiresIn: '90s' });

  return {
    token,
    memberId: payload.memberId,
    memberName: payload.name,
    isAllAccess,
    homeClubName: payload.homeClubName,
    expiresAt: new Date(now + 90 * 1000).toISOString(),
    validitySeconds: 90,
  };
};

/**
 * 2. Staff QR Scan & Access Verification Engine
 */
exports.verifyAndProcessCheckIn = async ({ qrToken, staffUser, clubId }) => {
  // Verify JWT Token
  let decoded;
  try {
    decoded = jwt.verify(qrToken, QR_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('This QR pass has expired. Please refresh the pass on your mobile device.');
    }
    throw new Error('Invalid QR Pass signature. Access rejected.');
  }

  const { userId, isAllAccess, homeClubId } = decoded;

  const member = await User.findById(userId).populate('homeClub');
  if (!member) throw new Error('Registered member profile not found.');

  // Verify biometric/club status
  if (member.biometricAccess === false) {
    throw new Error('Member access card is deactivated.');
  }

  const targetClub = await Club.findById(clubId).populate('organization');
  if (!targetClub) throw new Error('Target sanctuary / club location not found.');

  // Check access permissions:
  const isHomeClub = homeClubId && String(homeClubId) === String(targetClub._id);
  const isNetworkPartner = targetClub.isNetworkPartner === true;

  if (!isHomeClub) {
    // If not home club, member MUST have All-Access and club MUST be a verified network partner
    if (!isAllAccess) {
      // Record denied check-in
      await Attendance.create({
        member: member._id,
        memberName: member.name,
        club: targetClub._id,
        clubName: targetClub.name,
        organization: targetClub.organization ? targetClub.organization._id : null,
        passType: 'All-Access-Network',
        verificationMethod: 'QR-Dynamic',
        status: 'Denied',
        denialReason: 'Single-club membership pass presented at cross-facility partner location.',
        recordedByName: staffUser ? staffUser.name : 'Automated Gate',
      });

      throw new Error(`Access Denied: Your plan is limited to your home sanctuary (${member.homeClubName || 'Home Club'}). Please upgrade to QNOX All-Access.`);
    }

    if (!isNetworkPartner) {
      throw new Error(`This facility (${targetClub.name}) is not currently participating in the QNOX All-Access Network.`);
    }
  }

  // Duplicate Check-in Prevention (cannot check-in twice within 60 minutes)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCheckIn = await Attendance.findOne({
    member: member._id,
    status: 'Approved',
    createdAt: { $gte: oneHourAgo },
  });

  if (recentCheckIn) {
    throw new Error(`Duplicate entry prevented: Member already checked in at ${recentCheckIn.clubName} at ${new Date(recentCheckIn.createdAt).toLocaleTimeString()}.`);
  }

  // Record Approved Attendance
  const passType = isAllAccess && !isHomeClub ? 'All-Access-Network' : 'Home-Club';
  const attendance = await Attendance.create({
    member: member._id,
    memberName: member.name,
    club: targetClub._id,
    clubName: targetClub.name,
    organization: targetClub.organization ? targetClub.organization._id : null,
    passType,
    verificationMethod: 'QR-Dynamic',
    status: 'Approved',
    recordedByName: staffUser ? staffUser.name : 'Executive Concierge',
    activityType: 'Workout',
  });

  // Increment club current occupancy
  targetClub.currentOccupancy = Math.max(0, (targetClub.currentOccupancy || 0) + 1);
  await targetClub.save();

  // If this is an All-Access visit at a Partner Gym, record partner settlement accrual
  if (passType === 'All-Access-Network' && targetClub.organization && targetClub.gymType !== 'Company-Owned') {
    const now = new Date();
    const periodYear = now.getFullYear();
    const periodMonth = now.getMonth() + 1;
    const ratePerVisit = targetClub.settlementRatePerVisit || 250;

    let settlement = await PartnerSettlement.findOne({
      organization: targetClub.organization._id,
      partnerClub: targetClub._id,
      periodYear,
      periodMonth,
      status: 'Pending',
    });

    if (!settlement) {
      settlement = await PartnerSettlement.create({
        organization: targetClub.organization._id,
        partnerClub: targetClub._id,
        partnerClubName: targetClub.name,
        periodYear,
        periodMonth,
        ratePerVisit,
        totalCheckIns: 1,
        totalGrossPayable: ratePerVisit,
        platformCommissionPercent: 20,
        platformFeeAmount: ratePerVisit * 0.2,
        netPayoutAmount: ratePerVisit * 0.8,
        status: 'Pending',
      });
    } else {
      settlement.totalCheckIns += 1;
      settlement.totalGrossPayable += ratePerVisit;
      settlement.platformFeeAmount = Math.round(settlement.totalGrossPayable * (settlement.platformCommissionPercent / 100));
      settlement.netPayoutAmount = settlement.totalGrossPayable - settlement.platformFeeAmount;
      await settlement.save();
    }
  }

  // Real-time Push Notification via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.to(member._id.toString()).emit('checkin_verified', {
        clubName: targetClub.name,
        time: new Date().toLocaleTimeString(),
        passType,
      });
    }
  } catch (e) {
    // Socket emit is non-blocking
  }

  return {
    success: true,
    message: `Entry Approved: Welcome to ${targetClub.name}`,
    member: {
      id: member._id,
      name: member.name,
      memberId: member.memberId,
      avatar: member.avatar,
      planName: member.membership?.planName || 'Active Member',
    },
    club: {
      id: targetClub._id,
      name: targetClub.name,
      gymType: targetClub.gymType,
      currentOccupancy: targetClub.currentOccupancy,
    },
    attendance,
    passType,
  };
};

/**
 * 3. Submit Partnership Application
 */
exports.submitPartnershipApplication = async ({ organizationId, clubId, ownerId, facilities, hours, maxVisitors, requestedRate, verificationDocs }) => {
  const club = await Club.findById(clubId);
  if (!club) throw new Error('Club record not found.');

  const existingApp = await PartnershipApplication.findOne({
    club: clubId,
    status: { $in: ['Pending', 'Under-Review', 'Approved'] },
  });

  if (existingApp) {
    throw new Error(`An application for ${club.name} is already ${existingApp.status}.`);
  }

  const application = await PartnershipApplication.create({
    organization: organizationId,
    owner: ownerId,
    club: club._id,
    clubName: club.name,
    location: club.location,
    address: club.address,
    offeredFacilities: facilities || club.amenities || ['Strength Floor', 'Cardio Suite'],
    allAccessHours: hours || '07:00 - 21:00',
    maxDailyNetworkVisitors: maxVisitors || 30,
    requestedRatePerVisit: requestedRate || 250,
    agreedRatePerVisit: requestedRate || 250,
    verificationDocs: verificationDocs || [],
    agreementAccepted: true,
    status: 'Pending',
  });

  // Update Organization status
  await Organization.findByIdAndUpdate(organizationId, {
    allAccessPartnerStatus: 'Applied',
    allAccessApplicationDate: new Date(),
  });

  return application;
};

/**
 * 4. Super Admin Review & Approval of All-Access Partner Gym
 */
exports.reviewPartnershipApplication = async ({ applicationId, status, agreedRate, adminRemarks, reviewerUser }) => {
  const app = await PartnershipApplication.findById(applicationId);
  if (!app) throw new Error('Partnership application not found.');

  app.status = status;
  app.adminRemarks = adminRemarks || '';
  app.reviewedBy = reviewerUser._id;
  app.reviewedAt = new Date();
  if (agreedRate) app.agreedRatePerVisit = agreedRate;
  await app.save();

  if (status === 'Approved') {
    // Update Club to All-Access Partner
    await Club.findByIdAndUpdate(app.club, {
      isNetworkPartner: true,
      gymType: 'All-Access-Partner',
      settlementRatePerVisit: app.agreedRatePerVisit,
    });

    // Update Organization
    await Organization.findByIdAndUpdate(app.organization, {
      allAccessPartnerStatus: 'Approved',
      allAccessApprovedAt: new Date(),
      settlementRatePerVisit: app.agreedRatePerVisit,
    });
  } else if (status === 'Rejected' || status === 'Suspended') {
    await Club.findByIdAndUpdate(app.club, {
      isNetworkPartner: false,
    });

    await Organization.findByIdAndUpdate(app.organization, {
      allAccessPartnerStatus: status,
    });
  }

  return app;
};
