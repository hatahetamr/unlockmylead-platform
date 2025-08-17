const axios = require('axios');
const crypto = require('crypto');

class HubSpotService {
  constructor() {
    this.clientId = process.env.HUBSPOT_CLIENT_ID;
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    this.redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/api/hubspot/callback';
    this.scopes = [
      'contacts',
      'content',
      'reports',
      'social',
      'automation',
      'timeline',
      'business-intelligence',
      'forms',
      'files',
      'hubdb',
      'integration-sync',
      'tickets',
      'e-commerce',
      'accounting',
      'sales-email-read',
      'forms-uploaded-files',
      'files.ui_hidden.read',
      'crm.objects.marketing_events.read',
      'crm.objects.marketing_events.write',
      'oauth'
    ];
    this.baseUrl = 'https://api.hubapi.com';
  }

  /**
   * Generate authorization URL for OAuth flow
   * @param {string} state - Optional state parameter for security
   * @returns {string} Authorization URL
   */
  generateAuthUrl(state = null) {
    if (!this.clientId) {
      throw new Error('HubSpot Client ID not configured');
    }

    const stateParam = state || crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_type: 'code',
      state: stateParam
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from callback
   * @returns {Object} Token response with access_token, refresh_token, etc.
   */
  async exchangeCodeForTokens(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('HubSpot credentials not configured');
    }

    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token response
   */
  async refreshAccessToken(refreshToken) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('HubSpot credentials not configured');
    }

    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v1/token', {
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get account information
   * @param {string} accessToken - Access token
   * @returns {Object} Account information
   */
  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/v1/access-tokens/${accessToken}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting account info:', error.response?.data || error.message);
      throw new Error('Failed to get account information');
    }
  }

  /**
   * Get contacts from HubSpot
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options (limit, after, properties, etc.)
   * @returns {Object} Contacts data
   */
  async getContacts(accessToken, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.after) params.append('after', options.after);
      if (options.properties) {
        options.properties.forEach(prop => params.append('properties', prop));
      } else {
        // Default properties
        ['firstname', 'lastname', 'email', 'phone', 'company'].forEach(prop => 
          params.append('properties', prop)
        );
      }

      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/contacts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting contacts:', error.response?.data || error.message);
      throw new Error('Failed to get contacts from HubSpot');
    }
  }

  /**
   * Create a contact in HubSpot
   * @param {string} accessToken - Access token
   * @param {Object} contactData - Contact properties
   * @returns {Object} Created contact data
   */
  async createContact(accessToken, contactData) {
    try {
      const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts`, {
        properties: contactData
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating contact:', error.response?.data || error.message);
      throw new Error('Failed to create contact in HubSpot');
    }
  }

  /**
   * Update a contact in HubSpot
   * @param {string} accessToken - Access token
   * @param {string} contactId - Contact ID
   * @param {Object} contactData - Updated contact properties
   * @returns {Object} Updated contact data
   */
  async updateContact(accessToken, contactId, contactData) {
    try {
      const response = await axios.patch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
        properties: contactData
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating contact:', error.response?.data || error.message);
      throw new Error('Failed to update contact in HubSpot');
    }
  }

  /**
   * Search contacts in HubSpot
   * @param {string} accessToken - Access token
   * @param {Object} searchCriteria - Search criteria
   * @returns {Object} Search results
   */
  async searchContacts(accessToken, searchCriteria) {
    try {
      const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts/search`, {
        filterGroups: searchCriteria.filterGroups || [],
        sorts: searchCriteria.sorts || [],
        query: searchCriteria.query || '',
        properties: searchCriteria.properties || ['firstname', 'lastname', 'email', 'phone', 'company'],
        limit: searchCriteria.limit || 100,
        after: searchCriteria.after || 0
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error searching contacts:', error.response?.data || error.message);
      throw new Error('Failed to search contacts in HubSpot');
    }
  }

  /**
   * Get companies from HubSpot
   * @param {string} accessToken - Access token
   * @param {Object} options - Query options
   * @returns {Object} Companies data
   */
  async getCompanies(accessToken, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.after) params.append('after', options.after);
      if (options.properties) {
        options.properties.forEach(prop => params.append('properties', prop));
      } else {
        // Default properties
        ['name', 'domain', 'industry', 'phone', 'city', 'state'].forEach(prop => 
          params.append('properties', prop)
        );
      }

      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/companies?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting companies:', error.response?.data || error.message);
      throw new Error('Failed to get companies from HubSpot');
    }
  }

  /**
   * Validate access token
   * @param {string} accessToken - Access token to validate
   * @returns {boolean} True if token is valid
   */
  async validateToken(accessToken) {
    try {
      await this.getAccountInfo(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check for HubSpot service
   * @returns {Object} Health status
   */
  healthCheck() {
    return {
      service: 'HubSpot',
      status: this.clientId && this.clientSecret ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
      scopes: this.scopes,
      redirectUri: this.redirectUri
    };
  }
}

module.exports = HubSpotService;
