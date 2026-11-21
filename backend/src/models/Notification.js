const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['Gym Member', 'Admin', 'Super Admin', 'All'],
      default: 'Gym Member',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'EXPIRY_REMINDER_7D',
        'EXPIRY_REMINDER_3D',
        'EXPIRY_REMINDER_1D',
        'EXPIRY_TODAY',
        'EXPIRY_EXPIRED',
        'EXPIRY_FOLLOWUP_3D',
        'MEMBERSHIP_RENEWED',
        'MEMBERSHIP_EXPIRING_SOON',
        'MEMBERSHIP_EXPIRED',
        'CUSTOM',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    stage: {
      type: String,
      enum: [
        '7_DAYS_BEFORE',
        '3_DAYS_BEFORE',
        '1_DAY_BEFORE',
        'EXPIRY_DATE',
        '3_DAYS_AFTER',
        'RENEWED',
        'NONE',
      ],
      default: 'NONE',
      index: true,
    },
    // Unique identifier to prevent duplicate reminder delivery across restarts/instances
    // Format: `${recipientId || 'admin'}_${customerId}_${stage}_${endDateTimestamp}`
    reminderKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: {
      type: String,
      default: '',
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    membershipPlan: {
      type: String,
      default: '',
    },
    membershipStartDate: {
      type: Date,
    },
    membershipEndDate: {
      type: Date,
      index: true,
    },
    membershipStatus: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailError: {
      type: String,
      default: '',
    },
    actionLabel: {
      type: String,
      default: 'Renew Membership',
    },
    actionUrl: {
      type: String,
      default: '#membership',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound indexes for rapid notification lookups and deduplication
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ customerId: 1, stage: 1, membershipEndDate: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
