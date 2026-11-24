const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeRegistrationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Helper to sign JWT token
const sendTokenResponse = (user, statusCode, res, message = 'Authentication successful') => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'qnox_luxury_jwt_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      membership: user.membership,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Register Member
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A sanctuary dossier with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'Gym Member',
    });

    // Send Welcome Email asynchronously
    sendWelcomeRegistrationEmail(user).catch((e) => console.log(e.message));

    sendTokenResponse(user, 201, res, 'Sanctuary account established successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Login User
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Check if this email has a pending or rejected trainer application
      const TrainerApplication = require('../models/TrainerApplication');
      const pendingApp = await TrainerApplication.findOne({ email: email.toLowerCase() });
      if (pendingApp) {
        if (pendingApp.status === 'Pending' || pendingApp.status === 'Under Review') {
          return res.status(403).json({
            success: false,
            message: `Your trainer application (${pendingApp.applicationId}) is currently pending admin review. You can only log in after approval.`,
          });
        } else if (pendingApp.status === 'Rejected') {
          return res.status(403).json({
            success: false,
            message: `Your trainer application was rejected: "${pendingApp.adminRemarks || 'Did not meet compliance standards'}".`,
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Access rejected.',
      });
    }

    // If user has role Trainer, verify that their profile is approved and active
    if (user.role === 'Trainer') {
      const Trainer = require('../models/Trainer');
      const trainerRecord = await Trainer.findOne({
        $or: [{ user: user._id }, { email: user.email }]
      });

      if (trainerRecord && trainerRecord.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your trainer profile is currently inactive or pending administrative reactivation.',
        });
      }
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Access rejected.',
      });
    }

    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}.`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('membership.planId');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Profile Details
// @route   PUT /api/auth/updatedetails
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
    };
    if (req.body.avatar) {
      fieldsToUpdate.avatar = req.body.avatar;
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Sanctuary profile updated.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Token Generation
// @route   POST /api/auth/forgotpassword
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No member dossier located for this email address.',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Client Reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset dispatch transmitted to your email.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with Token
// @route   PUT /api/auth/resetpassword/:resettoken
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password updated successfully. Access granted.');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out from QNOX Sanctuary network.',
  });
};
