const express = require('express');
const router = express.Router();
const {
  applyAsTrainer,
  getApplicationStatus,
  getAllTrainerApplications,
  getTrainerApplicationById,
  approveTrainerApplication,
  rejectTrainerApplication,
} = require('../controllers/trainerApplicationController');
const { protect, authorize } = require('../middlewares/auth');

// Public endpoints
router.post('/apply', applyAsTrainer);
router.get('/application-status', getApplicationStatus);

// Protected Admin endpoints
router.get('/admin/applications', protect, authorize('Admin', 'Super Admin'), getAllTrainerApplications);
router.get('/admin/applications/:id', protect, authorize('Admin', 'Super Admin'), getTrainerApplicationById);
router.patch('/admin/applications/:id/approve', protect, authorize('Admin', 'Super Admin'), approveTrainerApplication);
router.patch('/admin/applications/:id/reject', protect, authorize('Admin', 'Super Admin'), rejectTrainerApplication);

module.exports = router;
