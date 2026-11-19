const Trainer = require('../models/Trainer');

exports.getAllTrainers = async (req, res, next) => {
  try {
    const query = req.query.all === 'true' ? {} : { isActive: true };
    const trainers = await Trainer.find(query).sort({ rating: -1, createdAt: 1 });
    res.status(200).json({
      success: true,
      count: trainers.length,
      data: trainers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrainerById = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Master Trainer not found in sanctuary records.',
      });
    }
    res.status(200).json({
      success: true,
      data: trainer,
    });
  } catch (error) {
    next(error);
  }
};

exports.createTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Master Coach commissioned successfully.',
      data: trainer,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer record not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Trainer profile updated successfully.',
      data: trainer,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer record not found.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Trainer profile removed from sanctuary roster.',
    });
  } catch (error) {
    next(error);
  }
};
