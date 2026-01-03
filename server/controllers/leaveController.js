const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');

// @desc    Create leave request
// @route   POST /api/leave
// @access  Private
exports.createLeaveRequest = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leaveType, startDate, endDate, and reason'
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const leaveRequest = await LeaveRequest.create({
      userId: req.user.id,
      leaveType,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all leave requests (Admin/HR sees all, Employee sees own)
// @route   GET /api/leave
// @access  Private
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, leaveType } = req.query;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    let query = {};

    if (!isAdmin) {
      query.userId = req.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (leaveType) {
      query.leaveType = leaveType;
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('userId', 'employeeId email')
      .populate('reviewedBy', 'employeeId email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single leave request
// @route   GET /api/leave/:id
// @access  Private
exports.getLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('userId', 'employeeId email')
      .populate('reviewedBy', 'employeeId email');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    const isOwner = leaveRequest.userId._id.toString() === req.user.id;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this leave request'
      });
    }

    res.status(200).json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve leave request (Admin/HR only)
// @route   PUT /api/leave/:id/approve
// @access  Private (Admin/HR)
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { adminComment } = req.body;

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    leaveRequest.status = 'Approved';
    leaveRequest.adminComment = adminComment || '';
    leaveRequest.reviewedBy = req.user.id;
    leaveRequest.reviewedAt = new Date();

    await leaveRequest.save();

    // Update attendance records for approved leave
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = new Date(date);
      dateStr.setHours(0, 0, 0, 0);

      await Attendance.findOneAndUpdate(
        {
          userId: leaveRequest.userId,
          date: {
            $gte: dateStr,
            $lt: new Date(dateStr.getTime() + 24 * 60 * 60 * 1000)
          }
        },
        {
          userId: leaveRequest.userId,
          date: dateStr,
          status: 'Leave'
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reject leave request (Admin/HR only)
// @route   PUT /api/leave/:id/reject
// @access  Private (Admin/HR)
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { adminComment } = req.body;

    if (!adminComment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a comment for rejection'
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    leaveRequest.status = 'Rejected';
    leaveRequest.adminComment = adminComment;
    leaveRequest.reviewedBy = req.user.id;
    leaveRequest.reviewedAt = new Date();

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: 'Leave request rejected',
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

