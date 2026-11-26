const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  generateAiWorkoutPlan,
  saveWorkoutPlan,
  approveWorkoutPlan,
  getActiveWorkoutPlan,
  getSavedWorkoutPlans,
  getWorkoutPlanById,
  deleteSavedWorkoutPlan,
  startWorkoutSession,
  getCurrentSession,
  logSessionSet,
  completeWorkoutSession,
  cancelWorkoutSession,
  getProgressDashboard,
} = require('../controllers/userWorkoutController');

// All workout endpoints require authenticated user via JWT
router.use(protect);

// 1. AI Plan Generation, Approval & Saving
router.post('/ai-generate', generateAiWorkoutPlan);
router.post('/save', saveWorkoutPlan);
router.post('/approve', approveWorkoutPlan);
router.get('/active', getActiveWorkoutPlan);
router.get('/saved', getSavedWorkoutPlans);

// 2. Progress Dashboard
router.get('/progress/dashboard', getProgressDashboard);

// 3. Live Workout Sessions
router.post('/session/start', startWorkoutSession);
router.get('/session/current', getCurrentSession);
router.put('/session/:id/log-set', logSessionSet);
router.post('/session/:id/complete', completeWorkoutSession);
router.post('/session/:id/cancel', cancelWorkoutSession);

// 4. Single Plan Operations (Must come after specific subpaths)
router.get('/:id', getWorkoutPlanById);
router.delete('/:id', deleteSavedWorkoutPlan);

module.exports = router;
