const axios = require('axios');

class ApolloService {
  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY;
    this.baseUrl = 'https://api.apollo.io/v1';
    this.headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };
  }

  /**
   * Search for people using Apollo.io API
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results
   */
  async searchPeople(searchParams) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const payload = {
        api_key: this.apiKey,
        q_keywords: searchParams.keywords || '',
        page: searchParams.page || 1,
        per_page: searchParams.perPage || 25,
        person_locations: searchParams.locations || [],
        person_titles: searchParams.titles || [],
        person_seniorities: searchParams.seniorities || [],
        organization_locations: searchParams.companyLocations || [],
        organization_industries: searchParams.industries || [],
        organization_num_employees_ranges: searchParams.companySizes || [],
        organization_ids: searchParams.organizationIds || [],
        prospected_by_current_team: searchParams.prospectedByCurrentTeam || [],
        include_emails: true,
        include_phone_numbers: true
      };

      // Remove empty arrays and undefined values
      Object.keys(payload).forEach(key => {
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          delete payload[key];
        }
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/mixed_people/search`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Error searching people in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to search people in Apollo.io');
    }
  }

  /**
   * Search for organizations using Apollo.io API
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results
   */
  async searchOrganizations(searchParams) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const payload = {
        api_key: this.apiKey,
        q_keywords: searchParams.keywords || '',
        page: searchParams.page || 1,
        per_page: searchParams.perPage || 25,
        organization_locations: searchParams.locations || [],
        organization_industries: searchParams.industries || [],
        organization_num_employees_ranges: searchParams.companySizes || [],
        organization_founded_year_ranges: searchParams.foundedYearRanges || [],
        organization_latest_funding_stage_cd: searchParams.fundingStages || [],
        prospected_by_current_team: searchParams.prospectedByCurrentTeam || []
      };

      // Remove empty arrays and undefined values
      Object.keys(payload).forEach(key => {
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          delete payload[key];
        }
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/organizations/search`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Error searching organizations in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to search organizations in Apollo.io');
    }
  }

  /**
   * Get person details by ID
   * @param {string} personId - Apollo person ID
   * @returns {Object} Person details
   */
  async getPersonById(personId) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/people/${personId}`, {
        headers: this.headers,
        params: {
          api_key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting person details from Apollo:', error.response?.data || error.message);
      throw new Error('Failed to get person details from Apollo.io');
    }
  }

  /**
   * Get organization details by ID
   * @param {string} organizationId - Apollo organization ID
   * @returns {Object} Organization details
   */
  async getOrganizationById(organizationId) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/organizations/${organizationId}`, {
        headers: this.headers,
        params: {
          api_key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting organization details from Apollo:', error.response?.data || error.message);
      throw new Error('Failed to get organization details from Apollo.io');
    }
  }

  /**
   * Create a contact in Apollo
   * @param {Object} contactData - Contact information
   * @returns {Object} Created contact
   */
  async createContact(contactData) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const payload = {
        api_key: this.apiKey,
        first_name: contactData.firstName,
        last_name: contactData.lastName,
        email: contactData.email,
        organization_name: contactData.organizationName,
        title: contactData.title,
        phone: contactData.phone,
        linkedin_url: contactData.linkedinUrl,
        twitter_url: contactData.twitterUrl,
        facebook_url: contactData.facebookUrl
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      const response = await axios.post(`${this.baseUrl}/contacts`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Error creating contact in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to create contact in Apollo.io');
    }
  }

  /**
   * Add people to a sequence
   * @param {string} sequenceId - Apollo sequence ID
   * @param {Array} contactIds - Array of contact IDs
   * @returns {Object} Result
   */
  async addToSequence(sequenceId, contactIds) {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const payload = {
        api_key: this.apiKey,
        sequence_id: sequenceId,
        contact_ids: contactIds,
        send_email_from_email_account_id: null // Use default email account
      };

      const response = await axios.post(`${this.baseUrl}/emailer_campaigns/add_contact_ids`, payload, {
        headers: this.headers
      });

      return response.data;
    } catch (error) {
      console.error('Error adding contacts to sequence in Apollo:', error.response?.data || error.message);
      throw new Error('Failed to add contacts to sequence in Apollo.io');
    }
  }

  /**
   * Get available sequences
   * @returns {Object} Sequences list
   */
  async getSequences() {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/emailer_campaigns`, {
        headers: this.headers,
        params: {
          api_key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting sequences from Apollo:', error.response?.data || error.message);
      throw new Error('Failed to get sequences from Apollo.io');
    }
  }

  /**
   * Get account information
   * @returns {Object} Account details
   */
  async getAccountInfo() {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/auth/health`, {
        headers: this.headers,
        params: {
          api_key: this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting account info from Apollo:', error.response?.data || error.message);
      throw new Error('Failed to get account information from Apollo.io');
    }
  }

  /**
   * Validate API key
   * @returns {boolean} True if API key is valid
   */
  async validateApiKey() {
    try {
      await this.getAccountInfo();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check for Apollo service
   * @returns {Object} Health status
   */
  healthCheck() {
    return {
      service: 'Apollo.io',
      status: this.apiKey ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl
    };
  }

  /**
   * Get search filters and options
   * @returns {Object} Available filters
   */
  getSearchFilters() {
    return {
      seniorities: [
        'founder',
        'c_suite',
        'vp',
        'director',
        'manager',
        'senior',
        'entry',
        'intern',
        'unpaid'
      ],
      companySizes: [
        '1,10',
        '11,50',
        '51,200',
        '201,500',
        '501,1000',
        '1001,5000',
        '5001,10000',
        '10001+'
      ],
      industries: [
        'Accounting',
        'Airlines/Aviation',
        'Alternative Dispute Resolution',
        'Alternative Medicine',
        'Animation',
        'Apparel & Fashion',
        'Architecture & Planning',
        'Arts and Crafts',
        'Automotive',
        'Aviation & Aerospace',
        'Banking',
        'Biotechnology',
        'Broadcast Media',
        'Building Materials',
        'Business Supplies and Equipment',
        'Capital Markets',
        'Chemicals',
        'Civic & Social Organization',
        'Civil Engineering',
        'Commercial Real Estate',
        'Computer & Network Security',
        'Computer Games',
        'Computer Hardware',
        'Computer Networking',
        'Computer Software',
        'Construction',
        'Consumer Electronics',
        'Consumer Goods',
        'Consumer Services',
        'Cosmetics',
        'Dairy',
        'Defense & Space',
        'Design',
        'E-Learning',
        'Education Management',
        'Electrical/Electronic Manufacturing',
        'Entertainment',
        'Environmental Services',
        'Events Services',
        'Executive Office',
        'Facilities Services',
        'Farming',
        'Financial Services',
        'Fine Art',
        'Fishery',
        'Food & Beverages',
        'Food Production',
        'Fund-Raising',
        'Furniture',
        'Gambling & Casinos',
        'Glass, Ceramics & Concrete',
        'Government Administration',
        'Government Relations',
        'Graphic Design',
        'Health, Wellness and Fitness',
        'Higher Education',
        'Hospital & Health Care',
        'Hospitality',
        'Human Resources',
        'Import and Export',
        'Individual & Family Services',
        'Industrial Automation',
        'Information Services',
        'Information Technology and Services',
        'Insurance',
        'International Affairs',
        'International Trade and Development',
        'Internet',
        'Investment Banking',
        'Investment Management',
        'Judiciary',
        'Law Enforcement',
        'Law Practice',
        'Legal Services',
        'Legislative Office',
        'Leisure, Travel & Tourism',
        'Libraries',
        'Logistics and Supply Chain',
        'Luxury Goods & Jewelry',
        'Machinery',
        'Management Consulting',
        'Maritime',
        'Market Research',
        'Marketing and Advertising',
        'Mechanical or Industrial Engineering',
        'Media Production',
        'Medical Devices',
        'Medical Practice',
        'Mental Health Care',
        'Military',
        'Mining & Metals',
        'Motion Pictures and Film',
        'Museums and Institutions',
        'Music',
        'Nanotechnology',
        'Newspapers',
        'Non-Profit Organization Management',
        'Oil & Energy',
        'Online Media',
        'Outsourcing/Offshoring',
        'Package/Freight Delivery',
        'Packaging and Containers',
        'Paper & Forest Products',
        'Performing Arts',
        'Pharmaceuticals',
        'Philanthropy',
        'Photography',
        'Plastics',
        'Political Organization',
        'Primary/Secondary Education',
        'Printing',
        'Professional Training & Coaching',
        'Program Development',
        'Public Policy',
        'Public Relations and Communications',
        'Public Safety',
        'Publishing',
        'Railroad Manufacture',
        'Ranching',
        'Real Estate',
        'Recreational Facilities and Services',
        'Religious Institutions',
        'Renewables & Environment',
        'Research',
        'Restaurants',
        'Retail',
        'Security and Investigations',
        'Semiconductors',
        'Shipbuilding',
        'Sporting Goods',
        'Sports',
        'Staffing and Recruiting',
        'Supermarkets',
        'Telecommunications',
        'Textiles',
        'Think Tanks',
        'Tobacco',
        'Translation and Localization',
        'Transportation/Trucking/Railroad',
        'Utilities',
        'Venture Capital & Private Equity',
        'Veterinary',
        'Warehousing',
        'Wholesale',
        'Wine and Spirits',
        'Wireless',
        'Writing and Editing'
      ],
      fundingStages: [
        'seed',
        'series_a',
        'series_b',
        'series_c',
        'series_d',
        'series_e',
        'private_equity',
        'debt_financing',
        'convertible_note',
        'grant',
        'equity_crowdfunding',
        'product_crowdfunding',
        'secondary_market',
        'post_ipo_equity',
        'post_ipo_debt',
        'undisclosed'
      ]
    };
  }
}

module.exports = ApolloService;
