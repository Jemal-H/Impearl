import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './freelancer_dashboard.css';

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

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

  const handleDownloadResume = async () => {
    try {
      const resumeUrl = userData.profile.resume;
      
      // Fetch the file
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use default
      const filename = resumeUrl.split('/').pop() || `${userData.name}_Resume.pdf`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      alert('Failed to download resume. Please try again.');
    }
  };

  const openEditModal = () => {
    setEditFormData({
      name: userData.name || '',
      email: userData.email || '',
      skills: userData.profile?.skills || '',
      experience: userData.profile?.experience || '0-1'
    });
    setProfilePicturePreview(userData.profile?.profilePicture || null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({});
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setResumeFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Append text fields
      formData.append('name', editFormData.name);
      formData.append('email', editFormData.email);
      formData.append('skills', editFormData.skills);
      formData.append('experience', editFormData.experience);

      // Append files if they exist
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state and localStorage
        setUserData(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        closeEditModal();
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          <a href="/search" className="nav-icon-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <span>Search</span>
          </a>
          <a href="/notifications" className="nav-icon-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </a>
          <a href="/favorites" className="nav-icon-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </a>
          <a href="/messages" className="nav-icon-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </a>
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

          <button 
            onClick={openEditModal}
            style={{
              margin: '20px auto',
              padding: '10px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Edit Profile
          </button>

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
                  <button
                    onClick={handleDownloadResume}
                    className="resume-link"
                    style={{
                      color: '#007bff',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      font: 'inherit'
                    }}
                  >
                    View Resume
                  </button>
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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Edit Profile</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Profile Picture
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {profilePicturePreview && (
                  <img 
                    src={profilePicturePreview} 
                    alt="Preview" 
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                  />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Name
              </label>
              <input
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Skills/Expertise
              </label>
              <textarea
                name="skills"
                value={editFormData.skills}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="e.g., React, Node.js, Python"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Experience
              </label>
              <select
                name="experience"
                value={editFormData.experience}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                <option value="0-1">Less than 1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Resume (PDF)
              </label>
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleResumeChange}
                style={{ width: '100%' }}
              />
              {resumeFile && (
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                  Selected: {resumeFile.name}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeEditModal}
                disabled={isSaving}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}