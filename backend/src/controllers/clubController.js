const mongoose = require('mongoose');
const Club = require('../models/Club');
const { sampleClubs } = require('../seed/seedData');

// In-memory cache fallback if Mongo is disconnected
let inMemoryClubs = [...sampleClubs];

// Compute Dynamic Live Status based on operating days, hours, and operational status
const computeLiveStatus = (club, referenceDate = new Date()) => {
  if (!club) return 'CLOSED';

  // Suspended or Inactive branch is CLOSED
  if (club.operationalStatus && club.operationalStatus !== 'ACTIVE') {
    return 'CLOSED';
  }
  if (club.status === 'MAINTENANCE' || club.status === 'COMING SOON' || club.isActive === false) {
    return 'CLOSED';
  }

  // Days of week check
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[referenceDate.getDay()];
  if (Array.isArray(club.operatingDays) && club.operatingDays.length > 0) {
    if (!club.operatingDays.includes(currentDay)) {
      return 'CLOSED';
    }
  }

  // Operating Hours check
  const isWeekend = referenceDate.getDay() === 0 || referenceDate.getDay() === 6;
  const hoursStr = isWeekend
    ? club.openingHours?.weekends || '07:30 - 20:00'
    : club.openingHours?.weekdays || '06:00 - 22:30';

  const parts = hoursStr.split('-').map((s) => s.trim());
  if (parts.length === 2) {
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3] ? match[3].toUpperCase() : null;
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const openMinutes = parseTime(parts[0]);
    const closeMinutes = parseTime(parts[1]);
    const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

    if (openMinutes !== null && closeMinutes !== null) {
      if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
        return 'OPEN';
      } else {
        return 'CLOSED';
      }
    }
  }

  return 'OPEN';
};

exports.computeLiveStatus = computeLiveStatus;

exports.getAllClubs = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Enterprise filter: Public site shows only company-owned clubs OR approved, active, published partner branches
      const publicFilter = {
        $or: [
          { isCompanyOwned: true, isActive: true },
          {
            verificationStatus: { $in: ['APPROVED', 'ACTIVE'] },
            operationalStatus: 'ACTIVE',
            publicationStatus: 'PUBLISHED',
          },
        ],
      };

      const clubs = await Club.find(publicFilter).sort({ createdAt: 1 });
      if (clubs && clubs.length > 0) {
        const enrichedClubs = clubs.map((c) => {
          const clubObj = c.toObject();
          clubObj.liveStatus = computeLiveStatus(c);
          return clubObj;
        });

        return res.status(200).json({
          success: true,
          source: 'database',
          count: enrichedClubs.length,
          data: enrichedClubs,
        });
      }
    }

    const fallbackEnriched = inMemoryClubs
      .filter((c) => c.isActive !== false)
      .map((c) => ({
        ...c,
        liveStatus: computeLiveStatus(c),
      }));

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: fallbackEnriched.length,
      data: fallbackEnriched,
    });
  } catch (error) {
    const fallbackEnriched = inMemoryClubs
      .filter((c) => c.isActive !== false)
      .map((c) => ({
        ...c,
        liveStatus: computeLiveStatus(c),
      }));

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: fallbackEnriched.length,
      data: fallbackEnriched,
    });
  }
};

exports.getClubBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let club = await Club.findOne({ slug });
    if (!club) {
      club = inMemoryClubs.find((c) => c.slug === slug);
    }
    if (!club) {
      return res.status(404).json({
        success: false,
        message: `Sanctuary '${slug}' not found in QNOX portfolio`,
      });
    }

    // Ensure non-company branches are published before serving publicly
    if (!club.isCompanyOwned) {
      const isApproved = club.verificationStatus === 'APPROVED' || club.verificationStatus === 'ACTIVE';
      const isOperActive = club.operationalStatus === 'ACTIVE';
      const isPublished = club.publicationStatus === 'PUBLISHED';
      if (!isApproved || !isOperActive || !isPublished) {
        return res.status(404).json({
          success: false,
          message: `Sanctuary '${slug}' is currently undergoing verification or private setup.`,
        });
      }
    }

    const clubObj = typeof club.toObject === 'function' ? club.toObject() : { ...club };
    clubObj.liveStatus = computeLiveStatus(club);

    return res.status(200).json({
      success: true,
      data: clubObj,
    });
  } catch (error) {
    const club = inMemoryClubs.find((c) => c.slug === req.params.slug);
    if (club) {
      const clubObj = { ...club, liveStatus: computeLiveStatus(club) };
      return res.status(200).json({ success: true, data: clubObj });
    }
    next(error);
  }
};

exports.createClub = async (req, res, next) => {
  try {
    const newClub = await Club.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'New QNOX sanctuary commissioned successfully',
      data: newClub,
    });
  } catch (error) {
    inMemoryClubs.push(req.body);
    return res.status(201).json({
      success: true,
      message: 'New QNOX sanctuary commissioned (in-memory mode)',
      data: req.body,
    });
  }
};

exports.updateClub = async (req, res, next) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Sanctuary record not found.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Sanctuary details updated successfully.',
      data: club,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Sanctuary record not found.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Sanctuary removed from QNOX portfolio.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Branch Manager's Assigned Branch & Operational Stats
// @route   GET /api/clubs/my-branch
// @access  Private (Branch Manager, Receptionist, Admin)
exports.getMyBranch = async (req, res, next) => {
  try {
    const branchId = req.user.assignedBranch || req.user.homeClub;
    if (!branchId) {
      return res.status(404).json({
        success: false,
        message: 'No branch is currently assigned to your account.',
      });
    }

    const club = await Club.findById(branchId).populate('assignedManager organization');
    if (!club) {
      return res.status(404).json({ success: false, message: 'Assigned branch not found.' });
    }

    const User = require('../models/User');
    const Attendance = require('../models/Attendance');

    const [membersCount, todayAttendance] = await Promise.all([
      User.countDocuments({ homeClub: club._id, role: 'Gym Member' }),
      Attendance.countDocuments({
        club: club._id,
        status: 'Approved',
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        branch: club,
        stats: {
          membersCount,
          todayAttendance,
          currentOccupancy: club.currentOccupancy || 0,
          capacity: club.capacity || 150,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign Branch Manager to a Branch
// @route   POST /api/clubs/assign-manager
// @access  Private (Super Admin)
exports.assignBranchManager = async (req, res, next) => {
  try {
    const { branchId, managerId } = req.body;
    const club = await Club.findById(branchId);
    if (!club) return res.status(404).json({ success: false, message: 'Branch not found.' });

    const User = require('../models/User');
    const manager = await User.findById(managerId);
    if (!manager) return res.status(404).json({ success: false, message: 'User not found.' });

    manager.role = 'Branch Manager';
    manager.assignedBranch = club._id;
    manager.assignedBranchName = club.name;
    await manager.save();

    club.assignedManager = manager._id;
    club.assignedManagerName = manager.name;
    club.assignedManagerEmail = manager.email;
    await club.save();

    return res.status(200).json({
      success: true,
      message: `${manager.name} successfully appointed as Branch Manager for ${club.name}.`,
      data: { club, manager },
    });
  } catch (error) {
    next(error);
  }
};
