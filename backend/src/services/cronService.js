const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SchedulerLock = require('../models/SchedulerLock');
const {
  sendMembershipExpiryReminderEmail,
  sendMembershipRenewalSuccessEmail,
} = require('./emailService');
const { processScheduledFreezes } = require('./membershipFreezeService');

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns YYYY-MM-DD string for a date in Asia/Kolkata timezone
 */
const getKolkataDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

/**
 * Calculate calendar day difference in Asia/Kolkata timezone.
 * > 0: Days in future (e.g. +7 = 7 days before expiry)
 * = 0: Today is the expiry date
 * < 0: Days in past (e.g. -3 = expired 3 days ago)
 */
const getDaysDifferenceKolkata = (targetDate, baseDate = new Date()) => {
  const targetStr = getKolkataDateString(targetDate);
  const baseStr = getKolkataDateString(baseDate);
  const dTarget = new Date(`${targetStr}T00:00:00Z`);
  const dBase = new Date(`${baseStr}T00:00:00Z`);
  const diffMs = dTarget.getTime() - dBase.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Acquire distributed lock in MongoDB for multi-instance safety
 */
const acquireSchedulerLock = async (lockName = 'membership_expiry_job', ttlMinutes = 15) => {
  try {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const lock = await SchedulerLock.findOneAndUpdate(
      {
        lockName,
        $or: [{ lockedUntil: { $lte: now } }, { lockedUntil: { $exists: false } }],
      },
      {
        $set: {
          lockedUntil,
          lockedBy: `process_${process.pid}_${Math.random().toString(36).substring(7)}`,
          lastRunAt: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return !!lock;
  } catch (err) {
    // E11000 duplicate key means another instance acquired the lock
    if (err.code === 11000) {
      return false;
    }
    console.warn(`[QNOX Scheduler Lock Warning]: ${err.message}`);
    return false;
  }
};

/**
 * Release distributed lock after job completion
 */
const releaseSchedulerLock = async (lockName = 'membership_expiry_job', summary = {}) => {
  try {
    await SchedulerLock.findOneAndUpdate(
      { lockName },
      {
        $set: {
          lockedUntil: new Date(),
          lastSummary: summary,
        },
      }
    );
  } catch (err) {
    console.warn(`[QNOX Scheduler Release Warning]: ${err.message}`);
  }
};

/**
 * Core Membership Expiry & Reminder Processing Engine
 */
const checkAndProcessMembershipExpiries = async (force = false) => {
  const summary = {
    timestamp: new Date().toISOString(),
    timezone: TIMEZONE,
    processedMembers: 0,
    markedExpired: 0,
    markedExpiringSoon: 0,
    notificationsCreated: 0,
    emailsSent: 0,
    skippedDuplicates: 0,
  };

  if (!force) {
    const hasLock = await acquireSchedulerLock('membership_expiry_job', 15);
    if (!hasLock) {
      console.log('[QNOX Scheduler] Another server instance is currently executing or lock is active. Skipping run.');
      return { skipped: true, reason: 'Active lock on another instance' };
    }
  }

  try {
    console.log(`\n======================================================`);
    console.log(` [QNOX SCHEDULER] Running Membership Expiry Engine...`);
    console.log(` Timezone: ${TIMEZONE} | Reference Date: ${getKolkataDateString()}`);
    console.log(`======================================================\n`);

    // Fetch active Admins and Super Admins for notification dispatch
    const admins = await User.find({
      role: { $in: ['Admin', 'Super Admin'] },
      isArchived: { $ne: true },
    }).select('_id name email role');

    // Query members with defined membership end dates
    const members = await User.find({
      role: 'Gym Member',
      isArchived: { $ne: true },
      'membership.endDate': { $ne: null },
      'membership.status': { $in: ['Active', 'Expiring Soon', 'Expired'] },
    });

    summary.processedMembers = members.length;

    for (const member of members) {
      const { membership } = member;
      if (!membership || !membership.endDate) continue;

      const daysDiff = getDaysDifferenceKolkata(membership.endDate);
      const endDateMs = new Date(membership.endDate).getTime();
      const formattedEndDate = new Date(membership.endDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const planName = membership.planName || 'Residency Plan';

      // 1. Automatic Status Transition
      if (daysDiff <= 0 && membership.status !== 'Expired') {
        member.membership.status = 'Expired';
        await member.save();
        summary.markedExpired++;
      } else if (daysDiff > 0 && daysDiff <= 7 && membership.status === 'Active') {
        member.membership.status = 'Expiring Soon';
        await member.save();
        summary.markedExpiringSoon++;
      }

      // 2. Identify Applicable Reminder Stage
      let stage = null;
      let notificationType = null;
      let customerTitle = '';
      let customerMessage = '';
      let adminTitle = '';
      let adminMessage = '';

      if (daysDiff === 7) {
        stage = '7_DAYS_BEFORE';
        notificationType = 'EXPIRY_REMINDER_7D';
        customerTitle = 'Your Gym Membership Expires in 7 Days';
        customerMessage = `Hello ${member.name}, your ${planName} membership will expire in 7 days on ${formattedEndDate}. Renew your membership early to maintain uninterrupted access to our luxury sanctuaries.`;
        adminTitle = 'Membership Expiring Soon (7 Days)';
        adminMessage = `Membership for ${member.name} (${planName}) is expiring in 7 days on ${formattedEndDate}. Please follow up with the customer for renewal.`;
      } else if (daysDiff === 3) {
        stage = '3_DAYS_BEFORE';
        notificationType = 'EXPIRY_REMINDER_3D';
        customerTitle = 'Your Gym Membership Expires in 3 Days';
        customerMessage = `Hello ${member.name}, only 3 days remain on your ${planName} membership (expires on ${formattedEndDate}). Renew now to preserve your booking privileges and club access.`;
        adminTitle = 'Membership Expiring Soon (3 Days)';
        adminMessage = `Urgent Reminder: ${member.name}'s ${planName} membership expires in 3 days on ${formattedEndDate}. Follow up for membership renewal.`;
      } else if (daysDiff === 1) {
        stage = '1_DAY_BEFORE';
        notificationType = 'EXPIRY_REMINDER_1D';
        customerTitle = 'Final Reminder: Membership Expires Tomorrow';
        customerMessage = `Hello ${member.name}, your ${planName} membership expires tomorrow on ${formattedEndDate}. Renew today to prevent suspension of your biometric sanctuary access.`;
        adminTitle = 'Membership Expiring Tomorrow';
        adminMessage = `Final Advance Alert: ${member.name}'s ${planName} membership expires tomorrow on ${formattedEndDate}. Immediate renewal follow-up recommended.`;
      } else if (daysDiff === 0) {
        stage = 'EXPIRY_DATE';
        notificationType = 'EXPIRY_TODAY';
        customerTitle = 'Your Gym Membership Has Expired!';
        customerMessage = `Hello ${member.name}, your ${planName} membership expired on ${formattedEndDate}. Renew your membership today to continue enjoying your fitness journey at QNOX GYM.`;
        adminTitle = 'Membership Expired';
        adminMessage = `Membership of ${member.name} has expired on ${formattedEndDate}. Please follow up with the customer for membership renewal.`;
      } else if (daysDiff === -3) {
        stage = '3_DAYS_AFTER';
        notificationType = 'EXPIRY_FOLLOWUP_3D';
        customerTitle = 'We Miss You at QNOX GYM - Renew Today';
        customerMessage = `Hello ${member.name}, your ${planName} membership expired 3 days ago on ${formattedEndDate}. Your reserved locker and tier benefits are on hold. Renew now to reactivate your residency.`;
        adminTitle = 'Follow-up: Membership Expired 3 Days Ago';
        adminMessage = `Follow-up needed: ${member.name}'s membership expired on ${formattedEndDate} (3 days ago). Please initiate personal renewal outreach.`;
      }

      if (!stage) {
        // Not a target reminder day
        continue;
      }

      // 3. Customer Notification Creation (Idempotent via unique reminderKey)
      const customerReminderKey = `member_${member._id}_${stage}_${endDateMs}`;
      const existingCustomerNotif = await Notification.findOne({ reminderKey: customerReminderKey });

      if (!existingCustomerNotif) {
        let emailSent = false;
        let emailError = '';

        // Dispatch Email using Nodemailer
        try {
          const emailRes = await sendMembershipExpiryReminderEmail({
            user: member,
            planName,
            expiryDate: membership.endDate,
            daysRemaining: daysDiff,
            stage,
          });
          emailSent = emailRes?.success || false;
          if (emailSent) summary.emailsSent++;
        } catch (mailErr) {
          emailError = mailErr.message;
          console.warn(`[QNOX Email Failed Non-blocking] ${member.email}: ${mailErr.message}`);
        }

        try {
          await Notification.create({
            recipient: member._id,
            recipientRole: 'Gym Member',
            title: customerTitle,
            message: customerMessage,
            type: notificationType,
            stage,
            reminderKey: customerReminderKey,
            membershipId: membership.planId,
            customerId: member._id,
            customerName: member.name,
            customerEmail: member.email,
            customerPhone: member.phone || '',
            membershipPlan: planName,
            membershipStartDate: membership.startDate,
            membershipEndDate: membership.endDate,
            membershipStatus: member.membership.status,
            actionLabel: 'Renew Membership',
            actionUrl: '#membership',
            emailSent,
            emailError,
            isRead: false,
          });
          summary.notificationsCreated++;
        } catch (insertErr) {
          if (insertErr.code === 11000) {
            summary.skippedDuplicates++;
          } else {
            console.error('[Notification Insert Error]', insertErr.message);
          }
        }
      } else {
        summary.skippedDuplicates++;
      }

      // 4. Admin Notifications Creation (One per admin, idempotent)
      for (const admin of admins) {
        const adminReminderKey = `admin_${admin._id}_${member._id}_${stage}_${endDateMs}`;
        const existingAdminNotif = await Notification.findOne({ reminderKey: adminReminderKey });

        if (!existingAdminNotif) {
          try {
            await Notification.create({
              recipient: admin._id,
              recipientRole: admin.role,
              title: adminTitle,
              message: adminMessage,
              type: notificationType,
              stage,
              reminderKey: adminReminderKey,
              membershipId: membership.planId,
              customerId: member._id,
              customerName: member.name,
              customerEmail: member.email,
              customerPhone: member.phone || '',
              membershipPlan: planName,
              membershipStartDate: membership.startDate,
              membershipEndDate: membership.endDate,
              membershipStatus: member.membership.status,
              actionLabel: 'View Customer Profile',
              actionUrl: `#member-${member._id}`,
              metadata: {
                memberId: member._id,
                planName,
                endDate: membership.endDate,
              },
              isRead: false,
            });
            summary.notificationsCreated++;
          } catch (adminInsertErr) {
            if (adminInsertErr.code === 11000) {
              summary.skippedDuplicates++;
            } else {
              console.error('[Admin Notification Insert Error]', adminInsertErr.message);
            }
          }
        } else {
          summary.skippedDuplicates++;
        }
      }
    }

    console.log('[QNOX SCHEDULER FINISHED]', JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('[QNOX SCHEDULER FATAL ERROR]', error);
    summary.error = error.message;
  } finally {
    if (!force) {
      await releaseSchedulerLock('membership_expiry_job', summary);
    }
  }

  return summary;
};

/**
 * Dispatch renewal notifications and emails for Customer and Admin
 */
const createRenewalNotifications = async ({ user, payment, planName, newEndDate, previousMembership }) => {
  try {
    const formattedDate = new Date(newEndDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const customerTitle = 'Membership Successfully Renewed!';
    const customerMessage = `Congratulations ${user.name}! Your ${planName} membership has been renewed until ${formattedDate}. Thank you for continuing your fitness journey with QNOX GYM.`;

    // 1. Customer Notification
    await Notification.create({
      recipient: user._id,
      recipientRole: 'Gym Member',
      title: customerTitle,
      message: customerMessage,
      type: 'MEMBERSHIP_RENEWED',
      stage: 'RENEWED',
      customerId: user._id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      membershipPlan: planName,
      membershipStartDate: user.membership?.startDate || new Date(),
      membershipEndDate: newEndDate,
      membershipStatus: 'Active',
      actionLabel: 'View Member Portal',
      actionUrl: '#portal',
      metadata: {
        invoiceNumber: payment?.invoiceNumber,
        amount: payment?.amount,
      },
      isRead: false,
      emailSent: true,
    });

    // Send customer renewal confirmation email
    sendMembershipRenewalSuccessEmail({
      user,
      planName,
      expiryDate: newEndDate,
      invoiceNumber: payment?.invoiceNumber,
      amount: payment?.amount,
    }).catch((err) => console.warn(`[Renewal Email Error]: ${err.message}`));

    // 2. Admin Notifications
    const admins = await User.find({
      role: { $in: ['Admin', 'Super Admin'] },
      isArchived: { $ne: true },
    }).select('_id role');

    const adminTitle = 'Membership Renewed';
    const adminMessage = `${user.name} has successfully renewed their ${planName} membership until ${formattedDate}. Amount: ₹${Number(payment?.amount || 0).toLocaleString('en-IN')}.`;

    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        recipientRole: admin.role,
        title: adminTitle,
        message: adminMessage,
        type: 'MEMBERSHIP_RENEWED',
        stage: 'RENEWED',
        customerId: user._id,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '',
        membershipPlan: planName,
        membershipStartDate: user.membership?.startDate || new Date(),
        membershipEndDate: newEndDate,
        membershipStatus: 'Active',
        actionLabel: 'View Customer Profile',
        actionUrl: `#member-${user._id}`,
        metadata: {
          memberId: user._id,
          invoiceNumber: payment?.invoiceNumber,
          amount: payment?.amount,
        },
        isRead: false,
      });
    }
  } catch (error) {
    console.error('[Create Renewal Notifications Error]', error.message);
  }
};

/**
 * Initialize Background Scheduler
 */
const initScheduler = () => {
  // Run daily at midnight 00:00 (Asia/Kolkata timezone)
  const cronExpression = '0 0 * * *';

  cron.schedule(
    cronExpression,
    async () => {
      console.log(`[QNOX CRON TRIGGERED] ${new Date().toISOString()}`);
      await checkAndProcessMembershipExpiries();
      await processScheduledFreezes();
    },
    {
      timezone: TIMEZONE,
    }
  );

  console.log(`[QNOX Scheduler Initialized] Automated Expiry & Freeze Engine scheduled daily at 00:00 [${TIMEZONE}]`);

  // Run a non-blocking check on server boot after a 5-second stabilization delay
  setTimeout(() => {
    checkAndProcessMembershipExpiries().catch((err) =>
      console.warn('[Startup Expiry Check Warning]:', err.message)
    );
    processScheduledFreezes().catch((err) =>
      console.warn('[Startup Freeze Processor Warning]:', err.message)
    );
  }, 5000);
};

module.exports = {
  checkAndProcessMembershipExpiries,
  createRenewalNotifications,
  initScheduler,
  getKolkataDateString,
  getDaysDifferenceKolkata,
};
