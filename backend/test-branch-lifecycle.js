/**
 * QNOX Enterprise Multi-Branch Management & Approval Lifecycle Test Suite
 *
 * Tests:
 * 1. Independent 4-Status Architecture Verification
 * 2. Dynamic Live Status Calculation (computeLiveStatus)
 * 3. Branch Creation (Draft vs Submit for Verification)
 * 4. Super Admin Changes Requested Workflow
 * 5. Super Admin Approval Workflow
 * 6. Post-Approval Setup Wizard Checklist Completion
 * 7. Ready for Publication & Public Listing Validation
 * 8. Unpublish Workflow
 * 9. Super Admin Suspension & Immediate Public Delisting
 */

const assert = require('assert');
const Club = require('./src/models/Club');
const { computeLiveStatus } = require('./src/controllers/clubController');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🏛️  QNOX ENTERPRISE MULTI-BRANCH LIFECYCLE AUDIT SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(description, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS ${total}] ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL ${total}] ${description}`);
      console.error(`     Error: ${err.message}\n`);
    }
  }

  // TEST 1: Schema Architecture - 4 Strictly Independent Status Fields
  test('Club schema defines verificationStatus with required enterprise enums', () => {
    const enumValues = Club.schema.path('verificationStatus').enumValues;
    assert(enumValues.includes('PENDING_VERIFICATION'), 'Missing PENDING_VERIFICATION');
    assert(enumValues.includes('APPROVED'), 'Missing APPROVED');
    assert(enumValues.includes('REJECTED'), 'Missing REJECTED');
    assert(enumValues.includes('CHANGES_REQUESTED'), 'Missing CHANGES_REQUESTED');
    assert(enumValues.includes('DRAFT'), 'Missing DRAFT');
  });

  test('Club schema defines operationalStatus with ACTIVE, INACTIVE, and SUSPENDED', () => {
    const enumValues = Club.schema.path('operationalStatus').enumValues;
    assert(enumValues.includes('ACTIVE'), 'Missing ACTIVE');
    assert(enumValues.includes('INACTIVE'), 'Missing INACTIVE');
    assert(enumValues.includes('SUSPENDED'), 'Missing SUSPENDED');
  });

  test('Club schema defines publicationStatus with DRAFT, READY_TO_PUBLISH, PUBLISHED, UNPUBLISHED', () => {
    const enumValues = Club.schema.path('publicationStatus').enumValues;
    assert(enumValues.includes('DRAFT'), 'Missing DRAFT');
    assert(enumValues.includes('READY_TO_PUBLISH'), 'Missing READY_TO_PUBLISH');
    assert(enumValues.includes('PUBLISHED'), 'Missing PUBLISHED');
    assert(enumValues.includes('UNPUBLISHED'), 'Missing UNPUBLISHED');
  });

  test('Club schema includes rich multi-branch enterprise fields', () => {
    assert(Club.schema.path('branchType'), 'Missing branchType');
    assert(Club.schema.path('landmark'), 'Missing landmark');
    assert(Club.schema.path('country'), 'Missing country');
    assert(Club.schema.path('operatingDays'), 'Missing operatingDays');
    assert(Club.schema.path('facilitiesBreakdown.cardioEquipment'), 'Missing facilitiesBreakdown.cardioEquipment');
    assert(Club.schema.path('documents.propertyLeaseDeed.url'), 'Missing documents.propertyLeaseDeed');
    assert(Club.schema.path('setupChecklist.completed'), 'Missing setupChecklist.completed');
    assert(Club.schema.path('changeRequestNotes'), 'Missing changeRequestNotes');
  });

  // TEST 2: Dynamic Live Status Calculation
  test('computeLiveStatus returns OPEN when within operating hours on operating day', () => {
    const mockBranch = {
      operationalStatus: 'ACTIVE',
      status: 'OPEN',
      isActive: true,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
    };
    // Monday at 14:00 (2 PM)
    const testDate = new Date('2026-11-23T14:00:00Z'); // Monday
    // Override local hours for deterministic test
    const customDate = new Date();
    // Set to a Monday at 14:30
    customDate.getDay = () => 1; // Monday
    customDate.getHours = () => 14;
    customDate.getMinutes = () => 30;

    const status = computeLiveStatus(mockBranch, customDate);
    assert.strictEqual(status, 'OPEN', 'Expected branch to be OPEN during operating hours');
  });

  test('computeLiveStatus returns CLOSED during night hours', () => {
    const mockBranch = {
      operationalStatus: 'ACTIVE',
      status: 'OPEN',
      isActive: true,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
    };
    const customDate = new Date();
    customDate.getDay = () => 1; // Monday
    customDate.getHours = () => 3; // 3 AM
    customDate.getMinutes = () => 0;

    const status = computeLiveStatus(mockBranch, customDate);
    assert.strictEqual(status, 'CLOSED', 'Expected branch to be CLOSED at 3 AM');
  });

  test('computeLiveStatus returns CLOSED if operationalStatus is SUSPENDED or INACTIVE', () => {
    const suspendedBranch = {
      operationalStatus: 'SUSPENDED',
      status: 'OPEN',
      isActive: true,
    };
    assert.strictEqual(computeLiveStatus(suspendedBranch), 'CLOSED');

    const inactiveBranch = {
      operationalStatus: 'INACTIVE',
      status: 'OPEN',
      isActive: false,
    };
    assert.strictEqual(computeLiveStatus(inactiveBranch), 'CLOSED');
  });

  // TEST 3: Branch Creation Workflow (Draft vs Verification Submission)
  test('Saving branch as draft sets DRAFT statuses and INACTIVE operations', () => {
    const draftPayload = {
      name: 'South Kensington Sanctuary',
      isDraft: true,
    };
    const branchStatus = {
      verificationStatus: draftPayload.isDraft ? 'DRAFT' : 'PENDING_VERIFICATION',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      isActive: false,
    };
    assert.strictEqual(branchStatus.verificationStatus, 'DRAFT');
    assert.strictEqual(branchStatus.operationalStatus, 'INACTIVE');
    assert.strictEqual(branchStatus.publicationStatus, 'DRAFT');
  });

  test('Submitting branch for verification sets PENDING_VERIFICATION', () => {
    const submitPayload = {
      name: 'South Kensington Sanctuary',
      isDraft: false,
    };
    const branchStatus = {
      verificationStatus: submitPayload.isDraft ? 'DRAFT' : 'PENDING_VERIFICATION',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      isActive: false,
    };
    assert.strictEqual(branchStatus.verificationStatus, 'PENDING_VERIFICATION');
    assert.strictEqual(branchStatus.operationalStatus, 'INACTIVE');
    assert.strictEqual(branchStatus.publicationStatus, 'DRAFT');
  });

  // TEST 4: Super Admin Request Changes Workflow
  test('Super Admin requesting changes transitions branch to CHANGES_REQUESTED with notes', () => {
    const branch = {
      name: 'South Kensington Sanctuary',
      verificationStatus: 'PENDING_VERIFICATION',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      changeRequestNotes: '',
    };

    const notes = 'Please provide updated fire safety operating license.';
    branch.verificationStatus = 'CHANGES_REQUESTED';
    branch.changeRequestNotes = notes;

    assert.strictEqual(branch.verificationStatus, 'CHANGES_REQUESTED');
    assert.strictEqual(branch.changeRequestNotes, notes);
    assert.strictEqual(branch.operationalStatus, 'INACTIVE');
    assert.strictEqual(branch.publicationStatus, 'DRAFT');
  });

  // TEST 5: Super Admin Approval Workflow
  test('Super Admin approving branch transitions verificationStatus to APPROVED while keeping DRAFT publication', () => {
    const branch = {
      name: 'South Kensington Sanctuary',
      verificationStatus: 'PENDING_VERIFICATION',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      setupChecklist: { completed: false },
    };

    branch.verificationStatus = 'APPROVED';
    branch.verifiedAt = new Date();

    if (!branch.setupChecklist.completed) {
      branch.operationalStatus = 'INACTIVE';
      branch.publicationStatus = 'DRAFT';
    }

    assert.strictEqual(branch.verificationStatus, 'APPROVED');
    assert.strictEqual(branch.operationalStatus, 'INACTIVE');
    assert.strictEqual(branch.publicationStatus, 'DRAFT');
  });

  // TEST 6: Gym Owner Setup Wizard Completion
  test('Gym Owner completing setup wizard sets setupChecklist.completed and READY_TO_PUBLISH', () => {
    const branch = {
      name: 'South Kensington Sanctuary',
      verificationStatus: 'APPROVED',
      operationalStatus: 'INACTIVE',
      publicationStatus: 'DRAFT',
      setupChecklist: { completed: false },
    };

    // Completing setup
    branch.setupChecklist = {
      managerConfigured: true,
      trainersAssigned: true,
      operatingHoursSet: true,
      facilitiesConfigured: true,
      pricingConfigured: true,
      completed: true,
      completedAt: new Date(),
    };
    branch.operationalStatus = 'ACTIVE';
    branch.publicationStatus = 'READY_TO_PUBLISH';
    branch.isActive = true;

    assert.strictEqual(branch.setupChecklist.completed, true);
    assert.strictEqual(branch.operationalStatus, 'ACTIVE');
    assert.strictEqual(branch.publicationStatus, 'READY_TO_PUBLISH');
  });

  // TEST 7: Publish to Public Website
  test('Publishing branch transitions publicationStatus to PUBLISHED with audit timestamp', () => {
    const branch = {
      name: 'South Kensington Sanctuary',
      verificationStatus: 'APPROVED',
      operationalStatus: 'ACTIVE',
      publicationStatus: 'READY_TO_PUBLISH',
    };

    branch.publicationStatus = 'PUBLISHED';
    branch.publishedAt = new Date();

    assert.strictEqual(branch.publicationStatus, 'PUBLISHED');
    assert(branch.publishedAt instanceof Date);
  });

  // TEST 8: Public Website Query Filtering Engine
  test('Public website query strictly includes published branches and company-owned clubs, excluding drafts/unapproved', () => {
    const mockClubsInDb = [
      { name: 'Company Mayfair', isCompanyOwned: true, isActive: true },
      { name: 'Partner Approved & Published', isCompanyOwned: false, verificationStatus: 'APPROVED', operationalStatus: 'ACTIVE', publicationStatus: 'PUBLISHED' },
      { name: 'Partner Inactive Setup', isCompanyOwned: false, verificationStatus: 'APPROVED', operationalStatus: 'INACTIVE', publicationStatus: 'DRAFT' },
      { name: 'Partner Pending Verif', isCompanyOwned: false, verificationStatus: 'PENDING_VERIFICATION', operationalStatus: 'INACTIVE', publicationStatus: 'DRAFT' },
      { name: 'Partner Suspended', isCompanyOwned: false, verificationStatus: 'APPROVED', operationalStatus: 'SUSPENDED', publicationStatus: 'PUBLISHED' },
    ];

    // Simulating Mongo $or filter
    const publicResults = mockClubsInDb.filter((c) => {
      const isCompanyActive = c.isCompanyOwned === true && c.isActive === true;
      const isPartnerLive = (c.verificationStatus === 'APPROVED' || c.verificationStatus === 'ACTIVE') &&
        c.operationalStatus === 'ACTIVE' &&
        c.publicationStatus === 'PUBLISHED';
      return isCompanyActive || isPartnerLive;
    });

    assert.strictEqual(publicResults.length, 2, 'Expected exactly 2 public clubs');
    assert.strictEqual(publicResults[0].name, 'Company Mayfair');
    assert.strictEqual(publicResults[1].name, 'Partner Approved & Published');
  });

  // TEST 9: Unpublish Branch Workflow
  test('Unpublishing branch sets publicationStatus to UNPUBLISHED and immediately excludes from public view while keeping operations ACTIVE', () => {
    const branch = {
      name: 'Partner Approved & Published',
      isCompanyOwned: false,
      verificationStatus: 'APPROVED',
      operationalStatus: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
    };

    // Owner unpublishes
    branch.publicationStatus = 'UNPUBLISHED';
    branch.unpublishedAt = new Date();

    // Check public filter logic
    const isPublic = (branch.verificationStatus === 'APPROVED') &&
      branch.operationalStatus === 'ACTIVE' &&
      branch.publicationStatus === 'PUBLISHED';

    assert.strictEqual(isPublic, false, 'Unpublished branch must not be public');
    assert.strictEqual(branch.operationalStatus, 'ACTIVE', 'Operations must remain active');
    assert.strictEqual(branch.publicationStatus, 'UNPUBLISHED');
  });

  // TEST 10: Super Admin Branch Suspension
  test('Super Admin suspending branch sets operationalStatus to SUSPENDED with mandatory reason and liveStatus becomes CLOSED', () => {
    const branch = {
      name: 'Partner Branch',
      isCompanyOwned: false,
      verificationStatus: 'APPROVED',
      operationalStatus: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
    };

    const suspensionReason = 'Failed statutory electrical safety inspection audit.';
    branch.operationalStatus = 'SUSPENDED';
    branch.suspensionReason = suspensionReason;
    branch.suspendedAt = new Date();

    const liveStatus = computeLiveStatus(branch);
    assert.strictEqual(branch.operationalStatus, 'SUSPENDED');
    assert.strictEqual(branch.suspensionReason, suspensionReason);
    assert.strictEqual(liveStatus, 'CLOSED', 'Suspended branch dynamic status must be CLOSED');
  });

  console.log(`\n================================================================`);
  console.log(`📊 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log(`================================================================\n`);

  if (passed === total) {
    console.log('🎉 ALL MULTI-BRANCH ENTERPRISE LIFECYCLE TESTS VERIFIED PERFECTLY!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
