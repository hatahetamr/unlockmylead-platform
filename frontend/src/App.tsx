import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ApiService from './services/api';
import './App.css';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        setUser(JSON.parse(demoUser));
      } catch (error) {
        console.error('Failed to load user profile:', error);
        localStorage.removeItem('demoUser');
      }
    }
    setLoading(false);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('demoUser');
    setUser(null);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>UnlockMyLead</h1>
            <span className="tagline">AI-Powered Sales Automation</span>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
            {user && (
              <div className="user-info">
                <span>Welcome, {user.firstName}!</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {user ? (
          <Dashboard user={user} />
        ) : (
          <SimpleAuth onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
