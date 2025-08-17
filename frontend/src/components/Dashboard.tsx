import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import Analytics from './Analytics';
import Integrations from './Integrations';
import VoicePicker from './VoicePicker';
import './Dashboard.css';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  status: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  leads_count: number;
  created_at: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lead search form state
  const [leadSearchData, setLeadSearchData] = useState({
    keywords: '',
    location: '',
    industry: ''
  });

  // Campaign creation form state
  const [campaignData, setCampaignData] = useState({
    name: '',
    message: '',
    voice: 'default',
    language: 'en'
  });

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [leadsResponse, campaignsResponse] = await Promise.all([
        ApiService.getLeads(),
        ApiService.getCampaigns()
      ]);
      
      setLeads(leadsResponse.leads || []);
      setCampaigns(campaignsResponse.campaigns || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ApiService.searchLeads(leadSearchData);
      setLeads(response.leads || []);
      setSuccess(`Found ${response.leads?.length || 0} leads`);
    } catch (error: any) {
      setError(error.message || 'Failed to search leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await ApiService.createCampaign(campaignData);
      setCampaigns(prev => [response.campaign, ...prev]);
      setSuccess('Campaign created successfully!');
      setCampaignData({
        name: '',
        message: '',
        voice: 'default',
        language: 'en'
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboardContent = () => {
    return (
      <div className="dashboard-main">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Leads</h3>
            <div className="stat-value">{leads.length}</div>
          </div>
          <div className="stat-card">
            <h3>Active Campaigns</h3>
            <div className="stat-value">{campaigns.filter(c => c.status === 'active').length}</div>
          </div>
          <div className="stat-card">
            <h3>Total Campaigns</h3>
            <div className="stat-value">{campaigns.length}</div>
          </div>
        </div>

        <div className="dashboard-sections">
          {/* Lead Search Section */}
          <div className="section-card">
            <h3>Search for Leads</h3>
            <form onSubmit={handleSearchLeads} className="lead-search-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Keywords (e.g., CEO, Marketing Director)"
                  value={leadSearchData.keywords}
                  onChange={(e) => setLeadSearchData({...leadSearchData, keywords: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Location (e.g., New York, CA)"
                  value={leadSearchData.location}
                  onChange={(e) => setLeadSearchData({...leadSearchData, location: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Industry (e.g., Technology, Healthcare)"
                  value={leadSearchData.industry}
                  onChange={(e) => setLeadSearchData({...leadSearchData, industry: e.target.value})}
                />
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Searching...' : 'Search Leads'}
                </button>
              </div>
            </form>
          </div>

          {/* Campaign Creation Section */}
          <div className="section-card">
            <h3>Create New Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="campaign-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Campaign Name"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Campaign Message"
                  value={campaignData.message}
                  onChange={(e) => setCampaignData({...campaignData, message: e.target.value})}
                  rows={4}
                  required
                />
              </div>
              <div className="form-row">
                <VoicePicker
                  selectedVoice={campaignData.voice}
                  onVoiceSelect={(voiceId) => setCampaignData({...campaignData, voice: voiceId})}
                  language={campaignData.language}
                />
                <select
                  value={campaignData.voice}
                  onChange={(e) => setCampaignData({...campaignData, voice: e.target.value})}
                  style={{display: 'none'}}
                >
                  <option value="default">Default Voice</option>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="energetic">Energetic</option>
                </select>
                <select
                  value={campaignData.language}
                  onChange={(e) => setCampaignData({...campaignData, language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Leads */}
          <div className="section-card">
            <h3>Recent Leads</h3>
            <div className="leads-list">
              {leads.length > 0 ? (
                leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="lead-item">
                    <div className="lead-info">
                      <strong>{lead.name}</strong>
                      <span>{lead.company}</span>
                    </div>
                    <div className="lead-contact">
                      <span>{lead.email}</span>
                      {lead.phone && <span>{lead.phone}</span>}
                    </div>
                    <div className={`lead-status ${lead.status}`}>
                      {lead.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No leads found. Try searching for leads above.</p>
              )}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="section-card">
            <h3>Recent Campaigns</h3>
            <div className="campaigns-list">
              {campaigns.length > 0 ? (
                campaigns.slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="campaign-item">
                    <div className="campaign-info">
                      <strong>{campaign.name}</strong>
                      <span>{campaign.leads_count} leads</span>
                    </div>
                    <div className="campaign-date">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                    <div className={`campaign-status ${campaign.status}`}>
                      {campaign.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No campaigns yet. Create your first campaign above.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>UnlockMyLead Platform</h1>
        <div className="user-info">
          <span>Welcome, {user.firstName}!</span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`nav-btn ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && renderDashboardContent()}
        {activeTab === 'analytics' && <Analytics user={user} />}
        {activeTab === 'integrations' && <Integrations />}
      </div>
    </div>
  );
};

export default Dashboard;