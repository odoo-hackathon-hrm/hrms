const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  checkOut: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-day', 'Leave'],
    default: 'Absent'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

