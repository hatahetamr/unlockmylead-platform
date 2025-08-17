/**
 * Script Service
 * Handles all script-related operations with Firestore
 */

const { db } = require('../config/firebase');
const Script = require('../models/Script');
const { FieldValue } = require('firebase-admin/firestore');

class ScriptService {
  constructor() {
    this.collection = db.collection('scripts');
  }

  /**
   * Create a new script
   */
  async createScript(scriptData, userId) {
    try {
      const script = new Script({
        ...scriptData,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      });

      const validation = script.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Extract and update variables
      script.variables = script.extractVariables();

      const docRef = await this.collection.add(script.toFirestore());
      script.id = docRef.id;

      console.log(`Script created successfully: ${docRef.id}`);
      return script;
    } catch (error) {
      console.error('Error creating script:', error);
      throw error;
    }
  }

  /**
   * Get script by ID
   */
  async getScript(scriptId, userId = null) {
    try {
      const doc = await this.collection.doc(scriptId).get();
      
      if (!doc.exists) {
        throw new Error('Script not found');
      }

      const script = Script.fromFirestore(doc);
      
      // Check if user has access to this script
      if (userId && script.created_by !== userId) {
        throw new Error('Access denied');
      }

      return script;
    } catch (error) {
      console.error('Error getting script:', error);
      throw error;
    }
  }

  /**
   * Get all scripts for a user
   */
  async getScripts(userId, filters = {}) {
    try {
      let query = this.collection.where('created_by', '==', userId);

      // Apply filters
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.industry) {
        query = query.where('industry', '==', filters.industry);
      }
      if (filters.objective) {
        query = query.where('objective', '==', filters.objective);
      }

      // Apply ordering
      const orderBy = filters.orderBy || 'updated_at';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }
      if (filters.startAfter) {
        const startAfterDoc = await this.collection.doc(filters.startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const scripts = [];

      snapshot.forEach(doc => {
        scripts.push(Script.fromFirestore(doc));
      });

      return {
        scripts,
        total: scripts.length,
        hasMore: snapshot.size === parseInt(filters.limit || 1000)
      };
    } catch (error) {
      console.error('Error getting scripts:', error);
      throw error;
    }
  }

  /**
   * Update script
   */
  async updateScript(scriptId, updateData, userId) {
    try {
      const existingScript = await this.getScript(scriptId, userId);
      
      const updatedScript = new Script({
        ...existingScript,
        ...updateData,
        id: scriptId,
        updated_at: new Date()
      });

      const validation = updatedScript.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Extract and update variables
      updatedScript.variables = updatedScript.extractVariables();

      await this.collection.doc(scriptId).update({
        ...updatedScript.toFirestore(),
        updated_at: FieldValue.serverTimestamp()
      });

      console.log(`Script updated successfully: ${scriptId}`);
      return updatedScript;
    } catch (error) {
      console.error('Error updating script:', error);
      throw error;
    }
  }

  /**
   * Delete script
   */
  async deleteScript(scriptId, userId) {
    try {
      const script = await this.getScript(scriptId, userId);
      
      await this.collection.doc(scriptId).delete();
      
      console.log(`Script deleted successfully: ${scriptId}`);
      return { success: true, message: 'Script deleted successfully' };
    } catch (error) {
      console.error('Error deleting script:', error);
      throw error;
    }
  }

  /**
   * Duplicate script
   */
  async duplicateScript(scriptId, userId, newName = null) {
    try {
      const originalScript = await this.getScript(scriptId, userId);
      
      const duplicatedScript = new Script({
        ...originalScript,
        id: null,
        name: newName || `${originalScript.name} (Copy)`,
        created_at: new Date(),
        updated_at: new Date(),
        performance_metrics: {
          total_uses: 0,
          success_rate: 0,
          average_duration: 0,
          conversion_rate: 0,
          last_used: null
        }
      });

      return await this.createScript(duplicatedScript, userId);
    } catch (error) {
      console.error('Error duplicating script:', error);
      throw error;
    }
  }

  /**
   * Create script version
   */
  async createVersion(scriptId, userId) {
    try {
      const originalScript = await this.getScript(scriptId, userId);
      const newVersion = originalScript.createVersion();
      
      return await this.createScript(newVersion, userId);
    } catch (error) {
      console.error('Error creating script version:', error);
      throw error;
    }
  }

