const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getRevenueAnalytics,
  getMembersList,
  exportMembersCsv,
  getMemberDossier,
  updateMemberProfile,
  updateMemberMembership,
  renewMemberMembership,
  freezeMemberMembership,
  unfreezeMemberMembership,
  getMemberPayments,
  recordOfflinePayment,
  getMemberAttendance,
  recordMemberAttendance,
  getMemberFitness,
  recordMemberFitness,
  addAdminNote,
  updateAdminNote,
  archiveMember,
  restoreMember,
  getMemberAuditLogs,
  deleteMember,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all admin routes
router.use(protect);
router.use(authorize('Admin', 'Super Admin'));

// Overview & Analytics
router.get('/overview', getDashboardOverview);
router.get('/analytics/revenue', getRevenueAnalytics);

// Members Dossier 360° Management
router.get('/members/export', exportMembersCsv);
router.get('/members', getMembersList);
router.get('/members/:id', getMemberDossier);
router.put('/members/:id/profile', updateMemberProfile);
router.put('/members/:id/membership', updateMemberMembership);
router.post('/members/:id/renew', renewMemberMembership);
router.post('/members/:id/freeze', freezeMemberMembership);
router.post('/members/:id/unfreeze', unfreezeMemberMembership);

// Member Payments & Ledger
router.get('/members/:id/payments', getMemberPayments);
router.post('/members/:id/payments', recordOfflinePayment);

// Attendance History & Check-ins
router.get('/members/:id/attendance', getMemberAttendance);
router.post('/members/:id/attendance', recordMemberAttendance);

// Fitness Progress Biometrics
router.get('/members/:id/fitness', getMemberFitness);
router.post('/members/:id/fitness', recordMemberFitness);

// Notes & Follow-ups
router.post('/members/:id/notes', addAdminNote);
router.put('/members/:id/notes/:noteId', updateAdminNote);

// Archive & Restoration
router.put('/members/:id/archive', archiveMember);
router.put('/members/:id/restore', restoreMember);

// Audit Logs & Deletion
router.get('/members/:id/audit-logs', getMemberAuditLogs);
router.delete('/members/:id', deleteMember);

module.exports = router;
