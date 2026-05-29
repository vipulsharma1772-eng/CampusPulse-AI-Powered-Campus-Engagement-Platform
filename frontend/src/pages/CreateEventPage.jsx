import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technology',
    venue: '',
    date: '',
    registrationDeadline: '',
    maxParticipants: 100,
    imageUrl: '',
    tags: '',
    organizerName: '',
    organizerEmail: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('type', 'events');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/image?type=events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });
      
      const result = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, imageUrl: result.url }));
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
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

  const detectCategory = (title, defaultCategory) => {
    if (!title) return defaultCategory || 'Technology';
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('social') || lowerTitle.includes('media') || lowerTitle.includes('instagram') || lowerTitle.includes('community') || lowerTitle.includes('socail') || lowerTitle.includes('sociam')) {
      return 'Social';
    }
    if (lowerTitle.includes('business') || lowerTitle.includes('startup') || lowerTitle.includes('marketing') || lowerTitle.includes('finance')) {
      return 'Business';
    }
    if (lowerTitle.includes('tech') || lowerTitle.includes('ai') || lowerTitle.includes('coding') || lowerTitle.includes('software') || lowerTitle.includes('web')) {
      return 'Technology';
    }
    if (lowerTitle.includes('design') || lowerTitle.includes('ui') || lowerTitle.includes('ux') || lowerTitle.includes('graphics')) {
      return 'Design';
    }
    if (lowerTitle.includes('sports') || lowerTitle.includes('cricket') || lowerTitle.includes('football') || lowerTitle.includes('tournament') || lowerTitle.includes('fitness') || lowerTitle.includes('game') || lowerTitle.includes('athletics') || lowerTitle.includes('match')) {
      return 'Sports';
    }
    return defaultCategory || 'Technology';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validations
    if (!formData.title.trim()) return alert("Event title is required");
    if (!formData.organizerName.trim()) return alert("Organizer name is required");
    if (!formData.organizerEmail.trim() || !formData.organizerEmail.includes('@')) {
      return alert("Enter a valid organizer email address");
    }
    if (!formData.date) return alert("Event date and time are required");
    if (!formData.registrationDeadline) return alert("Registration deadline is required");
    if (!formData.venue.trim()) return alert("Venue location is required");
    if (formData.maxParticipants < 1) return alert("Seats limit must be at least 1");

    setLoading(true);
    try {
      const detectedCat = detectCategory(formData.title, formData.category);
      const payload = {
        ...formData,
        category: detectedCat,
        date: formData.date || null,
        registrationDeadline: formData.registrationDeadline || null,
      };
      await eventService.createEvent(payload);
      alert('Event created successfully!');
      navigate('/events');
    } catch (err) {
      console.error(err);
      alert('Failed to create event. ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h2 className="fw-bold mb-4"><i className="bi bi-calendar-plus text-gradient me-2"></i>Create New Event</h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 p-md-5"
          >
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase fw-bold">Event Title</label>
                <input type="text" className="form-control glow-input bg-transparent text-light" name="title" value={formData.title} onChange={handleChange} required />
              </div>

              {/* Banner Upload */}
              <div className="mb-4">
                <label className="form-label text-muted small text-uppercase fw-bold">Event Banner</label>
                <div 
                  className="border border-secondary border-dashed rounded p-4 text-center position-relative"
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="d-none" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleImageUpload(e.target.files[0])} />
                  
                  {uploading ? (
                    <div className="spinner-border text-primary my-4"></div>
                  ) : formData.imageUrl ? (
                    <div>
                      <img src={formData.imageUrl} alt="Banner Preview" className="img-fluid rounded mb-2" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                      <p className="text-muted small m-0">Click or drag a new image to replace</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <i className="bi bi-cloud-arrow-up display-4 text-muted mb-3 d-block"></i>
                      <p className="m-0 text-muted">Drag & drop your event poster here or click to browse</p>
                      <small className="text-muted">JPG, PNG, WEBP (Max 5MB)</small>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Row 1: Category & Organizer Name */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Category</label>
                  <select className="form-select glow-input bg-dark text-light" name="category" value={formData.category} onChange={handleChange}>
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
                    name="organizerName" 
                    value={formData.organizerName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter organizer or club head name" 
                  />
                </div>
              </div>

              {/* Row 2: Event Date/Time & Organizer Email */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Event Date & Time</label>
                  <input type="datetime-local" className="form-control glow-input bg-transparent text-light" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Organizer Email</label>
                  <input 
                    type="email" 
                    className="form-control glow-input bg-transparent text-light" 
                    name="organizerEmail" 
                    value={formData.organizerEmail} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter organizer email" 
                  />
                </div>
              </div>

              {/* Row 3: Venue & Registration Deadline */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Venue</label>
                  <input type="text" className="form-control glow-input bg-transparent text-light" name="venue" value={formData.venue} onChange={handleChange} required placeholder="e.g. Auditorium, Block A" />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Registration Deadline</label>
                  <input type="datetime-local" className="form-control glow-input bg-transparent text-light" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} required />
                </div>
              </div>

              {/* Row 4: Max Participants (Seats) & Tags */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Max Participants (Seats)</label>
                  <input type="number" className="form-control glow-input bg-transparent text-light" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} min="1" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small text-uppercase fw-bold">Tags (Comma Separated)</label>
                  <input type="text" className="form-control glow-input bg-transparent text-light" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. AI, Workshop, Career" />
                </div>
              </div>

              {/* Row 5: Description */}
              <div className="mb-5">
                <label className="form-label text-muted small text-uppercase fw-bold">Description</label>
                <textarea className="form-control glow-input bg-transparent text-light" name="description" rows="5" value={formData.description} onChange={handleChange} required placeholder="Detailed information about your event..."></textarea>
              </div>

              <div className="d-flex justify-content-end gap-3">
                <button type="button" className="btn btn-outline-light px-4 rounded-pill" onClick={() => navigate('/events')}>Cancel</button>
                <button type="submit" className="neon-btn px-5" disabled={loading || uploading}>
                  {loading ? <div className="spinner-border spinner-border-sm"></div> : 'Publish Event'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
