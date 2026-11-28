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
    // Business entity metadata
    businessType: {
      type: String,
      enum: ['Sole Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'Independent Studio'],
      default: 'Independent Studio',
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      default: '',
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: true,
    },
    phoneVerified: {
      type: Boolean,
      default: true,
    },
    documents: [
      {
        docType: { type: String, required: true }, // 'Business Registration', 'GST Certificate', 'Owner ID Proof', 'Fitness License', 'Location Lease'
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Partnership Policy (Franchise vs SaaS)
    partnershipType: {
      type: String,
      enum: ['QNOX Franchise Gym', 'QNOX SaaS Partner Gym'],
      default: 'QNOX Franchise Gym',
      index: true,
    },
    // GPS Geolocation & Territory Protection Fields
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    hasTerritoryConflict: {
      type: Boolean,
      default: false,
      index: true,
    },
    conflictingBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    conflictingBranchName: {
      type: String,
      default: '',
    },
    conflictDistanceKm: {
      type: Number,
      default: null,
    },
    exceptionalApproval: {
      type: Boolean,
      default: false,
    },
    exceptionalApprovalJustification: {
      type: String,
      default: '',
    },
    exceptionalApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
      enum: [
        'PENDING_APPROVAL',
        'UNDER_REVIEW',
        'ADDITIONAL_INFORMATION_REQUIRED',
        'TERRITORY_CONFLICT',
        'APPROVED',
        'REJECTED',
        'REGISTERED',
      ],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    additionalInfoRequested: {
      type: String,
      default: '',
    },
    history: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
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
