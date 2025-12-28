/**
 * Authentication Middleware
 *
 * Provides session-based authentication for the dashboard.
 * Uses database for user management with Nextcloud SSO integration.
 */

import userService from '../services/userService.js';
import nextcloudProvisioning from '../services/nextcloudProvisioningService.js';

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
 * Validate credentials against database
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object|null>} User object or null
 */
export const validateCredentials = async (username, password) => {
  try {
    const user = await userService.verifyCredentials(username, password);
    return user;
  } catch (error) {
    console.error('Credential validation error:', error.message);
    return null;
  }
};

/**
 * Validate against Nextcloud SSO
 * @param {string} username
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export const validateNextcloudAuth = async (username, password) => {
  try {
    return await nextcloudProvisioning.verifyCredentials(username, password);
  } catch (error) {
    console.error('Nextcloud auth failed:', error.message);
    return false;
  }
};
