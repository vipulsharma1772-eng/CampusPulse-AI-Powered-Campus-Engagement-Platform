import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminService from '../services/adminService';
import { EVENT_IMAGE_PLACEHOLDER, CLUB_IMAGE_PLACEHOLDER } from '../utils/placeholder';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending-events');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setLoadingEvents(true);
      const events = await adminService.getPendingEvents();
      setPendingEvents(events);
    } catch (err) {
      console.error("Failed to load pending events:", err);
    } finally {
      setLoadingEvents(false);
    }

    try {
      setLoadingClubs(true);
      const clubs = await adminService.getPendingClubs();
      setPendingClubs(clubs);
    } catch (err) {
      console.error("Failed to load pending clubs:", err);
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => {
    // Only render chart if activeTab is analytics and canvas exists
    if (activeTab === 'analytics' && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Platform Engagement',
            data: [65, 59, 80, 81, 56, 85, 90],
            backgroundColor: gradient,
            borderColor: '#8B5CF6',
            borderWidth: 2,
            pointBackgroundColor: '#6C63FF',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#F8FAFC' }
            }
          },
          scales: {
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#94A3B8' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8' }
            }
          }
        }
      });

      return () => myChart.destroy();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setActionMessage({ text: message, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const handleApproveEvent = async (id, title) => {
    try {
      await adminService.approveEvent(id);
      setPendingEvents(prev => prev.filter(item => item.id !== id));
      showNotification(`"${title}" has been successfully published to campus network!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to approve event: ${err.response?.data?.message || 'Server error'}`, 'danger');
    }
  };

  const handleRejectEvent = async (id, title) => {
    try {
      await adminService.rejectEvent(id);
      setPendingEvents(prev => prev.filter(item => item.id !== id));
      showNotification(`"${title}" has been rejected.`, 'warning');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to reject event: ${err.response?.data?.message || 'Server error'}`, 'danger');
    }
  };

  const handleApproveClub = async (id, name) => {
    try {
      await adminService.approveClub(id);
      setPendingClubs(prev => prev.filter(item => item.id !== id));
      showNotification(`"${name}" club creation approved and published!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to approve club: ${err.response?.data?.message || 'Server error'}`, 'danger');
    }
  };

  const handleRejectClub = async (id, name) => {
    try {
      await adminService.rejectClub(id);
      setPendingClubs(prev => prev.filter(item => item.id !== id));
      showNotification(`"${name}" club request has been rejected.`, 'warning');
    } catch (err) {
      console.error(err);
      showNotification(`Failed to reject club: ${err.response?.data?.message || 'Server error'}`, 'danger');
    }
  };

  return (
    <div className="container py-4">
      {/* Title Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h2 className="fw-bold m-0"><span className="text-gradient">Admin</span> Control Panel</h2>
          <p className="text-muted lead m-0 small">Platform analytics, event approval workflows, and club authorization.</p>
        </div>
        <div className="d-flex glass-card p-1 rounded-pill" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>

          <button 
            onClick={() => setActiveTab('pending-events')} 
            className={`btn rounded-pill px-4 py-2 text-sm transition-all duration-300 position-relative ${activeTab === 'pending-events' ? 'neon-btn' : 'btn-link text-light text-decoration-none'}`}
          >
            <i className="bi bi-calendar-event me-2"></i>Events
            {pendingEvents.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark">
                {pendingEvents.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('pending-clubs')} 
            className={`btn rounded-pill px-4 py-2 text-sm transition-all duration-300 position-relative ${activeTab === 'pending-clubs' ? 'neon-btn' : 'btn-link text-light text-decoration-none'}`}
          >
            <i className="bi bi-shield-check me-2"></i>Clubs
            {pendingClubs.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-dark">
                {pendingClubs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Notifications */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`alert d-flex align-items-center mb-4 border-0 p-3 shadow-lg rounded-3`} 
            style={{ 
              background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 
                          actionMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: actionMessage.type === 'success' ? '#34d399' : 
                     actionMessage.type === 'warning' ? '#fbbf24' : '#f87171',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 
                                   actionMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}
          >
            <i className={`bi ${actionMessage.type === 'success' ? 'bi-check-circle-fill' : 
                               actionMessage.type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-x-circle-fill'} fs-4 me-3`}></i>
            <div className="fw-bold">{actionMessage.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Stats Cards */}
            <div className="row g-4 mb-5">
              {[
                { title: 'Total Users', value: '1,245', icon: 'bi-people', inc: '+12%' },
                { title: 'Active Events', value: '48', icon: 'bi-calendar-event', inc: '+5%' },
                { title: 'Total Registrations', value: '8,402', icon: 'bi-check2-circle', inc: '+24%' },
                { title: 'AI Accuracy', value: '94%', icon: 'bi-robot', inc: '+2%' }
              ].map((stat, idx) => (
                <div className="col-md-6 col-lg-3" key={idx}>
                  <motion.div whileHover={{ y: -5 }} className="glass-card p-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="m-0 text-muted">{stat.title}</h6>
                      <div className="p-2 rounded" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                        <i className={`bi ${stat.icon} text-gradient`}></i>
                      </div>
                    </div>
                    <div className="d-flex align-items-end justify-content-between">
                      <h3 className="fw-bold m-0">{stat.value}</h3>
                      <span className="text-success small fw-bold">{stat.inc} <i className="bi bi-arrow-up"></i></span>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Charts & Engagements */}
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="glass-card p-4 h-100">
                  <h5 className="fw-bold mb-4">Engagement Trends</h5>
                  <div style={{ height: '300px' }}>
                    <canvas ref={chartRef}></canvas>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="glass-card p-4 h-100">
                  <h5 className="fw-bold mb-4">Recent Registrations</h5>
                  <div className="d-flex flex-column gap-3">
                    {[
                      { name: 'Alice Chen', event: 'Web3 Summit', time: '2 mins ago' },
                      { name: 'Mark Davis', event: 'AI Ethics', time: '15 mins ago' },
                      { name: 'Sarah Wilson', event: 'Design Sprint', time: '1 hour ago' },
                      { name: 'James Lee', event: 'Web3 Summit', time: '2 hours ago' },
                    ].map((activity, idx) => (
                      <div key={idx} className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                        <div className="rounded-circle bg-gradient me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="fw-bold text-white">{activity.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h6 className="m-0 fw-bold fs-6">{activity.name}</h6>
                          <small className="text-muted">{activity.event} • {activity.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'pending-events' && (
          <motion.div 
            key="pending-events"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="fw-bold mb-4">Pending Event Creations</h4>
            {loadingEvents ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3">Loading pending events...</p>
              </div>
            ) : pendingEvents.length === 0 ? (
              <div className="glass-card text-center p-5 text-muted">
                <i className="bi bi-calendar2-check display-3 text-gradient d-block mb-3"></i>
                <h5 className="fw-bold text-light">All caught up!</h5>
                <p className="mb-0">There are no pending event approvals currently.</p>
              </div>
            ) : (
              <div className="row g-4">
                <AnimatePresence>
                  {pendingEvents.map(event => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
                      className="col-12 col-md-6 col-lg-4"
                    >
                      <div className="glass-card h-100 overflow-hidden d-flex flex-column" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src={event.imageUrl || EVENT_IMAGE_PLACEHOLDER} 
                            alt={event.title} 
                            className="w-100 h-100 object-fit-cover" 
                          />
                          <span 
                            className="position-absolute top-3 end-3 badge text-uppercase rounded-pill"
                            style={{ background: 'rgba(139, 92, 246, 0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.5)', color: 'white' }}
                          >
                            {event.category || 'Technology'}
                          </span>
                        </div>
                        
                        <div className="p-4 d-flex flex-column flex-grow-1">
                          <h5 className="fw-bold mb-2 text-light">{event.title}</h5>
                          <p className="text-muted small mb-3 text-truncate-2" style={{ flexGrow: 1 }}>{event.description || 'No description provided.'}</p>
                          
                          <div className="d-flex flex-column gap-2 mb-4 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-person me-2"></i>Organizer:</span>
                              <span className="text-light fw-bold">{event.organizerName || 'Anonymous Student'}</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-geo-alt me-2"></i>Venue:</span>
                              <span className="text-light">{event.venue || 'TBA'}</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-calendar me-2"></i>Date:</span>
                              <span className="text-light">{event.date ? new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}</span>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button 
                              onClick={() => handleApproveEvent(event.id, event.title)}
                              className="neon-btn flex-grow-1 py-2"
                              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}
                            >
                              <i className="bi bi-check-lg me-1"></i>Publish
                            </button>
                            <button 
                              onClick={() => handleRejectEvent(event.id, event.title)}
                              className="btn btn-outline-danger rounded-pill px-3"
                              style={{ borderColor: 'rgba(220, 53, 69, 0.5)', background: 'transparent' }}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'pending-clubs' && (
          <motion.div 
            key="pending-clubs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <h4 className="fw-bold mb-4">Pending Club Registrations</h4>
            {loadingClubs ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-3">Loading pending clubs...</p>
              </div>
            ) : pendingClubs.length === 0 ? (
              <div className="glass-card text-center p-5 text-muted">
                <i className="bi bi-shield-check display-3 text-gradient d-block mb-3"></i>
                <h5 className="fw-bold text-light">All caught up!</h5>
                <p className="mb-0">There are no pending club registrations currently.</p>
              </div>
            ) : (
              <div className="row g-4">
                <AnimatePresence>
                  {pendingClubs.map(club => (
                    <motion.div 
                      key={club.id}
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
                      className="col-12 col-md-6 col-lg-4"
                    >
                      <div className="glass-card h-100 overflow-hidden d-flex flex-column" style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src={club.imageUrl || CLUB_IMAGE_PLACEHOLDER} 
                            alt={club.name} 
                            className="w-100 h-100 object-fit-cover" 
                          />
                          <span 
                            className="position-absolute top-3 end-3 badge text-uppercase rounded-pill"
                            style={{ background: 'rgba(139, 92, 246, 0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(139, 92, 246, 0.5)', color: 'white' }}
                          >
                            {club.category || 'Social'}
                          </span>
                        </div>
                        
                        <div className="p-4 d-flex flex-column flex-grow-1">
                          <h5 className="fw-bold mb-2 text-light">{club.name}</h5>
                          <p className="text-muted small mb-3 text-truncate-2" style={{ flexGrow: 1 }}>{club.description || 'No description provided.'}</p>
                          
                          <div className="d-flex flex-column gap-2 mb-4 p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-person-badge me-2"></i>Club Head:</span>
                              <span className="text-light fw-bold">{club.clubHeadName || 'Anonymous Student'}</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-envelope me-2"></i>Contact:</span>
                              <span className="text-light text-truncate-1">{club.contactEmail || 'N/A'}</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted"><i className="bi bi-people me-2"></i>Max Capacity:</span>
                              <span className="text-light">{club.maxMembers ? `${club.maxMembers} Members` : 'Unlimited'}</span>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button 
                              onClick={() => handleApproveClub(club.id, club.name)}
                              className="neon-btn flex-grow-1 py-2"
                              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}
                            >
                              <i className="bi bi-check-lg me-1"></i>Publish
                            </button>
                            <button 
                              onClick={() => handleRejectClub(club.id, club.name)}
                              className="btn btn-outline-danger rounded-pill px-3"
                              style={{ borderColor: 'rgba(220, 53, 69, 0.5)', background: 'transparent' }}
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
