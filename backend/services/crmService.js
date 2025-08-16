const HubSpotService = require('./hubspotService');

class CRMService {
  constructor() {
    this.providers = {
      hubspot: new HubSpotService(),
      // Future CRM providers can be added here
      // salesforce: new SalesforceService(),
      // pipedrive: new PipedriveService(),
    };
  }

  // Get CRM provider instance
  getProvider(providerName) {
    const provider = this.providers[providerName.toLowerCase()];
    if (!provider) {
      throw new Error(`CRM provider '${providerName}' is not supported`);
    }
    return provider;
  }

  // Get list of supported CRM providers
  getSupportedProviders() {
    return Object.keys(this.providers).map(key => ({
      id: key,
      name: this.getProviderDisplayName(key),
      authRequired: true
    }));
  }

  // Get display name for provider
  getProviderDisplayName(providerId) {
    const displayNames = {
      hubspot: 'HubSpot',
      salesforce: 'Salesforce',
      pipedrive: 'Pipedrive'
    };
    return displayNames[providerId] || providerId;
  }

  // Universal contact format
  normalizeContact(contact, provider) {
    switch (provider) {
      case 'hubspot':
        return this.providers.hubspot.formatContactData(contact);
      // Add other providers as needed
      default:
        return contact;
    }
  }

  // Universal company format
  normalizeCompany(company, provider) {
    // Implement company normalization for different CRM providers
    return {
      id: company.id,
      name: company.name || company.properties?.name || '',
      domain: company.domain || company.properties?.domain || '',
      industry: company.industry || company.properties?.industry || '',
      phone: company.phone || company.properties?.phone || '',
      location: this.formatLocation(company),
      source: provider
    };
  }

  // Format location from various CRM formats
  formatLocation(entity) {
    const city = entity.city || entity.properties?.city || '';
    const state = entity.state || entity.properties?.state || '';
    const country = entity.country || entity.properties?.country || '';

    const parts = [city, state, country].filter(part => part && part.trim());
    return parts.join(', ');
  }

  // Validate CRM credentials
  async validateCredentials(provider, credentials) {
    try {
      const crmProvider = this.getProvider(provider);
      
      switch (provider) {
        case 'hubspot':
          // Try to fetch a small number of contacts to validate token
          await crmProvider.getContacts(credentials.accessToken, 1);
          return { valid: true, message: 'Credentials are valid' };
        
        default:
          throw new Error(`Credential validation not implemented for ${provider}`);
      }
    } catch (error) {
      return { 
        valid: false, 
        message: error.message || 'Invalid credentials' 
      };
    }
  }

  // Sync contacts from CRM
  async syncContacts(provider, credentials, options = {}) {
    try {
      const crmProvider = this.getProvider(provider);
      const { limit = 100, lastSyncDate = null } = options;
      
      let allContacts = [];
      let hasMore = true;
      let after = null;
      
      while (hasMore && allContacts.length < limit) {
        const response = await crmProvider.getContacts(
          credentials.accessToken, 
          Math.min(100, limit - allContacts.length),
          after
        );
        
        const normalizedContacts = response.results.map(contact => 
          this.normalizeContact(contact, provider)
        );
        
        allContacts = allContacts.concat(normalizedContacts);
        
        hasMore = response.paging && response.paging.next;
        after = response.paging?.next?.after;
      }
      
      return {
        contacts: allContacts,
        totalCount: allContacts.length,
        hasMore: hasMore,
        nextCursor: after
      };
    } catch (error) {
      console.error(`Error syncing contacts from ${provider}:`, error.message);
      throw new Error(`Failed to sync contacts from ${provider}`);
    }
  }

  // Search contacts across CRM
  async searchContacts(provider, credentials, searchCriteria) {
    try {
      const crmProvider = this.getProvider(provider);
      
      switch (provider) {
        case 'hubspot':
          const filters = this.buildHubSpotFilters(searchCriteria);
          const response = await crmProvider.searchContacts(
            credentials.accessToken, 
            filters, 
            searchCriteria.limit || 100
          );
          
          return {
            contacts: response.results.map(contact => 
              this.normalizeContact(contact, provider)
            ),
            totalCount: response.total || response.results.length
          };
        
        default:
          throw new Error(`Search not implemented for ${provider}`);
      }
    } catch (error) {
      console.error(`Error searching contacts in ${provider}:`, error.message);
      throw new Error(`Failed to search contacts in ${provider}`);
    }
  }

  // Build HubSpot-specific filters
  buildHubSpotFilters(searchCriteria) {
    const filters = [];
    
    if (searchCriteria.email) {
      filters.push({
        propertyName: 'email',
        operator: 'CONTAINS_TOKEN',
        value: searchCriteria.email
      });
    }
    
    if (searchCriteria.company) {
      filters.push({
        propertyName: 'company',
        operator: 'CONTAINS_TOKEN',
        value: searchCriteria.company
      });
    }
    
    if (searchCriteria.firstName) {
      filters.push({
        propertyName: 'firstname',
        operator: 'CONTAINS_TOKEN',
        value: searchCriteria.firstName
      });
    }
    
    if (searchCriteria.lastName) {
      filters.push({
        propertyName: 'lastname',
        operator: 'CONTAINS_TOKEN',
        value: searchCriteria.lastName
      });
    }
    
    if (searchCriteria.jobTitle) {
      filters.push({
        propertyName: 'jobtitle',
        operator: 'CONTAINS_TOKEN',
        value: searchCriteria.jobTitle
      });
    }
    
    return filters;
  }

  // Create contact in CRM
  async createContact(provider, credentials, contactData) {
    try {
      const crmProvider = this.getProvider(provider);
      
      switch (provider) {
        case 'hubspot':
          const hubspotData = this.convertToHubSpotFormat(contactData);
          const response = await crmProvider.createContact(credentials.accessToken, hubspotData);
          return this.normalizeContact(response, provider);
        
        default:
          throw new Error(`Contact creation not implemented for ${provider}`);
      }
    } catch (error) {
      console.error(`Error creating contact in ${provider}:`, error.message);
      throw new Error(`Failed to create contact in ${provider}`);
    }
  }

  // Convert universal contact format to HubSpot format
  convertToHubSpotFormat(contactData) {
    return {
      firstname: contactData.firstName || '',
      lastname: contactData.lastName || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      company: contactData.company || '',
      jobtitle: contactData.jobTitle || ''
    };
  }

  // Update contact in CRM
  async updateContact(provider, credentials, contactId, contactData) {
    try {
      const crmProvider = this.getProvider(provider);
      
      switch (provider) {
        case 'hubspot':
          const hubspotData = this.convertToHubSpotFormat(contactData);
          const response = await crmProvider.updateContact(
            credentials.accessToken, 
            contactId, 
            hubspotData
          );
          return this.normalizeContact(response, provider);
        
        default:
          throw new Error(`Contact update not implemented for ${provider}`);
      }
    } catch (error) {
      console.error(`Error updating contact in ${provider}:`, error.message);
      throw new Error(`Failed to update contact in ${provider}`);
    }
  }
}

module.exports = CRMService;
