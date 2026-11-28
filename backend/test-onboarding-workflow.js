const mongoose = require('mongoose');
const { calculateHaversineDistanceKm } = require('./src/controllers/saasController');

async function runOnboardingTests() {
  console.log('--- STARTING QNOX GYM OWNER ONBOARDING WORKFLOW UNIT & INTEGRATION TEST ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${message}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Haversine distance geofencing verification
  const mayfairCoords = { lat: 51.5118, lon: -0.1473 };
  const nearbySohoCoords = { lat: 51.5133, lon: -0.1322 };
  const distSoho = calculateHaversineDistanceKm(mayfairCoords.lat, mayfairCoords.lon, nearbySohoCoords.lat, nearbySohoCoords.lon);
  assert(distSoho < 5, `Geodesic distance between Mayfair and Soho is ${distSoho.toFixed(2)} KM (within 5 KM protected territory)`);

  const distantReadingCoords = { lat: 51.4543, lon: -0.9781 };
  const distReading = calculateHaversineDistanceKm(mayfairCoords.lat, mayfairCoords.lon, distantReadingCoords.lat, distantReadingCoords.lon);
  assert(distReading > 50, `Geodesic distance between Mayfair and Reading is ${distReading.toFixed(2)} KM (outside protected territory)`);

  // TEST 2: Club Model Verification Status Schema Check
  const Club = require('./src/models/Club');
  const clubSchemaPaths = Club.schema.paths;
  assert(clubSchemaPaths['verificationStatus'] !== undefined, 'Club model defines verificationStatus field');
  const allowedVerificationEnums = clubSchemaPaths['verificationStatus'].enumValues;
  assert(
    ['DRAFT', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'TERRITORY_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'].every(e => allowedVerificationEnums.includes(e)),
    'Club verificationStatus enum includes all 8 required lifecycle states'
  );

  // TEST 3: GymOwnerApplication Model Schema Check
  const GymOwnerApplication = require('./src/models/GymOwnerApplication');
  const appSchemaPaths = GymOwnerApplication.schema.paths;
  assert(appSchemaPaths['businessType'] !== undefined, 'GymOwnerApplication defines businessType');
  assert(appSchemaPaths['gstNumber'] !== undefined, 'GymOwnerApplication defines gstNumber');
  assert(appSchemaPaths['documents'] !== undefined, 'GymOwnerApplication defines documents array');
  assert(appSchemaPaths['emailVerified'] !== undefined, 'GymOwnerApplication defines emailVerified');
  assert(appSchemaPaths['phoneVerified'] !== undefined, 'GymOwnerApplication defines phoneVerified');
  const allowedAppEnums = appSchemaPaths['status'].enumValues;
  assert(allowedAppEnums.includes('ADDITIONAL_INFORMATION_REQUIRED'), 'GymOwnerApplication enum includes ADDITIONAL_INFORMATION_REQUIRED');
  assert(allowedAppEnums.includes('TERRITORY_CONFLICT'), 'GymOwnerApplication enum includes TERRITORY_CONFLICT');

  // TEST 4: Organization Model Onboarding Stages Schema Check
  const Organization = require('./src/models/Organization');
  const orgSchemaPaths = Organization.schema.paths;
  assert(orgSchemaPaths['onboardingStage'] !== undefined, 'Organization model defines onboardingStage');
  const allowedOrgStages = orgSchemaPaths['onboardingStage'].enumValues;
  assert(
    ['REGISTRATION_PENDING', 'ADMIN_REVIEW', 'PAYMENT_PENDING', 'SUBSCRIPTION_ACTIVE', 'GYM_VERIFICATION', 'TERRITORY_REVIEW', 'ACTIVE_COMPLETED', 'GYM_REJECTED'].every(s => allowedOrgStages.includes(s)),
    'Organization onboardingStage enum includes all 8 workflow stages'
  );

  // TEST 5: Controller API Handlers Export Check
  const saasController = require('./src/controllers/saasController');
  assert(typeof saasController.applyGymOwner === 'function', 'Controller exports applyGymOwner (Stage 1)');
  assert(typeof saasController.requestAdditionalInfoApplication === 'function', 'Controller exports requestAdditionalInfoApplication (Gateway 1)');
  assert(typeof saasController.registerApprovedGymOwner === 'function', 'Controller exports registerApprovedGymOwner (Stage 3)');
  assert(typeof saasController.verifySaaSPayment === 'function', 'Controller exports verifySaaSPayment (Stage 4)');
  assert(typeof saasController.submitInitialGymBranch === 'function', 'Controller exports submitInitialGymBranch (Stage 5)');
  assert(typeof saasController.getAdminGymVerifications === 'function', 'Controller exports getAdminGymVerifications (Gateway 2 queue)');
  assert(typeof saasController.approveAndActivateGymBranch === 'function', 'Controller exports approveAndActivateGymBranch (Gateway 2 activation)');
  assert(typeof saasController.rejectGymBranch === 'function', 'Controller exports rejectGymBranch (Gateway 2 rejection)');
  assert(typeof saasController.getGymOwnerOnboardingStatus === 'function', 'Controller exports getGymOwnerOnboardingStatus (6-stage tracking)');

  // Summary
  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log(`SUCCESS RATE: ${Math.round((passed / total) * 100)}%`);
  console.log(`======================================================`);
}

runOnboardingTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
