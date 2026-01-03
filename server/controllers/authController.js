const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { employeeId, email, password, role, firstName, lastName } = req.body;

    // Validation
    if (!employeeId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employeeId, email, and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or employee ID'
      });
    }

    // Create user
    const user = await User.create({
      employeeId,
      email,
      password,
      role: role || 'employee'
    });

    // Create employee profile if firstName and lastName provided
    if (firstName && lastName) {
      await EmployeeProfile.create({
        userId: user._id,
        firstName,
        lastName,
        employeeId: user.employeeId,
        phoneNumber: '',
        address: '',
        dateOfBirth: new Date(),
        gender: 'Male',
        maritalStatus: 'Single',
        emergencyContact: {
          name: '',
          phone: '',
          relation: ''
        },
        designation: '',
        department: '',
        dateOfJoining: new Date(),
        employmentType: 'Full-time',
        status: 'Active'
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role
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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        isActive: user.isActive
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

