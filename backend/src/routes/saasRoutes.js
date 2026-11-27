const express = require('express');
const router = express.Router();
const {
  getSaaSPlans,
  registerGymOwner,
  verifySaaSPayment,
  getMyOrganization,
  getMyBranches,
  createTenantBranch,
  getTenantAnalytics,
} = require('../controllers/saasController');
const { protect, authorize } = require('../middlewares/auth');
const { verifyTenant } = require('../middlewares/tenant');

// Public SaaS Onboarding Routes
router.get('/plans', getSaaSPlans);
router.post('/register-owner', registerGymOwner);
router.post('/verify-payment', verifySaaSPayment);

// Private Gym Owner Tenant Routes
router.get('/my-organization', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyOrganization);
router.get('/my-branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyBranches);
router.post('/branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantBranch);
router.get('/analytics', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getTenantAnalytics);

module.exports = router;
