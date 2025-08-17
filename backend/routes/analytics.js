const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');
const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user's client data
    const clientDoc = await db.collection('clients').doc(userId).get();
    const clientData = clientDoc.data();

    // Get integrations data
    const integrationsDoc = await db.collection('integrations').doc(userId).get();
    const integrationsData = integrationsDoc.data();

    // Calculate active integrations
    let activeIntegrations = 0;
    if (integrationsData) {
      if (integrationsData.hubspot && integrationsData.hubspot.access_token) activeIntegrations++;
      if (integrationsData.google && integrationsData.google.access_token) activeIntegrations++;
    }

    // Mock analytics data (in a real app, this would come from actual usage data)
    const analyticsData = {
      totalLeads: Math.floor(Math.random() * 500) + 100,
      conversionRate: Math.floor(Math.random() * 30) + 15,
      totalRevenue: Math.floor(Math.random() * 10000) + 5000,
      activeIntegrations: activeIntegrations,
      monthlyData: [
        { month: 'Jan', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 },
        { month: 'Feb', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 },
        { month: 'Mar', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 },
        { month: 'Apr', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 },
        { month: 'May', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 },
        { month: 'Jun', leads: Math.floor(Math.random() * 80) + 20, conversions: Math.floor(Math.random() * 20) + 5 }
      ]
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get lead generation data
router.get('/leads', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // In a real app, this would fetch actual lead data from the database
    const leadsData = {
      leads: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Tech Corp',
          source: 'HubSpot',
          status: 'qualified',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Marketing Inc',
          source: 'Google Calendar',
          status: 'contacted',
          createdAt: new Date().toISOString()
        }
      ],
      total: 2,
      qualified: 1,
      contacted: 1
    };

    res.json(leadsData);
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leads data' });
  }
});

// Get conversion funnel data
router.get('/funnel', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Mock funnel data
    const funnelData = {
      stages: [
        { name: 'Visitors', count: 1000, percentage: 100 },
        { name: 'Leads', count: 250, percentage: 25 },
        { name: 'Qualified', count: 100, percentage: 10 },
        { name: 'Customers', count: 25, percentage: 2.5 }
      ]
    };

    res.json(funnelData);
  } catch (error) {
    console.error('Funnel fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

module.exports = router;