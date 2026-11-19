const mongoose = require('mongoose');

const MembershipInquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    preferredClub: {
      type: String,
      required: true,
    },
    membershipTier: {
      type: String,
      enum: ['THE RESIDENT', 'THE METROPOLITAN', 'THE OBSIDIAN BLACK', 'UNSURE / TOUR ONLY'],
      default: 'UNSURE / TOUR ONLY',
    },
    preferredTime: {
      type: String,
      default: 'Morning (08:00 - 12:00)',
    },
    primaryGoal: {
      type: String,
      default: 'General Luxury Wellness & Performance',
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Scheduled Tour', 'Member'],
      default: 'New',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipInquiry', MembershipInquirySchema);
