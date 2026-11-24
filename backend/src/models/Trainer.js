const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide trainer name'],
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: 'MASTER COACH',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
      required: true,
    },
    photo: {
      type: String,
      required: true,
    },
    specialties: [
      {
        type: String,
      },
    ],
    certifications: [
      {
        type: String,
      },
    ],
    experienceYears: {
      type: Number,
      default: 8,
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    clubs: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    workingHours: {
      type: String,
      default: '06:00 AM - 02:00 PM',
    },
    availableDays: [
      {
        type: String,
        default: 'Mon, Tue, Wed, Thu, Fri, Sat',
      },
    ],
    qualifications: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trainer', TrainerSchema);
