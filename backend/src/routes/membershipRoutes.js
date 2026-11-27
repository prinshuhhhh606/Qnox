const express = require('express');
const router = express.Router();
const {
  getMyMembership,
  startFreeTrial,
  getTrialStatus,
  requestFreeze,
  requestCancellation,
  toggleAutoRenew,
  getMembershipStats,
  getMembershipRequests,
  approveMembershipRequest,
  rejectMembershipRequest,
  extendMembership,
  suspendMembership,
  reactivateMembership,
  sendRenewalReminderAdmin,
  getMyFreezeHistory,
  cancelMyFreezeRequest,
  getFreezePolicy,
  modifyFreezeRequestAdmin,
  unfreezeActiveRequestAdmin,
} = require('../controllers/membershipController');
const { protect, authorize } = require('../middlewares/auth');

// Member Routes (Protected)
router.get('/my-membership', protect, getMyMembership);
router.post('/start-trial', protect, startFreeTrial);
router.get('/trial-status', protect, getTrialStatus);
router.post('/freeze-request', protect, requestFreeze);
router.get('/freeze-history', protect, getMyFreezeHistory);
router.post('/freeze-requests/:id/cancel', protect, cancelMyFreezeRequest);
router.get('/freeze-policy', protect, getFreezePolicy);
router.post('/cancellation-request', protect, requestCancellation);
router.patch('/auto-renew', protect, toggleAutoRenew);

// Admin Routes (Protected + RBAC)
router.get('/admin/stats', protect, authorize('Admin', 'Super Admin'), getMembershipStats);
router.get('/admin/requests', protect, authorize('Admin', 'Super Admin'), getMembershipRequests);
router.post('/admin/requests/:id/approve', protect, authorize('Admin', 'Super Admin'), approveMembershipRequest);
router.post('/admin/requests/:id/reject', protect, authorize('Admin', 'Super Admin'), rejectMembershipRequest);
router.post('/admin/freeze-requests/:id/modify', protect, authorize('Admin', 'Super Admin'), modifyFreezeRequestAdmin);
router.post('/admin/freeze-requests/:id/unfreeze-now', protect, authorize('Admin', 'Super Admin'), unfreezeActiveRequestAdmin);
router.post('/admin/:userId/extend', protect, authorize('Admin', 'Super Admin'), extendMembership);
router.post('/admin/:userId/suspend', protect, authorize('Admin', 'Super Admin'), suspendMembership);
router.post('/admin/:userId/reactivate', protect, authorize('Admin', 'Super Admin'), reactivateMembership);
router.post('/admin/:userId/send-reminder', protect, authorize('Admin', 'Super Admin'), sendRenewalReminderAdmin);

module.exports = router;
