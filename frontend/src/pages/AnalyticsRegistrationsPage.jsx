import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

const AnalyticsRegistrationsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState('All');

  useEffect(() => {
    analyticsService.getRegistrationsDetails()
      .then(data => {
        setRegistrations(data || []);
      })
      .catch(err => console.error("Error fetching registrations details:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // Calculate stats based on loaded registrations list
  const totalRegistrations = registrations.length;
  
  // Most Popular Category
  const categoryCounts = {};
  registrations.forEach(r => {
    if (r.eventCategory) {
      categoryCounts[r.eventCategory] = (categoryCounts[r.eventCategory] || 0) + 1;
    }
  });
  let mostPopularCategory = 'N/A';
  let maxCatCount = 0;
  Object.keys(categoryCounts).forEach(cat => {
    if (categoryCounts[cat] > maxCatCount) {
      maxCatCount = categoryCounts[cat];
      mostPopularCategory = cat;
    }
  });

  // Most Joined Event
  const eventCounts = {};
  registrations.forEach(r => {
    if (r.eventName) {
      eventCounts[r.eventName] = (eventCounts[r.eventName] || 0) + 1;
    }
  });
  let mostJoinedEvent = 'N/A';
  let maxEventCount = 0;
  Object.keys(eventCounts).forEach(evt => {
    if (eventCounts[evt] > maxEventCount) {
      maxEventCount = eventCounts[evt];
      mostJoinedEvent = evt;
    }
  });

  // Total Active Students (Unique)
  const uniqueStudents = new Set(registrations.map(r => r.studentEmail));
  const totalActiveStudents = uniqueStudents.size;

  // Filter dynamic lists
  const uniqueEventsList = ['All', ...new Set(registrations.map(r => r.eventName))];

  // Apply filters
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || r.eventCategory === selectedCategory;
    const matchesEvent = selectedEvent === 'All' || r.eventName === selectedEvent;
    return matchesSearch && matchesCategory && matchesEvent;
  });

  // Helper for Category Badge Styling
  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Design':
        return 'badge bg-pink text-pink-light';
      case 'Social':
        return 'badge bg-purple text-purple-light';
      case 'Business':
        return 'badge bg-cyan text-cyan-light';
      case 'Sports':
        return 'badge bg-warning text-warning-light';
      case 'Technology':
      default:
        return 'badge bg-neon text-neon-light';
    }
  };

  // Helper for Attendance Badges
  const getAttendanceBadgeClass = (status) => {
    switch (status) {
      case 'ATTENDED':
        return 'badge bg-success bg-opacity-20 text-success border border-success border-opacity-30';
      case 'MISSED':
        return 'badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-30';
      case 'PENDING':
      default:
        return 'badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30';
    }
  };

  return (
    <div className="container py-5">
      {/* Navigation & Header */}
      <div className="d-flex align-items-center mb-4">
        <button onClick={() => navigate('/analytics')} className="btn btn-outline-light rounded-pill px-4 me-3">
          <i className="bi bi-arrow-left me-2"></i>Back to Analytics
        </button>
        <h2 className="fw-bold m-0 text-light"><i className="bi bi-people-fill text-gradient me-2"></i>Registration Directory</h2>
      </div>
      <p className="text-muted mb-5">Browse, search, and filter student registrations across event categories.</p>

      {/* STATS SUMMARY SECTION */}
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <motion.div whileHover={{ y: -5 }} className="glass-card p-4 text-center h-100">
            <i className="bi bi-card-checklist fs-2 text-gradient mb-2 d-block"></i>
            <h3 className="fw-bold text-gradient m-0 display-6">{totalRegistrations}</h3>
            <p className="text-muted small m-0 mt-1">Total Registrations</p>
          </motion.div>
        </div>
        <div className="col-md-3">
          <motion.div whileHover={{ y: -5 }} className="glass-card p-4 text-center h-100">
            <i className="bi bi-star-fill fs-2 text-gradient mb-2 d-block"></i>
            <h4 className="fw-bold text-gradient m-0 text-truncate" style={{ fontSize: '1.2rem', padding: '5px 0' }}>{mostPopularCategory}</h4>
            <p className="text-muted small m-0 mt-1">Most Popular Category</p>
          </motion.div>
        </div>
        <div className="col-md-3">
          <motion.div whileHover={{ y: -5 }} className="glass-card p-4 text-center h-100">
            <i className="bi bi-fire fs-2 text-gradient mb-2 d-block"></i>
            <h4 className="fw-bold text-gradient m-0 text-truncate" style={{ fontSize: '1.2rem', padding: '5px 0' }}>{mostJoinedEvent}</h4>
            <p className="text-muted small m-0 mt-1">Most Joined Event</p>
          </motion.div>
        </div>
        <div className="col-md-3">
          <motion.div whileHover={{ y: -5 }} className="glass-card p-4 text-center h-100">
            <i className="bi bi-person-check-fill fs-2 text-gradient mb-2 d-block"></i>
            <h3 className="fw-bold text-gradient m-0 display-6">{totalActiveStudents}</h3>
            <p className="text-muted small m-0 mt-1">Total Active Students</p>
          </motion.div>
        </div>
      </div>

      {/* SEARCH AND FILTER TOOLS */}
      <div className="glass-card p-4 mb-4">
        <div className="row g-3">
          {/* Search Input */}
          <div className="col-lg-4">
            <label className="form-label text-muted small text-uppercase fw-bold">Search Student</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent text-muted border-secondary"><i className="bi bi-search"></i></span>
              <input 
                type="text" 
                className="form-control glow-input bg-transparent text-light border-secondary border-start-0" 
                placeholder="Type name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="col-md-6 col-lg-4">
            <label className="form-label text-muted small text-uppercase fw-bold">Filter By Category</label>
            <select 
              className="form-select glow-input bg-dark text-light border-secondary"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Sports">Sports</option>
              <option value="Social">Social</option>
            </select>
          </div>

          {/* Event Filter */}
          <div className="col-md-6 col-lg-4">
            <label className="form-label text-muted small text-uppercase fw-bold">Filter By Event</label>
            <select 
              className="form-select glow-input bg-dark text-light border-secondary"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              {uniqueEventsList.map((evt, idx) => (
                <option key={idx} value={evt}>{evt === 'All' ? 'All Events' : evt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DETAILS TABLE */}
      <div className="glass-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle m-0 border-0">
            <thead className="bg-transparent border-bottom border-secondary border-opacity-30">
              <tr>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Student</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Joined Event</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Category Mapping</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Registration Date</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted border-0">
                    <i className="bi bi-inbox fs-2 mb-2 d-block"></i>
                    No registrations match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="border-bottom border-secondary border-opacity-10">
                    {/* Student Name */}
                    <td className="py-3 px-4 border-0">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-gradient me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(108, 99, 255, 0.1)', border: '1px solid rgba(108, 99, 255, 0.2)' }}>
                          <span className="fw-bold text-gradient">{reg.studentName?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h6 className="m-0 fw-bold text-light">{reg.studentName}</h6>
                          <small className="text-muted">{reg.studentEmail}</small>
                        </div>
                      </div>
                    </td>

                    {/* Event Joined */}
                    <td className="py-3 px-4 border-0">
                      <div className="fw-semibold text-light">{reg.eventName}</div>
                    </td>

                    {/* Event Category (Grouping display) */}
                    <td className="py-3 px-4 border-0">
                      <span className={getCategoryBadgeClass(reg.eventCategory)}>
                        {reg.eventCategory}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 border-0">
                      <span className="text-muted small">
                        {reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA'}
                      </span>
                    </td>

                    {/* Attendance Status */}
                    <td className="py-3 px-4 border-0">
                      <span className={getAttendanceBadgeClass(reg.attendanceStatus)}>
                        {reg.attendanceStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsRegistrationsPage;
