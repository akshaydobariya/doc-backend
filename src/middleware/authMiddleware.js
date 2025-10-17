/**
 * Authentication Middleware
 * Ensures user is authenticated and provides user information to routes
 */

const authMiddleware = (req, res, next) => {
  // Check if user is authenticated via session
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Add user to request object
  req.user = req.session.user;
  next();
};

/**
 * Role-based authorization middleware
 * @param {Array} allowedRoles - Array of roles that can access the route
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Doctor-only middleware
 * Ensures only doctors can access certain routes
 */
const requireDoctor = requireRole(['doctor']);

/**
 * Admin-only middleware
 * Ensures only admins can access certain routes
 */
const requireAdmin = requireRole(['admin']);

module.exports = {
  authMiddleware,
  requireRole,
  requireDoctor,
  requireAdmin
};