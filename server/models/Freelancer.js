const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  resume: {
    type: String,
    default: null
  },
  skills: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    enum: ['0-1', '1-3', '3-5', '5-10', '10+']
  },
  portfolioItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PortfolioItem'
  }],
  proposalsSubmitted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Freelancer', freelancerSchema);