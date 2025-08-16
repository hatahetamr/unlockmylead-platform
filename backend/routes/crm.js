const express = require('express');
const CRMService = require('../services/crmService');

const router = express.Router();
const crmService = new CRMService();

// Get supported CRM providers
router.get('/providers', (req, res) => {
  try {
    const providers = crmService.getSupportedProviders();
    
    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Error getting CRM providers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get CRM providers'
    });
  }
});

// Validate CRM credentials
router.post('/validate', async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    
    if (!provider || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Provider and credentials are required'
      });
    }
    
    const validation = await crmService.validateCredentials(provider, credentials);
    
    res.json({
      success: true,
      validation: validation
    });
  } catch (error) {
    console.error('Error validating CRM credentials:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate CRM credentials'
    });
  }
});

// Sync contacts from CRM
router.post('/sync/contacts', async (req, res) => {
  try {
    const { provider, credentials, options = {} } = req.body;
    
    if (!provider || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'Provider and credentials are required'
      });
    }
    
    const result = await crmService.syncContacts(provider, credentials, options);
    
    res.json({
      success: true,
      ...result,
      message: `Successfully synced ${result.contacts.length} contacts from ${provider}`
    });
  } catch (error) {
    console.error('Error syncing CRM contacts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync contacts from CRM'
    });
  }
});

// Search contacts across CRM
router.post('/search/contacts', async (req, res) => {
  try {
    const { provider, credentials, searchCriteria } = req.body;
    
    if (!provider || !credentials || !searchCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Provider, credentials, and search criteria are required'
      });
    }
    
    const result = await crmService.searchContacts(provider, credentials, searchCriteria);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error searching CRM contacts:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search contacts in CRM'
    });
  }
});

// Create contact in CRM
router.post('/contacts', async (req, res) => {
  try {
    const { provider, credentials, contactData } = req.body;
    
    if (!provider || !credentials || !contactData) {
      return res.status(400).json({
        success: false,
        error: 'Provider, credentials, and contact data are required'
      });
    }
    
    const contact = await crmService.createContact(provider, credentials, contactData);
    
    res.json({
      success: true,
      contact: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('Error creating CRM contact:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact in CRM'
    });
  }
});

// Update contact in CRM
router.put('/contacts/:contactId', async (req, res) => {
  try {
    const { provider, credentials, contactData } = req.body;
    const { contactId } = req.params;
    
    if (!provider || !credentials || !contactData) {
      return res.status(400).json({
        success: false,
        error: 'Provider, credentials, and contact data are required'
      });
    }
    
    const contact = await crmService.updateContact(provider, credentials, contactId, contactData);
    
    res.json({
      success: true,
      contact: contact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating CRM contact:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update contact in CRM'
    });
  }
});

module.exports = router;
