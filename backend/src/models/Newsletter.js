const mongoose = require('mongoose');
const crypto = require('crypto');

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    tierInterest: {
      type: String,
      default: 'VIP Inner Circle',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unsubscribeToken: {
      type: String,
    },
    unsubscribedAt: {
      type: Date,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

NewsletterSchema.pre('save', function (next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(16).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Newsletter', NewsletterSchema);
