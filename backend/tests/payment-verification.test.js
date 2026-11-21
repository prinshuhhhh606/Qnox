require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const { createOrder, verifyPayment } = require('../src/controllers/paymentController');
const { verifyRazorpaySignature } = require('../src/services/paymentService');
const crypto = require('crypto');

async function runPaymentTests() {
  console.log('\n======================================================');
  console.log('💳 QNOX GYM - PAYMENT VERIFICATION TEST SUITE');
  console.log('   Testing all 10 Requirements from User Specification');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS [${passed + failed + 1}]: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL [${passed + failed + 1}]: ${name}\n     Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS [${passed + failed + 1}]: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL [${passed + failed + 1}]: ${name}\n     Error: ${err.message}`);
      failed++;
    }
  }

  // --- Scenario 1: Signature Verification Function with Valid Razorpay HMAC ---
  test('Valid HMAC SHA256 signature is verified correctly', () => {
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_qnox_luxury_secret';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = verifyRazorpaySignature({ orderId, paymentId, signature: validSignature });
    assert.strictEqual(result, true, 'Valid signature must return true');
  });

  // --- Scenario 2: Invalid HMAC SHA256 Signature ---
  test('Invalid HMAC SHA256 signature is rejected', () => {
    const result = verifyRazorpaySignature({
      orderId: 'order_test_12345',
      paymentId: 'pay_test_67890',
      signature: 'invalid_tampered_signature_9999',
    });
    assert.strictEqual(result, false, 'Invalid signature must return false');
  });

  // --- Scenario 3: Missing Required Field - orderId returns 400 ---
  await testAsync('verifyPayment returns 400 when orderId is missing', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        paymentId: 'pay_123',
        signature: 'sig_123',
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    await verifyPayment(req, res, () => {});
    assert.strictEqual(statusCode, 400, 'Status must be 400 for missing orderId');
    assert.strictEqual(jsonResponse.success, false);
    assert(jsonResponse.message.includes('orderId'), 'Error message must specify missing orderId');
  });

  // --- Scenario 4: Missing Required Field - paymentId returns 400 ---
  await testAsync('verifyPayment returns 400 when paymentId is missing', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_123',
        signature: 'sig_123',
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    await verifyPayment(req, res, () => {});
    assert.strictEqual(statusCode, 400, 'Status must be 400 for missing paymentId');
    assert.strictEqual(jsonResponse.success, false);
    assert(jsonResponse.message.includes('paymentId'), 'Error message must specify missing paymentId');
  });

  // --- Scenario 5: Missing Required Field - signature returns 400 ---
  await testAsync('verifyPayment returns 400 when signature is missing', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_123',
        paymentId: 'pay_123',
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    await verifyPayment(req, res, () => {});
    assert.strictEqual(statusCode, 400, 'Status must be 400 for missing signature');
    assert.strictEqual(jsonResponse.success, false);
    assert(jsonResponse.message.includes('signature'), 'Error message must specify missing signature');
  });

  // --- Scenario 6: Non-existent orderId returns 404 ---
  await testAsync('verifyPayment returns 404 when orderId is not found in database', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;
    Payment.findOne = async () => null; // Mock order not found

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_non_existent_9999',
        paymentId: 'pay_123',
        signature: 'sig_123',
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    try {
      await verifyPayment(req, res, () => {});
      assert.strictEqual(statusCode, 404, 'Status must be 404 for missing DB order record');
      assert.strictEqual(jsonResponse.success, false);
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  // --- Scenario 7: Duplicate Verification returns 200 (Idempotent) ---
  await testAsync('verifyPayment returns 200 without reprocessing when already completed', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;

    const mockCompletedPayment = {
      orderId: 'order_already_done',
      status: 'Completed',
      amount: 1500,
      currency: 'INR',
      planName: 'THE RESIDENT',
      duration: 'monthly',
    };
    Payment.findOne = async () => mockCompletedPayment;

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_already_done',
        paymentId: 'pay_123',
        signature: 'sig_123',
      },
      user: {
        _id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        membership: { status: 'Active', planName: 'THE RESIDENT' },
      },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    let nextErr = null;
    try {
      await verifyPayment(req, res, (err) => { nextErr = err; });
      if (nextErr) throw nextErr;
      assert.strictEqual(statusCode, 200, 'Duplicate request must return 200 idempotent response');
      assert.strictEqual(jsonResponse.success, true);
      assert(jsonResponse && jsonResponse.message && jsonResponse.message.includes('already been verified'), 'Message must indicate already been verified');
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  // --- Scenario 8: Amount Mismatch returns 400 ---
  await testAsync('verifyPayment returns 400 when payment amount mismatches order record', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;

    let savedStatus = null;
    const mockPendingPayment = {
      orderId: 'order_amount_test',
      status: 'Pending',
      amount: 4000,
      currency: 'INR',
      planName: 'THE METROPOLITAN',
      duration: 'quarterly',
      async save() {
        savedStatus = this.status;
      },
    };
    Payment.findOne = async () => mockPendingPayment;

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_amount_test',
        paymentId: 'pay_123',
        signature: 'verified_simulated_sig',
        amount: 1500, // Expected 4000
        isSimulated: true,
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    try {
      await verifyPayment(req, res, () => {});
      assert.strictEqual(statusCode, 400, 'Status must be 400 on amount mismatch');
      assert.strictEqual(jsonResponse.success, false);
      assert(jsonResponse.message.includes('mismatch'), 'Message must describe amount mismatch');
      assert.strictEqual(savedStatus, 'Failed', 'Payment status must be marked Failed on mismatch');
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  // --- Scenario 9: Invalid Signature on real order returns 400 and marks payment Failed ---
  await testAsync('verifyPayment marks payment as Failed and returns 400 on forged signature', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;

    let savedStatus = null;
    const mockPendingPayment = {
      orderId: 'order_real_12345',
      status: 'Pending',
      amount: 1500,
      currency: 'INR',
      planName: 'THE RESIDENT',
      duration: 'monthly',
      isSimulated: false, // Real order
      async save() {
        savedStatus = this.status;
      },
    };
    Payment.findOne = async () => mockPendingPayment;

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_real_12345',
        paymentId: 'pay_99999',
        signature: 'fraudulent_invalid_signature',
        isSimulated: false,
      },
      user: { _id: 'user_1', name: 'John Doe', email: 'john@example.com' },
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    try {
      await verifyPayment(req, res, () => {});
      assert.strictEqual(statusCode, 400, 'Status must be 400 for invalid signature');
      assert.strictEqual(jsonResponse.success, false);
      assert.strictEqual(savedStatus, 'Failed', 'Payment must be marked as Failed in DB');
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  // --- Scenario 10: Successful Payment Verification activates membership & updates DB ---
  await testAsync('Successful payment verification updates payment to Completed and activates membership', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;

    let savedPaymentStatus = null;
    const mockPendingPayment = {
      orderId: 'order_sim_success_123',
      status: 'Pending',
      amount: 1500,
      currency: 'INR',
      planId: '654321098765432109876543',
      planName: 'THE RESIDENT',
      duration: 'monthly',
      invoiceNumber: 'INV-2026-TEST01',
      isSimulated: true,
      async save() {
        savedPaymentStatus = this.status;
      },
    };
    Payment.findOne = async () => mockPendingPayment;

    let userSaved = false;
    const mockUser = {
      _id: 'user_123',
      name: 'Prince Member',
      email: 'prince@example.com',
      membership: null,
      membershipHistory: [],
      async save() {
        userSaved = true;
      },
    };

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        orderId: 'order_sim_success_123',
        paymentId: 'pay_sim_987654',
        signature: 'verified_simulated_sig',
        isSimulated: true,
      },
      user: mockUser,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    try {
      await verifyPayment(req, res, () => {});
      assert.strictEqual(statusCode, 200, 'Status must be 200 for successful verification');
      assert.strictEqual(jsonResponse.success, true);
      assert.strictEqual(savedPaymentStatus, 'Completed', 'Payment status must be Completed');
      assert(userSaved, 'User record must be saved with new membership');
      assert.strictEqual(mockUser.membership.status, 'Active', 'Membership status must be Active');
      assert.strictEqual(mockUser.membership.planName, 'THE RESIDENT');
      assert.strictEqual(mockUser.membership.billingCycle, 'monthly');
      assert(mockUser.membership.endDate > mockUser.membership.startDate, 'End date must be in future');
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  // --- Scenario 11: Support both razorpay_order_id and orderId field names ---
  await testAsync('verifyPayment successfully accepts Razorpay snake_case parameter names', async () => {
    const Payment = require('../src/models/Payment');
    const originalFindOne = Payment.findOne;

    const mockPendingPayment = {
      orderId: 'order_snake_case_test',
      status: 'Pending',
      amount: 7000,
      currency: 'INR',
      planId: '654321098765432109876543',
      planName: 'THE METROPOLITAN',
      duration: 'halfYearly',
      invoiceNumber: 'INV-2026-TEST02',
      isSimulated: true,
      async save() {},
    };
    Payment.findOne = async ({ orderId }) => {
      if (orderId === 'order_snake_case_test') return mockPendingPayment;
      return null;
    };

    const mockUser = {
      _id: 'user_123',
      name: 'Prince Member',
      email: 'prince@example.com',
      membership: null,
      membershipHistory: [],
      async save() {},
    };

    let statusCode = null;
    let jsonResponse = null;

    const req = {
      body: {
        razorpay_order_id: 'order_snake_case_test',
        razorpay_payment_id: 'pay_sim_112233',
        razorpay_signature: 'verified_simulated_sig',
        isSimulated: true,
      },
      user: mockUser,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
      },
    };

    try {
      await verifyPayment(req, res, () => {});
      assert.strictEqual(statusCode, 200, 'Must accept razorpay_order_id without error');
      assert.strictEqual(jsonResponse.success, true);
    } finally {
      Payment.findOne = originalFindOne;
    }
  });

  console.log(`\n======================================================`);
  console.log(`  PAYMENT VERIFICATION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
