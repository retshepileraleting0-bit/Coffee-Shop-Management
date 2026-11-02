/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARE: Staff Protection
 * ============================================================================
 * Protects staff-only routes (such as adding/editing/deleting menu items and
 * viewing/updating customer orders).
 *
 * Checks for a Bearer token or 'x-staff-token' header that matches the
 * active staff token generated at /api/auth/login.
 */

// Simple shared secret / token generator for human-like, easy-to-understand auth
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'barista2024';

/**
 * Helper to compute an expected staff session token from the staff password
 */
function getExpectedToken() {
  return Buffer.from(`coffee-staff:${STAFF_PASSWORD}`).toString('base64');
}

/**
 * Middleware function to enforce staff authentication
 */
function requireStaffAuth(req, res, next) {
  // Read auth header from Authorization (Bearer ...) or custom header x-staff-token
  const authHeader = req.headers['authorization'] || '';
  const customHeader = req.headers['x-staff-token'] || '';

  let clientToken = '';
  if (authHeader.startsWith('Bearer ')) {
    clientToken = authHeader.substring(7).trim();
  } else if (customHeader) {
    clientToken = customHeader.trim();
  }

  const expectedToken = getExpectedToken();

  // Accept either the encoded session token or direct staff password for testing ease
  if (clientToken && (clientToken === expectedToken || clientToken === STAFF_PASSWORD)) {
    req.staff = { role: 'staff', authenticatedAt: new Date().toISOString() };
    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Access denied: Staff authentication required to perform this action.'
  });
}

module.exports = {
  requireStaffAuth,
  getExpectedToken,
  STAFF_PASSWORD
};

