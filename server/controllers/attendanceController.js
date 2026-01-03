const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Check in
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (attendance && attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const checkInData = {
      time: new Date(),
      location: req.body.location || {}
    };

    if (attendance) {
      attendance.checkIn = checkInData;
      attendance.status = 'Present';
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        userId: req.user.id,
        date: new Date(),
        checkIn: checkInData,
        status: 'Present'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check out
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Please check in first'
      });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.checkIn.time);
    const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours

    attendance.checkOut = {
      time: checkOutTime,
      location: req.body.location || {}
    };
    attendance.workingHours = workingHours;

    // Update status based on working hours
    if (workingHours < 4) {
      attendance.status = 'Half-day';
    } else {
      attendance.status = 'Present';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all attendance records (Admin/HR) or own records (Employee)
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    let query = {};

    if (isAdmin) {
      if (userId) {
        query.userId = userId;
      }
    } else {
      query.userId = req.user.id;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'employeeId email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          checkedIn: false,
          checkedOut: false,
          status: 'Absent'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        checkedIn: !!attendance.checkIn.time,
        checkedOut: !!attendance.checkOut.time,
        checkInTime: attendance.checkIn.time,
        checkOutTime: attendance.checkOut.time,
        status: attendance.status,
        workingHours: attendance.workingHours
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update attendance status (Admin/HR only)
// @route   PUT /api/attendance/:id
// @access  Private (Admin/HR)
exports.updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (status) {
      attendance.status = status;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

