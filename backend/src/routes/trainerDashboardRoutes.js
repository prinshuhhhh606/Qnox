const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getTrainerDashboardStats,
  getMyMembers,
  getMemberById,
  updateMemberFitnessProfile,
  addMemberNote,
  getTrainerAttendance,
  markMemberCheckIn,
  markMemberCheckOut,
  getWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  assignWorkoutPlan,
  generateAiWorkoutPlan,
  getDietPlans,
  createDietPlan,
  deleteDietPlan,
  generateAiDietPlan,
  getFitnessAssessments,
  createFitnessAssessment,
  deleteFitnessAssessment,
  getPTSessions,
  schedulePTSession,
  updatePTSession,
  getExerciseLibrary,
  createCustomExercise,
  getChatMessages,
  sendChatMessage,
  getTrainerPerformanceReports,
  getTrainerNotifications,
  markNotificationRead,
  getTrainerProfile,
  updateTrainerProfile,
} = require('../controllers/trainerDashboardController');

// All trainer portal endpoints require authentication & Trainer / Admin role
router.use(protect);
router.use(authorize('Trainer', 'Admin', 'Super Admin'));

// 1. Dashboard
router.get('/dashboard/stats', getTrainerDashboardStats);

// 2. Members Management
router.get('/members', getMyMembers);
router.get('/members/:id', getMemberById);
router.put('/members/:id/fitness-profile', updateMemberFitnessProfile);
router.post('/members/:id/notes', addMemberNote);

// 3. Attendance
router.get('/attendance', getTrainerAttendance);
router.post('/attendance/check-in', markMemberCheckIn);
router.put('/attendance/:id/check-out', markMemberCheckOut);

// 4. Workout Plans & AI Assistant
router.get('/workouts', getWorkoutPlans);
router.post('/workouts', createWorkoutPlan);
router.put('/workouts/:id', updateWorkoutPlan);
router.post('/workouts/:id/assign', assignWorkoutPlan);
router.post('/workouts/ai-generate', generateAiWorkoutPlan);

// 5. Diet Plans & AI Nutrition
router.get('/diets', getDietPlans);
router.post('/diets', createDietPlan);
router.delete('/diets/:id', deleteDietPlan);
router.post('/diets/ai-generate', generateAiDietPlan);

// 6. Assessments & Measurements
router.get('/assessments', getFitnessAssessments);
router.post('/assessments', createFitnessAssessment);
router.delete('/assessments/:id', deleteFitnessAssessment);

// 7. Personal Training Sessions
router.get('/pt-sessions', getPTSessions);
router.post('/pt-sessions', schedulePTSession);
router.put('/pt-sessions/:id', updatePTSession);

// 8. Exercise Library
router.get('/exercises', getExerciseLibrary);
router.post('/exercises', createCustomExercise);

// 9. Real-time Messages & Chat
router.get('/messages/:memberId', getChatMessages);
router.post('/messages', sendChatMessage);

// 10. Performance Reports & Analytics
router.get('/reports', getTrainerPerformanceReports);

// 11. Notifications
router.get('/notifications', getTrainerNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// 12. Trainer Profile & Availability
router.get('/profile', getTrainerProfile);
router.put('/profile', updateTrainerProfile);

module.exports = router;
