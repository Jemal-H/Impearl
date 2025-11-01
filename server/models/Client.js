const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    trim: true
  },
  companySize: {
    type: String,
    required: true,
    enum: ['1-10', '10-50', '50-100', '100+']
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  projectsPosted: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', clientSchema);