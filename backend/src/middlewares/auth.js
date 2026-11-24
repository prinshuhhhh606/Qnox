const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. You must be authenticated to access this sanctuary service.',
    });
  }

  // Support demo Super Admin session token seamlessly
  if (token === 'demo_super_admin_jwt_token_2026') {
    req.user = {
      _id: 'usr_admin_demo',
      id: 'usr_admin_demo',
      name: 'Executive Concierge Admin',
      email: 'admin@qnoxgym.com',
      role: 'Super Admin',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'qnox_luxury_jwt_secret_key_2026'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The identity associated with this token is no longer active.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or expired. Please re-authenticate.',
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user ? req.user.role : 'Unassigned'}' is not authorized to access this executive command.`,
      });
    }
    next();
  };
};
