const express = require('express');
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus,
} = require('../controllers/membershipPlanController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getPlans)
  .post(protect, authorize('Admin', 'Super Admin'), createPlan);

router.route('/:id')
  .get(getPlanById)
  .put(protect, authorize('Admin', 'Super Admin'), updatePlan)
  .delete(protect, authorize('Admin', 'Super Admin'), deletePlan);

router.put('/:id/toggle-status', protect, authorize('Admin', 'Super Admin'), togglePlanStatus);

module.exports = router;
