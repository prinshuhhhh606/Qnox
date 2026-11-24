const mongoose = require('mongoose');

const TrainerNotificationSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'NEW_MEMBER_ASSIGNED',
        'UPCOMING_TRAINING_SESSION',
        'MISSED_MEMBER_WORKOUT',
        'MEMBER_ATTENDANCE',
        'MEMBER_PROGRESS_UPDATE',
        'NEW_MEMBER_MESSAGE',
        'MEMBERSHIP_EXPIRY_ALERT',
        'GENERAL',
      ],
      default: 'GENERAL',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainerNotification', TrainerNotificationSchema);
