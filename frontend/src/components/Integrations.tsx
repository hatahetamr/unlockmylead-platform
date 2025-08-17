import React, { useState, useEffect } from 'react'
import './Integrations.css'

interface IntegrationStatus {
  connected: boolean
  status?: string
  connected_at?: string
  expires_at?: string
  expired?: boolean
}

const Integrations: React.FC = () => {
  const [hubspotStatus, setHubspotStatus] = useState<IntegrationStatus>({ connected: false })
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState<IntegrationStatus>({ connected: false })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkIntegrationStatuses()
  }, [])

  const checkIntegrationStatuses = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Check HubSpot status
      const hubspotResponse = await fetch('http://localhost:5000/api/integrations/hubspot/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (hubspotResponse.ok) {
        const hubspotData = await hubspotResponse.json()
        setHubspotStatus(hubspotData)
      }

      // Check Google Calendar status
      const googleResponse = await fetch('http://localhost:5000/api/integrations/google-calendar/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (googleResponse.ok) {
        const googleData = await googleResponse.json()
        setGoogleCalendarStatus(googleData)
      }
    } catch (error) {
      console.error('Error checking integration statuses:', error)
    }
  }

  const connectHubSpot = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setMessage('Please log in first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/integrations/hubspot/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.authUrl, '_blank', 'width=600,height=600')
        setMessage('Please complete the authorization in the popup window')
      } else {
        setMessage('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Error connecting HubSpot:', error)
      setMessage('Error connecting to HubSpot')
    }
    setLoading(false)
  }

  const connectGoogleCalendar = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setMessage('Please log in first')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/integrations/google-calendar/auth-url', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.authUrl, '_blank', 'width=600,height=600')
        setMessage('Please complete the authorization in the popup window')
      } else {
        setMessage('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Error connecting Google Calendar:', error)
      setMessage('Error connecting to Google Calendar')
    }
    setLoading(false)
  }

  const disconnectHubSpot = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/integrations/hubspot/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setHubspotStatus({ connected: false })
        setMessage('HubSpot disconnected successfully')
      } else {
        setMessage('Failed to disconnect HubSpot')
      }
    } catch (error) {
      console.error('Error disconnecting HubSpot:', error)
      setMessage('Error disconnecting HubSpot')
    }
    setLoading(false)
  }

  const disconnectGoogleCalendar = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/integrations/google-calendar/disconnect', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setGoogleCalendarStatus({ connected: false })
        setMessage('Google Calendar disconnected successfully')
      } else {
        setMessage('Failed to disconnect Google Calendar')
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      setMessage('Error disconnecting Google Calendar')
    }
    setLoading(false)
  }

  return (
    <div className="integrations-container">
      <div className="integrations-header">
        <h1>Integrations</h1>
        <p>Connect your CRM and calendar to unlock powerful automation features</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="integrations-grid">
        {/* HubSpot Integration */}
        <div className="integration-card">
          <div className="integration-header">
            <div className="integration-icon hubspot">
              <span>H</span>
            </div>
            <div className="integration-info">
              <h3>HubSpot CRM</h3>
              <p>Sync contacts and manage your sales pipeline</p>
            </div>
            <div className={`status-indicator ${hubspotStatus.connected ? 'connected' : 'disconnected'}`}>
              {hubspotStatus.connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {hubspotStatus.connected && (
            <div className="integration-details">
              <p><strong>Status:</strong> {hubspotStatus.status}</p>
              {hubspotStatus.connected_at && (
                <p><strong>Connected:</strong> {new Date(hubspotStatus.connected_at).toLocaleDateString()}</p>
              )}
              {hubspotStatus.expired && (
                <p className="warning">⚠️ Token expired - please reconnect</p>
              )}
            </div>
          )}

          <div className="integration-actions">
            {hubspotStatus.connected ? (
              <button 
                className="btn btn-danger" 
                onClick={disconnectHubSpot}
                disabled={loading}
              >
                Disconnect
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={connectHubSpot}
                disabled={loading}
              >
                Connect HubSpot
              </button>
            )}
          </div>
        </div>

        {/* Google Calendar Integration */}
        <div className="integration-card">
          <div className="integration-header">
            <div className="integration-icon google">
              <span>G</span>
            </div>
            <div className="integration-info">
              <h3>Google Calendar</h3>
              <p>Schedule meetings and manage your calendar</p>
            </div>
            <div className={`status-indicator ${googleCalendarStatus.connected ? 'connected' : 'disconnected'}`}>
              {googleCalendarStatus.connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>

          {googleCalendarStatus.connected && (
            <div className="integration-details">
              <p><strong>Status:</strong> {googleCalendarStatus.status}</p>
              {googleCalendarStatus.connected_at && (
                <p><strong>Connected:</strong> {new Date(googleCalendarStatus.connected_at).toLocaleDateString()}</p>
              )}
              {googleCalendarStatus.expired && (
                <p className="warning">⚠️ Token expired - please reconnect</p>
              )}
            </div>
          )}

          <div className="integration-actions">
            {googleCalendarStatus.connected ? (
              <button 
                className="btn btn-danger" 
                onClick={disconnectGoogleCalendar}
                disabled={loading}
              >
                Disconnect
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={connectGoogleCalendar}
                disabled={loading}
              >
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="integration-benefits">
        <h2>Benefits of Connecting Integrations</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h4>🔄 Automated Sync</h4>
            <p>Keep your contacts and calendar events synchronized across platforms</p>
          </div>
          <div className="benefit-item">
            <h4>📊 Better Analytics</h4>
            <p>Get comprehensive insights from your integrated data sources</p>
          </div>
          <div className="benefit-item">
            <h4>⚡ Streamlined Workflow</h4>
            <p>Reduce manual work with automated lead management and scheduling</p>
          </div>
          <div className="benefit-item">
            <h4>🎯 Enhanced Targeting</h4>
            <p>Use CRM data to create more targeted and effective campaigns</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Integrations