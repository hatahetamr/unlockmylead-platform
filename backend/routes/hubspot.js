const express = require('express');
const HubSpotService = require('../services/hubspotService');
const CRMService = require('../services/crmService');

const router = express.Router();
const hubspotService = new HubSpotService();
const crmService = new CRMService();

// Get HubSpot OAuth authorization URL
router.get('/auth/url', (req, res) => {
  try {
    const state = req.query.state || Math.random().toString(36).substring(7);
    const authUrl = hubspotService.getAuthUrl(state);
    
    res.json({
      success: true,
      authUrl: authUrl,
      state: state
    });
  } catch (error) {
    console.error('Error generating HubSpot auth URL:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

// Handle OAuth callback
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }
    
    const tokenData = await hubspotService.exchangeCodeForToken(code);
    
    // Validate the token by making a test API call
    const validation = await crmService.validateCredentials('hubspot', {
      accessToken: tokenData.access_token
    });
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token received from HubSpot'
      });
    }
    
    res.json({
      success: true,
      tokenData: tokenData,
      message: 'Successfully connected to HubSpot'
    });
  } catch (error) {
    console.error('Error handling HubSpot OAuth callback:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to complete HubSpot authorization'
    });
  }
});

// Refresh access token
router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    const tokenData = await hubspotService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      tokenData: tokenData
    });
  } catch (error) {
    console.error('Error refreshing HubSpot token:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token'
    });
  }
});

// Get contacts
router.get('/contacts', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { limit = 100, after } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const response = await hubspotService.getContacts(
      accessToken, 
      parseInt(limit), 
      after
    );
    
    const formattedContacts = response.results.map(contact => 
      hubspotService.formatContactData(contact)
    );
    
    res.json({
      success: true,
      contacts: formattedContacts,
      pagination: response.paging || null,
      totalCount: formattedContacts.length
    });
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts from HubSpot'
    });
  }
});

// Search contacts
router.post('/contacts/search', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const searchCriteria = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const result = await crmService.searchContacts('hubspot', 
      { accessToken }, 
      searchCriteria
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error searching HubSpot contacts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search contacts in HubSpot'
    });
  }
});

// Create contact
router.post('/contacts', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const contactData = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const contact = await crmService.createContact('hubspot', 
      { accessToken }, 
      contactData
    );
    
    res.json({
      success: true,
      contact: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('Error creating HubSpot contact:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact in HubSpot'
    });
  }
});

// Update contact
router.put('/contacts/:contactId', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { contactId } = req.params;
    const contactData = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const contact = await crmService.updateContact('hubspot', 
      { accessToken }, 
      contactId, 
      contactData
    );
    
    res.json({
      success: true,
      contact: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating HubSpot contact:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact in HubSpot'
    });
  }
});

// Get contact by email
router.get('/contacts/email/:email', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { email } = req.params;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const contact = await hubspotService.getContactByEmail(accessToken, email);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact: hubspotService.formatContactData(contact)
    });
  } catch (error) {
    console.error('Error fetching HubSpot contact by email:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact by email'
    });
  }
});

// Get companies
router.get('/companies', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { limit = 100, after } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const response = await hubspotService.getCompanies(
      accessToken, 
      parseInt(limit), 
      after
    );
    
    const formattedCompanies = response.results.map(company => 
      crmService.normalizeCompany(company, 'hubspot')
    );
    
    res.json({
      success: true,
      companies: formattedCompanies,
      pagination: response.paging || null,
      totalCount: formattedCompanies.length
    });
  } catch (error) {
    console.error('Error fetching HubSpot companies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch companies from HubSpot'
    });
  }
});

// Get deals
router.get('/deals', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { limit = 100, after } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const response = await hubspotService.getDeals(
      accessToken, 
      parseInt(limit), 
      after
    );
    
    res.json({
      success: true,
      deals: response.results,
      pagination: response.paging || null,
      totalCount: response.results.length
    });
  } catch (error) {
    console.error('Error fetching HubSpot deals:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals from HubSpot'
    });
  }
});

// Sync contacts
router.post('/sync/contacts', async (req, res) => {
  try {
    const { accessToken } = req.headers;
    const { limit = 1000, lastSyncDate } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    const result = await crmService.syncContacts('hubspot', 
      { accessToken }, 
      { limit, lastSyncDate }
    );
    
    res.json({
      success: true,
      ...result,
      message: `Successfully synced ${result.contacts.length} contacts`
    });
  } catch (error) {
    console.error('Error syncing HubSpot contacts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync contacts from HubSpot'
    });
  }
});

module.exports = router;
