const express = require('express')
const router = express.Router()
const { db } = require('../config/firebase')
const jwt = require('jsonwebtoken')
const axios = require('axios')

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' })
  }
}

// HubSpot OAuth Configuration
const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI

// Google Calendar OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI

// HubSpot OAuth Routes

// Get HubSpot authorization URL
router.get('/hubspot/auth-url', verifyToken, (req, res) => {
  const scopes = 'contacts'
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(HUBSPOT_REDIRECT_URI)}&state=${req.user.uid}`
  
  res.json({ authUrl })
})

// Handle HubSpot OAuth callback
router.post('/hubspot/callback', verifyToken, async (req, res) => {
  try {
    const { code, state } = req.body
    
    // Verify state matches user ID
    if (state !== req.user.uid) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', {
      grant_type: 'authorization_code',
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      redirect_uri: HUBSPOT_REDIRECT_URI,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Store tokens in Firestore
    await db.collection('integrations').doc(req.user.uid).set({
      hubspot: {
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000),
        connected_at: new Date(),
        status: 'connected'
      }
    }, { merge: true })

    res.json({ success: true, message: 'HubSpot integration connected successfully' })
  } catch (error) {
    console.error('HubSpot OAuth error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to connect HubSpot integration' })
  }
})

// Get HubSpot integration status
router.get('/hubspot/status', verifyToken, async (req, res) => {
  try {
    const integrationDoc = await db.collection('integrations').doc(req.user.uid).get()
    
    if (!integrationDoc.exists || !integrationDoc.data().hubspot) {
      return res.json({ connected: false })
    }

    const hubspotData = integrationDoc.data().hubspot
    const isExpired = new Date() > hubspotData.expires_at.toDate()

    res.json({
      connected: true,
      status: hubspotData.status,
      connected_at: hubspotData.connected_at,
      expires_at: hubspotData.expires_at,
      expired: isExpired
    })
  } catch (error) {
    console.error('Error getting HubSpot status:', error)
    res.status(500).json({ error: 'Failed to get HubSpot status' })
  }
})

// Disconnect HubSpot integration
router.delete('/hubspot/disconnect', verifyToken, async (req, res) => {
  try {
    await db.collection('integrations').doc(req.user.uid).update({
      hubspot: {
        status: 'disconnected',
        disconnected_at: new Date()
      }
    })

    res.json({ success: true, message: 'HubSpot integration disconnected' })
  } catch (error) {
    console.error('Error disconnecting HubSpot:', error)
    res.status(500).json({ error: 'Failed to disconnect HubSpot integration' })
  }
})

// Google Calendar OAuth Routes

// Get Google Calendar authorization URL
router.get('/google-calendar/auth-url', verifyToken, (req, res) => {
  const scopes = 'https://www.googleapis.com/auth/calendar'
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent&state=${req.user.uid}`
  
  res.json({ authUrl })
})

// Handle Google Calendar OAuth callback
router.post('/google-calendar/callback', verifyToken, async (req, res) => {
  try {
    const { code, state } = req.body
    
    // Verify state matches user ID
    if (state !== req.user.uid) {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'authorization_code',
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      code: code
    })

    const { access_token, refresh_token, expires_in } = tokenResponse.data

    // Store tokens in Firestore
    await db.collection('integrations').doc(req.user.uid).set({
      google_calendar: {
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000),
        connected_at: new Date(),
        status: 'connected'
      }
    }, { merge: true })

    res.json({ success: true, message: 'Google Calendar integration connected successfully' })
  } catch (error) {
    console.error('Google Calendar OAuth error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to connect Google Calendar integration' })
  }
})

// Get Google Calendar integration status
router.get('/google-calendar/status', verifyToken, async (req, res) => {
  try {
    const integrationDoc = await db.collection('integrations').doc(req.user.uid).get()
    
    if (!integrationDoc.exists || !integrationDoc.data().google_calendar) {
      return res.json({ connected: false })
    }

    const googleData = integrationDoc.data().google_calendar
    const isExpired = new Date() > googleData.expires_at.toDate()

    res.json({
      connected: true,
      status: googleData.status,
      connected_at: googleData.connected_at,
      expires_at: googleData.expires_at,
      expired: isExpired
    })
  } catch (error) {
    console.error('Error getting Google Calendar status:', error)
    res.status(500).json({ error: 'Failed to get Google Calendar status' })
  }
})

// Disconnect Google Calendar integration
router.delete('/google-calendar/disconnect', verifyToken, async (req, res) => {
  try {
    await db.collection('integrations').doc(req.user.uid).update({
      google_calendar: {
        status: 'disconnected',
        disconnected_at: new Date()
      }
    })

    res.json({ success: true, message: 'Google Calendar integration disconnected' })
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error)
    res.status(500).json({ error: 'Failed to disconnect Google Calendar integration' })
  }
})

// Helper function to refresh HubSpot token
async function refreshHubSpotToken(userId) {
  try {
    const integrationDoc = await db.collection('integrations').doc(userId).get()
    const hubspotData = integrationDoc.data().hubspot

    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', {
      grant_type: 'refresh_token',
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      refresh_token: hubspotData.refresh_token
    })

    const { access_token, expires_in } = tokenResponse.data

    await db.collection('integrations').doc(userId).update({
      'hubspot.access_token': access_token,
      'hubspot.expires_at': new Date(Date.now() + expires_in * 1000)
    })

    return access_token
  } catch (error) {
    console.error('Error refreshing HubSpot token:', error)
    throw error
  }
}

// Helper function to refresh Google Calendar token
async function refreshGoogleToken(userId) {
  try {
    const integrationDoc = await db.collection('integrations').doc(userId).get()
    const googleData = integrationDoc.data().google_calendar

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      grant_type: 'refresh_token',
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: googleData.refresh_token
    })

    const { access_token, expires_in } = tokenResponse.data

    await db.collection('integrations').doc(userId).update({
      'google_calendar.access_token': access_token,
      'google_calendar.expires_at': new Date(Date.now() + expires_in * 1000)
    })

    return access_token
  } catch (error) {
    console.error('Error refreshing Google token:', error)
    throw error
  }
}

module.exports = router
