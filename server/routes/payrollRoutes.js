const express = require('express');
const router = express.Router();
const {
  getPayroll,
  getPayrollById,
  createPayroll,
  updatePayroll
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', protect, getPayroll);
router.get('/:id', protect, getPayrollById);
router.post('/', protect, authorize('admin', 'hr'), createPayroll);
router.put('/:id', protect, authorize('admin', 'hr'), updatePayroll);

module.exports = router;

