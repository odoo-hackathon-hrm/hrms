const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance,
  updateAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/', protect, getAttendance);
router.put('/:id', protect, authorize('admin', 'hr'), updateAttendance);

module.exports = router;

