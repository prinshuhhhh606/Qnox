const mongoose = require('mongoose');
const TrainerApplication = require('../models/TrainerApplication');
const User = require('../models/User');
const Trainer = require('../models/Trainer');

// Generate Unique Application ID e.g. QNX-TRN-7849
function generateApplicationId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `QNX-TRN-${randomNum}`;
}

// In-memory zero-downtime store pre-seeded with 5 realistic candidate applications
const initialSeedApplications = [
  {
    _id: 'app_seed_001',
    applicationId: 'QNX-TRN-7849',
    fullName: 'Vikram Sen',
    email: 'vikram.sen@qnoxfit.com',
    phone: '+91 98765 43210',
    gender: 'Male',
    experienceYears: 8,
    specializations: ['Weight Training', 'Muscle Building', 'Nutrition Coaching'],
    qualifications: 'ACSM Certified Exercise Physiologist, CSCS',
    certifications: 'ISSA Strength & Conditioning, Precision Nutrition Level 2',
    bio: 'Elite performance coach specializing in hypertrophy, functional strength, and biomechanics for high-net-worth clients.',
    gymName: 'The Iron Sanctuary',
    gymAddress: 'Bandra West, Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    gymContactNumber: '+91 22 2640 1122',
    gymType: 'Independent Trainer',
    certificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    identityProofDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    experienceCertificateDocument: '',
    linkedinProfile: 'https://linkedin.com/in/vikram-sen-fitness',
    instagramProfile: 'https://instagram.com/vikramsen.fit',
    confirmedAccuracy: true,
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    _id: 'app_seed_002',
    applicationId: 'QNX-TRN-4192',
    fullName: 'Ananya Sharma',
    email: 'ananya.sharma@sanctuary.in',
    phone: '+91 98111 22334',
    gender: 'Female',
    experienceYears: 6,
    specializations: ['Yoga', 'Personal Training', 'Cardio'],
    qualifications: 'Yoga Alliance RYT-500, ACE Master Trainer',
    certifications: 'Pranayama & Biomechanics Specialist',
    bio: 'Holistic mind-body practitioner blending ancient Vinyasa flow with modern postural biomechanics.',
    gymName: 'Atelier Wellness',
    gymAddress: 'Chanakyapuri High Street',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110021',
    gymContactNumber: '+91 11 4155 9900',
    gymType: 'Commercial Gym Trainer',
    certificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    identityProofDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    experienceCertificateDocument: '',
    linkedinProfile: 'https://linkedin.com/in/ananyasharma',
    instagramProfile: 'https://instagram.com/ananya.coach',
    confirmedAccuracy: true,
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    _id: 'app_seed_003',
    applicationId: 'QNX-TRN-6231',
    fullName: 'Marcus Vance',
    email: 'marcus.vance@qnoxperformance.com',
    phone: '+91 99880 11223',
    gender: 'Male',
    experienceYears: 10,
    specializations: ['Olympic Lifting', 'Kinetic Acceleration', 'VO2 Max Protocol'],
    qualifications: 'NSCA-CSCS, UKSCA Accredited Strength Coach',
    certifications: 'USAW Level 2 Olympic Lifting Coach, EXOS Performance',
    bio: 'Former strength advisor to European athletes focusing on power output, neural drive, and rapid sprint biomechanics.',
    gymName: 'Apex Performance Club',
    gymAddress: 'Indiranagar 100ft Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560038',
    gymContactNumber: '+91 80 4123 5566',
    gymType: 'Commercial Gym Trainer',
    certificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    identityProofDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    experienceCertificateDocument: '',
    linkedinProfile: 'https://linkedin.com/in/marcus-vance-cscs',
    instagramProfile: 'https://instagram.com/marcus.vance.performance',
    confirmedAccuracy: true,
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    _id: 'app_seed_004',
    applicationId: 'QNX-TRN-8904',
    fullName: 'Elena Rostova',
    email: 'elena.rostova@sanctuaryfit.com',
    phone: '+91 97665 44332',
    gender: 'Female',
    experienceYears: 7,
    specializations: ['Sub-Zero Conditioning', 'Hypertrophy', 'CrossFit'],
    qualifications: 'NASM-CPT, Polestar Pilates Master Practitioner',
    certifications: 'Oxygen Advantage Master Instructor, Functional Range Conditioning (FRC)',
    bio: 'Specialist in hypoxic recovery, core stability, and athletic postural alignment with over 7 years in luxury fitness clubs.',
    gymName: 'CryoFit Sanctuary',
    gymAddress: 'Colaba Waterfront',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400005',
    gymContactNumber: '+91 22 2218 4400',
    gymType: 'Independent Trainer',
    certificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    identityProofDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    experienceCertificateDocument: '',
    linkedinProfile: 'https://linkedin.com/in/elena-rostova-trainer',
    instagramProfile: 'https://instagram.com/elena.rostova.fit',
    confirmedAccuracy: true,
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    _id: 'app_seed_005',
    applicationId: 'QNX-TRN-5517',
    fullName: 'Rohan Singhania',
    email: 'rohan.singhania@apexfitness.in',
    phone: '+91 98223 77889',
    gender: 'Male',
    experienceYears: 5,
    specializations: ['Functional Hypertrophy', 'Sports Injury Rehab', 'Personal Training'],
    qualifications: 'B.Sc. Exercise & Sports Science, EXOS Performance Specialist',
    certifications: 'FMS Level 2, Barefoot Training Specialist',
    bio: 'Passionate about joint longevity, athletic movement patterns, and progressive resistance training for busy executives.',
    gymName: 'Elite Athletica',
    gymAddress: 'Jubilee Hills Road No. 36',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500033',
    gymContactNumber: '+91 40 2355 7788',
    gymType: 'Commercial Gym Trainer',
    certificationDocument: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
    identityProofDocument: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    experienceCertificateDocument: '',
    linkedinProfile: 'https://linkedin.com/in/rohan-singhania-fit',
    instagramProfile: 'https://instagram.com/rohan.singhania.coach',
    confirmedAccuracy: true,
    status: 'Pending',
    createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
  },
];

