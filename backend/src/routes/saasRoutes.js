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
  toggleTenantBranchStatus,
  deleteTenantBranch,
  completeBranchSetup,
  publishTenantBranch,
  unpublishTenantBranch,
  getMyTrainers,
  createTenantTrainer,
  updateTenantTrainer,
  toggleTenantTrainerStatus,
  deleteTenantTrainer,
  getMyMembers,
  getTenantMemberDossier,
  createTenantMember,
  updateTenantMember,
  toggleTenantMemberStatus,
  getMyInvoices,
  getInvoiceByNumber,
  upgradeSaaSSubscription,
  getTenantAnalytics,
  changeOwnerPassword,
  updateOwnerProfile,
  getAdminTenants,
  updateAdminTenantStatus,
  updateAdminTenantPlan,
  applyGymOwner,
  getAdminGymOwnerApplications,
  getAdminGymOwnerApplicationById,
  approveGymOwnerApplication,
  rejectGymOwnerApplication,
  verifyInvitationToken,
  registerApprovedGymOwner,
  initiateSaaSCheckout,
  getAdminTerritories,
  updateBranchTerritory,
  requestAdditionalInfoApplication,
  submitInitialGymBranch,
  getAdminGymVerifications,
  approveAndActivateGymBranch,
  rejectGymBranch,
  requestChangesBranch,
  suspendBranch,
  getGymOwnerOnboardingStatus,
} = require('../controllers/saasController');
const { protect, authorize } = require('../middlewares/auth');
const { verifyTenant } = require('../middlewares/tenant');

// Public SaaS Pre-Approval Application & Onboarding Routes
router.get('/plans', getSaaSPlans);
router.post('/apply', applyGymOwner);
router.get('/verify-invitation/:token', verifyInvitationToken);
router.post('/register-approved', registerApprovedGymOwner);
router.post('/register-owner', registerGymOwner); // Backward compatibility
router.post('/verify-payment', verifySaaSPayment);

// Private Gym Owner Tenant Routes
router.post('/initiate-checkout', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, initiateSaaSCheckout);
router.get('/my-organization', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyOrganization);
router.put('/my-organization', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateMyOrganization);
router.put('/change-password', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), changeOwnerPassword);
router.put('/owner-profile', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), updateOwnerProfile);

// Branches
router.get('/my-branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyBranches);
router.post('/branches', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantBranch);
router.put('/branches/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateTenantBranch);
router.put('/branches/:id/setup', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, completeBranchSetup);
router.put('/branches/:id/publish', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, publishTenantBranch);
router.put('/branches/:id/unpublish', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, unpublishTenantBranch);
router.put('/branches/:id/toggle-status', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, toggleTenantBranchStatus);
router.delete('/branches/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, deleteTenantBranch);

// Trainers
router.get('/my-trainers', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyTrainers);
router.post('/trainers', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantTrainer);
router.put('/trainers/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateTenantTrainer);
router.put('/trainers/:id/toggle-status', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, toggleTenantTrainerStatus);
router.delete('/trainers/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, deleteTenantTrainer);

// Members
router.get('/my-members', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getMyMembers);
router.get('/members/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getTenantMemberDossier);
router.post('/members', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, createTenantMember);
router.put('/members/:id', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, updateTenantMember);
router.put('/members/:id/toggle-status', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, toggleTenantMemberStatus);

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

// Super Admin Gym Owner Pre-Approval Pipeline (Gateway 1)
router.get('/admin/applications', protect, authorize('Super Admin'), getAdminGymOwnerApplications);
router.get('/admin/applications/:id', protect, authorize('Super Admin'), getAdminGymOwnerApplicationById);
router.put('/admin/applications/:id/approve', protect, authorize('Super Admin'), approveGymOwnerApplication);
router.put('/admin/applications/:id/reject', protect, authorize('Super Admin'), rejectGymOwnerApplication);
router.put('/admin/applications/:id/request-info', protect, authorize('Super Admin'), requestAdditionalInfoApplication);

// Super Admin Territory Protection & Geofencing Console
router.get('/admin/territories', protect, authorize('Super Admin'), getAdminTerritories);
router.put('/admin/territories/branch/:id', protect, authorize('Super Admin'), updateBranchTerritory);

// Gym Owner Onboarding Status & Initial Branch Setup
router.get('/onboarding-status', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, getGymOwnerOnboardingStatus);
router.post('/branches/submit-initial', protect, authorize('Gym Owner', 'Company Admin', 'Super Admin'), verifyTenant, submitInitialGymBranch);

// Super Admin Final Gym Branch Verification & Activation (Gateway 2)
router.get('/admin/gym-verifications', protect, authorize('Super Admin'), getAdminGymVerifications);
router.put('/admin/gym-verifications/:clubId/approve', protect, authorize('Super Admin'), approveAndActivateGymBranch);
router.put('/admin/gym-verifications/:clubId/reject', protect, authorize('Super Admin'), rejectGymBranch);
router.put('/admin/gym-verifications/:clubId/request-changes', protect, authorize('Super Admin'), requestChangesBranch);
router.put('/admin/gym-verifications/:clubId/suspend', protect, authorize('Super Admin'), suspendBranch);

module.exports = router;
