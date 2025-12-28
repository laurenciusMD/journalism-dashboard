import axios from 'axios';

/**
 * Nextcloud WebDAV Service
 *
 * Provides integration with Nextcloud for:
 * - File management (WebDAV)
 * - Calendar access (CalDAV)
 * - Contacts (CardDAV)
 */

class NextcloudService {
  constructor(url, username, password) {
    this.baseUrl = url;
    this.username = username;
    this.password = password;
    this.webdavUrl = `${url}/remote.php/dav`;

    // Create axios instance with basic auth
    this.client = axios.create({
      auth: {
        username: this.username,
        password: this.password
      },
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      }
    });
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path (e.g., '/Documents')
   * @returns {Promise<Array>} List of files
   */
  async listFiles(path = '/') {
    try {
      const url = `${this.webdavUrl}/files/${this.username}${path}`;

      const propfindBody = `<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
          <d:prop>
            <d:displayname />
            <d:getcontentlength />
            <d:getcontenttype />
            <d:getlastmodified />
            <d:resourcetype />
          </d:prop>
        </d:propfind>`;

      const response = await this.client.request({
        method: 'PROPFIND',
        url,
        data: propfindBody,
        headers: {
          'Depth': '1'
        }
      });

      // Parse WebDAV response (simplified)
      return this.parseWebDAVResponse(response.data);
    } catch (error) {
      console.error('Nextcloud list files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Upload a file
   * @param {string} localPath - Local file path
   * @param {string} remotePath - Remote path in Nextcloud
   * @param {Buffer} fileData - File content
   */
  async uploadFile(remotePath, fileData) {
    try {
      const url = `${this.webdavUrl}/files/${this.username}${remotePath}`;

      await this.client.put(url, fileData, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      return { success: true, path: remotePath };
    } catch (error) {
      console.error('Nextcloud upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file
   * @param {string} remotePath - Remote file path
   * @returns {Promise<Buffer>} File content
   */
  async downloadFile(remotePath) {
    try {
      const url = `${this.webdavUrl}/files/${this.username}${remotePath}`;
      const response = await this.client.get(url, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      console.error('Nextcloud download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file or directory
   * @param {string} remotePath - Remote path to delete
   */
  async deleteFile(remotePath) {
    try {
      const url = `${this.webdavUrl}/files/${this.username}${remotePath}`;
      await this.client.delete(url);
      return { success: true };
    } catch (error) {
      console.error('Nextcloud delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Create a directory
   * @param {string} remotePath - Directory path to create
   */
  async createDirectory(remotePath) {
    try {
      const url = `${this.webdavUrl}/files/${this.username}${remotePath}`;
      await this.client.request({
        method: 'MKCOL',
        url
      });
      return { success: true, path: remotePath };
    } catch (error) {
      console.error('Nextcloud create directory error:', error);
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  /**
   * Get calendar events (CalDAV)
   * @returns {Promise<Array>} List of events
   */
  async getCalendarEvents() {
    try {
      const url = `${this.webdavUrl}/calendars/${this.username}`;
      // CalDAV implementation would go here
      // For now, return placeholder
      return { message: 'CalDAV integration coming soon' };
    } catch (error) {
      console.error('Nextcloud calendar error:', error);
      throw new Error(`Failed to get calendar events: ${error.message}`);
    }
  }

  /**
   * Parse WebDAV XML response
   * @param {string} xmlData - XML response from WebDAV
   * @returns {Array} Parsed file list
   */
  parseWebDAVResponse(xmlData) {
    // Simplified parser - in production, use a proper XML parser
    // This is a placeholder for the actual implementation
    return [];
  }

  /**
   * Test connection to Nextcloud
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.listFiles('/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default NextcloudService;
