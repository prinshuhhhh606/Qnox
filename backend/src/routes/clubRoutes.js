const express = require('express');
const router = express.Router();
const {
  getAllClubs,
  getClubBySlug,
  createClub,
  updateClub,
  deleteClub,
} = require('../controllers/clubController');
const { protect, authorize } = require('../middlewares/auth');

router.route('/')
  .get(getAllClubs)
  .post(protect, authorize('Admin', 'Super Admin'), createClub);

router.route('/slug/:slug')
  .get(getClubBySlug);

router.route('/:id')
  .put(protect, authorize('Admin', 'Super Admin'), updateClub)
  .delete(protect, authorize('Admin', 'Super Admin'), deleteClub);

module.exports = router;
