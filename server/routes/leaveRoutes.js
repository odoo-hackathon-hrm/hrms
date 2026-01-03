const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/', protect, createLeaveRequest);
router.get('/', protect, getLeaveRequests);
router.get('/:id', protect, getLeaveRequest);
router.put('/:id/approve', protect, authorize('admin', 'hr'), approveLeaveRequest);
router.put('/:id/reject', protect, authorize('admin', 'hr'), rejectLeaveRequest);

module.exports = router;

