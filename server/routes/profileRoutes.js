const express = require('express');
const router = express.Router();
const {
  getAllProfiles,
  getProfile,
  getMyProfile,
  updateProfile
} = require('../controllers/profileController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/me', protect, getMyProfile);
router.get('/', protect, authorize('admin', 'hr'), getAllProfiles);
router.get('/:id', protect, getProfile);
router.put('/:id', protect, updateProfile);

module.exports = router;

