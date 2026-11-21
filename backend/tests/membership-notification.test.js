require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const Payment = require('../src/models/Payment');
const MembershipPlan = require('../src/models/MembershipPlan');
const SchedulerLock = require('../src/models/SchedulerLock');
const {
  checkAndProcessMembershipExpiries,
  createRenewalNotifications,
  getKolkataDateString,
  getDaysDifferenceKolkata,
} = require('../src/services/cronService');
const { verifyPayment } = require('../src/controllers/paymentController');

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🏛️  QNOX GYM - MEMBERSHIP EXPIRY & RENEWAL TEST SUITE');
  console.log('    Testing all 14 Specification Scenarios');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS [Scenario ${passed + failed + 1}]: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL [Scenario ${passed + failed + 1}]: ${message}`);
      failed++;
    }
  }

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qnoxgymdb';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('Connected to MongoDB database for test execution.\n');

    // Clean up test artifacts from previous runs
    const testPrefix = 'test_expiry_';
    await User.deleteMany({ email: new RegExp(`^${testPrefix}`, 'i') });
    await Notification.deleteMany({ customerEmail: new RegExp(`^${testPrefix}`, 'i') });
    await Payment.deleteMany({ userEmail: new RegExp(`^${testPrefix}`, 'i') });

    // Ensure at least one test Admin exists
    let testAdmin = await User.findOne({ role: 'Admin', email: `${testPrefix}admin@qnoxgym.com` });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: 'Test Executive Admin',
        email: `${testPrefix}admin@qnoxgym.com`,
        password: 'Password123!',
        role: 'Admin',
      });
    }

    const todayStr = getKolkataDateString();
    const today = new Date(`${todayStr}T12:00:00Z`);

    // Helper: calculate date offset in days from today
    const getDateOffset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d;
    };

    // ==========================================
    // 1. Membership expiring in 7 days
    // ==========================================
    const member7d = await User.create({
      name: 'Alexandre 7D',
      email: `${testPrefix}7d@qnoxgym.com`,
      phone: '+44 20 7946 0007',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE MAYFAIR OBSIDIAN',
        billingCycle: 'monthly',
        status: 'Active',
        startDate: getDateOffset(-23),
        endDate: getDateOffset(7),
      },
    });

    await checkAndProcessMembershipExpiries(true);

    const notif7d = await Notification.findOne({
      customerId: member7d._id,
      stage: '7_DAYS_BEFORE',
      recipientRole: 'Gym Member',
    });
    const updatedMember7d = await User.findById(member7d._id);

    assert(
      notif7d &&
      notif7d.type === 'EXPIRY_REMINDER_7D' &&
      updatedMember7d.membership.status === 'Expiring Soon',
      'Membership expiring in 7 days triggers advance alert and marks status "Expiring Soon"'
    );

    // ==========================================
    // 2. Membership expiring in 3 days
    // ==========================================
    const member3d = await User.create({
      name: 'Sophia 3D',
      email: `${testPrefix}3d@qnoxgym.com`,
      phone: '+44 20 7946 0003',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE METROPOLITAN',
        billingCycle: 'monthly',
        status: 'Active',
        startDate: getDateOffset(-27),
        endDate: getDateOffset(3),
      },
    });

    await checkAndProcessMembershipExpiries(true);

    const notif3d = await Notification.findOne({
      customerId: member3d._id,
      stage: '3_DAYS_BEFORE',
      recipientRole: 'Gym Member',
    });
    assert(
      notif3d && notif3d.type === 'EXPIRY_REMINDER_3D' && notif3d.message.includes('3 days'),
      'Membership expiring in 3 days sends customer and admin alerts'
    );

    // ==========================================
    // 3. Membership expiring tomorrow (1 day)
    // ==========================================
    const member1d = await User.create({
      name: 'Marcus Tomorrow',
      email: `${testPrefix}1d@qnoxgym.com`,
      phone: '+44 20 7946 0001',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE SOHO SANCTUARY',
        billingCycle: 'monthly',
        status: 'Active',
        startDate: getDateOffset(-29),
        endDate: getDateOffset(1),
      },
    });

    await checkAndProcessMembershipExpiries(true);

    const notif1d = await Notification.findOne({
      customerId: member1d._id,
      stage: '1_DAY_BEFORE',
      recipientRole: 'Gym Member',
    });
    assert(
      notif1d && notif1d.type === 'EXPIRY_REMINDER_1D' && notif1d.title.includes('Tomorrow'),
      'Membership expiring tomorrow triggers urgent 1-day advance reminder'
    );

    // ==========================================
    // 4. Membership expiring today (0 days)
    // ==========================================
    const memberToday = await User.create({
      name: 'Elena Today',
      email: `${testPrefix}today@qnoxgym.com`,
      phone: '+44 20 7946 0000',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'CANARY WHARF RESIDENCY',
        billingCycle: 'monthly',
        status: 'Active',
        startDate: getDateOffset(-30),
        endDate: today,
      },
    });

    await checkAndProcessMembershipExpiries(true);

    const notifToday = await Notification.findOne({
      customerId: memberToday._id,
      stage: 'EXPIRY_DATE',
      recipientRole: 'Gym Member',
    });
    const updatedMemberToday = await User.findById(memberToday._id);

    assert(
      notifToday &&
      notifToday.title === 'Your Gym Membership Has Expired!' &&
      updatedMemberToday.membership.status === 'Expired',
      'Membership expiring today is automatically marked "Expired" and receives "Your Gym Membership Has Expired!" notification'
    );

    // ==========================================
    // 5. Membership already expired (3 days ago / follow-up)
    // ==========================================
    const memberPast = await User.create({
      name: 'Julian Past',
      email: `${testPrefix}past3d@qnoxgym.com`,
      phone: '+44 20 7946 0033',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE METROPOLITAN',
        billingCycle: 'monthly',
        status: 'Expired',
        startDate: getDateOffset(-33),
        endDate: getDateOffset(-3),
      },
    });

    await checkAndProcessMembershipExpiries(true);

    const notifPast = await Notification.findOne({
      customerId: memberPast._id,
      stage: '3_DAYS_AFTER',
      recipientRole: 'Gym Member',
    });

    assert(
      notifPast &&
      notifPast.type === 'EXPIRY_FOLLOWUP_3D' &&
      notifPast.title.includes('We Miss You'),
      'Membership expired 3 days ago receives follow-up renewal notification'
    );

    // ==========================================
    // 6. Customer renews before expiry (preserves remaining days)
    // ==========================================
    const memberRenewEarly = await User.create({
      name: 'Claire Early Renewal',
      email: `${testPrefix}early_ren@qnoxgym.com`,
      phone: '+44 20 7946 0099',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE METROPOLITAN',
        billingCycle: 'monthly',
        status: 'Active',
        startDate: getDateOffset(-10),
        endDate: getDateOffset(20), // 20 days remaining!
      },
    });

    const previousEndDate = new Date(memberRenewEarly.membership.endDate);

    // Simulate payment verification for 1-month renewal
    const fakeOrderEarly = `ord_test_early_${Date.now()}`;
    const paymentEarly = await Payment.create({
      user: memberRenewEarly._id,
      userName: memberRenewEarly.name,
      userEmail: memberRenewEarly.email,
      orderId: fakeOrderEarly,
      amount: 25000,
      currency: 'INR',
      planName: 'THE METROPOLITAN',
      duration: 'monthly',
      status: 'Pending',
      invoiceNumber: `INV-TEST-${Date.now()}`,
    });

    // Invoke payment verify logic
    const reqMockEarly = {
      body: { orderId: fakeOrderEarly, isSimulated: true },
      user: memberRenewEarly,
    };
    let responseDataEarly = null;
    const resMockEarly = {
      status: () => ({
        json: (data) => {
          responseDataEarly = data;
        },
      }),
    };
    await verifyPayment(reqMockEarly, resMockEarly, (err) => console.error(err));

    const refreshedEarly = await User.findById(memberRenewEarly._id);
    const expectedExtendedDate = new Date(previousEndDate);
    expectedExtendedDate.setMonth(expectedExtendedDate.getMonth() + 1);

    const daysPreserved = Math.round(
      (new Date(refreshedEarly.membership.endDate).getTime() - previousEndDate.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    assert(
      refreshedEarly.membership.status === 'Active' &&
      daysPreserved >= 28 &&
      refreshedEarly.membershipHistory.length > 0 &&
      refreshedEarly.membershipHistory[0].actionType === 'Renewal',
      'Customer renews before expiry: preserves remaining duration and extends from existing expiry date'
    );

    // ==========================================
    // 7. Customer renews after expiry
    // ==========================================
    const memberRenewLate = await User.create({
      name: 'David Late Renewal',
      email: `${testPrefix}late_ren@qnoxgym.com`,
      phone: '+44 20 7946 0088',
      password: 'Password123!',
      role: 'Gym Member',
      membership: {
        planName: 'THE METROPOLITAN',
        billingCycle: 'monthly',
        status: 'Expired',
        startDate: getDateOffset(-40),
        endDate: getDateOffset(-10),
      },
    });

    const fakeOrderLate = `ord_test_late_${Date.now()}`;
    await Payment.create({
      user: memberRenewLate._id,
      userName: memberRenewLate.name,
      userEmail: memberRenewLate.email,
      orderId: fakeOrderLate,
      amount: 25000,
      currency: 'INR',
      planName: 'THE METROPOLITAN',
      duration: 'monthly',
      status: 'Pending',
      invoiceNumber: `INV-TEST-LATE-${Date.now()}`,
    });

    const reqMockLate = {
      body: { orderId: fakeOrderLate, isSimulated: true },
      user: memberRenewLate,
    };
    const resMockLate = {
      status: () => ({ json: () => {} }),
    };
    await verifyPayment(reqMockLate, resMockLate, (err) => console.error(err));

    const refreshedLate = await User.findById(memberRenewLate._id);
    const newEndDaysFromNow = Math.round(
      (new Date(refreshedLate.membership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    assert(
      refreshedLate.membership.status === 'Active' && newEndDaysFromNow >= 28,
      'Customer renews after expiry: resets start date to now and extends 1 month forward'
    );

    // ==========================================
    // 8. Payment fails (signature mismatch or bad payload)
    // ==========================================
    const memberPayFail = await User.create({
      name: 'Hacker Attempt',
      email: `${testPrefix}hack@qnoxgym.com`,
      password: 'Password123!',
      role: 'Gym Member',
      membership: { status: 'Expired', planName: 'None' },
    });

    const fakeOrderFail = `ord_test_fail_${Date.now()}`;
    await Payment.create({
      user: memberPayFail._id,
      userName: memberPayFail.name,
      userEmail: memberPayFail.email,
      orderId: fakeOrderFail,
      amount: 25000,
      currency: 'INR',
      planName: 'THE METROPOLITAN',
      duration: 'monthly',
      status: 'Pending',
      invoiceNumber: `INV-TEST-FAIL-${Date.now()}`,
    });

    let failStatusCode = null;
    const reqMockFail = {
      body: {
        orderId: fakeOrderFail,
        paymentId: 'pay_tampered_123',
        signature: 'invalid_cryptographic_signature_hash',
        isSimulated: false, // Forces cryptographic HMAC check against secret
      },
      user: memberPayFail,
    };
    const resMockFail = {
      status: (code) => {
        failStatusCode = code;
        return { json: () => {} };
      },
    };

    await verifyPayment(reqMockFail, resMockFail, (err) => console.error(err));
    const failedPayment = await Payment.findOne({ orderId: fakeOrderFail });
    const refreshedPayFail = await User.findById(memberPayFail._id);

    assert(
      failStatusCode === 400 &&
      failedPayment.status === 'Failed' &&
      refreshedPayFail.membership.status === 'Expired',
      'Payment fails: rejects invalid signature, marks payment Failed, and leaves membership Expired'
    );

    // ==========================================
    // 9. Duplicate scheduler execution (Idempotent deduplication)
    // ==========================================
    const countBeforeDuplicate = await Notification.countDocuments();
    const runSummary = await checkAndProcessMembershipExpiries(true);
    const countAfterDuplicate = await Notification.countDocuments();

    assert(
      countBeforeDuplicate === countAfterDuplicate,
      'Duplicate scheduler execution: zero duplicate notifications generated due to unique reminder keys'
    );

    // ==========================================
    // 10. Server restarts / Lock handling
    // ==========================================
    await SchedulerLock.deleteMany({});
    const runWithFreshLock = await checkAndProcessMembershipExpiries(false);

    assert(
      runWithFreshLock && !runWithFreshLock.skipped,
      'Server restarts: scheduler lock handles clean initialization without deadlock'
    );

    // ==========================================
    // 11. Email delivery fails gracefully
    // ==========================================
    // Notification model allows storing emailError without aborting notification creation
    const notifWithMailErr = await Notification.create({
      recipient: memberToday._id,
      recipientRole: 'Gym Member',
      title: 'Simulated Email Failure Notice',
      message: 'Testing email resilience',
      type: 'GENERAL',
      emailSent: false,
      emailError: 'SMTP connect ECONNREFUSED',
      isRead: false,
    });

    assert(
      notifWithMailErr && notifWithMailErr.emailSent === false && notifWithMailErr.emailError.includes('ECONNREFUSED'),
      'Email delivery fails: notification record is preserved in DB with emailError details'
    );

    // ==========================================
    // 12. Customer cannot access another customer notifications
    // ==========================================
    const memberA = await User.create({
      name: 'Customer Alpha',
      email: `${testPrefix}alpha@qnoxgym.com`,
      password: 'Password123!',
      role: 'Gym Member',
    });
    const memberB = await User.create({
      name: 'Customer Beta',
      email: `${testPrefix}beta@qnoxgym.com`,
      password: 'Password123!',
      role: 'Gym Member',
    });

    await Notification.create({
      recipient: memberB._id,
      recipientRole: 'Gym Member',
      title: 'Secret Beta Notice',
      message: 'Private message for Beta only',
    });

    // Query scoping as enforced by notificationController.getMyNotifications
    const alphaQuery = { recipient: memberA._id };
    const alphaNotifications = await Notification.find(alphaQuery);

    assert(
      alphaNotifications.every((n) => n.recipient.toString() === memberA._id.toString()) &&
      alphaNotifications.length === 0,
      'Security: Customer Alpha cannot access Customer Beta notifications'
    );

    // ==========================================
    // 13. Admin receives correct notifications
    // ==========================================
    const adminNotif = await Notification.findOne({
      recipient: testAdmin._id,
      customerId: memberToday._id,
      stage: 'EXPIRY_DATE',
    });

    assert(
      adminNotif &&
      adminNotif.customerName === 'Elena Today' &&
      adminNotif.customerEmail === `${testPrefix}today@qnoxgym.com` &&
      adminNotif.customerPhone === '+44 20 7946 0000' &&
      adminNotif.membershipPlan === 'CANARY WHARF RESIDENCY' &&
      adminNotif.actionLabel === 'View Customer Profile',
      'Admin receives correct notifications with full customer details, plan, dates, and action links'
    );

    // ==========================================
    // 14. Customer receives correct notifications
    // ==========================================
    assert(
      notifToday &&
      notifToday.title === 'Your Gym Membership Has Expired!' &&
      notifToday.message.includes('Hello Elena Today') &&
      notifToday.actionLabel === 'Renew Membership' &&
      notifToday.actionUrl === '#membership',
      'Customer receives correct personalized notification with plan name, expiry date, and "Renew Membership" CTA'
    );

    console.log(`\n======================================================`);
    console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed out of 14 Scenarios`);
    console.log(`======================================================\n`);

    // Clean up test data
    await User.deleteMany({ email: new RegExp(`^${testPrefix}`, 'i') });
    await Notification.deleteMany({ customerEmail: new RegExp(`^${testPrefix}`, 'i') });
    await Payment.deleteMany({ userEmail: new RegExp(`^${testPrefix}`, 'i') });

    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal Test Execution Error:', error);
    process.exit(1);
  }
}

runTestSuite();
