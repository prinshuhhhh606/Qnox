const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get Current User's Notifications
// @route   GET /api/notifications/my-notifications
// @access  Private (Gym Member, Trainer, Admin)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    if (req.query.unreadOnly === 'true') {
      query.isRead = false;
    }

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Unread Notification Count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    let unreadCount = 0;

    if (['Admin', 'Super Admin'].includes(req.user.role)) {
      unreadCount = await Notification.countDocuments({
        $or: [
          { recipient: req.user._id, isRead: false },
          { recipientRole: { $in: ['Admin', 'Super Admin'] }, isRead: false },
        ],
      });
    } else {
      unreadCount = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
      });
    }

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark Notification as Read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const isAdmin = ['Admin', 'Super Admin'].includes(req.user.role);

    const query = { _id: req.params.id };
    if (!isAdmin) {
      query.recipient = req.user._id;
    }

    const notification = await Notification.findOneAndUpdate(
      query,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark All Notifications as Read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    const isAdmin = ['Admin', 'Super Admin'].includes(req.user.role);

    let query = { recipient: req.user._id, isRead: false };
    if (isAdmin && req.query.scope === 'admin') {
      query = {
        $or: [
          { recipient: req.user._id },
          { recipientRole: { $in: ['Admin', 'Super Admin'] } },
        ],
        isRead: false,
      };
    }

    await Notification.updateMany(query, {
      $set: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
  try {
    const isAdmin = ['Admin', 'Super Admin'].includes(req.user.role);
    const query = { _id: req.params.id };
    if (!isAdmin) {
      query.recipient = req.user._id;
    }

    const notification = await Notification.findOneAndDelete(query);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification removed.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Notification Feed with Advanced Filters
// @route   GET /api/notifications/admin-notifications
// @access  Private (Admin, Super Admin)
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const { status, filterType, search, page = 1, limit = 20 } = req.query;

    const baseQuery = {
      $or: [
        { recipient: req.user._id },
        { recipientRole: { $in: ['Admin', 'Super Admin'] } },
      ],
    };

    if (status === 'unread') {
      baseQuery.isRead = false;
    } else if (status === 'read') {
      baseQuery.isRead = true;
    }

    if (filterType === 'expired') {
      baseQuery.type = { $in: ['EXPIRY_TODAY', 'EXPIRY_EXPIRED', 'EXPIRY_FOLLOWUP_3D'] };
    } else if (filterType === 'expiringSoon') {
      baseQuery.type = { $in: ['EXPIRY_REMINDER_7D', 'EXPIRY_REMINDER_3D', 'EXPIRY_REMINDER_1D'] };
    } else if (filterType === 'renewed') {
      baseQuery.type = 'MEMBERSHIP_RENEWED';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      baseQuery.$and = [
        {
          $or: [
            { customerName: searchRegex },
            { customerEmail: searchRegex },
            { customerPhone: searchRegex },
            { membershipPlan: searchRegex },
            { title: searchRegex },
            { message: searchRegex },
          ],
        },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Notification.countDocuments(baseQuery);

    const notifications = await Notification.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Summary counts for Admin Badges
    const adminBase = {
      $or: [
        { recipient: req.user._id },
        { recipientRole: { $in: ['Admin', 'Super Admin'] } },
      ],
    };

    const unread = await Notification.countDocuments({ ...adminBase, isRead: false });
    const totalExpired = await Notification.countDocuments({
      ...adminBase,
      type: { $in: ['EXPIRY_TODAY', 'EXPIRY_EXPIRED', 'EXPIRY_FOLLOWUP_3D'] },
    });
    const totalExpiringSoon = await Notification.countDocuments({
      ...adminBase,
      type: { $in: ['EXPIRY_REMINDER_7D', 'EXPIRY_REMINDER_3D', 'EXPIRY_REMINDER_1D'] },
    });
    const totalRenewed = await Notification.countDocuments({
      ...adminBase,
      type: 'MEMBERSHIP_RENEWED',
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      metrics: {
        total,
        unread,
        expired: totalExpired,
        expiringSoon: totalExpiringSoon,
        renewed: totalRenewed,
      },
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};
