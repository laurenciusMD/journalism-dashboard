/**
 * Authentication Middleware
 *
 * Provides session-based authentication for the dashboard.
 * Uses credentials from environment variables or Nextcloud authentication.
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

/**
 * Validate credentials against environment variables
 */
export const validateCredentials = (username, password) => {
  const validUsername = process.env.DASHBOARD_USERNAME || process.env.NEXTCLOUD_USERNAME;
  const validPassword = process.env.DASHBOARD_PASSWORD || process.env.NEXTCLOUD_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('WARNING: No credentials configured in environment variables!');
    return false;
  }

  return username === validUsername && password === validPassword;
};

/**
 * Optional: Validate against Nextcloud
 * This would authenticate against Nextcloud's API
 */
export const validateNextcloudAuth = async (username, password, nextcloudUrl) => {
  if (!nextcloudUrl) {
    return false;
  }

  try {
    const axios = require('axios');

    // Try to access Nextcloud user endpoint
    const response = await axios.get(`${nextcloudUrl}/ocs/v1.php/cloud/user`, {
      auth: {
        username,
        password
      },
      headers: {
        'OCS-APIRequest': 'true'
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('Nextcloud auth failed:', error.message);
    return false;
  }
};
