import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    interests: '',
    bio: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileData, statsData] = await Promise.all([
        userService.getUserProfile(),
        userService.getDashboardStats()
      ]);
      setProfile(profileData);
      setStats(statsData);
      setFormData({
        name: profileData.name || '',
        branch: profileData.branch || '',
        interests: profileData.interests || '',
        bio: profileData.bio || ''
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedUser = await userService.updateProfile(formData);
      setProfile(updatedUser);
      // Update local storage user context with new name
      login({ ...user, name: updatedUser.name }, localStorage.getItem('token'));
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      const uploadRes = await userService.uploadProfileImage(file);
      const updatedUser = await userService.updateProfile({ profileImage: uploadRes.url });
      setProfile(updatedUser);
      login({ ...user, profileImage: updatedUser.profileImage }, localStorage.getItem('token'));
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success d-flex align-items-center"><i className="bi bi-check-circle-fill me-2 fs-5"></i>{success}</div>}

        <div className="row g-4">
          {/* Left Column: Avatar & Basic Info */}
          <div className="col-lg-4">
            <div className="glass-card p-4 text-center h-100 position-relative">
              <div className="position-relative d-inline-block mb-3">
                <img 
                  src={profile?.profileImage || `https://ui-avatars.com/api/?name=${profile?.name}&background=6C63FF&color=fff&size=150`} 
                  alt="Profile Avatar" 
                  className="rounded-circle shadow"
                  style={{ width: '150px', height: '150px', objectFit: 'cover', border: '4px solid var(--primary-neon)' }}
                />
                
                {/* Image Upload Overlay */}
                <label className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2 cursor-pointer shadow" style={{ cursor: 'pointer', transform: 'translate(10%, 10%)' }}>
                  <i className="bi bi-camera-fill text-white fs-5"></i>
                  <input type="file" className="d-none" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
                {uploadingImage && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border text-light"></div></div>}
              </div>

              <h3 className="fw-bold mb-1">{profile?.name}</h3>
              <p className="text-muted mb-2">{profile?.email}</p>
              <span className="badge bg-primary px-3 py-2 rounded-pill fs-6 mb-3">{profile?.role}</span>
              
              <hr className="bg-secondary opacity-25 my-4" />
              
              <div className="d-flex justify-content-between text-center px-2">
                <div>
                  <h4 className="fw-bold text-gradient mb-0">{stats?.clubsJoined || 0}</h4>
                  <small className="text-muted">Clubs</small>
                </div>
                <div>
                  <h4 className="fw-bold text-gradient mb-0">{stats?.eventsAttended || 0}</h4>
                  <small className="text-muted">Events</small>
                </div>
                <div>
                  <h4 className="fw-bold text-gradient mb-0">{stats?.engagementScore || 0}</h4>
                  <small className="text-muted">Score</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Edit Form */}
          <div className="col-lg-8">
            <div className="glass-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">Profile Details</h3>
                <button 
                  className={`btn ${isEditing ? 'btn-secondary' : 'neon-btn-outline'} btn-sm`}
                  onClick={() => {
                    setIsEditing(!isEditing);
                    // Reset form on cancel
                    if (isEditing) {
                      setFormData({
                        name: profile?.name || '',
                        branch: profile?.branch || '',
                        interests: profile?.interests || '',
                        bio: profile?.bio || ''
                      });
                    }
                  }}
                >
                  <i className={`bi ${isEditing ? 'bi-x-lg' : 'bi-pencil'} me-2`}></i>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {!isEditing ? (
                <div className="profile-view-mode">
                  <div className="mb-4">
                    <h6 className="text-muted text-uppercase small fw-bold">About Me</h6>
                    <p className="fs-5">{profile?.bio || 'No bio added yet.'}</p>
                  </div>
                  
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="text-muted text-uppercase small fw-bold">Branch/Department</h6>
                      <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <i className="bi bi-building me-3 fs-4 text-gradient"></i>
                        <span className="fs-5">{profile?.branch || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted text-uppercase small fw-bold">Interests</h6>
                      <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <i className="bi bi-lightbulb me-3 fs-4 text-gradient"></i>
                        <span className="fs-5">{profile?.interests || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-muted text-uppercase small fw-bold">Member Since</h6>
                      <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <i className="bi bi-calendar-event me-3 fs-4 text-gradient"></i>
                        <span className="fs-5">{new Date(profile?.createdAt).toLocaleDateString() || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="profile-edit-mode">
                  <div className="mb-3">
                    <label className="form-label text-muted">Full Name</label>
                    <input type="text" name="name" className="form-control glow-input" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label text-muted">Bio / About Me</label>
                    <textarea name="bio" className="form-control glow-input" rows="4" value={formData.bio} onChange={handleInputChange} placeholder="Tell us about yourself..."></textarea>
                  </div>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label text-muted">Branch / Department</label>
                      <input type="text" name="branch" className="form-control glow-input" value={formData.branch} onChange={handleInputChange} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted">Skills / Interests (comma separated)</label>
                      <input type="text" name="interests" className="form-control glow-input" value={formData.interests} onChange={handleInputChange} placeholder="AI, Web Dev, Design" />
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end">
                    <button type="submit" className="neon-btn px-5" disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
