import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import eventService from '../services/eventService';
import clubService from '../services/clubService';
import { useNavigate } from 'react-router-dom';
import { EVENT_IMAGE_PLACEHOLDER } from '../utils/placeholder';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    eventsJoined: 0, 
    clubsJoined: 0, 
    eventsAttended: 0, 
    attendancePercentage: 0, 
    activityStatus: 'New Participant', 
    participationScore: 0 
  });
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const dashboardStats = await userService.getDashboardStats();
      setStats(dashboardStats);

      // Fetch AI recommendations from backend
      const combinedRecs = await userService.getCombinedRecommendations();
      
      const topEvents = combinedRecs
        .filter(r => r.type === 'event')
        .sort((a, b) => {
          if (b.popularity !== a.popularity) return b.popularity - a.popularity;
          return b.item.id - a.item.id;
        })
        .slice(0, 2);
        
      const topClubs = combinedRecs
        .filter(r => r.type === 'club')
        .sort((a, b) => {
          if (b.popularity !== a.popularity) return b.popularity - a.popularity;
          return b.item.id - a.item.id;
        })
        .slice(0, 2);
        
      setRecommendations([...topEvents, ...topClubs]);

      // Fetch all events to compute real user events for the upcoming events list
      const allEvents = await eventService.getAllEvents();
      const realUserEvents = allEvents.filter(event => {
        // Remove fake/mock/test
        const title = event.title?.toLowerCase() || '';
        const desc = event.description?.toLowerCase() || '';
        const isMock = title.includes('test') || title.includes('demo') || title.includes('sample') || title.includes('fake') || title.includes('mock') ||
          desc.includes('test') || desc.includes('demo') || desc.includes('sample') || desc.includes('fake') || desc.includes('mock');
        return !isMock;
      });

      // Upcoming events: filter for future dates and slice 3
      const upcoming = realUserEvents.filter(e => e.date && new Date(e.date) >= new Date());
      setUpcomingEvents(upcoming.slice(0, 3));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleJoinClub = async (clubId, e) => {
    e.stopPropagation();
    try {
      await clubService.joinClub(clubId);
      alert('Successfully joined the club!');
      setLoading(true);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Failed to join club: ' + (err.response?.data || err.message));
    }
  };

  if (loading) {
    return <div className="container py-5 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold m-0">Welcome back, <span className="text-gradient">{user?.name}</span></h2>
          <p className="text-muted">Here is your campus intelligence overview.</p>
        </div>
        <button className="neon-btn-outline" onClick={() => navigate('/notifications')}><i className="bi bi-bell-fill me-2"></i>Notifications</button>
      </div>

      <div className="row g-4 mb-5">
        {/* Stats */}
        <div className="col-md-4">
          <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4" onClick={() => navigate('/my-events')} style={{ cursor: 'pointer' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="m-0 text-muted">Events Attended</h5>
              <i className="bi bi-calendar-check fs-3 text-gradient"></i>
            </div>
            <h2 className="fw-bold m-0">{stats.eventsAttended}</h2>
          </motion.div>
        </div>
        <div className="col-md-4">
          <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4" onClick={() => navigate('/clubs')} style={{ cursor: 'pointer' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="m-0 text-muted">Clubs Joined</h5>
              <i className="bi bi-people fs-3 text-gradient"></i>
            </div>
            <h2 className="fw-bold m-0">{stats.clubsJoined}</h2>
          </motion.div>
        </div>
        <div className="col-md-4">
          <motion.div 
            whileHover={{ y: -5 }} 
            className="glass-card futuristic-glow-card p-4 position-relative overflow-hidden h-100 d-flex flex-column justify-content-between" 
            onClick={() => navigate('/analytics/activity')} 
            style={{ cursor: 'pointer' }}
          >
            <div>
              <h5 className="m-0 text-light fw-bold">Campus Activity Level</h5>
              <p className="text-muted small m-0 mt-1">Real-time participation summary</p>
            </div>

            <div className="d-grid gap-3 pt-3 border-top border-secondary border-opacity-20 mt-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted fw-semibold">👥 Clubs Joined</span>
                <span className="h4 fw-bold text-gradient m-0">{stats.clubsJoined || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted fw-semibold">🎟 Events Joined</span>
                <span className="h4 fw-bold text-gradient m-0">{stats.eventsJoined || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="row g-4">
        {/* AI Recommendations */}
        <div className="col-lg-8">
          <h4 className="fw-bold mb-4 d-flex align-items-center justify-content-between">
            <div><i className="bi bi-stars text-gradient me-2"></i>AI Recommended Events & Clubs</div>
            <button className="btn btn-sm btn-link text-light text-decoration-none" onClick={() => navigate('/recommendations')}>View All <i className="bi bi-arrow-right"></i></button>
          </h4>
          <div className="row g-4">
            {recommendations.length === 0 ? (
              <div className="col-12 text-center text-muted py-5 glass-card border border-secondary border-opacity-20">
                <i className="bi bi-stars text-secondary display-1 mb-3 d-block"></i>
                <h5 className="fw-bold text-light mb-2">No personalized recommendations available yet.</h5>
                <p className="text-muted small">Update your interests in your profile or explore more events and clubs to train your AI.</p>
              </div>
            ) : recommendations.slice(0, 4).map((rec, idx) => {
              const { type, item } = rec;
              if (type === 'event') {
                return (
                  <div className="col-md-6" key={`event-${item.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="glass-card h-100 overflow-hidden d-flex flex-column"
                      style={{ cursor: 'pointer', border: '1px solid rgba(108, 99, 255, 0.2)' }}
                      onClick={() => navigate(`/events/${item.id}`)}
                    >
                      <div style={{ height: '160px', overflow: 'hidden' }}>
                        <img src={item.imageUrl || EVENT_IMAGE_PLACEHOLDER} alt={item.title} className="w-100 h-100 object-fit-cover" />
                      </div>
                      <div className="p-4 d-flex flex-column flex-grow-1">
                        <div className="mb-2 d-flex gap-2">
                          <span className="badge bg-primary text-white">EVENT</span>
                          <span className="badge bg-secondary" style={{ background: 'var(--primary-deep)' }}>{item.category || 'General'}</span>
                        </div>
                        <h5 className="fw-bold mb-2 text-truncate">{item.title}</h5>
                        <p className="text-muted small mb-4"><i className="bi bi-people-fill me-1"></i>{item.registrationCount || 0} Registered</p>
                        <button className="neon-btn-outline mt-auto w-100" onClick={(e) => { e.stopPropagation(); navigate(`/events/${item.id}`); }}>View Details</button>
                      </div>
                    </motion.div>
                  </div>
                );
              } else {
                return (
                  <div className="col-md-6" key={`club-${item.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -10 }}
                      className="glass-card h-100 overflow-hidden d-flex flex-column"
                      style={{ cursor: 'pointer', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                      onClick={() => navigate(`/clubs/${item.id}`)}
                    >
                      <div style={{ height: '160px', overflow: 'hidden', background: 'var(--primary-deep)', position: 'relative' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white opacity-50">
                            <i className="bi bi-diagram-3 fs-1"></i>
                          </div>
                        )}
                        <span className="position-absolute top-0 end-0 m-2 badge bg-dark border border-secondary text-capitalize">Club</span>
                      </div>
                      <div className="p-4 d-flex flex-column flex-grow-1">
                        <div className="mb-2 d-flex gap-2">
                          <span className="badge bg-info text-white">CLUB</span>
                          <span className="badge bg-secondary" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>{item.category || 'Community'}</span>
                        </div>
                        <h5 className="fw-bold mb-2 text-truncate">{item.name}</h5>
                        <p className="text-muted small mb-4"><i className="bi bi-people-fill me-1"></i>{item.memberCount || 0} Members</p>
                        <div className="mt-auto d-flex gap-2">
                          <button className="btn btn-outline-light btn-sm flex-grow-1 rounded-pill" onClick={(e) => { e.stopPropagation(); navigate(`/clubs/${item.id}`); }}>View Details</button>
                          {item.isMember ? (
                            <button className="btn btn-secondary btn-sm px-3 rounded-pill" disabled>
                              <i className="bi bi-check2-circle me-1"></i>Joined
                            </button>
                          ) : (
                            <button className="neon-btn btn-sm px-3" onClick={(e) => handleJoinClub(item.id, e)}>
                              Join Club
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        <div className="col-lg-4">
          <h4 className="fw-bold mb-4">Quick Actions</h4>
          <div className="glass-card futuristic-glow-card p-4 mb-4 text-center" onClick={() => navigate('/attendance')} style={{ cursor: 'pointer' }}>
            <i className="bi bi-qr-code fs-1 text-gradient mb-3"></i>
            <h5>Your Campus ID</h5>
            <p className="text-muted small mb-4">Scan for attendance and access</p>
            <div className="bg-white p-2 mx-auto rounded-3 d-inline-block">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?.id || 'mock-id'}`} alt="QR Code" />
            </div>
          </div>

          <div className="d-grid gap-3">
            <motion.button
              whileHover={{ x: 5 }}
              style={{ cursor: 'pointer' }}
              className="glass-card futuristic-glow-card border-0 text-start p-3 text-light d-flex align-items-center w-100"
              onClick={() => navigate('/certificates')}
            >
              <div className="p-2 rounded bg-gradient me-3" style={{ background: 'rgba(108, 99, 255, 0.2)' }}>
                <i className="bi bi-award fs-5 text-gradient"></i>
              </div>
              <div>
                <h6 className="m-0 fw-bold">My Certificates</h6>
                <small className="text-muted">View achievements</small>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ x: 5 }}
              style={{ cursor: 'pointer' }}
              className="glass-card futuristic-glow-card border-0 text-start p-3 text-light d-flex align-items-center w-100"
              onClick={() => navigate('/feedback')}
            >
              <div className="p-2 rounded bg-gradient me-3" style={{ background: 'rgba(108, 99, 255, 0.2)' }}>
                <i className="bi bi-chat-left-text fs-5 text-gradient"></i>
              </div>
              <div>
                <h6 className="m-0 fw-bold">Feedback Hub</h6>
                <small className="text-muted">Rate past events</small>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
