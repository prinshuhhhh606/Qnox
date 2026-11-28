const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    location: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    mapsLink: {
      type: String,
      default: 'https://maps.google.com',
    },
    status: {
      type: String,
      enum: ['OPEN', 'COMING SOON', 'PRIVATE ACCESS ONLY', 'MAINTENANCE'],
      default: 'OPEN',
    },
    tagline: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    heroImage: {
      type: String,
      required: true,
    },
    gallery: [
      {
        type: String,
      },
    ],
    amenities: [
      {
        type: String,
      },
    ],
    openingHours: {
      weekdays: { type: String, default: '06:00 - 22:30' },
      weekends: { type: String, default: '07:30 - 20:00' },
    },
    features: {
      pool: { type: Boolean, default: true },
      altitudeChamber: { type: Boolean, default: false },
      cryotherapy: { type: Boolean, default: true },
      spaAndRecovery: { type: Boolean, default: true },
      valet: { type: Boolean, default: true },
    },
    branchCode: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // GPS Territory Protection & Geofencing
    latitude: {
      type: Number,
      default: 51.5118, // Default central location
    },
    longitude: {
      type: Number,
      default: -0.1473,
    },
    isCompanyOwned: {
      type: Boolean,
      default: true,
    },
    isTerritoryProtected: {
      type: Boolean,
      default: true,
    },
    protectionRadiusKm: {
      type: Number,
      default: 5, // Default 5 KM protected geographical radius
      min: [0.5, 'Protected radius must be at least 0.5 KM'],
      max: [50, 'Protected radius cannot exceed 50 KM'],
    },
    // Multi-Branch / Multi-Gym Architecture
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    gymType: {
      type: String,
      enum: ['Company-Owned', 'SaaS-Partner', 'All-Access-Partner'],
      default: 'Company-Owned',
    },
    assignedManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedManagerName: {
      type: String,
      default: '',
    },
    assignedManagerEmail: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      default: 150,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
    },
    // All-Access Network Eligibility & Settlement
    isNetworkPartner: {
      type: Boolean,
      default: true,
    },
    networkAccessHours: {
      type: String,
      default: 'All Day Access',
    },
    settlementRatePerVisit: {
      type: Number,
      default: 250,
    },
    // Onboarding Verification & Activation Workflow
    verificationStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'UNDER_REVIEW',
        'TERRITORY_REVIEW',
        'APPROVED',
        'REJECTED',
        'ACTIVE',
        'SUSPENDED',
        'CHANGES_REQUESTED',
      ],
      default: 'APPROVED',
    },
    operationalStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'READY_TO_PUBLISH', 'PUBLISHED', 'UNPUBLISHED'],
      default: 'PUBLISHED',
    },
    branchType: {
      type: String,
      enum: ['Flagship', 'Premium', 'Standard'],
      default: 'Standard',
    },
    landmark: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'India',
    },
    operatingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    facilitiesBreakdown: {
      cardioEquipment: { type: Boolean, default: true },
      weightTraining: { type: Boolean, default: true },
      personalTraining: { type: Boolean, default: true },
      swimmingPool: { type: Boolean, default: false },
      steamAndSauna: { type: Boolean, default: false },
      lockerRoom: { type: Boolean, default: true },
      showerFacilities: { type: Boolean, default: true },
      parking: { type: Boolean, default: true },
    },
    media: {
      heroImage: { type: String, default: '' },
      interiorGallery: [{ type: String }],
      equipmentImages: [{ type: String }],
      exteriorImages: [{ type: String }],
    },
    documents: {
      propertyLeaseDeed: {
        title: { type: String, default: 'Property Ownership / Lease Agreement' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
      businessRegistration: {
        title: { type: String, default: 'Business Registration' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
      operatingLicense: {
        title: { type: String, default: 'Gym Operating License' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now },
      },
      emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' },
      },
    },
    setupChecklist: {
      managerConfigured: { type: Boolean, default: false },
      trainersAssigned: { type: Boolean, default: false },
      operatingHoursSet: { type: Boolean, default: false },
      facilitiesConfigured: { type: Boolean, default: false },
      pricingConfigured: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    },
    changeRequestNotes: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    unpublishedAt: {
      type: Date,
    },
    unpublishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspensionReason: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    locationDocuments: [
      {
        title: { type: String, default: 'Location Proof' },
        url: { type: String, required: true },
        type: { type: String, default: 'LEASE_OR_OWNERSHIP' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ClubSchema.index({ organization: 1, gymType: 1 });
ClubSchema.index({ isNetworkPartner: 1 });

module.exports = mongoose.model('Club', ClubSchema);
