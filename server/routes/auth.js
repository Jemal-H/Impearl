const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/User');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'profilePicture') {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed for profile picture!'), false);
      }
    } else if (file.fieldname === 'resume') {
      if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
        return cb(new Error('Only PDF and DOC files are allowed for resume!'), false);
      }
    }
    cb(null, true);
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

router.post('/register/client', async (req, res) => {
  try {
    const { name, email, password, businessName, businessType, companySize, address } = req.body;

    if (!name || !email || !password || !businessName || !businessType || !companySize || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = new User({
      name,
      email,
      password,
      userType: 'client'
    });

    await user.save();

    const client = new Client({
      userId: user._id,
      businessName,
      businessType,
      companySize,
      address
    });

    await client.save();

    const token = generateToken(user._id, 'client');

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

router.post('/register/freelancer', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, password, skills, experience } = req.body;

    if (!name || !email || !password || !skills || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const user = new User({
      name,
      email,
      password,
      userType: 'freelancer'
    });

    await user.save();

    const profilePicturePath = req.files['profilePicture'] ? 
      `/uploads/${req.files['profilePicture'][0].filename}` : null;
    const resumePath = req.files['resume'] ? 
      `/uploads/${req.files['resume'][0].filename}` : null;

    const freelancer = new Freelancer({
      userId: user._id,
      profilePicture: profilePicturePath,
      resume: resumePath,
      skills,
      experience
    });

    await freelancer.save();

    const token = generateToken(user._id, 'freelancer');

    res.status(201).json({
      success: true,
      message: 'Freelancer registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Freelancer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and user type'
      });
    }

    const user = await User.findOne({ email, userType });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    let profileData = {};
    if (userType === 'client') {
      const client = await Client.findOne({ userId: user._id });
      profileData = client;
    } else if (userType === 'freelancer') {
      const freelancer = await Freelancer.findOne({ userId: user._id });
      profileData = freelancer;
    }

    const token = generateToken(user._id, userType);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        profile: profileData
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profileData = {};
    if (user.userType === 'client') {
      profileData = await Client.findOne({ userId: user._id });
    } else if (user.userType === 'freelancer') {
      profileData = await Freelancer.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        profile: profileData
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;