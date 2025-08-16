const axios = require('axios');

class ApolloService {
  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY;
    this.baseUrl = 'https://api.apollo.io/v1';
  }

  // Search for people/contacts
  async searchPeople(searchCriteria) {
    try {
      const {
        q = '',
        titles = [],
        company_names = [],
        person_locations = [],
        organization_locations = [],
        organization_num_employees_ranges = [],
        organization_industries = [],
        page = 1,
        per_page = 25
      } = searchCriteria;

      const requestData = {
        api_key: this.apiKey,
        q,
        titles,
        company_names,
        person_locations,
        organization_locations,
        organization_num_employees_ranges,
        organization_industries,
        page,
        per_page
      };

      // Remove empty arrays and undefined values
      Object.keys(requestData).forEach(key => {
        if (Array.isArray(requestData[key]) && requestData[key].length === 0) {
          delete requestData[key];
        }
        if (requestData[key] === undefined || requestData[key] === '') {
          delete requestData[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/mixed_people/search`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error searching people in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to search people in Apollo.io');
    }
  }

  // Search for organizations/companies
  async searchOrganizations(searchCriteria) {
    try {
      const {
        q = '',
        organization_locations = [],
        organization_num_employees_ranges = [],
        organization_industries = [],
        organization_keywords = [],
        page = 1,
        per_page = 25
      } = searchCriteria;

      const requestData = {
        api_key: this.apiKey,
        q,
        organization_locations,
        organization_num_employees_ranges,
        organization_industries,
        organization_keywords,
        page,
        per_page
      };

      // Remove empty arrays and undefined values
      Object.keys(requestData).forEach(key => {
        if (Array.isArray(requestData[key]) && requestData[key].length === 0) {
          delete requestData[key];
        }
        if (requestData[key] === undefined || requestData[key] === '') {
          delete requestData[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/mixed_companies/search`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error searching organizations in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to search organizations in Apollo.io');
    }
  }

  // Enrich a person by email
  async enrichPerson(email) {
    try {
      const response = await axios.get(`${this.baseUrl}/people/match`, {
        params: {
          api_key: this.apiKey,
          email: email
        },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error enriching person in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to enrich person in Apollo.io');
    }
  }

  // Enrich an organization by domain
  async enrichOrganization(domain) {
    try {
      const response = await axios.get(`${this.baseUrl}/organizations/enrich`, {
        params: {
          api_key: this.apiKey,
          domain: domain
        },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error enriching organization in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to enrich organization in Apollo.io');
    }
  }

  // Get email finder results
  async findEmails(searchCriteria) {
    try {
      const {
        first_name,
        last_name,
        domain,
        organization_name
      } = searchCriteria;

      const requestData = {
        api_key: this.apiKey,
        first_name,
        last_name,
        domain,
        organization_name
      };

      // Remove undefined values
      Object.keys(requestData).forEach(key => {
        if (requestData[key] === undefined || requestData[key] === '') {
          delete requestData[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/email_finder`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error finding emails in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to find emails in Apollo.io');
    }
  }

  // Get account information and credits
  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/auth/health`, {
        params: {
          api_key: this.apiKey
        },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting account info from Apollo:', error.response?.data || error.message);
      throw new Error('Failed to get account info from Apollo.io');
    }
  }

  // Format person data for frontend
  formatPersonData(apolloPerson) {
    return {
      id: apolloPerson.id,
      firstName: apolloPerson.first_name || '',
      lastName: apolloPerson.last_name || '',
      email: apolloPerson.email || '',
      phone: apolloPerson.phone_numbers?.[0]?.sanitized_number || '',
      company: apolloPerson.organization?.name || '',
      jobTitle: apolloPerson.title || '',
      linkedinUrl: apolloPerson.linkedin_url || '',
      twitterUrl: apolloPerson.twitter_url || '',
      location: apolloPerson.city && apolloPerson.state ? 
        `${apolloPerson.city}, ${apolloPerson.state}` : 
        (apolloPerson.city || apolloPerson.state || ''),
      industry: apolloPerson.organization?.industry || '',
      companySize: apolloPerson.organization?.estimated_num_employees || null,
      companyDomain: apolloPerson.organization?.website_url || '',
      source: 'apollo'
    };
  }

  // Format organization data for frontend
  formatOrganizationData(apolloOrg) {
    return {
      id: apolloOrg.id,
      name: apolloOrg.name || '',
      domain: apolloOrg.website_url || '',
      industry: apolloOrg.industry || '',
      employeeCount: apolloOrg.estimated_num_employees || null,
      location: apolloOrg.city && apolloOrg.state ? 
        `${apolloOrg.city}, ${apolloOrg.state}` : 
        (apolloOrg.city || apolloOrg.state || ''),
      phone: apolloOrg.phone || '',
      description: apolloOrg.short_description || '',
      linkedinUrl: apolloOrg.linkedin_url || '',
      twitterUrl: apolloOrg.twitter_url || '',
      founded: apolloOrg.founded_year || null,
      source: 'apollo'
    };
  }

  // Validate search criteria
  validateSearchCriteria(criteria) {
    const errors = [];

    if (!criteria.q && 
        (!criteria.titles || criteria.titles.length === 0) &&
        (!criteria.company_names || criteria.company_names.length === 0) &&
        (!criteria.organization_industries || criteria.organization_industries.length === 0)) {
      errors.push('At least one search criterion must be provided (query, titles, company names, or industries)');
    }

    if (criteria.per_page && (criteria.per_page < 1 || criteria.per_page > 100)) {
      errors.push('per_page must be between 1 and 100');
    }

    if (criteria.page && criteria.page < 1) {
      errors.push('page must be greater than 0');
    }

    return errors;
  }
}

module.exports = ApolloService;
