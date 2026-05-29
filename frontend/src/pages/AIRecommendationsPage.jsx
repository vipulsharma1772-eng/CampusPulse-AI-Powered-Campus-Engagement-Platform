import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import userService from '../services/userService';
import clubService from '../services/clubService';
import { EVENT_IMAGE_PLACEHOLDER } from '../utils/placeholder';
import { useNavigate } from 'react-router-dom';

const AIRecommendationsPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecommendations = recommendations.filter(rec => {
    if (filterType !== 'all' && rec.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (rec.type === 'event' ? rec.item.title : rec.item.name) || '';
      const category = rec.item.category || '';
      return title.toLowerCase().includes(q) || category.toLowerCase().includes(q);
    }
    return true;
  });

  const fetchRecommendations = async () => {
    try {
      const data = await userService.getCombinedRecommendations();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleJoinClub = async (clubId, e) => {
    e.stopPropagation();
    try {
      await clubService.joinClub(clubId);
      alert('Successfully joined the club!');
      setLoading(true);
      await fetchRecommendations();
    } catch (err) {
      console.error(err);
      alert('Failed to join club: ' + (err.response?.data || err.message));
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-stars text-gradient me-2"></i>AI Recommendations</h2>
      <p className="text-muted mb-4">Curated events and clubs tailored to your unique interests and activity history.</p>
      
      <div className="row mb-5 g-3 align-items-center">
        <div className="col-md-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text bg-dark border-secondary text-muted"><i className="bi bi-search"></i></span>
            <input 
              type="text" 
              className="form-control bg-dark text-light border-secondary" 
              placeholder="Search recommendations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 col-lg-8">
          <div className="d-flex gap-2 flex-wrap">
            <button className={`btn btn-sm rounded-pill ${filterType === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterType('all')}>All</button>
            <button className={`btn btn-sm rounded-pill ${filterType === 'event' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterType('event')}>Events Only</button>
            <button className={`btn btn-sm rounded-pill ${filterType === 'club' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterType('club')}>Clubs Only</button>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {filteredRecommendations.length === 0 ? (
          <div className="col-12 text-center text-muted py-5 glass-card border border-secondary border-opacity-20">
            <i className="bi bi-stars text-secondary display-1 mb-3 d-block"></i>
            <h5 className="fw-bold text-light mb-2">No personalized recommendations available yet.</h5>
            <p className="text-muted small">Update your interests in your profile or explore more events and clubs to train your AI.</p>
          </div>
        ) : (
          filteredRecommendations.map((rec, idx) => {
            const { type, item } = rec;
            if (type === 'event') {
              return (
                <div className="col-md-4" key={`event-${item.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="glass-card h-100 overflow-hidden d-flex flex-column"
                    style={{ cursor: 'pointer', border: '1px solid rgba(108, 99, 255, 0.2)' }}
                    onClick={() => navigate(`/events/${item.id}`)}
                  >
                    <div style={{ height: '200px', overflow: 'hidden' }}>
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
                <div className="col-md-4" key={`club-${item.id}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="glass-card h-100 overflow-hidden d-flex flex-column"
                    style={{ cursor: 'pointer', border: '1px solid rgba(139, 92, 246, 0.2)' }}
                    onClick={() => navigate(`/clubs/${item.id}`)}
                  >
                    <div style={{ height: '200px', overflow: 'hidden', background: 'var(--primary-deep)', position: 'relative' }}>
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
          })
        )}
      </div>
    </div>
  );
};

export default AIRecommendationsPage;