let inMemoryTrainerApplications = [...initialSeedApplications];

// Helper export to check applications across controllers
exports.findInMemoryApplicationByEmail = (email) => {
  if (!email) return null;
  return inMemoryTrainerApplications.find(
    (a) => a.email && a.email.toLowerCase() === email.toLowerCase()
  );
};

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

    // Check if user already exists with role Trainer in DB
    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser && existingUser.role === 'Trainer') {
          return res.status(400).json({
            success: false,
            message: 'A registered Trainer account already exists with this email address. Please sign in.',
          });
        }
      } catch (e) {}
    }

    // Check if an existing application is already Pending or Under Review
    const existingInMem = inMemoryTrainerApplications.find(
      (a) => a.email === email.toLowerCase() && ['Pending', 'Under Review'].includes(a.status)
    );
    if (existingInMem) {
      return res.status(400).json({
        success: false,
        message: `An active application (${existingInMem.applicationId}) is already under review for this email address. Please track your status.`,
      });
    }

    // Generate Unique Application ID
    let applicationId = generateApplicationId();
    while (inMemoryTrainerApplications.some((a) => a.applicationId === applicationId)) {
      applicationId = generateApplicationId();
    }

    const applicationRecord = {
      _id: 'app_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      applicationId,
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
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
      createdAt: new Date().toISOString(),
    };

    // Prepend to in-memory store so it shows immediately in Admin Dashboard
    inMemoryTrainerApplications.unshift(applicationRecord);

    // If MongoDB is connected, also persist to DB
    if (mongoose.connection.readyState === 1) {
      try {
        const dbApp = await TrainerApplication.create({
          ...applicationRecord,
          _id: undefined,
        });
        if (dbApp && dbApp._id) {
          applicationRecord._id = dbApp._id.toString();
        }
      } catch (err) {
        console.warn('Non-fatal: MongoDB TrainerApplication.create error:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Your trainer application has been submitted successfully. Our admin team will review your details.',
      data: {
        _id: applicationRecord._id,
        applicationId: applicationRecord.applicationId,
        fullName: applicationRecord.fullName,
        email: applicationRecord.email,
        status: applicationRecord.status,
        submittedAt: applicationRecord.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    let application = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (applicationId) query.applicationId = applicationId.trim().toUpperCase();
        if (email) query.email = email.trim().toLowerCase();
        application = await TrainerApplication.findOne(query).select('-password').sort({ createdAt: -1 });
      } catch (e) {}
    }

    if (!application) {
      application = inMemoryTrainerApplications.find((a) => {
        if (applicationId && a.applicationId.toUpperCase() === applicationId.trim().toUpperCase()) return true;
        if (email && a.email.toLowerCase() === email.trim().toLowerCase()) return true;
        return false;
      });
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No trainer application found with the provided details.',
      });
    }

    return res.json({
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Admin: Get All Trainer Applications
exports.getAllTrainerApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    let dbApplications = [];

    const effectiveStatus = (status && status !== 'All' && status !== 'undefined' && status !== 'null') ? status : null;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (effectiveStatus) {
          query.status = effectiveStatus;
        }
        if (search) {
          query.$or = [
            { fullName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { applicationId: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
          ];
        }
        dbApplications = await TrainerApplication.find(query).select('-password').sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('DB query error, fallback to memory store:', dbErr.message);
      }
    }

    // Merge DB results with in-memory store (deduplicating cleanly by applicationId, _id, and email)
    const combined = [...(dbApplications || [])];
    const seenIds = new Set();
    const seenEmails = new Set();
    for (const a of combined) {
      if (a.applicationId) seenIds.add(a.applicationId);
      if (a._id) seenIds.add(String(a._id));
      if (a.email) seenEmails.add(a.email.toLowerCase());
    }

    for (const memApp of inMemoryTrainerApplications) {
      const hasId = (memApp.applicationId && seenIds.has(memApp.applicationId)) || (memApp._id && seenIds.has(String(memApp._id)));
      const hasEmail = memApp.email && seenEmails.has(memApp.email.toLowerCase());
      if (!hasId && !hasEmail) {
        combined.push(memApp);
        if (memApp.applicationId) seenIds.add(memApp.applicationId);
        if (memApp._id) seenIds.add(String(memApp._id));
        if (memApp.email) seenEmails.add(memApp.email.toLowerCase());
      }
    }

    // Filter combined results
    let filtered = combined;
    if (effectiveStatus) {
      filtered = filtered.filter((a) => a.status === effectiveStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.fullName && a.fullName.toLowerCase().includes(q)) ||
          (a.email && a.email.toLowerCase().includes(q)) ||
          (a.applicationId && a.applicationId.toLowerCase().includes(q)) ||
          (a.phone && a.phone.includes(q))
      );
    }

    // Sort: Pending applications first, real user submissions prioritized above seeds, newest first
    filtered.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;

      const aIsSeed = String(a._id || '').startsWith('app_seed_');
      const bIsSeed = String(b._id || '').startsWith('app_seed_');
      if (!aIsSeed && bIsSeed) return -1;
      if (aIsSeed && !bIsSeed) return 1;

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      total: filtered.length,
      data: paginated,
    });
  } catch (error) {
    return res.json({
      success: true,
      total: inMemoryTrainerApplications.length,
      data: inMemoryTrainerApplications,
    });
  }
};

