const MembershipInquiry = require('../models/MembershipInquiry');

let inMemoryInquiries = [];

exports.createInquiry = async (req, res, next) => {
  try {
    const { fullName, email, phone, preferredClub, membershipTier, preferredTime, primaryGoal, notes } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Phone are required to schedule a Private Sanctuary Tour.',
      });
    }

    let inquiry;
    try {
      inquiry = await MembershipInquiry.create({
        fullName,
        email,
        phone,
        preferredClub: preferredClub || 'QNOX Mayfair Sanctuary',
        membershipTier: membershipTier || 'THE RESIDENT',
        preferredTime: preferredTime || 'Morning (08:00 - 12:00)',
        primaryGoal: primaryGoal || 'Performance & Luxury Longevity',
        notes: notes || '',
      });
    } catch (dbErr) {
      inquiry = {
        _id: 'inq_' + Date.now(),
        fullName,
        email,
        phone,
        preferredClub,
        membershipTier,
        preferredTime,
        primaryGoal,
        notes,
        createdAt: new Date(),
      };
      inMemoryInquiries.push(inquiry);
    }

    const conciergePassId = `QNOX-VIP-${Math.floor(100000 + Math.random() * 900000)}`;

    return res.status(201).json({
      success: true,
      message: 'Private tour requested successfully. A Senior Membership Concierge will contact you within 4 hours.',
      data: {
        inquiryId: inquiry._id,
        conciergePassId,
        guest: fullName,
        club: preferredClub,
        tier: membershipTier,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllInquiries = async (req, res, next) => {
  try {
    let inquiries = [];
    try {
      inquiries = await MembershipInquiry.find().sort({ createdAt: -1 });
    } catch (e) {
      inquiries = inMemoryInquiries;
    }
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    next(error);
  }
};
