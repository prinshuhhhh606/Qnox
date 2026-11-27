const express = require('express');
const router = express.Router();
const {
  getSaaSPlans,
  registerGymOwner,
  verifySaaSPayment,
  getMyOrganization,
  updateMyOrganization,
  getMyBranches,
  createTenantBranch,
  updateTenantBranch,
  deleteTenantBranch,
  getMyTrainers,
  createTenantTrainer,
  deleteTenantTrainer,
  getMyMembers,
  createTenantMember,
  getMyInvoices,
  getInvoiceByNumber,
  upgradeSaaSSubscription,
  getTenantAnalytics,
  getAdminTenants,
  updateAdminTenantStatus,
  updateAdminTenantPlan,
} = require('../controllers/saasController');
const { protect, authorize } = require('../middlewares/auth');
const { verifyTenant } = require('../middlewares/tenant');

// Public SaaS Onboarding Routes
router.get('/plans', getSaaSPlans);
router.post('/register-owner', registerGymOwner);
router.post('/verify-payment', verifySaaSPayment);

// Private Gym Owner Tenant Routes
router.get('/my-organization', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyOrganization);
router.put('/my-organization', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateMyOrganization);

// Branches
router.get('/my-branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyBranches);
router.post('/branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantBranch);
router.put('/branches/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateTenantBranch);
router.delete('/branches/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, deleteTenantBranch);

// Trainers
router.get('/my-trainers', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyTrainers);
router.post('/trainers', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantTrainer);
router.delete('/trainers/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, deleteTenantTrainer);

// Members
router.get('/my-members', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyMembers);
router.post('/members', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantMember);

// Invoices & Billing
router.get('/my-invoices', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyInvoices);
router.get('/invoices/:invoiceNumber', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getInvoiceByNumber);
router.post('/upgrade-subscription', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, upgradeSaaSSubscription);

// Analytics
router.get('/analytics', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getTenantAnalytics);

// Super Admin SaaS Platform Management
router.get('/admin/tenants', protect, authorize('Super Admin'), getAdminTenants);
router.put('/admin/tenants/:id/status', protect, authorize('Super Admin'), updateAdminTenantStatus);
router.put('/admin/tenants/:id/plan', protect, authorize('Super Admin'), updateAdminTenantPlan);

module.exports = router;