// 4. Admin: Get Single Trainer Application Details
exports.getTrainerApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    let application = null;

    if (mongoose.connection.readyState === 1) {
      try {
        application = await TrainerApplication.findById(id)
          .select('-password')
          .populate('reviewedBy', 'name email');
      } catch (e) {}
    }

    if (!application) {
      application = inMemoryTrainerApplications.find(
        (a) => a._id === id || a.applicationId === id
      );
    }

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Admin: Approve Application (Creates / Activates User with role 'Trainer')
exports.approveTrainerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    let application = null;

    if (mongoose.connection.readyState === 1) {
      try {
        application = await TrainerApplication.findById(id).select('+password');
      } catch (e) {}
    }

    if (!application) {
      application = inMemoryTrainerApplications.find(
        (a) => a._id === id || a.applicationId === id
      );
    }

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Application has already been approved.' });
    }

    // Mark Approved in in-memory store
    application.status = 'Approved';
    application.adminRemarks = adminRemarks || 'Application verified and approved by Executive Administration.';
    application.reviewedAt = new Date().toISOString();

    const memAppIndex = inMemoryTrainerApplications.findIndex(
      (a) => a._id === id || a.applicationId === id || a.applicationId === application.applicationId
    );
    if (memAppIndex !== -1) {
      inMemoryTrainerApplications[memAppIndex].status = 'Approved';
      inMemoryTrainerApplications[memAppIndex].adminRemarks = application.adminRemarks;
      inMemoryTrainerApplications[memAppIndex].reviewedAt = application.reviewedAt;
    }

    // Link or create user and trainer profile in MongoDB
    let userId = null;
    if (mongoose.connection.readyState === 1) {
      try {
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

        if (typeof application.save === 'function') {
          application.reviewedBy = req.user ? req.user._id : undefined;
          application.createdUser = user._id;
          await application.save();
        }
        userId = user._id;
      } catch (err) {
        console.warn('Non-fatal: DB user linking during trainer approval:', err.message);
      }
    }

    return res.json({
      success: true,
      message: `Trainer application ${application.applicationId} approved. Trainer account created successfully.`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        userId: userId || application._id,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Admin: Reject Application
exports.rejectTrainerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks } = req.body;

    let application = null;
    if (mongoose.connection.readyState === 1) {
      try {
        application = await TrainerApplication.findById(id);
      } catch (e) {}
    }

    if (!application) {
      application = inMemoryTrainerApplications.find(
        (a) => a._id === id || a.applicationId === id
      );
    }

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = 'Rejected';
    application.adminRemarks = adminRemarks || 'Application did not meet current sanctuary compliance standards.';
    application.reviewedAt = new Date().toISOString();

    const memAppIndex = inMemoryTrainerApplications.findIndex(
      (a) => a._id === id || a.applicationId === id || a.applicationId === application.applicationId
    );
    if (memAppIndex !== -1) {
      inMemoryTrainerApplications[memAppIndex].status = 'Rejected';
      inMemoryTrainerApplications[memAppIndex].adminRemarks = application.adminRemarks;
      inMemoryTrainerApplications[memAppIndex].reviewedAt = application.reviewedAt;
    }

    if (mongoose.connection.readyState === 1 && typeof application.save === 'function') {
      try {
        application.reviewedBy = req.user ? req.user._id : undefined;
        await application.save();
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: `Trainer application ${application.applicationId} has been rejected.`,
      data: {
        applicationId: application.applicationId,
        status: application.status,
        adminRemarks: application.adminRemarks,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
