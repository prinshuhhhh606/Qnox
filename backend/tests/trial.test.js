const mongoose = require('mongoose');
const User = require('../src/models/User');
const MembershipPlan = require('../src/models/MembershipPlan');
const Payment = require('../src/models/Payment');
const { startFreeTrial, getMyMembership, getTrialStatus } = require('../src/controllers/membershipController');
const { bookClass } = require('../src/controllers/bookingController');
const { verifyPayment } = require('../src/controllers/paymentController');
const { getDashboardOverview, getMembersList } = require('../src/controllers/adminController');
const { connectDB } = require('../src/config/db');

// Helper to create mock res
const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

async function runTrialTestSuite() {
  console.log('\n======================================================');
  console.log('🏛️  QNOX GYM — 3-DAY FREE TRIAL SYSTEM COMPREHENSIVE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await connectDB();

    // Setup Test Plan
    let plan = await MembershipPlan.findOne({ name: /Resident|Metropolitan|Obsidian/i });
    if (!plan) {
      plan = await MembershipPlan.create({
        name: 'THE METROPOLITAN',
        code: 'METROPOLITAN',
        subtitle: 'London All-Sanctuary Access',
        description: 'Unrestricted entry across all London clubs.',
        pricing: { monthly: 1800, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
        benefits: ['Full spa', 'All clubs'],
        features: { accessType: 'All 5 London Clubs' },
        isActive: true,
      });
    }

    // SCENARIO 1: New customer can activate a free trial
    const testEmail1 = `trial_user_${Date.now()}@qnoxfit.com`;
    const user1 = await User.create({
      name: 'Julian Sterling',
      email: testEmail1,
      password: 'Password123!',
      role: 'Gym Member',
    });

    const req1 = { user: user1 };
    const res1 = createMockRes();
    await startFreeTrial(req1, res1, (e) => console.error(e));

    assert(res1.statusCode === 200, 'Scenario 1: New customer successfully activated 3-Day Free Trial');
    assert(res1.jsonData.data.trial.status === 'Active', 'Scenario 1: Trial status is set to "Active"');

    // SCENARIO 2: Trial duration is exactly 72 hours
    const start = new Date(res1.jsonData.data.trial.startDate).getTime();
    const end = new Date(res1.jsonData.data.trial.endDate).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    assert(Math.round(diffHours) === 72, `Scenario 2: Trial duration is exactly 72 hours (calculated: ${diffHours}h)`);

    // SCENARIO 3: Customer cannot activate trial twice
    const res1Duplicate = createMockRes();
    await startFreeTrial(req1, res1Duplicate, (e) => {});
    assert(res1Duplicate.statusCode === 400, 'Scenario 3: Second trial activation rejected with HTTP 400');
    assert(
      res1Duplicate.jsonData.message.includes('already utilized'),
      'Scenario 3: Explanatory error message returned'
    );

    // SCENARIO 4: Customer can use eligible features during active trial
    const bookingReqActive = {
      user: user1,
      body: {
        classId: new mongoose.Types.ObjectId().toString(),
        classTitle: 'High-Altitude Hypoxic Conditioning',
        clubName: 'Mayfair Sanctuary',
        trainerName: 'Marcus Vance',
      },
    };
    const bookingResActive = createMockRes();
    await bookClass(bookingReqActive, bookingResActive, (e) => {});
    // Should NOT be blocked with 403
    assert(bookingResActive.statusCode !== 403, 'Scenario 4: Active trial holder allowed to access sanctuary booking');

    // SCENARIO 5: Expired trial access blocked by backend
    // Simulate expired trial by advancing endDate to the past
    user1.trial.endDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    user1.trial.status = 'Active'; // was active, now expired by time
    await user1.save({ validateBeforeSave: false });

    const bookingReqExpired = {
      user: user1,
      body: {
        classId: new mongoose.Types.ObjectId().toString(),
        classTitle: 'Sub-Zero Cryotherapy Session',
        clubName: 'Mayfair Sanctuary',
      },
    };
    const bookingResExpired = createMockRes();
    await bookClass(bookingReqExpired, bookingResExpired, (e) => {});
    assert(bookingResExpired.statusCode === 403, 'Scenario 5: Expired trial blocked with HTTP 403 Forbidden');
    assert(bookingResExpired.jsonData.code === 'TRIAL_EXPIRED', 'Scenario 5: Backend returns TRIAL_EXPIRED code');

    // SCENARIO 6: Expired trial status auto-updates on backend read & displays upgrade prompts
    const myMemRes = createMockRes();
    await getMyMembership(req1, myMemRes, (e) => {});
    assert(myMemRes.jsonData.data.trial.status === 'Expired', 'Scenario 6: Backend auto-marked trial status as Expired');
    assert(myMemRes.jsonData.data.trial.isActive === false, 'Scenario 6: Trial isActive is false');

    // SCENARIO 7 & 8: Customer can purchase paid membership and converts trial
    const orderId = `order_sim_${Date.now()}`;
    const payment = await Payment.create({
      user: user1._id,
      userEmail: user1.email,
      userName: user1.name,
      planId: plan._id,
      planName: plan.name,
      duration: 'monthly',
      amount: plan.pricing.monthly,
      orderId,
      receipt: `rec_${Date.now()}`,
      invoiceNumber: `INV-${Date.now()}`,
      status: 'Pending',
    });

    const verifyReq = {
      user: user1,
      body: {
        orderId,
        paymentId: `pay_sim_${Date.now()}`,
        signature: 'simulated_signature_valid',
      },
    };
    const verifyRes = createMockRes();
    await verifyPayment(verifyReq, verifyRes, (e) => {});

    assert(verifyRes.statusCode === 200, 'Scenario 8: Paid membership activated after payment verification');
    assert(verifyRes.jsonData.data.membership.status === 'Active', 'Scenario 8: Membership status is Active');

    // Refresh user1 from DB
    const freshUser1 = await User.findById(user1._id);
    assert(freshUser1.trial.status === 'Converted', 'Scenario 7: Trial status converted to "Converted" upon paid upgrade');
    assert(freshUser1.trial.isActive === false, 'Scenario 7: Trial isActive is false after paid conversion');

    // SCENARIO 9: Existing paid members cannot claim another free trial
    const resPaidTrialAttempt = createMockRes();
    await startFreeTrial({ user: freshUser1 }, resPaidTrialAttempt, (e) => {});
    assert(resPaidTrialAttempt.statusCode === 400, 'Scenario 9: Active paid member prevented from claiming free trial');

    // SCENARIO 10: Admin can view trial records and statuses
    const adminOverviewRes = createMockRes();
    await getDashboardOverview({}, adminOverviewRes, (e) => {});
    assert(
      adminOverviewRes.jsonData.data.stats.trialStats !== undefined,
      'Scenario 10: Admin overview includes trialStats intelligence'
    );
    assert(
      adminOverviewRes.jsonData.data.stats.trialStats.totalTrials >= 1,
      'Scenario 10: Admin stats track total trial activations'
    );

    const adminMembersRes = createMockRes();
    await getMembersList({ query: { status: 'All Trials' } }, adminMembersRes, (e) => {});
    assert(adminMembersRes.statusCode === 200, 'Scenario 10: Admin members query supports All Trials filtering');

    console.log(`\n======================================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  }
}

runTrialTestSuite();
