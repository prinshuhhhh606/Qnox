const mongoose = require('mongoose');

const TrainerApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    // Step 1: Personal Information
    fullName: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-Binary', 'Other'],
      default: 'Male',
    },
    dateOfBirth: {
      type: Date,
    },
    profilePhoto: {
      type: String,
      default: '',
    },

    // Step 2: Professional Information
    experienceYears: {
      type: Number,
      required: [true, 'Please provide years of experience'],
      min: 0,
    },
    specializations: [
      {
        type: String,
        enum: [
          'Weight Training',
          'Personal Training',
          'Yoga',
          'Cardio',
          'CrossFit',
          'Weight Loss',
          'Muscle Building',
          'Nutrition Coaching',
        ],
      },
    ],
    qualifications: {
      type: String,
      required: [true, 'Please provide professional qualification'],
      trim: true,
    },
    certifications: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      required: [true, 'Please provide a short professional bio'],
      trim: true,
    },

    // Step 3: Gym Information
    gymName: {
      type: String,
      default: '',
      trim: true,
    },
    gymAddress: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    pincode: {
      type: String,
      default: '',
      trim: true,
    },
    gymContactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    gymType: {
      type: String,
      enum: ['Commercial Gym', 'Personal Studio', 'Fitness Center', 'Independent Trainer'],
      default: 'Independent Trainer',
    },

    // Step 4: Documents & Social Verification
    certificationDocument: {
      type: String,
      default: '',
    },
    identityProofDocument: {
      type: String,
      default: '',
    },
    experienceCertificateDocument: {
      type: String,
      default: '',
    },
    linkedinProfile: {
      type: String,
      default: '',
    },
    instagramProfile: {
      type: String,
      default: '',
    },
    confirmedAccuracy: {
      type: Boolean,
      default: false,
    },

    // Application Status & Admin Review
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    adminRemarks: {
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
    createdUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrainerApplication', TrainerApplicationSchema);
