import React, { useState } from 'react';
import './DemoApp.css';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
}

const DemoApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: ''
  });
  const [isLogin, setIsLogin] = useState(true);
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Q4 Outreach', status: 'active', leads: 150 },
    { id: 2, name: 'Holiday Campaign', status: 'paused', leads: 89 }
  ]);
  const [leads, setLeads] = useState([
    { id: 1, name: 'John Smith', company: 'Tech Corp', email: 'john@techcorp.com' },
    { id: 2, name: 'Sarah Johnson', company: 'Sales Inc', email: 'sarah@salesinc.com' }
  ]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      if (formData.email && formData.password) {
        setUser({
          email: formData.email,
          firstName: formData.firstName || 'Demo',
          lastName: formData.lastName || 'User',
          company: formData.company || 'Demo Company'
        });
      }
    } else {
      if (formData.email && formData.password && formData.firstName && formData.lastName) {
        setUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company || 'Demo Company'
        });
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setFormData({ email: '', password: '', firstName: '', lastName: '', company: '' });
  };

  if (!user) {
    return (
      <div className="demo-app">
        <div className="auth-container">
          <div className="auth-header">
            <h1>UnlockMyLead</h1>
            <p>AI-Powered Sales Automation Platform</p>
            <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {!isLogin && (
              <div className="form-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required={!isLogin}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required={!isLogin}
                />
              </div>
            )}
            {!isLogin && (
              <input
                type="text"
                placeholder="Company (Optional)"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button type="submit" className="auth-btn">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="switch-btn">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <div className="demo-note">
            <p><strong>Demo Mode:</strong> Use any email and password to explore the platform</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>UnlockMyLead</h1>
            <span>AI-Powered Sales Automation</span>
          </div>
          <div className="user-info">
            <span>Welcome, {user.firstName}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="app-content">
        <nav className="sidebar">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            👥 Leads
          </button>
          <button 
            className={`nav-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            📢 Campaigns
          </button>
          <button 
            className={`nav-btn ${activeTab === 'voices' ? 'active' : ''}`}
            onClick={() => setActiveTab('voices')}
          >
            🎙️ AI Voices
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
        </nav>

        <main className="main-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard">
              <h2>Dashboard</h2>
              <div className="stats-grid">
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
              
              <div className="action-cards">
                <div className="action-card">
                  <h3>🔍 Search for Leads</h3>
                  <p>Find new prospects using AI-powered lead generation</p>
                  <button className="action-btn">Search Leads</button>
                </div>
                <div className="action-card">
                  <h3>📞 Create Campaign</h3>
                  <p>Launch AI-powered calling campaigns with 100+ voices</p>
                  <button className="action-btn">Create Campaign</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voices' && (
            <div className="voices">
              <h2>AI Voice Selection</h2>
              <p>Choose from 100+ premium AI voices across 40+ languages</p>
              
              <div className="voice-categories">
                <div className="voice-category">
                  <h3>🌟 Popular Voices</h3>
                  <div className="voice-list">
                    <div className="voice-item">
                      <span>👨 James (US English) - Neural2</span>
                      <button className="play-btn">▶️</button>
                    </div>
                    <div className="voice-item">
                      <span>👩 Emma (US English) - WaveNet</span>
                      <button className="play-btn">▶️</button>
                    </div>
                    <div className="voice-item">
                      <span>👨 Carlos (Spanish) - Neural2</span>
                      <button className="play-btn">▶️</button>
                    </div>
                  </div>
                </div>
                
                <div className="voice-category">
                  <h3>💎 Premium Voices</h3>
                  <div className="voice-list">
                    <div className="voice-item">
                      <span>👩 Sophie (French) - Neural2</span>
                      <button className="play-btn">▶️</button>
                    </div>
                    <div className="voice-item">
                      <span>👨 Hans (German) - WaveNet</span>
                      <button className="play-btn">▶️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics">
              <h2>Analytics Dashboard</h2>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>📞 Calls This Month</h3>
                  <div className="metric-value">1,247</div>
                  <div className="metric-change">+23% from last month</div>
                </div>
                <div className="analytics-card">
                  <h3>📈 Response Rate</h3>
                  <div className="metric-value">34.2%</div>
                  <div className="metric-change">+5.1% from last month</div>
                </div>
                <div className="analytics-card">
                  <h3>💰 Conversion Rate</h3>
                  <div className="metric-value">12.8%</div>
                  <div className="metric-change">+2.3% from last month</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="leads">
              <h2>Lead Management</h2>
              <div className="leads-list">
                {leads.map(lead => (
                  <div key={lead.id} className="lead-item">
                    <div className="lead-info">
                      <h4>{lead.name}</h4>
                      <p>{lead.company} • {lead.email}</p>
                    </div>
                    <button className="contact-btn">📞 Call</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="campaigns">
              <h2>Campaign Management</h2>
              <div className="campaigns-list">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="campaign-item">
                    <div className="campaign-info">
                      <h4>{campaign.name}</h4>
                      <p>Status: {campaign.status} • {campaign.leads} leads</p>
                    </div>
                    <div className="campaign-actions">
                      <button className="action-btn-sm">Edit</button>
                      <button className="action-btn-sm">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DemoApp;
