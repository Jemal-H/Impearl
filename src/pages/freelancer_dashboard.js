import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './freelancer_dashboard.css';

export default function FreelancerDashboard() {
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
    return userData?.name ? userData.name.charAt(0).toUpperCase() : 'F';
  };

  const getExperienceText = (exp) => {
    const expMap = {
      '0-1': 'Less than 1 year',
      '1-3': '1-3 years',
      '3-5': '3-5 years',
      '5-10': '5-10 years',
      '10+': '10+ years'
    };
    return expMap[exp] || exp;
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
      <div className="navbar">
        <a href="/">
          <img src="/impearl_logo.PNG" alt="Impearl Logo" style={{ height: '65px' }} />
        </a>
        <div className="navbar-links">
          <a href="/freelancer-dashboard">Dashboard</a>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="profile-card">
          <div className="profile-picture-container">
            <div className="profile-picture">
              {userData.profile?.profilePicture ? (
                <img 
                  src={userData.profile.profilePicture} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <div className="profile-initials">{getInitials()}</div>
              )}
            </div>
          </div>

          <h2 className="profile-name">{userData.name}</h2>
          <p className="profile-email">{userData.email}</p>

          <div className="profile-info">
            <div className="info-section">
              <h3>Professional Information</h3>
              
              <div className="info-item">
                <span className="info-label">Skills/Expertise:</span>
                <span className="info-value">{userData.profile?.skills || 'Not specified'}</span>
              </div>

              <div className="info-item">
                <span className="info-label">Experience:</span>
                <span className="info-value">
                  {getExperienceText(userData.profile?.experience) || 'Not specified'}
                </span>
              </div>

              <div className="info-item">
                <span className="info-label">Rating:</span>
                <span className="info-value">
                  {userData.profile?.rating ? `${userData.profile.rating}/5` : 'No ratings yet'}
                </span>
              </div>

              {userData.profile?.resume && (
                <div className="info-item">
                  <span className="info-label">Resume:</span>
                  <a 
                    href={userData.profile.resume} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="resume-link"
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    View Resume
                  </a>
                </div>
              )}

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

        <div className="bio-card">
          <h3>Welcome to Your Dashboard, {userData.name}!</h3>
          <p>You're registered as a freelancer. Here's what you can do:</p>
          <ul style={{ marginTop: '20px', lineHeight: '2' }}>
            <li>Browse available projects</li>
            <li>Submit proposals to clients</li>
            <li>Manage your active contracts</li>
            <li>Build your portfolio</li>
            <li>Communicate with clients</li>
            <li>Track your earnings</li>
          </ul>
          <div style={{ marginTop: '30px' }}>
            <button className="btn-primary" style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Browse Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}