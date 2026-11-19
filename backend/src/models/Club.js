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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Club', ClubSchema);
