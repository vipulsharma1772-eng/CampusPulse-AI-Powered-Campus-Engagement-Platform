import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import userService from '../services/userService';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    eventReminders: true,
    clubUpdates: false
  });

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await userService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container mt-4 mb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        <div className="d-flex align-items-center mb-4">
          <i className="bi bi-gear-fill fs-2 text-gradient me-3"></i>
          <h2 className="fw-bold mb-0">Settings</h2>
        </div>

        <div className="row g-4">
          {/* Settings Sidebar */}
          <div className="col-lg-3">
            <div className="glass-card p-3">
              <div className="nav flex-column nav-pills" role="tablist" aria-orientation="vertical">
                <button className={`nav-link text-start py-3 mb-2 ${activeTab === 'account' ? 'active neon-btn-outline border-0 bg-primary text-white' : 'text-light'}`} onClick={() => setActiveTab('account')}>
                  <i className="bi bi-shield-lock me-2"></i> Security & Account
                </button>
                <Link to="/profile" className="nav-link text-start py-3 mb-2 text-light text-decoration-none">
                  <i className="bi bi-person me-2"></i> Edit Profile Info
                </Link>
                <button className={`nav-link text-start py-3 mb-2 ${activeTab === 'notifications' ? 'active neon-btn-outline border-0 bg-primary text-white' : 'text-light'}`} onClick={() => setActiveTab('notifications')}>
                  <i className="bi bi-bell me-2"></i> Notifications
                </button>
                <button className={`nav-link text-start py-3 mb-2 ${activeTab === 'theme' ? 'active neon-btn-outline border-0 bg-primary text-white' : 'text-light'}`} onClick={() => setActiveTab('theme')}>
                  <i className="bi bi-palette me-2"></i> Appearance
                </button>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="col-lg-9">
            <div className="glass-card p-4 p-md-5 h-100">
              
              {activeTab === 'account' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4 className="fw-bold mb-4 border-bottom border-secondary pb-3">Change Password</h4>
                  
                  {error && <div className="alert alert-danger">{error}</div>}
                  {success && <div className="alert alert-success d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 fs-5"></i>{success}</div>}

                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-4">
                      <label className="form-label text-muted">Current Password</label>
                      <input 
                        type="password" 
                        name="currentPassword"
                        className="form-control glow-input" 
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required 
                      />
                    </div>
                    
                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <label className="form-label text-muted">New Password</label>
                        <input 
                          type="password" 
                          name="newPassword"
                          className="form-control glow-input" 
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-muted">Confirm New Password</label>
                        <input 
                          type="password" 
                          name="confirmPassword"
                          className="form-control glow-input" 
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required 
                        />
                      </div>
                    </div>
                    
                    <button type="submit" className="neon-btn" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-key me-2"></i>}
                      Update Password
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4 className="fw-bold mb-4 border-bottom border-secondary pb-3">Notification Preferences</h4>
                  
                  <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <h6 className="mb-1 fw-bold">Email Alerts</h6>
                      <small className="text-muted">Receive summary emails about your account activity.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input className="form-check-input" type="checkbox" role="switch" checked={notifications.emailAlerts} onChange={() => toggleNotification('emailAlerts')} />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <h6 className="mb-1 fw-bold">Event Reminders</h6>
                      <small className="text-muted">Get notified 24 hours before your registered events begin.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input className="form-check-input" type="checkbox" role="switch" checked={notifications.eventReminders} onChange={() => toggleNotification('eventReminders')} />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <h6 className="mb-1 fw-bold">Club Updates</h6>
                      <small className="text-muted">Get notified when clubs you join post new announcements.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input className="form-check-input" type="checkbox" role="switch" checked={notifications.clubUpdates} onChange={() => toggleNotification('clubUpdates')} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'theme' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h4 className="fw-bold mb-4 border-bottom border-secondary pb-3">Appearance</h4>
                  
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="p-4 rounded border text-center cursor-pointer" style={{ borderColor: 'var(--primary-neon)', background: 'rgba(139, 92, 246, 0.1)' }}>
                        <i className="bi bi-moon-stars fs-1 text-gradient mb-2 d-block"></i>
                        <h6 className="fw-bold">Dark Mode (Default)</h6>
                        <small className="text-muted">The futuristic dark theme.</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-4 rounded border text-center opacity-50">
                        <i className="bi bi-sun fs-1 text-light mb-2 d-block"></i>
                        <h6 className="fw-bold">Light Mode</h6>
                        <small className="text-muted">Coming soon in v2.0</small>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default SettingsPage;
