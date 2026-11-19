const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  unsubscribe,
  getAllSubscribers,
  exportSubscribersCsv,
  sendCampaign,
} = require('../controllers/newsletterController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/subscribe', subscribeNewsletter);
router.get('/unsubscribe', unsubscribe);
router.get('/subscribers', protect, authorize('Admin', 'Super Admin'), getAllSubscribers);
router.get('/export-csv', protect, authorize('Admin', 'Super Admin'), exportSubscribersCsv);
router.post('/campaign', protect, authorize('Admin', 'Super Admin'), sendCampaign);

module.exports = router;
