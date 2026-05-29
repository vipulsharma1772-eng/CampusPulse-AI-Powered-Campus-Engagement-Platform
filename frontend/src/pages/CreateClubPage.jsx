import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import clubService from '../services/clubService';

const CreateClubPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technology',
    venue: '',
    startDate: '',
    timing: '',
    tags: '',
    maxMembers: 100,
    contactEmail: '',
    clubHeadName: '',
    imageUrl: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await clubService.uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: result.url }));
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.name.trim()) return alert("Club name is required");
    if (!formData.clubHeadName.trim()) return alert("Organizer name is required");
    if (!formData.startDate) return alert("Club start date is required");
    
    // Future date validation
    const selectedDate = new Date(formData.startDate);
    const now = new Date();
    if (selectedDate < now) {
      return alert("Club start date must be in the future");
    }

    if (!formData.timing.trim()) return alert("Meeting timings/frequency are required");
    if (!formData.venue.trim()) return alert("Venue location is required");
    if (formData.maxMembers < 1) return alert("Members limit must be at least 1");
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) return alert("Enter a valid email address");

    setLoading(true);
    try {
      await clubService.createClub(formData);
      alert('Club launched successfully!');
      navigate('/clubs');
    } catch (err) {
      console.error(err);
      alert('Failed to launch club. ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="fw-bold mb-4">
            <i className="bi bi-diagram-3-fill text-gradient me-2"></i>Create New Club
          </h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 p-md-5"
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase fw-bold">Club Name</label>
                <input 
                  type="text" 
                  className="form-control glow-input bg-transparent text-light" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              {/* Banner Upload */}
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase fw-bold">Club Logo / Banner</label>
                <div 
                  className="border border-secondary border-dashed rounded p-4 text-center position-relative"
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="d-none" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={(e) => handleImageUpload(e.target.files[0])} 
                  />
                  
                  {uploading ? (
                    <div className="spinner-border text-primary my-4"></div>
                  ) : formData.imageUrl ? (
                    <div>
                      <img 
                        src={formData.imageUrl} 
                        alt="Banner Preview" 
                        className="img-fluid rounded mb-2" 
                        style={{ maxHeight: '200px', objectFit: 'cover' }} 
                      />
                      <p className="text-muted small m-0">Click or drag a new image to replace</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <i className="bi bi-cloud-arrow-up display-4 text-muted mb-3 d-block"></i>
                      <p className="m-0 text-muted">Drag & drop your club banner/image here or click to browse</p>
                      <small className="text-muted">JPG, PNG, WEBP (Max 5MB)</small>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Category</label>
                  <select 
                    className="form-select glow-input bg-dark text-light" 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Organizer / Club Head Name</label>
                  <input 
                    type="text" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="clubHeadName" 
                    value={formData.clubHeadName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Club Start Date</label>
                  <input 
                    type="datetime-local" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Meeting Timings / Frequency</label>
                  <input 
                    type="text" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="timing" 
                    value={formData.timing} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Every Friday at 4:00 PM" 
                  />
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Venue / Meeting Location</label>
                  <input 
                    type="text" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="venue" 
                    value={formData.venue} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Room 204, Block C" 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Max Members Limit</label>
                  <input 
                    type="number" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="maxMembers" 
                    value={formData.maxMembers} 
                    onChange={handleChange} 
                    min="1" 
                    required 
                  />
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Contact Email</label>
                  <input 
                    type="email" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="contactEmail" 
                    value={formData.contactEmail} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Tags (Comma Separated)</label>
                  <input 
                    type="text" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleChange} 
                    placeholder="e.g. AI, Coding, Robotics" 
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="form-label text-muted small text-uppercase fw-bold">Description</label>
                <textarea 
                  className="form-control glow-input bg-transparent text-light" 
                  name="description" 
                  rows="5" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  placeholder="Detailed information about your club..."
                ></textarea>
              </div>

              <div className="d-flex justify-content-end gap-3">
                <button type="button" className="btn btn-outline-light px-4 rounded-pill" onClick={() => navigate('/clubs')}>Cancel</button>
                <button type="submit" className="neon-btn px-5" disabled={loading || uploading}>
                  {loading ? <div className="spinner-border spinner-border-sm"></div> : 'Launch Club'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateClubPage;
