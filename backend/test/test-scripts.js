/**
 * Script Management System Tests
 * Comprehensive test suite for script CRUD operations
 */

const ScriptService = require('../src/services/ScriptService');
const Script = require('../src/models/Script');

// Test data
const testUserId = 'test-user-123';
const testScript = {
  name: 'Test Lead Generation Script',
  description: 'A test script for lead generation calls',
  type: 'call',
  industry: 'technology',
  language: 'en',
  tone: 'professional',
  objective: 'lead_generation',
  content: {
    opening: 'Hi {firstName}, this is {agentName} from {companyName}.',
    main_points: [
      'We help companies like yours {value_proposition}',
      'Would you be interested in learning more?'
    ],
    objection_handling: {
      'not_interested': 'I understand, but what if I could show you {specific_benefit}?'
    },
    closing: 'Great! I\'ll send you more information.',
    fallback_responses: ['Could you repeat that?', 'I didn\'t catch that.']
  },
  tags: ['lead-gen', 'technology', 'cold-calling'],
  status: 'draft'
};

const testVariables = {
  firstName: 'John',
  agentName: 'Sarah',
  companyName: 'TechCorp',
  value_proposition: 'increase sales by 30%',
  specific_benefit: 'a 25% reduction in costs'
};

async function runScriptTests() {
  console.log('🧪 Starting Script Management Tests...');
  console.log('='.repeat(50));

  let createdScriptId = null;

  try {
    // Test 1: Create Script
    console.log('\n1. Testing script creation...');
    const createdScript = await ScriptService.createScript(testScript, testUserId);
    createdScriptId = createdScript.id;
    
    if (createdScript && createdScript.id) {
      console.log('✅ Script created successfully:', createdScript.id);
      console.log('   Name:', createdScript.name);
      console.log('   Variables extracted:', createdScript.variables);
    } else {
      console.log('❌ Script creation failed');
      return;
    }

    // Test 2: Get Script
    console.log('\n2. Testing script retrieval...');
    const retrievedScript = await ScriptService.getScript(createdScriptId, testUserId);
    
    if (retrievedScript && retrievedScript.id === createdScriptId) {
      console.log('✅ Script retrieved successfully');
      console.log('   Name:', retrievedScript.name);
      console.log('   Type:', retrievedScript.type);
    } else {
      console.log('❌ Script retrieval failed');
    }

    // Test 3: Update Script
    console.log('\n3. Testing script update...');
    const updateData = {
      name: 'Updated Test Script',
      status: 'active',
      content: {
        ...testScript.content,
        opening: 'Hello {firstName}, this is {agentName} calling from {companyName}.'
      }
    };
    
    const updatedScript = await ScriptService.updateScript(createdScriptId, updateData, testUserId);
    
    if (updatedScript && updatedScript.name === 'Updated Test Script') {
      console.log('✅ Script updated successfully');
      console.log('   New name:', updatedScript.name);
      console.log('   Status:', updatedScript.status);
    } else {
      console.log('❌ Script update failed');
    }

    // Test 4: Get All Scripts
    console.log('\n4. Testing scripts listing...');
    const scriptsResult = await ScriptService.getScripts(testUserId, { limit: 10 });
    
    if (scriptsResult && scriptsResult.scripts.length > 0) {
      console.log('✅ Scripts listed successfully');
      console.log('   Total scripts:', scriptsResult.scripts.length);
      console.log('   First script:', scriptsResult.scripts[0].name);
    } else {
      console.log('❌ Scripts listing failed');
    }

    // Test 5: Variable Replacement
    console.log('\n5. Testing variable replacement...');
    const scriptWithVariables = await ScriptService.getScript(createdScriptId, testUserId);
    const processedScript = scriptWithVariables.replaceVariables(testVariables);
    
    console.log('   Original opening:', scriptWithVariables.content.opening);
    console.log('   Processed opening:', processedScript.content.opening);
    
    if (processedScript.content.opening.includes('John') && processedScript.content.opening.includes('Sarah')) {
      console.log('✅ Variable replacement successful');
    } else {
      console.log('❌ Variable replacement failed');
    }

    // Test 6: Script Duplication
    console.log('\n6. Testing script duplication...');
    const duplicatedScript = await ScriptService.duplicateScript(createdScriptId, testUserId, 'Duplicated Test Script');
    
    if (duplicatedScript && duplicatedScript.name === 'Duplicated Test Script') {
      console.log('✅ Script duplicated successfully');
      console.log('   Original ID:', createdScriptId);
      console.log('   Duplicate ID:', duplicatedScript.id);
      
      // Clean up duplicate
      await ScriptService.deleteScript(duplicatedScript.id, testUserId);
    } else {
      console.log('❌ Script duplication failed');
    }

    // Test 7: Script Versioning
    console.log('\n7. Testing script versioning...');
    const versionedScript = await ScriptService.createVersion(createdScriptId, testUserId);
    
    if (versionedScript && versionedScript.version === 2) {
      console.log('✅ Script version created successfully');
      console.log('   Original version:', 1);
      console.log('   New version:', versionedScript.version);
      console.log('   Parent script ID:', versionedScript.parent_script_id);
      
      // Clean up version
      await ScriptService.deleteScript(versionedScript.id, testUserId);
    } else {
      console.log('❌ Script versioning failed');
    }

    // Test 8: Search Scripts
    console.log('\n8. Testing script search...');
    const searchResults = await ScriptService.searchScripts(testUserId, 'test', { type: 'call' });
    
    if (searchResults && searchResults.length > 0) {
      console.log('✅ Script search successful');
      console.log('   Found scripts:', searchResults.length);
      console.log('   First result:', searchResults[0].name);
    } else {
      console.log('❌ Script search failed');
    }

    // Test 9: Get Templates
    console.log('\n9. Testing template retrieval...');
    const templates = await ScriptService.getTemplates('call', 'lead_generation');
    
    if (templates && templates.length > 0) {
      console.log('✅ Templates retrieved successfully');
      console.log('   Available templates:', templates.length);
      console.log('   First template type:', templates[0].type);
    } else {
      console.log('❌ Template retrieval failed');
    }

    // Test 10: Update Metrics
    console.log('\n10. Testing metrics update...');
    const metricsUpdate = {
      total_uses: 5,
      success_rate: 0.8,
      conversion_rate: 0.15
    };
    
    const metricsResult = await ScriptService.updateMetrics(createdScriptId, metricsUpdate);
    
    if (metricsResult && metricsResult.success) {
      console.log('✅ Metrics updated successfully');
      
      // Verify metrics were updated
      const scriptWithMetrics = await ScriptService.getScript(createdScriptId, testUserId);
      console.log('   Total uses:', scriptWithMetrics.performance_metrics.total_uses);
      console.log('   Success rate:', scriptWithMetrics.performance_metrics.success_rate);
    } else {
      console.log('❌ Metrics update failed');
    }

    // Test 11: Get Analytics
    console.log('\n11. Testing analytics...');
    const analytics = await ScriptService.getAnalytics(testUserId);
    
    if (analytics && analytics.total_scripts > 0) {
      console.log('✅ Analytics retrieved successfully');
      console.log('   Total scripts:', analytics.total_scripts);
      console.log('   Active scripts:', analytics.active_scripts);
      console.log('   Average success rate:', analytics.performance.average_success_rate.toFixed(2));
    } else {
      console.log('❌ Analytics retrieval failed');
    }

    // Test 12: Health Check
    console.log('\n12. Testing health check...');
    const health = await ScriptService.healthCheck();
    
    if (health && health.status === 'healthy') {
      console.log('✅ Health check passed');
      console.log('   Status:', health.status);
      console.log('   Service:', health.service);
    } else {
      console.log('❌ Health check failed');
    }

    // Test 13: Script Validation
    console.log('\n13. Testing script validation...');
    const invalidScript = new Script({
      name: '', // Invalid: empty name
      type: 'invalid_type', // Invalid: wrong type
      tone: 'invalid_tone' // Invalid: wrong tone
    });
    
    const validation = invalidScript.validate();
    
    if (!validation.isValid && validation.errors.length > 0) {
      console.log('✅ Script validation working correctly');
      console.log('   Validation errors:', validation.errors.length);
      console.log('   First error:', validation.errors[0]);
    } else {
      console.log('❌ Script validation failed');
    }

    // Test 14: Delete Script (cleanup)
    console.log('\n14. Testing script deletion...');
    const deleteResult = await ScriptService.deleteScript(createdScriptId, testUserId);
    
    if (deleteResult && deleteResult.success) {
      console.log('✅ Script deleted successfully');
    } else {
      console.log('❌ Script deletion failed');
    }

    // Final verification - script should not exist
    try {
      await ScriptService.getScript(createdScriptId, testUserId);
      console.log('❌ Script still exists after deletion');
    } catch (error) {
      if (error.message === 'Script not found') {
        console.log('✅ Script properly deleted - not found in database');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    // Cleanup on error
    if (createdScriptId) {
      try {
        await ScriptService.deleteScript(createdScriptId, testUserId);
        console.log('🧹 Cleaned up test script');
      } catch (cleanupError) {
        console.log('⚠️  Could not clean up test script:', cleanupError.message);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Script Management Tests Completed!');
  console.log('\nNext steps:');
  console.log('1. Set up proper authentication middleware');
  console.log('2. Configure Firestore security rules');
  console.log('3. Add rate limiting to API endpoints');
  console.log('4. Implement full-text search with Algolia/Elasticsearch');
  console.log('5. Add script performance tracking and analytics');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runScriptTests().catch(console.error);
}

module.exports = { runScriptTests };
