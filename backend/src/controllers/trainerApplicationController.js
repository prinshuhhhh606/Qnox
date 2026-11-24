const TrainerApplication = require('../models/TrainerApplication');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const crypto = require('crypto');

// Generate Unique Application ID e.g. QNX-TRN-7849
function generateApplicationId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `QNX-TRN-${randomNum}`;
}

// 1. Submit Trainer Application (Public)
exports.applyAsTrainer = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      gender,
      dateOfBirth,
      profilePhoto,
      experienceYears,
      specializations,
      qualifications,
      certifications,
      bio,
      gymName,
      gymAddress,
      city,
      state,
      pincode,
      gymContactNumber,
      gymType,
      certificationDocument,
      identityProofDocument,
      experienceCertificateDocument,
      linkedinProfile,
      instagramProfile,
      confirmedAccuracy,
    } = req.body;

    // Basic Validations
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all required personal details.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Password and confirm password do not match.' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Check if user already exists with role Trainer
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.role === 'Trainer') {
      return res.status(400).json({
        success: false,
        message: 'A registered Trainer account already exists with this email address. Please sign in.',
      });
    }

    // Check if an existing application is already Pending or Under Review
    const existingApp = await TrainerApplication.findOne({
      email: email.toLowerCase(),
      status: { $in: ['Pending', 'Under Review'] },
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `An active application (${existingApp.applicationId}) is already under review for this email address. Please check your status.`,
      });
    }

    // Unique Application ID
    let applicationId = generateApplicationId();
    let idExists = await TrainerApplication.findOne({ applicationId });
    while (idExists) {
      applicationId = generateApplicationId();
      idExists = await TrainerApplication.findOne({ applicationId });
    }

    const newApplication = await TrainerApplication.create({
      applicationId,
      fullName,
      email: email.toLowerCase(),
      phone,
      password, // Password hashed when approved and user created
      gender: gender || 'Male',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      profilePhoto: profilePhoto || '',
      experienceYears: Number(experienceYears) || 0,
      specializations: Array.isArray(specializations) ? specializations : [specializations || 'Personal Training'],
      qualifications: qualifications || 'Certified Fitness Trainer',
      certifications: certifications || '',
      bio: bio || 'Dedicated fitness trainer and coach.',
      gymName: gymName || '',
      gymAddress: gymAddress || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      gymContactNumber: gymContactNumber || '',
      gymType: gymType || 'Independent Trainer',
      certificationDocument: certificationDocument || '',
      identityProofDocument: identityProofDocument || '',
      experienceCertificateDocument: experienceCertificateDocument || '',
      linkedinProfile: linkedinProfile || '',
      instagramProfile: instagramProfile || '',
      confirmedAccuracy: Boolean(confirmedAccuracy),
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Your trainer application has been submitted successfully. Our admin team will review your details.',
      data: {
        applicationId: newApplication.applicationId,
        fullName: newApplication.fullName,
        email: newApplication.email,
        status: newApplication.status,
        submittedAt: newApplication.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Track Application Status (Public)
exports.getApplicationStatus = async (req, res) => {
  try {
    const { email, applicationId } = req.query;

    if (!email && !applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either registered Email or Application ID.',
      });
    }

    const query = {};
    if (applicationId) query.applicationId = applicationId.trim().toUpperCase();
    if (email) query.email = email.trim().toLowerCase();

    const application = await TrainerApplication.findOne(query)
      .select('-password')
      .sort({ createdAt: -1 });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No trainer application found with the provided details.',
      });
    }

    res.json({
      success: true,
      data: {
        applicationId: application.applicationId,
        applicantName: application.fullName,
        email: application.email,
        submissionDate: application.createdAt,
        currentStatus: application.status,
        adminRemarks: application.adminRemarks,
        experienceYears: application.experienceYears,
        specializations: application.specializations,
        gymName: application.gymName,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Admin: Get All Trainer Applications
exports.getAllTrainerApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await TrainerApplication.countDocuments(query);
    const applications = await TrainerApplication.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Admin: Get Single Trainer Application Details
exports.getTrainerApplicationById = async (req, res) => {
  try {
    const application = await TrainerApplication.findById(req.params.id)
      .select('-password')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin: Approve Application (Creates / Activates User with role 'Trainer')
exports.approveTrainerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const application = await TrainerApplication.findById(id).select('+password');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Application has already been approved.' });
    }

    // Check if user already exists with this email
    let user = await User.findOne({ email: application.email });
    if (!user) {
      user = await User.create({
        name: application.fullName,
        email: application.email,
        phone: application.phone,
        password: application.password || 'Trainer@QNOX2026!',
        role: 'Trainer',
        avatar: application.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
        gender: application.gender,
        dateOfBirth: application.dateOfBirth,
      });
    } else {
      user.role = 'Trainer';
      if (application.profilePhoto) user.avatar = application.profilePhoto;
      await user.save();
    }

    // Link or create Trainer profile model
    let trainerProfile = await Trainer.findOne({ user: user._id });
    if (!trainerProfile) {
      trainerProfile = await Trainer.create({
        user: user._id,
        name: user.name,
        role: 'Master Coach',
        title: application.qualifications || 'Certified Performance Specialist',
        email: user.email,
        phone: user.phone,
        bio: application.bio || 'Elite performance coach.',
        photo: user.avatar,
        specialties: application.specializations?.length ? application.specializations : ['Personal Training'],
        experienceYears: application.experienceYears || 5,
        isActive: true,
      });
    } else {
      trainerProfile.isActive = true;
      await trainerProfile.save();
    }

    // Update application record
    application.status = 'Approved';
    application.adminRemarks = adminRemarks || 'Application verified and approved by Executive Administration.';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.createdUser = user._id;
    await application.save();

    res.json({
      success: true,
      message: `Trainer application ${application.applicationId} approved. Trainer account created successfully.`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        userId: user._id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin: Reject Application
exports.rejectTrainerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    const application = await TrainerApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = 'Rejected';
    application.adminRemarks = adminRemarks || 'Application did not meet current sanctuary compliance standards.';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: `Trainer application ${application.applicationId} has been rejected.`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        adminRemarks: application.adminRemarks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
