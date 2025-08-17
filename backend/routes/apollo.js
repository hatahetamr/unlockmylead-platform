const express = require('express');
const ApolloService = require('../src/services/ApolloService');
const admin = require('firebase-admin');

const router = express.Router();
const apolloService = new ApolloService();

// Search for people/leads
router.post('/people/search', async (req, res) => {
  try {
    const searchCriteria = req.body;
    
    // Validate search criteria
    const validationErrors = apolloService.validateSearchCriteria(searchCriteria);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search criteria',
        details: validationErrors
      });
    }
    
    const response = await apolloService.searchPeople(searchCriteria);
    
    // Format the response data
    const formattedPeople = response.people?.map(person => 
      apolloService.formatPersonData(person)
    ) || [];
    
    res.json({
      success: true,
      people: formattedPeople,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 25,
        total_entries: response.pagination?.total_entries || 0,
        total_pages: response.pagination?.total_pages || 0
      },
      totalCount: formattedPeople.length
    });
  } catch (error) {
    console.error('Error searching people in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search people in Apollo.io'
    });
  }
});

// Search for organizations/companies
router.post('/organizations/search', async (req, res) => {
  try {
    const searchCriteria = req.body;
    
    const response = await apolloService.searchOrganizations(searchCriteria);
    
    // Format the response data
    const formattedOrganizations = response.organizations?.map(org => 
      apolloService.formatOrganizationData(org)
    ) || [];
    
    res.json({
      success: true,
      organizations: formattedOrganizations,
      pagination: {
        page: response.pagination?.page || 1,
        per_page: response.pagination?.per_page || 25,
        total_entries: response.pagination?.total_entries || 0,
        total_pages: response.pagination?.total_pages || 0
      },
      totalCount: formattedOrganizations.length
    });
  } catch (error) {
    console.error('Error searching organizations in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search organizations in Apollo.io'
    });
  }
});

// Enrich a person by email
router.post('/people/enrich', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required for person enrichment'
      });
    }
    
    const response = await apolloService.enrichPerson(email);
    
    if (!response.person) {
      return res.status(404).json({
        success: false,
        error: 'Person not found for the provided email'
      });
    }
    
    const formattedPerson = apolloService.formatPersonData(response.person);
    
    res.json({
      success: true,
      person: formattedPerson,
      credits_consumed: response.credits_consumed || 0
    });
  } catch (error) {
    console.error('Error enriching person in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich person in Apollo.io'
    });
  }
});

// Enrich an organization by domain
router.post('/organizations/enrich', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required for organization enrichment'
      });
    }
    
    const response = await apolloService.enrichOrganization(domain);
    
    if (!response.organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found for the provided domain'
      });
    }
    
    const formattedOrganization = apolloService.formatOrganizationData(response.organization);
    
    res.json({
      success: true,
      organization: formattedOrganization,
      credits_consumed: response.credits_consumed || 0
    });
  } catch (error) {
    console.error('Error enriching organization in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich organization in Apollo.io'
    });
  }
});

// Find emails for a person
router.post('/emails/find', async (req, res) => {
  try {
    const searchCriteria = req.body;
    
    if (!searchCriteria.first_name || !searchCriteria.last_name || 
        (!searchCriteria.domain && !searchCriteria.organization_name)) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, and either domain or organization name are required'
      });
    }
    
    const response = await apolloService.findEmails(searchCriteria);
    
    res.json({
      success: true,
      email: response.email || null,
      confidence: response.confidence || 0,
      credits_consumed: response.credits_consumed || 0,
      person: response.person ? apolloService.formatPersonData(response.person) : null
    });
  } catch (error) {
    console.error('Error finding emails in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to find emails in Apollo.io'
    });
  }
});

// Get account information and credits
router.get('/account', async (req, res) => {
  try {
    const response = await apolloService.getAccountInfo();
    
    res.json({
      success: true,
      account: response
    });
  } catch (error) {
    console.error('Error getting Apollo account info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get account information from Apollo.io'
    });
  }
});

