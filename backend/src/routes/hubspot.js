const express = require('express');
const HubSpotService = require('../services/HubSpotService');
const admin = require('firebase-admin');
const router = express.Router();

const hubspotService = new HubSpotService();
const db = admin.firestore();

/**
 * @route GET /api/hubspot/auth
 * @desc Generate HubSpot authorization URL
 * @access Public
 */
router.get('/auth', async (req, res) => {
  try {
    const { userId, state } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Generate state parameter for security
    const stateParam = state || `${userId}_${Date.now()}`;
    
    // Store state in Firestore for validation
    await db.collection('oauth_states').doc(stateParam).set({
      userId,
      provider: 'hubspot',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    const authUrl = hubspotService.generateAuthUrl(stateParam);

    res.json({
      success: true,
      authUrl,
      state: stateParam
    });
  } catch (error) {
    console.error('Error generating HubSpot auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

/**
 * @route GET /api/hubspot/callback
 * @desc Handle HubSpot OAuth callback
 * @access Public
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: `OAuth error: ${error}`
      });
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state parameter'
      });
    }

    // Validate state parameter
    const stateDoc = await db.collection('oauth_states').doc(state).get();
    if (!stateDoc.exists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter'
      });
    }

    const stateData = stateDoc.data();
    const now = new Date();
    if (stateData.expiresAt.toDate() < now) {
      return res.status(400).json({
        success: false,
        error: 'State parameter expired'
      });
    }

    // Exchange code for tokens
    const tokenData = await hubspotService.exchangeCodeForTokens(code);
    
    // Get account information
    const accountInfo = await hubspotService.getAccountInfo(tokenData.access_token);

    // Store tokens securely in Firestore
    const integrationData = {
      provider: 'hubspot',
      userId: stateData.userId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      hubId: accountInfo.hub_id,
      hubDomain: accountInfo.hub_domain,
      appId: accountInfo.app_id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };

    // Store in user's integrations subcollection
    await db.collection('users').doc(stateData.userId)
      .collection('integrations').doc('hubspot').set(integrationData);

    // Clean up state document
    await db.collection('oauth_states').doc(state).delete();

    // Redirect to success page or return success response
    res.json({
      success: true,
      message: 'HubSpot integration successful',
      hubId: accountInfo.hub_id,
      hubDomain: accountInfo.hub_domain
    });
  } catch (error) {
    console.error('Error handling HubSpot callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete HubSpot integration'
    });
  }
});

/**
 * @route GET /api/hubspot/status/:userId
 * @desc Check HubSpot integration status for user
 * @access Private
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const integrationDoc = await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').get();

    if (!integrationDoc.exists) {
      return res.json({
        success: true,
        connected: false,
        message: 'HubSpot not connected'
      });
    }

    const integrationData = integrationDoc.data();
    
    // Validate token
    const isValid = await hubspotService.validateToken(integrationData.accessToken);
    
    if (!isValid) {
      // Try to refresh token
      try {
        const newTokenData = await hubspotService.refreshAccessToken(integrationData.refreshToken);
        
        // Update stored tokens
        await integrationDoc.ref.update({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || integrationData.refreshToken,
          expiresIn: newTokenData.expires_in,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({
          success: true,
          connected: true,
          hubId: integrationData.hubId,
          hubDomain: integrationData.hubDomain,
          tokenRefreshed: true
        });
      } catch (refreshError) {
        // Mark as inactive if refresh fails
        await integrationDoc.ref.update({
          isActive: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.json({
          success: true,
          connected: false,
          error: 'Token expired and refresh failed'
        });
      }
    }

    res.json({
      success: true,
      connected: true,
      hubId: integrationData.hubId,
      hubDomain: integrationData.hubDomain,
      scope: integrationData.scope
    });
  } catch (error) {
    console.error('Error checking HubSpot status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check HubSpot integration status'
    });
  }
});

/**
 * @route GET /api/hubspot/contacts/:userId
 * @desc Get contacts from HubSpot
 * @access Private
 */
router.get('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, after, properties } = req.query;

    // Get user's HubSpot integration
    const integrationDoc = await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').get();

    if (!integrationDoc.exists || !integrationDoc.data().isActive) {
      return res.status(400).json({
        success: false,
        error: 'HubSpot not connected or inactive'
      });
    }

    const integrationData = integrationDoc.data();
    
    const options = {
      limit: parseInt(limit),
      after,
      properties: properties ? properties.split(',') : undefined
    };

    const contacts = await hubspotService.getContacts(integrationData.accessToken, options);

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Error getting HubSpot contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contacts from HubSpot'
    });
  }
});

/**
 * @route POST /api/hubspot/contacts/:userId
 * @desc Create contact in HubSpot
 * @access Private
 */
router.post('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const contactData = req.body;

    // Get user's HubSpot integration
    const integrationDoc = await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').get();

    if (!integrationDoc.exists || !integrationDoc.data().isActive) {
      return res.status(400).json({
        success: false,
        error: 'HubSpot not connected or inactive'
      });
    }

    const integrationData = integrationDoc.data();
    
    const contact = await hubspotService.createContact(integrationData.accessToken, contactData);

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create contact in HubSpot'
    });
  }
});

/**
 * @route POST /api/hubspot/contacts/:userId/search
 * @desc Search contacts in HubSpot
 * @access Private
 */
router.post('/contacts/:userId/search', async (req, res) => {
  try {
    const { userId } = req.params;
    const searchCriteria = req.body;

    // Get user's HubSpot integration
    const integrationDoc = await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').get();

    if (!integrationDoc.exists || !integrationDoc.data().isActive) {
      return res.status(400).json({
        success: false,
        error: 'HubSpot not connected or inactive'
      });
    }

    const integrationData = integrationDoc.data();
    
    const results = await hubspotService.searchContacts(integrationData.accessToken, searchCriteria);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching HubSpot contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search contacts in HubSpot'
    });
  }
});

/**
 * @route GET /api/hubspot/companies/:userId
 * @desc Get companies from HubSpot
 * @access Private
 */
router.get('/companies/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, after, properties } = req.query;

    // Get user's HubSpot integration
    const integrationDoc = await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').get();

    if (!integrationDoc.exists || !integrationDoc.data().isActive) {
      return res.status(400).json({
        success: false,
        error: 'HubSpot not connected or inactive'
      });
    }

    const integrationData = integrationDoc.data();
    
    const options = {
      limit: parseInt(limit),
      after,
      properties: properties ? properties.split(',') : undefined
    };

    const companies = await hubspotService.getCompanies(integrationData.accessToken, options);

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error getting HubSpot companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get companies from HubSpot'
    });
  }
});

/**
 * @route DELETE /api/hubspot/disconnect/:userId
 * @desc Disconnect HubSpot integration
 * @access Private
 */
router.delete('/disconnect/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mark integration as inactive
    await db.collection('users').doc(userId)
      .collection('integrations').doc('hubspot').update({
        isActive: false,
        disconnectedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({
      success: true,
      message: 'HubSpot integration disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting HubSpot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect HubSpot integration'
    });
  }
});

/**
 * @route GET /api/hubspot/health
 * @desc Health check for HubSpot service
 * @access Public
 */
router.get('/health', (req, res) => {
  try {
    const health = hubspotService.healthCheck();
    res.json({
      success: true,
      ...health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'HubSpot service health check failed'
    });
  }
});

module.exports = router;
