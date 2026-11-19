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
