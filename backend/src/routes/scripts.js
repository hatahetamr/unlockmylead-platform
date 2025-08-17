/**
 * Script Management Routes
 * Handles all script-related API endpoints
 */

const express = require('express');
const router = express.Router();
const ScriptService = require('../services/ScriptService');
const Script = require('../models/Script');

// Middleware for user authentication (placeholder)
const authenticateUser = (req, res, next) => {
  // In production, implement proper JWT authentication
  req.userId = req.headers['user-id'] || 'default-user';
  next();
};

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * @route POST /api/scripts
 * @desc Create a new script
 */
router.post('/', async (req, res) => {
  try {
    const script = await ScriptService.createScript(req.body, req.userId);
    res.status(201).json({
      success: true,
      data: script,
      message: 'Script created successfully'
    });
  } catch (error) {
    console.error('Error creating script:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts
 * @desc Get all scripts for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      industry: req.query.industry,
      objective: req.query.objective,
      orderBy: req.query.orderBy,
      orderDirection: req.query.orderDirection,
      limit: req.query.limit,
      startAfter: req.query.startAfter
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await ScriptService.getScripts(req.userId, filters);
    res.json({
      success: true,
      data: result.scripts,
      pagination: {
        total: result.total,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Error getting scripts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/search
 * @desc Search scripts
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, type, status } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const filters = { type, status };
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const scripts = await ScriptService.searchScripts(req.userId, searchTerm, filters);
    res.json({
      success: true,
      data: scripts,
      query: searchTerm
    });
  } catch (error) {
    console.error('Error searching scripts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/templates
 * @desc Get script templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { type, objective } = req.query;
    const templates = await ScriptService.getTemplates(type, objective);
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/analytics
 * @desc Get script analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const analytics = await ScriptService.getAnalytics(req.userId, timeRange);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/:id
 * @desc Get a specific script
 */
router.get('/:id', async (req, res) => {
  try {
    const script = await ScriptService.getScript(req.params.id, req.userId);
    res.json({
      success: true,
      data: script
    });
  } catch (error) {
    console.error('Error getting script:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/scripts/:id
 * @desc Update a script
 */
router.put('/:id', async (req, res) => {
  try {
    const script = await ScriptService.updateScript(req.params.id, req.body, req.userId);
    res.json({
      success: true,
      data: script,
      message: 'Script updated successfully'
    });
  } catch (error) {
    console.error('Error updating script:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/scripts/:id
 * @desc Delete a script
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await ScriptService.deleteScript(req.params.id, req.userId);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting script:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/scripts/:id/duplicate
 * @desc Duplicate a script
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { name } = req.body;
    const script = await ScriptService.duplicateScript(req.params.id, req.userId, name);
    res.status(201).json({
      success: true,
      data: script,
      message: 'Script duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating script:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/scripts/:id/version
 * @desc Create a new version of a script
 */
router.post('/:id/version', async (req, res) => {
  try {
    const script = await ScriptService.createVersion(req.params.id, req.userId);
    res.status(201).json({
      success: true,
      data: script,
      message: 'Script version created successfully'
    });
  } catch (error) {
    console.error('Error creating script version:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/:id/versions
 * @desc Get all versions of a script
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await ScriptService.getScriptVersions(req.params.id, req.userId);
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error getting script versions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PATCH /api/scripts/:id/metrics
 * @desc Update script performance metrics
 */
router.patch('/:id/metrics', async (req, res) => {
  try {
    const result = await ScriptService.updateMetrics(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Metrics updated successfully'
    });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/scripts/:id/variables
 * @desc Replace variables in script content
 */
router.post('/:id/variables', async (req, res) => {
  try {
    const script = await ScriptService.getScript(req.params.id, req.userId);
    const processedScript = script.replaceVariables(req.body);
    
    res.json({
      success: true,
      data: {
        original: script.content,
        processed: processedScript.content,
        variables_used: script.variables
      }
    });
  } catch (error) {
    console.error('Error processing variables:', error);
    const statusCode = error.message === 'Script not found' ? 404 : 
                      error.message === 'Access denied' ? 403 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/scripts/health
 * @desc Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await ScriptService.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'ScriptRoutes'
    });
  }
});

module.exports = router;
