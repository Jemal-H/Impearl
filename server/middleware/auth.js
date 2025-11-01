const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const isClient = (req, res, next) => {
  if (req.userType !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route is only for clients.'
    });
  }
  next();
};

const isFreelancer = (req, res, next) => {
  if (req.userType !== 'freelancer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This route is only for freelancers.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  isClient,
  isFreelancer
};