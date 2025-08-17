const axios = require('axios');
const HubSpotService = require('../src/services/HubSpotService');

// Test configuration
const BASE_URL = 'http://localhost:8080';
const TEST_USER_ID = 'test_user_123';

// Test HubSpot Service
async function testHubSpotService() {
  console.log('\n=== Testing HubSpot Service ===');
  
  try {
    const hubspotService = new HubSpotService();
    
    // Test health check
    console.log('\n1. Testing health check...');
    const health = hubspotService.healthCheck();
    console.log('Health check result:', health);
    
    // Test auth URL generation
    console.log('\n2. Testing auth URL generation...');
    try {
      const authUrl = hubspotService.generateAuthUrl('test_state_123');
      console.log('Auth URL generated successfully');
      console.log('URL:', authUrl);
    } catch (error) {
      console.log('Auth URL generation failed (expected if no client ID):', error.message);
    }
    
    console.log('\n✅ HubSpot Service tests completed');
  } catch (error) {
    console.error('❌ HubSpot Service test failed:', error.message);
  }
}

// Test HubSpot API endpoints
async function testHubSpotAPI() {
  console.log('\n=== Testing HubSpot API Endpoints ===');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/hubspot/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    // Test auth endpoint
    console.log('\n2. Testing auth endpoint...');
    try {
      const authResponse = await axios.get(`${BASE_URL}/api/hubspot/auth`, {
        params: { userId: TEST_USER_ID }
      });
      console.log('Auth endpoint response:', authResponse.data);
    } catch (error) {
      console.log('Auth endpoint failed (expected if no HubSpot credentials):', error.response?.data || error.message);
    }
    
    // Test status endpoint
    console.log('\n3. Testing status endpoint...');
    const statusResponse = await axios.get(`${BASE_URL}/api/hubspot/status/${TEST_USER_ID}`);
    console.log('Status endpoint response:', statusResponse.data);
    
    console.log('\n✅ HubSpot API tests completed');
  } catch (error) {
    console.error('❌ HubSpot API test failed:', error.response?.data || error.message);
  }
}

// Test HubSpot OAuth flow simulation
async function testOAuthFlow() {
  console.log('\n=== Testing HubSpot OAuth Flow Simulation ===');
  
  try {
    // Step 1: Generate auth URL
    console.log('\n1. Generating authorization URL...');
    const authResponse = await axios.get(`${BASE_URL}/api/hubspot/auth`, {
      params: { userId: TEST_USER_ID }
    });
    
    if (authResponse.data.success) {
      console.log('✅ Auth URL generated successfully');
      console.log('State parameter:', authResponse.data.state);
      
      // Step 2: Simulate callback (this would normally come from HubSpot)
      console.log('\n2. Simulating OAuth callback...');
      console.log('Note: This would normally be handled by HubSpot redirecting to our callback URL');
      console.log('Callback URL would be:', `${BASE_URL}/api/hubspot/callback`);
      
      // Step 3: Check status (should show not connected)
      console.log('\n3. Checking connection status...');
      const statusResponse = await axios.get(`${BASE_URL}/api/hubspot/status/${TEST_USER_ID}`);
      console.log('Connection status:', statusResponse.data);
      
      console.log('\n✅ OAuth flow simulation completed');
    } else {
      console.log('❌ Failed to generate auth URL:', authResponse.data.error);
    }
  } catch (error) {
    console.log('❌ OAuth flow test failed (expected if no HubSpot credentials):', error.response?.data || error.message);
  }
}

// Main test function
async function runHubSpotTests() {
  console.log('🚀 Starting HubSpot Integration Tests...');
  console.log('='.repeat(50));
  
  // Wait for server to be ready
  console.log('Waiting for server to be ready...');
  let serverReady = false;
  let attempts = 0;
  
  while (!serverReady && attempts < 10) {
    try {
      await axios.get(`${BASE_URL}/health`);
      serverReady = true;
      console.log('✅ Server is ready');
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts}/10: Server not ready, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (!serverReady) {
    console.error('❌ Server failed to start within timeout period');
    return;
  }
  
  // Run tests
  await testHubSpotService();
  await testHubSpotAPI();
  await testOAuthFlow();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 HubSpot Integration Tests Completed!');
  console.log('\nNext steps:');
  console.log('1. Set up HubSpot Developer Account at https://developers.hubspot.com/');
  console.log('2. Create a new app and get Client ID and Client Secret');
  console.log('3. Update .env file with HubSpot credentials');
  console.log('4. Test the complete OAuth flow with real credentials');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runHubSpotTests().catch(console.error);
}

module.exports = {
  testHubSpotService,
  testHubSpotAPI,
  testOAuthFlow,
  runHubSpotTests
};
