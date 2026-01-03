const EmployeeProfile = require('../models/EmployeeProfile');
const User = require('../models/User');

// @desc    Get all employee profiles (Admin/HR only)
// @route   GET /api/profile
// @access  Private (Admin/HR)
exports.getAllProfiles = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    const profiles = await EmployeeProfile.find(query)
      .populate('userId', 'email employeeId role isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single employee profile
// @route   GET /api/profile/:id
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({ userId: req.params.id })
      .populate('userId', 'email employeeId role isActive');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Check if user can access this profile
    const isOwner = req.user.id.toString() === req.params.id;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this profile'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get own profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({ userId: req.user.id })
      .populate('userId', 'email employeeId role isActive');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create or update employee profile
// @route   PUT /api/profile/:id
// @access  Private (Admin/HR can edit any, Employee can edit own)
exports.updateProfile = async (req, res) => {
  try {
    const isAdmin = ['admin', 'hr'].includes(req.user.role);
    const isOwner = req.user.id.toString() === req.params.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    let profile = await EmployeeProfile.findOne({ userId: req.params.id });

    if (!profile) {
      // Create new profile if doesn't exist
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      profile = await EmployeeProfile.create({
        userId: req.params.id,
        employeeId: user.employeeId,
        ...req.body
      });
    } else {
      // Update existing profile
      // Employees can only update limited fields
      if (!isAdmin) {
        const allowedFields = ['phoneNumber', 'address', 'emergencyContact'];
        const updateData = {};
        allowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
          }
        });
        Object.assign(profile, updateData);
      } else {
        // Admin can update all fields
        Object.assign(profile, req.body);
      }

      await profile.save();
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

