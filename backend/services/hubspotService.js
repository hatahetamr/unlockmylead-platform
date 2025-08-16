const axios = require('axios');
const crypto = require('crypto');

class HubSpotService {
  constructor() {
    this.clientId = process.env.HUBSPOT_CLIENT_ID;
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    this.redirectUri = process.env.HUBSPOT_REDIRECT_URI;
    this.baseUrl = 'https://api.hubapi.com';
    this.authUrl = 'https://app.hubspot.com/oauth/authorize';
    this.tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
  }

  // Generate OAuth authorization URL
  getAuthUrl(state = null) {
    const scopes = [
      'contacts',
      'content',
      'reports',
      'social',
      'automation',
      'timeline',
      'business-intelligence',
      'oauth'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
      response_type: 'code'
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(this.tokenUrl, {
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
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(this.tokenUrl, {
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
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  // Get all contacts with pagination
  async getContacts(accessToken, limit = 100, after = null) {
    try {
      const params = {
        limit: limit,
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'company',
          'jobtitle',
          'lifecyclestage',
          'createdate',
          'lastmodifieddate'
        ].join(',')
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/contacts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error.response?.data || error.message);
      throw new Error('Failed to fetch contacts from HubSpot');
    }
  }

  // Search contacts by criteria
  async searchContacts(accessToken, filters, limit = 100) {
    try {
      const searchRequest = {
        filterGroups: [{
          filters: filters
        }],
        properties: [
          'firstname',
          'lastname',
          'email',
          'phone',
          'company',
          'jobtitle',
          'lifecyclestage',
          'createdate',
          'lastmodifieddate'
        ],
        limit: limit
      };

      const response = await axios.post(`${this.baseUrl}/crm/v3/objects/contacts/search`, searchRequest, {
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

  // Create a new contact
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

  // Update an existing contact
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

  // Get contact by email
  async getContactByEmail(accessToken, email) {
    try {
      const filters = [{
        propertyName: 'email',
        operator: 'EQ',
        value: email
      }];

      const result = await this.searchContacts(accessToken, filters, 1);
      return result.results.length > 0 ? result.results[0] : null;
    } catch (error) {
      console.error('Error getting contact by email:', error.response?.data || error.message);
      throw new Error('Failed to get contact by email from HubSpot');
    }
  }

  // Get companies
  async getCompanies(accessToken, limit = 100, after = null) {
    try {
      const params = {
        limit: limit,
        properties: [
          'name',
          'domain',
          'industry',
          'phone',
          'city',
          'state',
          'country',
          'createdate',
          'lastmodifieddate'
        ].join(',')
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/companies`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error.response?.data || error.message);
      throw new Error('Failed to fetch companies from HubSpot');
    }
  }

  // Get deals
  async getDeals(accessToken, limit = 100, after = null) {
    try {
      const params = {
        limit: limit,
        properties: [
          'dealname',
          'amount',
          'dealstage',
          'pipeline',
          'closedate',
          'createdate',
          'lastmodifieddate'
        ].join(',')
      };

      if (after) {
        params.after = after;
      }

      const response = await axios.get(`${this.baseUrl}/crm/v3/objects/deals`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching deals:', error.response?.data || error.message);
      throw new Error('Failed to fetch deals from HubSpot');
    }
  }

  // Validate webhook signature
  validateWebhookSignature(requestBody, signature, timestamp) {
    const sourceString = 'POST' + this.baseUrl + requestBody + timestamp;
    const hash = crypto.createHmac('sha256', this.clientSecret).update(sourceString).digest('hex');
    return hash === signature;
  }

  // Format contact data for frontend
  formatContactData(hubspotContact) {
    const properties = hubspotContact.properties;
    return {
      id: hubspotContact.id,
      firstName: properties.firstname || '',
      lastName: properties.lastname || '',
      email: properties.email || '',
      phone: properties.phone || '',
      company: properties.company || '',
      jobTitle: properties.jobtitle || '',
      lifecycleStage: properties.lifecyclestage || '',
      createdAt: properties.createdate,
      updatedAt: properties.lastmodifieddate,
      source: 'hubspot'
    };
  }
}

module.exports = HubSpotService;
