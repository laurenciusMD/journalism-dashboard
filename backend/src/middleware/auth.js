/**
 * Authentication Middleware
 *
 * Provides session-based authentication for the dashboard.
 * Uses Nextcloud for user management and authentication.
 */

/**
 * Check if user is authenticated
 */
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Please login to access this resource'
  });
};
