const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
    },
    attachmentType: {
      type: String,
      enum: ['none', 'workout_plan', 'diet_plan', 'assessment_report', 'image'],
      default: 'none',
    },
    attachmentData: {
      title: { type: String, default: '' },
      urlOrId: { type: String, default: '' },
      meta: { type: mongoose.Schema.Types.Mixed },
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

ChatMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
