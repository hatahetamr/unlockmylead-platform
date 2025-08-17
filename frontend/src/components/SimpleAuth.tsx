import React, { useState } from 'react';
import './SimpleAuth.css';

interface SimpleAuthProps {
  onLogin: (user: any) => void;
}

const SimpleAuth: React.FC<SimpleAuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isLogin) {
        // Simulate login
        if (formData.email && formData.password) {
          const user = {
            email: formData.email,
            firstName: formData.firstName || 'Demo',
            lastName: formData.lastName || 'User',
            company: formData.company || 'Demo Company'
          };
          localStorage.setItem('demoUser', JSON.stringify(user));
          onLogin(user);
          setSuccess('Login successful!');
        } else {
          setError('Please enter email and password');
        }
      } else {
        // Simulate signup
        if (formData.email && formData.password && formData.firstName && formData.lastName) {
          const user = {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: formData.company || 'Demo Company'
          };
          localStorage.setItem('demoUser', JSON.stringify(user));
          onLogin(user);
          setSuccess('Account created successfully!');
        } else {
          setError('Please fill in all required fields');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="simple-auth">
      <div className="auth-container">
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to your account' : 'Get started with UnlockMyLead'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </div>
              <input
                type="text"
                name="company"
                placeholder="Company (Optional)"
                value={formData.company}
                onChange={handleInputChange}
              />
            </>
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="switch-button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="demo-info">
          <p><strong>Demo Mode:</strong> Use any email and password to test the platform</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleAuth;
