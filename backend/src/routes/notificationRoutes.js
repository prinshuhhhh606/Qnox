const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAdminNotifications,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');

// All notification endpoints require JWT authentication
router.use(protect);

router.get('/my-notifications', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin-only notification routes
router.get('/admin-notifications', authorize('Admin', 'Super Admin'), getAdminNotifications);

module.exports = router;
