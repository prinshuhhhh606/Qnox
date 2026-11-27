const express = require('express');
const router = express.Router();
const {
  generateMyAccessPass,
  verifyMemberCheckIn,
  applyForPartnership,
  getPartnershipApplications,
  reviewApplication,
  getSettlements,
  disburseSettlement,
} = require('../controllers/allAccessController');
const { protect, authorize } = require('../middlewares/auth');

// Member Universal QR Pass
router.get('/my-pass', protect, generateMyAccessPass);

// Staff QR Check-In Scanner Engine
router.post(
  '/verify-check-in',
  protect,
  authorize('Branch Manager', 'Receptionist', 'Gym Owner', 'Admin', 'Super Admin'),
  verifyMemberCheckIn
);

// Partnership Application Workflow
router.post('/partner-application', protect, authorize('Gym Owner'), applyForPartnership);
router.get(
  '/partner-applications',
  protect,
  authorize('Gym Owner', 'Super Admin'),
  getPartnershipApplications
);
router.post(
  '/partner-applications/:id/review',
  protect,
  authorize('Super Admin'),
  reviewApplication
);

// Revenue Settlement Ledger
router.get('/settlements', protect, authorize('Gym Owner', 'Super Admin'), getSettlements);
router.post('/settlements/:id/disburse', protect, authorize('Super Admin'), disburseSettlement);

module.exports = router;
