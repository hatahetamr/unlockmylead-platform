const axios = require('axios');
const ApolloService = require('../src/services/ApolloService');

// Test configuration
const BASE_URL = 'http://localhost:8080';
const TEST_USER_ID = 'test_user_123';

// Test Apollo Service
async function testApolloService() {
  console.log('\n=== Testing Apollo Service ===');
  
  try {
    const apolloService = new ApolloService();
    
    // Test health check
    console.log('\n1. Testing health check...');
    const health = apolloService.healthCheck();
    console.log('Health check result:', health);
    
    // Test search filters
    console.log('\n2. Testing search filters...');
    const filters = apolloService.getSearchFilters();
    console.log('Available industries:', filters.industries.slice(0, 5), '... and', filters.industries.length - 5, 'more');
    console.log('Available company sizes:', filters.companySizes);
    console.log('Available seniorities:', filters.seniorities);
    
    // Test API key validation (will fail without real key)
    console.log('\n3. Testing API key validation...');
    try {
      const isValid = await apolloService.validateApiKey();
      console.log('API key validation result:', isValid);
    } catch (error) {
      console.log('API key validation failed (expected if no API key):', error.message);
    }
    
    console.log('\n✅ Apollo Service tests completed');
  } catch (error) {
    console.error('❌ Apollo Service test failed:', error.message);
  }
}

// Test Apollo API endpoints
async function testApolloAPI() {
  console.log('\n=== Testing Apollo API Endpoints ===');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/apollo/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    // Test filters endpoint
    console.log('\n2. Testing filters endpoint...');
    const filtersResponse = await axios.get(`${BASE_URL}/api/apollo/filters`);
    console.log('Filters endpoint response (sample):', {
      industries: filtersResponse.data.data.industries.slice(0, 3),
      companySizes: filtersResponse.data.data.companySizes,
      seniorities: filtersResponse.data.data.seniorities.slice(0, 3)
    });
    
    // Test people search endpoint (will fail without API key)
    console.log('\n3. Testing people search endpoint...');
    try {
      const searchResponse = await axios.post(`${BASE_URL}/api/apollo/search/people`, {
        keywords: 'software engineer',
        page: 1,
        perPage: 5,
        locations: ['San Francisco, CA'],
        titles: ['Software Engineer', 'Senior Software Engineer']
      });
      console.log('People search response:', searchResponse.data);
    } catch (error) {
      console.log('People search failed (expected if no Apollo API key):', error.response?.data || error.message);
    }
    
    // Test organizations search endpoint (will fail without API key)
    console.log('\n4. Testing organizations search endpoint...');
    try {
      const orgSearchResponse = await axios.post(`${BASE_URL}/api/apollo/search/organizations`, {
        keywords: 'technology',
        page: 1,
        perPage: 5,
        industries: ['Computer Software'],
        companySizes: ['51,200']
      });
      console.log('Organizations search response:', orgSearchResponse.data);
    } catch (error) {
      console.log('Organizations search failed (expected if no Apollo API key):', error.response?.data || error.message);
    }
    
    console.log('\n✅ Apollo API tests completed');
  } catch (error) {
    console.error('❌ Apollo API test failed:', error.response?.data || error.message);
  }
}

// Test Apollo lead import functionality
async function testLeadImport() {
  console.log('\n=== Testing Apollo Lead Import ===');
  
  try {
    // Mock lead data for import test
    const mockLeads = [
      {
        id: 'apollo_person_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        company: 'Example Corp',
        jobTitle: 'Software Engineer',
        location: 'San Francisco, CA',
        linkedinUrl: 'https://linkedin.com/in/johndoe'
      },
      {
        id: 'apollo_person_2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@techco.com',
        phone: '+1-555-0124',
        company: 'TechCo Inc',
        jobTitle: 'Product Manager',
        location: 'New York, NY',
        linkedinUrl: 'https://linkedin.com/in/janesmith'
      }
    ];
    
    console.log('\n1. Testing lead import...');
    const importResponse = await axios.post(`${BASE_URL}/api/apollo/import/${TEST_USER_ID}`, {
      leads: mockLeads,
      source: 'apollo_test',
      campaignId: 'test_campaign_123'
    });
    
    console.log('Import response:', importResponse.data);
    console.log('Imported leads count:', importResponse.data.data.importedCount);
    
    console.log('\n✅ Lead import test completed');
  } catch (error) {
    console.error('❌ Lead import test failed:', error.response?.data || error.message);
  }
}

// Test Apollo contact creation
async function testContactCreation() {
  console.log('\n=== Testing Apollo Contact Creation ===');
  
  try {
    const contactData = {
      firstName: 'Test',
      lastName: 'Contact',
      email: 'test.contact@example.com',
      organizationName: 'Test Company',
      title: 'Test Manager',
      phone: '+1-555-9999',
      linkedinUrl: 'https://linkedin.com/in/testcontact'
    };
    
    console.log('\n1. Testing contact creation...');
    try {
      const contactResponse = await axios.post(`${BASE_URL}/api/apollo/contacts`, contactData);
      console.log('Contact creation response:', contactResponse.data);
    } catch (error) {
      console.log('Contact creation failed (expected if no Apollo API key):', error.response?.data || error.message);
    }
    
    console.log('\n✅ Contact creation test completed');
  } catch (error) {
    console.error('❌ Contact creation test failed:', error.response?.data || error.message);
  }
}

// Main test function
async function runApolloTests() {
  console.log('🚀 Starting Apollo.io Integration Tests...');
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
  await testApolloService();
  await testApolloAPI();
  await testLeadImport();
  await testContactCreation();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Apollo.io Integration Tests Completed!');
  console.log('\nNext steps:');
  console.log('1. Sign up for Apollo.io account at https://app.apollo.io/');
  console.log('2. Get your API key from Settings > Integrations > API');
  console.log('3. Update .env file with APOLLO_API_KEY');
  console.log('4. Test the complete lead generation flow with real API key');
  console.log('5. Configure search parameters for your target audience');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runApolloTests().catch(console.error);
}

module.exports = {
  testApolloService,
  testApolloAPI,
  testLeadImport,
  testContactCreation,
  runApolloTests
};
