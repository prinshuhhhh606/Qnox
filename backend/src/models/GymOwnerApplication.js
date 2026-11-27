const mongoose = require('mongoose');

const GymOwnerApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Business email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact / WhatsApp number is required'],
      trim: true,
    },
    gymName: {
      type: String,
      required: [true, 'Gym / Brand name is required'],
      trim: true,
    },
    gymAddress: {
      type: String,
      required: [true, 'Gym facility address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    branchCount: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 branch is required'],
    },
    expectedMembers: {
      type: Number,
      default: 100,
    },
    businessDescription: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REGISTERED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    invitationToken: {
      type: String, // SHA-256 hashed token
      index: true,
    },
    invitationExpiresAt: {
      type: Date,
    },
    invitationUsed: {
      type: Boolean,
      default: false,
    },
    invitationUsedAt: {
      type: Date,
    },
    registeredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    registeredOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GymOwnerApplication', GymOwnerApplicationSchema);
