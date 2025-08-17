import React, { useState, useEffect } from 'react';
import './Analytics.css';

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AnalyticsData {
  totalLeads: number;
  conversionRate: number;
  totalRevenue: number;
  activeIntegrations: number;
  monthlyData: Array<{
    month: string;
    leads: number;
    conversions: number;
  }>;
}

interface AnalyticsProps {
  user: User;
}

const Analytics: React.FC<AnalyticsProps> = ({ user }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError('Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Track your lead generation performance</p>
      </header>

      <div className="analytics-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Leads</h3>
            <div className="metric-value">{analyticsData?.totalLeads || 0}</div>
            <div className="metric-change positive">+12% from last month</div>
          </div>
          
          <div className="metric-card">
            <h3>Conversion Rate</h3>
            <div className="metric-value">{analyticsData?.conversionRate || 0}%</div>
            <div className="metric-change positive">+5% from last month</div>
          </div>
          
          <div className="metric-card">
            <h3>Total Revenue</h3>
            <div className="metric-value">${analyticsData?.totalRevenue || 0}</div>
            <div className="metric-change positive">+18% from last month</div>
          </div>
          
          <div className="metric-card">
            <h3>Active Integrations</h3>
            <div className="metric-value">{analyticsData?.activeIntegrations || 0}</div>
            <div className="metric-change neutral">No change</div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <h3>Monthly Performance</h3>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {analyticsData?.monthlyData?.map((month, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill" 
                      style={{ height: `${(month.leads / 100) * 100}%` }}
                    ></div>
                    <span className="bar-label">{month.month}</span>
                  </div>
                )) || (
                  <div className="no-data">No data available</div>
                )}
              </div>
            </div>
          </div>

          <div className="insights-card">
            <h3>Key Insights</h3>
            <div className="insights-list">
              <div className="insight-item">
                <span className="insight-icon">📈</span>
                <div>
                  <strong>Lead Quality Improved</strong>
                  <p>Your conversion rate has increased by 5% this month</p>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">🎯</span>
                <div>
                  <strong>Best Performing Channel</strong>
                  <p>HubSpot integration generating 60% of leads</p>
                </div>
              </div>
              <div className="insight-item">
                <span className="insight-icon">⚡</span>
                <div>
                  <strong>Optimization Opportunity</strong>
                  <p>Consider adding more calendar integrations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Analytics;