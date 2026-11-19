const express = require('express');
const router = express.Router();
const {
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainerController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getAllTrainers)
  .post(protect, authorize('Admin', 'Super Admin'), createTrainer);

router.route('/:id')
  .get(getTrainerById)
  .put(protect, authorize('Admin', 'Super Admin'), updateTrainer)
  .delete(protect, authorize('Admin', 'Super Admin'), deleteTrainer);

module.exports = router;
