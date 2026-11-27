const mongoose = require('mongoose');
const Club = require('../models/Club');
const { sampleClubs } = require('../seed/seedData');

// In-memory cache fallback if Mongo is disconnected
let inMemoryClubs = [...sampleClubs];

exports.getAllClubs = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const clubs = await Club.find().sort({ createdAt: 1 });
      if (clubs && clubs.length > 0) {
        return res.status(200).json({
          success: true,
          source: 'database',
          count: clubs.length,
          data: clubs,
        });
      }
    }
    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: inMemoryClubs.length,
      data: inMemoryClubs,
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: inMemoryClubs.length,
      data: inMemoryClubs,
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
    return res.status(200).json({
      success: true,
      data: club,
    });
  } catch (error) {
    const club = inMemoryClubs.find((c) => c.slug === req.params.slug);
    if (club) {
      return res.status(200).json({ success: true, data: club });
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
