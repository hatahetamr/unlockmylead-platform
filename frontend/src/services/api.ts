// API service for backend communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication methods
  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request('/auth/profile', {
      method: 'GET',
    });
  }

  // Lead management methods
  async searchLeads(searchData) {
    return this.request('/leads/search', {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  }

  async getLeads() {
    return this.request('/leads', {
      method: 'GET',
    });
  }

  // Campaign management methods
  async createCampaign(campaignData) {
    return this.request('/campaigns/create', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  async getCampaigns() {
    return this.request('/campaigns', {
      method: 'GET',
    });
  }

  // Analytics methods
  async getAnalytics() {
    return this.request('/analytics/dashboard', {
      method: 'GET',
    });
  }

  // Integration methods
  async getIntegrationStatus(integration) {
    return this.request(`/integrations/${integration}/status`, {
      method: 'GET',
    });
  }

  async connectIntegration(integration) {
    return this.request(`/integrations/${integration}/auth-url`, {
      method: 'GET',
    });
  }

  async disconnectIntegration(integration) {
    return this.request(`/integrations/${integration}/disconnect`, {
      method: 'DELETE',
    });
  }

  // Voice methods
  async getVoices() {
    return this.request('/voices');
  }

  async getVoicesByLanguage(language) {
    return this.request(`/voices/language/${language}`);
  }

  async getPopularVoices() {
    return this.request('/voices/popular');
  }

  async getPremiumVoices() {
    return this.request('/voices/premium');
  }

  async getVoicePreview(voiceId, language = 'en-US') {
    const response = await fetch(`${this.baseURL}/voices/preview/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ language })
    });

    if (!response.ok) {
      throw new Error('Failed to generate voice preview');
    }

    return response.blob();
  }

  async searchVoices(query) {
    return this.request(`/voices/search?q=${encodeURIComponent(query)}`);
  }

  // Utility methods
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken() {
    localStorage.removeItem('authToken');
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }
}

export default new ApiService();