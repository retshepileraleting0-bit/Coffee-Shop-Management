// Staff authentication routes
const express = require('express');
const router = express.Router();
const { getExpectedToken, requireStaffAuth } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Body: { password: "..." }
 */
router.post('/login', (req, res) => {
  const { password } = req.body || {};
  const currentStaffPassword = process.env.STAFF_PASSWORD || 'barista2024';

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a password to log in as staff.'
    });
  }

  if (password.trim() === currentStaffPassword.trim()) {
    const token = getExpectedToken();
    return res.json({
      success: true,
      message: 'Staff authentication successful.',
      token: token,
      role: 'staff'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid staff password. Please check your credentials.'
  });
});

/**
 * GET /api/auth/verify
 * Checks if current staff token is still valid
 */
router.get('/verify', requireStaffAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Staff session is valid.',
    staff: req.staff
  });
});

module.exports = router;

