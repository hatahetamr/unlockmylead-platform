#!/usr/bin/env node

/**
 * Comprehensive Test Script for AI Calling & Messaging System
 * Tests all implemented features: Twilio, LLMs, TTS, CRM, and Apollo.io
 */

const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:8080';

class SystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Testing: ${testName}`);
    try {
      await testFunction();
      console.log(`✅ PASSED: ${testName}`);
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testServerHealth() {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error('Server health check failed');
    }
  }

  async testVoicesEndpoint() {
    const response = await axios.get(`${BASE_URL}/api/voices`);
    if (!response.data.success || !Array.isArray(response.data.voices)) {
      throw new Error('Voices endpoint failed');
    }
    if (response.data.voices.length < 7) {
      throw new Error('Expected at least 7 voice models');
    }
  }

  async testLanguagesEndpoint() {
    const response = await axios.get(`${BASE_URL}/api/languages`);
    if (!response.data.success || !Array.isArray(response.data.languages)) {
      throw new Error('Languages endpoint failed');
    }
    if (response.data.languages.length < 20) {
      throw new Error('Expected at least 20 languages');
    }
  }

  async testLLMProviders() {
    const providers = ['openai', 'gemini', 'deepseek'];
    
    for (const provider of providers) {
      const response = await axios.post(`${BASE_URL}/api/llm/test`, {
        provider: provider,
        prompt: 'Hello, this is a test message.'
      });
      
      if (!response.data.success) {
        throw new Error(`LLM provider ${provider} test failed`);
      }
    }
  }

  async testTTSService() {
    const response = await axios.post(`${BASE_URL}/api/tts-new/convert`, {
      text: 'Hello, this is a test of the text-to-speech service.',
      voiceId: 'en-US-Standard-A',
      languageCode: 'en-US'
    });
    
    if (!response.data.success || !response.data.audioUrl) {
      throw new Error('TTS service test failed');
    }
  }

  async testCRMProviders() {
    const response = await axios.get(`${BASE_URL}/api/crm/providers`);
    
    if (!response.data.success || !Array.isArray(response.data.providers)) {
      throw new Error('CRM providers endpoint failed');
    }
    
    const hasHubSpot = response.data.providers.some(p => p.id === 'hubspot');
    if (!hasHubSpot) {
      throw new Error('HubSpot provider not found');
    }
  }

  async testHubSpotAuthURL() {
    const response = await axios.get(`${BASE_URL}/api/hubspot/auth/url`);
    
    if (!response.data.success || !response.data.authUrl) {
      throw new Error('HubSpot auth URL generation failed');
    }
    
    if (!response.data.authUrl.includes('app.hubspot.com/oauth/authorize')) {
      throw new Error('Invalid HubSpot auth URL');
    }
  }

  async testApolloSuggestions() {
    const endpoints = ['titles', 'industries', 'locations'];
    
    for (const endpoint of endpoints) {
      const response = await axios.get(`${BASE_URL}/api/apollo/suggestions/${endpoint}`);
      
      if (!response.data.success || !Array.isArray(response.data[endpoint])) {
        throw new Error(`Apollo ${endpoint} suggestions failed`);
      }
      
      if (response.data[endpoint].length === 0) {
        throw new Error(`Apollo ${endpoint} suggestions returned empty array`);
      }
    }
  }

  async testTwilioService() {
    // Test Twilio service initialization (without making actual calls)
    const response = await axios.post(`${BASE_URL}/api/twilio/test-connection`, {});
    
    if (!response.data.success) {
      throw new Error('Twilio service test failed');
    }
  }

  async testCallInitiation() {
    // Test call initiation endpoint (mock mode)
    const response = await axios.post(`${BASE_URL}/api/call/initiate`, {
      to: '+1234567890',
      campaignId: 'test-campaign',
      llmProvider: 'openai',
      voiceId: 'en-US-Standard-A',
      testMode: true
    });
    
    if (!response.data.success) {
      throw new Error('Call initiation test failed');
    }
  }

  async testEnvironmentVariables() {
    const requiredVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'DEEPSEEK_API_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      console.log('   Some tests may fail without proper API keys.');
    } else {
      console.log('✅ All required environment variables are set');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting AI Calling & Messaging System Tests\n');
    console.log('=' .repeat(60));
    
    // Check environment variables first
    await this.testEnvironmentVariables();
    
    // Core system tests
    await this.runTest('Server Health Check', () => this.testServerHealth());
    await this.runTest('Voices Endpoint', () => this.testVoicesEndpoint());
    await this.runTest('Languages Endpoint', () => this.testLanguagesEndpoint());
    
    // AI and Communication tests
    await this.runTest('LLM Providers', () => this.testLLMProviders());
    await this.runTest('Text-to-Speech Service', () => this.testTTSService());
    await this.runTest('Twilio Service', () => this.testTwilioService());
    await this.runTest('Call Initiation', () => this.testCallInitiation());
    
    // CRM and Lead Generation tests
    await this.runTest('CRM Providers', () => this.testCRMProviders());
    await this.runTest('HubSpot Auth URL', () => this.testHubSpotAuthURL());
    await this.runTest('Apollo Suggestions', () => this.testApolloSuggestions());
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📋 Detailed Results:');
    this.results.tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${icon} ${test.name}`);
    });
    
    if (this.results.failed === 0) {
      console.log('\n🎉 All tests passed! Your AI Calling & Messaging System is ready!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the errors above and fix the issues.');
    }
    
    console.log('\n📚 Next Steps:');
    console.log('   1. Set up your API keys in the .env file');
    console.log('   2. Test with real API calls using your credentials');
    console.log('   3. Configure your frontend to use these endpoints');
    console.log('   4. Start building your AI campaigns!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().catch(error => {
    console.error('\n💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = SystemTester;
