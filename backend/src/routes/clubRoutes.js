const express = require('express');
const router = express.Router();
const {
  getAllClubs,
  getClubBySlug,
  createClub,
  updateClub,
  deleteClub,
  getMyBranch,
  assignBranchManager,
} = require('../controllers/clubController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/my-branch', protect, authorize('Branch Manager', 'Receptionist', 'Admin', 'Super Admin'), getMyBranch);
router.post('/assign-manager', protect, authorize('Super Admin'), assignBranchManager);

router.route('/')
  .get(getAllClubs)
  .post(protect, authorize('Admin', 'Super Admin'), createClub);

router.route('/slug/:slug')
  .get(getClubBySlug);

router.route('/:id')
  .put(protect, authorize('Admin', 'Super Admin'), updateClub)
  .delete(protect, authorize('Admin', 'Super Admin'), deleteClub);

module.exports = router;
