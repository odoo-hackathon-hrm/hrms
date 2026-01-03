const Payroll = require('../models/Payroll');
const EmployeeProfile = require('../models/EmployeeProfile');

// @desc    Get all payroll records (Admin/HR) or own records (Employee)
// @route   GET /api/payroll
// @access  Private
exports.getPayroll = async (req, res) => {
  try {
    const { userId, month, year } = req.query;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    let query = {};

    if (isAdmin) {
      if (userId) {
        query.userId = userId;
      }
    } else {
      query.userId = req.user.id;
    }

    if (month) {
      query.month = month;
    }

    if (year) {
      query.year = parseInt(year);
    }

    const payroll = await Payroll.find(query)
      .populate('userId', 'employeeId email')
      .sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: payroll.length,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single payroll record
// @route   GET /api/payroll/:id
// @access  Private
exports.getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('userId', 'employeeId email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Check authorization
    const isOwner = payroll.userId._id.toString() === req.user.id;
    const isAdmin = ['admin', 'hr'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payroll record'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create or update payroll (Admin/HR only)
// @route   POST /api/payroll
// @access  Private (Admin/HR)
exports.createPayroll = async (req, res) => {
  try {
    const {
      userId,
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      specialAllowance,
      providentFund,
      professionalTax,
      incomeTax,
      month,
      year,
      remarks
    } = req.body;

    // Validation
    if (!userId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, month, and year'
      });
    }

    // Calculate gross and net salary
    const grossSalary = (basicSalary || 0) +
      (houseRentAllowance || 0) +
      (medicalAllowance || 0) +
      (conveyanceAllowance || 0) +
      (specialAllowance || 0);

    const totalDeductions = (providentFund || 0) +
      (professionalTax || 0) +
      (incomeTax || 0);

    const netSalary = grossSalary - totalDeductions;

    const payroll = await Payroll.findOneAndUpdate(
      { userId, month, year },
      {
        userId,
        basicSalary: basicSalary || 0,
        houseRentAllowance: houseRentAllowance || 0,
        medicalAllowance: medicalAllowance || 0,
        conveyanceAllowance: conveyanceAllowance || 0,
        specialAllowance: specialAllowance || 0,
        grossSalary,
        providentFund: providentFund || 0,
        professionalTax: professionalTax || 0,
        incomeTax: incomeTax || 0,
        netSalary,
        month,
        year: parseInt(year),
        remarks: remarks || ''
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update payroll (Admin/HR only)
// @route   PUT /api/payroll/:id
// @access  Private (Admin/HR)
exports.updatePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const {
      basicSalary,
      houseRentAllowance,
      medicalAllowance,
      conveyanceAllowance,
      specialAllowance,
      providentFund,
      professionalTax,
      incomeTax,
      remarks
    } = req.body;

    // Update fields if provided
    if (basicSalary !== undefined) payroll.basicSalary = basicSalary;
    if (houseRentAllowance !== undefined) payroll.houseRentAllowance = houseRentAllowance;
    if (medicalAllowance !== undefined) payroll.medicalAllowance = medicalAllowance;
    if (conveyanceAllowance !== undefined) payroll.conveyanceAllowance = conveyanceAllowance;
    if (specialAllowance !== undefined) payroll.specialAllowance = specialAllowance;
    if (providentFund !== undefined) payroll.providentFund = providentFund;
    if (professionalTax !== undefined) payroll.professionalTax = professionalTax;
    if (incomeTax !== undefined) payroll.incomeTax = incomeTax;
    if (remarks !== undefined) payroll.remarks = remarks;

    // Recalculate gross and net salary
    payroll.grossSalary = payroll.basicSalary +
      payroll.houseRentAllowance +
      payroll.medicalAllowance +
      payroll.conveyanceAllowance +
      payroll.specialAllowance;

    const totalDeductions = payroll.providentFund +
      payroll.professionalTax +
      payroll.incomeTax;

    payroll.netSalary = payroll.grossSalary - totalDeductions;

    await payroll.save();

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

