import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './client_dashboard.css';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Try to get data from localStorage first (saved during login)
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserData(user);
        setLoading(false);
        return;
      }

      // If not in localStorage, fetch from backend
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.clear();
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      localStorage.clear();
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitials = () => {
    return userData?.name ? userData.name.charAt(0).toUpperCase() : 'C';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px'
      }}>
        No user data found
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <div className="navbar">
        <a href="/">
          <img src="/impearl_logo.PNG" alt="Impearl Logo" style={{ height: '65px' }} />
        </a>
        <div className="navbar-links">
          <a href="/client-dashboard">Dashboard</a>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-picture-container">
            <div className="profile-picture">
              <div className="profile-initials">{getInitials()}</div>
            </div>
          </div>

          <h2 className="profile-name">{userData.name}</h2>
          <p className="profile-email">{userData.email}</p>

          <div className="profile-info">
            <div className="info-section">
              <h3>Business Information</h3>
              
              <div className="info-item">
                <span className="info-label">Business Name:</span>
                <span className="info-value">{userData.profile?.businessName || 'Not specified'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Business Type:</span>
                <span className="info-value">{userData.profile?.businessType || 'Not specified'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Company Size:</span>
                <span className="info-value">{userData.profile?.companySize || 'Not specified'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">{userData.profile?.address || 'Not specified'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {new Date(userData.createdAt || Date.now()).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bio-card">
          <h3>Welcome to Your Dashboard, {userData.name}!</h3>
          <p>You're registered as a client. Here's what you can do:</p>
          <ul style={{ marginTop: '20px', lineHeight: '2' }}>
            <li>Post new projects and jobs</li>
            <li>Browse freelancer profiles</li>
            <li>Manage your active projects</li>
            <li>Review proposals from freelancers</li>
            <li>Communicate with hired freelancers</li>
          </ul>
          <div style={{ marginTop: '30px' }}>
            <button className="btn-primary" style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Post a New Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}