import axios from 'axios';

/**
 * Nextcloud User Provisioning API Service
 * Manages user creation and synchronization with Nextcloud
 */
export class NextcloudProvisioningService {
  constructor() {
    this.nextcloudUrl = process.env.NEXTCLOUD_URL || 'http://nextcloud';
    // Use admin credentials for user provisioning
    // On first start, Nextcloud creates admin with NEXTCLOUD_ADMIN_USER/PASSWORD from docker-compose
    this.adminUsername = process.env.NEXTCLOUD_ADMIN_USER || process.env.DASHBOARD_USERNAME;
    this.adminPassword = process.env.NEXTCLOUD_ADMIN_PASSWORD || process.env.DASHBOARD_PASSWORD;
  }

  /**
   * Check if Nextcloud is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.nextcloudUrl}/status.php`, {
        timeout: 3000
      });
      return response.data.installed === true;
    } catch (error) {
      console.warn('Nextcloud not available:', error.message);
      return false;
    }
  }

  /**
   * Wait for Nextcloud to be ready
   * Retries up to maxRetries times with delay
   * @param {number} maxRetries
   * @param {number} delay
   * @returns {Promise<boolean>}
   */
  async waitForReady(maxRetries = 30, delay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.isAvailable()) {
        console.log('✓ Nextcloud is ready');
        return true;
      }
      console.log(`Waiting for Nextcloud... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    console.warn('Nextcloud did not become ready in time');
    return false;
  }

  /**
   * Create a new user in Nextcloud
   * @param {string} username
   * @param {string} password
   * @param {string} displayName
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async createUser(username, password, displayName = null, email = null) {
    try {
      // Check if Nextcloud is available first
      const isReady = await this.isAvailable();
      if (!isReady) {
        console.warn('Nextcloud not available, skipping user creation');
        return false;
      }

      const formData = new URLSearchParams();
      formData.append('userid', username);
      formData.append('password', password);
      if (displayName) formData.append('displayName', displayName);
      if (email) formData.append('email', email);

      const response = await axios.post(
        `${this.nextcloudUrl}/ocs/v1.php/cloud/users`,
        formData,
        {
          headers: {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: this.adminUsername,
            password: this.adminPassword
          },
          timeout: 5000
        }
      );

      // Check if user was created successfully
      if (response.data?.ocs?.meta?.statuscode === 100) {
        console.log(`✓ Nextcloud user created: ${username}`);
        return true;
      } else {
        console.warn('Nextcloud user creation response:', response.data);
        return false;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.error('Nextcloud authentication failed - check admin credentials');
      } else if (error.response?.data?.ocs?.meta?.message) {
        console.warn('Nextcloud user creation failed:', error.response.data.ocs.meta.message);
      } else {
        console.warn('Nextcloud user creation failed:', error.message);
      }
      // Don't throw - allow Dashboard to work even if Nextcloud fails
      return false;
    }
  }

  /**
   * Check if a user exists in Nextcloud
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async userExists(username) {
    try {
      const response = await axios.get(
        `${this.nextcloudUrl}/ocs/v1.php/cloud/users/${username}`,
        {
          headers: {
            'OCS-APIRequest': 'true'
          },
          auth: {
            username: this.adminUsername,
            password: this.adminPassword
          },
          timeout: 3000
        }
      );

      return response.data?.ocs?.meta?.statuscode === 100;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify user credentials against Nextcloud
   * @param {string} username
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async verifyCredentials(username, password) {
    try {
      const response = await axios.get(
        `${this.nextcloudUrl}/ocs/v1.php/cloud/user`,
        {
          headers: {
            'OCS-APIRequest': 'true'
          },
          auth: {
            username: username,
            password: password
          },
          timeout: 3000
        }
      );

      return response.data?.ocs?.meta?.statuscode === 100;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a user from Nextcloud
   * @param {string} username
   * @returns {Promise<boolean>}
   */
  async deleteUser(username) {
    try {
      const response = await axios.delete(
        `${this.nextcloudUrl}/ocs/v1.php/cloud/users/${username}`,
        {
          headers: {
            'OCS-APIRequest': 'true'
          },
          auth: {
            username: this.adminUsername,
            password: this.adminPassword
          },
          timeout: 3000
        }
      );

      return response.data?.ocs?.meta?.statuscode === 100;
    } catch (error) {
      console.warn('Nextcloud user deletion failed:', error.message);
      return false;
    }
  }
}

export default new NextcloudProvisioningService();