// Bulk lead search and enrichment
router.post('/leads/bulk-search', async (req, res) => {
  try {
    const { searchCriteria, enrichContacts = false, maxResults = 100 } = req.body;
    
    // Validate search criteria
    const validationErrors = apolloService.validateSearchCriteria(searchCriteria);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search criteria',
        details: validationErrors
      });
    }
    
    let allPeople = [];
    let currentPage = 1;
    const perPage = Math.min(25, maxResults); // Apollo.io max per page is 25
    
    while (allPeople.length < maxResults) {
      const pageSearchCriteria = {
        ...searchCriteria,
        page: currentPage,
        per_page: Math.min(perPage, maxResults - allPeople.length)
      };
      
      const response = await apolloService.searchPeople(pageSearchCriteria);
      
      if (!response.people || response.people.length === 0) {
        break; // No more results
      }
      
      let formattedPeople = response.people.map(person => 
        apolloService.formatPersonData(person)
      );
      
      // Enrich contacts if requested
      if (enrichContacts) {
        for (let i = 0; i < formattedPeople.length; i++) {
          if (formattedPeople[i].email) {
            try {
              const enrichResponse = await apolloService.enrichPerson(formattedPeople[i].email);
              if (enrichResponse.person) {
                formattedPeople[i] = {
                  ...formattedPeople[i],
                  ...apolloService.formatPersonData(enrichResponse.person)
                };
              }
            } catch (enrichError) {
              console.warn(`Failed to enrich contact ${formattedPeople[i].email}:`, enrichError.message);
            }
          }
        }
      }
      
      allPeople = allPeople.concat(formattedPeople);
      
      // Check if we have more pages
      if (!response.pagination || currentPage >= response.pagination.total_pages) {
        break;
      }
      
      currentPage++;
    }
    
    res.json({
      success: true,
      leads: allPeople,
      totalCount: allPeople.length,
      enriched: enrichContacts,
      message: `Found ${allPeople.length} leads${enrichContacts ? ' with enrichment' : ''}`
    });
  } catch (error) {
    console.error('Error performing bulk lead search in Apollo:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk lead search in Apollo.io'
    });
  }
});

// Get search suggestions for titles
router.get('/suggestions/titles', (req, res) => {
  const commonTitles = [
    'CEO', 'CTO', 'CFO', 'COO', 'CMO',
    'President', 'Vice President', 'VP',
    'Director', 'Manager', 'Senior Manager',
    'Head of Sales', 'Sales Manager', 'Sales Director',
    'Head of Marketing', 'Marketing Manager', 'Marketing Director',
    'Software Engineer', 'Senior Software Engineer', 'Lead Developer',
    'Product Manager', 'Senior Product Manager', 'Product Director',
    'Business Development', 'Account Manager', 'Customer Success',
    'Founder', 'Co-Founder', 'Owner'
  ];
  
  res.json({
    success: true,
    titles: commonTitles
  });
});

// Get search suggestions for industries
router.get('/suggestions/industries', (req, res) => {
  const commonIndustries = [
    'Technology', 'Software', 'SaaS', 'E-commerce',
    'Healthcare', 'Finance', 'Banking', 'Insurance',
    'Manufacturing', 'Retail', 'Real Estate',
    'Education', 'Consulting', 'Marketing',
    'Media', 'Entertainment', 'Travel',
    'Food & Beverage', 'Automotive', 'Energy',
    'Construction', 'Legal', 'Non-profit'
  ];
  
  res.json({
    success: true,
    industries: commonIndustries
  });
});

// Get search suggestions for locations
router.get('/suggestions/locations', (req, res) => {
  const commonLocations = [
    'United States', 'New York, NY', 'San Francisco, CA', 'Los Angeles, CA',
    'Chicago, IL', 'Boston, MA', 'Seattle, WA', 'Austin, TX',
    'United Kingdom', 'London, UK', 'Canada', 'Toronto, ON',
    'Germany', 'Berlin, Germany', 'France', 'Paris, France',
    'Australia', 'Sydney, Australia', 'Singapore', 'Hong Kong'
  ];
  
  res.json({
    success: true,
    locations: commonLocations
  });
});

module.exports = router;
