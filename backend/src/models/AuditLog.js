const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminName: {
      type: String,
      default: 'Super Admin',
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    memberName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'MEMBERSHIP_ASSIGN', 'MEMBERSHIP_RENEW', 'MEMBERSHIP_FREEZE', 'MEMBERSHIP_RESUME', 'OFFLINE_PAYMENT', 'MEMBER_ARCHIVE', 'MEMBER_RESTORE', 'PROFILE_EDIT', 'NOTE_ADDED'
    },
    details: {
      type: String,
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
