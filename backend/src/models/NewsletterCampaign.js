const mongoose = require('mongoose');

const NewsletterCampaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    preheader: {
      type: String,
      default: '',
    },
    contentHtml: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String,
      default: 'All Subscribers',
    },
    sentBy: {
      type: String,
      default: 'QNOX Executive Desk',
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Scheduled'],
      default: 'Sent',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsletterCampaign', NewsletterCampaignSchema);