  /**
   * Get script versions
   */
  async getScriptVersions(parentScriptId, userId) {
    try {
      const query = this.collection
        .where('parent_script_id', '==', parentScriptId)
        .where('created_by', '==', userId)
        .orderBy('version', 'desc');

      const snapshot = await query.get();
      const versions = [];

      snapshot.forEach(doc => {
        versions.push(Script.fromFirestore(doc));
      });

      return versions;
    } catch (error) {
      console.error('Error getting script versions:', error);
      throw error;
    }
  }

  /**
   * Update script metrics
   */
  async updateMetrics(scriptId, metrics) {
    try {
      const updateData = {
        [`performance_metrics.${Object.keys(metrics)[0]}`]: Object.values(metrics)[0],
        'performance_metrics.last_used': FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp()
      };

      // Handle multiple metrics
      Object.entries(metrics).forEach(([key, value]) => {
        updateData[`performance_metrics.${key}`] = value;
      });

      await this.collection.doc(scriptId).update(updateData);
      
      console.log(`Script metrics updated: ${scriptId}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating script metrics:', error);
      throw error;
    }
  }

  /**
   * Search scripts
   */
  async searchScripts(userId, searchTerm, filters = {}) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or Elasticsearch
      
      let query = this.collection.where('created_by', '==', userId);
      
      // Apply filters first
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }

      const snapshot = await query.get();
      const scripts = [];

      snapshot.forEach(doc => {
        const script = Script.fromFirestore(doc);
        
        // Client-side filtering for search term
        const searchableText = `${script.name} ${script.description} ${script.tags.join(' ')}`.toLowerCase();
        if (searchableText.includes(searchTerm.toLowerCase())) {
          scripts.push(script);
        }
      });

      return scripts;
    } catch (error) {
      console.error('Error searching scripts:', error);
      throw error;
    }
  }

  /**
   * Get script templates
   */
  async getTemplates(type = null, objective = null) {
    try {
      const templates = [];
      const types = type ? [type] : ['call', 'sms', 'email'];
      const objectives = objective ? [objective] : ['lead_generation', 'appointment_setting', 'follow_up', 'survey'];

      types.forEach(scriptType => {
        objectives.forEach(scriptObjective => {
          const template = Script.getTemplate(scriptType, scriptObjective);
          if (template) {
            templates.push({
              type: scriptType,
              objective: scriptObjective,
              template
            });
          }
        });
      });

      return templates;
    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Get script analytics
   */
  async getAnalytics(userId, timeRange = '30d') {
    try {
      const scripts = await this.getScripts(userId);
      
      const analytics = {
        total_scripts: scripts.scripts.length,
        active_scripts: scripts.scripts.filter(s => s.status === 'active').length,
        draft_scripts: scripts.scripts.filter(s => s.status === 'draft').length,
        archived_scripts: scripts.scripts.filter(s => s.status === 'archived').length,
        by_type: {
          call: scripts.scripts.filter(s => s.type === 'call').length,
          sms: scripts.scripts.filter(s => s.type === 'sms').length,
          email: scripts.scripts.filter(s => s.type === 'email').length
        },
        performance: {
          total_uses: scripts.scripts.reduce((sum, s) => sum + s.performance_metrics.total_uses, 0),
          average_success_rate: scripts.scripts.reduce((sum, s) => sum + s.performance_metrics.success_rate, 0) / scripts.scripts.length || 0,
          average_conversion_rate: scripts.scripts.reduce((sum, s) => sum + s.performance_metrics.conversion_rate, 0) / scripts.scripts.length || 0
        },
        top_performing: scripts.scripts
          .sort((a, b) => b.performance_metrics.success_rate - a.performance_metrics.success_rate)
          .slice(0, 5)
          .map(s => ({
            id: s.id,
            name: s.name,
            success_rate: s.performance_metrics.success_rate,
            total_uses: s.performance_metrics.total_uses
          }))
      };

      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test Firestore connection
      await this.collection.limit(1).get();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ScriptService'
      };
    } catch (error) {
      console.error('Script service health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        service: 'ScriptService'
      };
    }
  }
}

module.exports = new ScriptService();
