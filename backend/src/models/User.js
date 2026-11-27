const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Trainer', 'Gym Member'],
      default: 'Gym Member',
    },
    avatar: {
      type: String,
      default: '',
    },
    memberId: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      default: 'Not Specified',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    assignedTrainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    },
    biometricAccess: {
      type: Boolean,
      default: true,
    },
    homeClub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    homeClubName: {
      type: String,
      default: 'Mayfair Sanctuary',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archiveReason: {
      type: String,
      default: '',
    },
    archivedAt: {
      type: Date,
    },
    membership: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipPlan',
      },
      planName: { type: String, default: 'None' },
      planCode: { type: String, default: 'NONE' },
      billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'halfYearly', 'yearly', 'none'],
        default: 'none',
      },
      status: {
        type: String,
        enum: ['Active', 'Expiring Soon', 'Expired', 'Renewed', 'Frozen', 'Upcoming', 'Cancelled', 'Suspended', 'Pending', 'None'],
        default: 'None',
      },
      startDate: { type: Date },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: true },
      isFrozen: { type: Boolean, default: false },
      freezeDetails: {
        startDate: { type: Date },
        endDate: { type: Date },
        reason: { type: String, default: '' },
        remainingDaysAtFreeze: { type: Number, default: 0 },
        approvedDuration: { type: Number, default: 0 },
        requestId: { type: String, default: '' },
        frozenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      suspensionDetails: {
        isSuspended: { type: Boolean, default: false },
        suspendedAt: { type: Date },
        reason: { type: String, default: '' },
        suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      cancellationDetails: {
        isCancelled: { type: Boolean, default: false },
        cancelledAt: { type: Date },
        reason: { type: String, default: '' },
        refundAmount: { type: Number, default: 0 },
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
      complimentary: { type: Boolean, default: false },
      discount: {
        type: { type: String, default: 'none' },
        value: { type: Number, default: 0 },
        code: { type: String, default: '' },
      },
    },
    // 3-Day Free Trial / Demo Membership System
    trial: {
      isActive: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['None', 'Active', 'Expired', 'Converted'],
        default: 'None',
      },
      trialType: {
        type: String,
        default: '3-Day VIP Sanctuary Trial',
      },
      startDate: { type: Date },
      endDate: { type: Date },
      hasUsedTrial: { type: Boolean, default: false },
      activatedAt: { type: Date },
    },
    membershipHistory: [
      {
        planName: { type: String, required: true },
        billingCycle: { type: String, default: 'monthly' },
        startDate: { type: Date },
        endDate: { type: Date },
        amount: { type: Number, default: 0 },
        status: { type: String, default: 'Completed' },
        actionType: { type: String, default: 'New Plan' }, // 'New Plan', 'Renewal', 'Upgrade', 'Freeze', 'Unfreeze', 'Admin Override'
        performedByName: { type: String, default: 'Executive Concierge' },
        notes: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    freezeHistory: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        resumedAt: { type: Date },
        reason: { type: String, default: '' },
        daysFrozen: { type: Number, default: 0 },
        performedByName: { type: String, default: 'Executive Concierge' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    adminNotes: [
      {
        content: { type: String, required: true },
        authorName: { type: String, default: 'Executive Concierge' },
        isFollowUp: { type: Boolean, default: false },
        followUpDate: { type: Date },
        followUpStatus: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Trainer & Member Fitness Profile Fields
    currentWeight: { type: Number, default: 70 }, // in kg
    targetWeight: { type: Number, default: 68 }, // in kg
    heightCm: { type: Number, default: 175 }, // in cm
    fitnessGoal: {
      type: String,
      enum: ['Muscle Gain', 'Fat Loss', 'Strength Training', 'Endurance', 'Flexibility & Mobility', 'General Fitness'],
      default: 'General Fitness',
    },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    memberCategory: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Personal Training', 'General Gym Member'],
      default: 'General Gym Member',
    },
    medicalConditions: [{ type: String }],
    injuries: [{ type: String }],
    workoutPreferences: {
      preferredDaysPerWeek: { type: Number, default: 4 },
      preferredTime: { type: String, default: 'Morning' },
      workoutStyle: { type: String, default: 'Strength + Cardio' },
      dietaryPreference: {
        type: String,
        enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'Flexible'],
        default: 'Flexible',
      },
    },
    trainerNotes: [
      {
        content: { type: String, required: true },
        trainerName: { type: String, default: 'Gym Coach' },
        category: { type: String, enum: ['Form & Technique', 'Diet & Nutrition', 'Injury Concern', 'Milestone', 'General'], default: 'General' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activeWorkoutPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Encrypt password and ensure memberId
UserSchema.pre('save', async function (next) {
  if (this.role === 'Gym Member' && !this.memberId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.memberId = `QNOX-M${randomSuffix}`;
  }
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
