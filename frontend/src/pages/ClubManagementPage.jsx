import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import clubService from '../services/clubService';
import { useAuth } from '../context/AuthContext';

const ClubManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Custom toast & modal states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, clubId: null, clubName: '', memberCount: 0 });

  useEffect(() => {
    fetchClubs();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const fetchClubs = () => {
    setLoading(true);
    clubService.getAllClubs()
      .then(data => setClubs(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleJoin = async (id, e) => {
    e.stopPropagation();
    try {
      await clubService.joinClub(id);
      showToast('Successfully joined the club!', 'success');
      fetchClubs(); // Refresh to update member count
    } catch (e) {
      showToast('Error: Already a member or club does not exist.', 'error');
    }
  };

  const handleDeleteClick = (club, e) => {
    e.stopPropagation();
    setDeleteModal({
      show: true,
      clubId: club.id,
      clubName: club.name,
      memberCount: club.memberCount || 0
    });
  };

  const handleDeleteConfirm = async () => {
    const { clubId } = deleteModal;
    setDeleteModal({ show: false, clubId: null, clubName: '', memberCount: 0 });
    
    try {
      await clubService.deleteClub(clubId);
      showToast('Club deleted successfully.', 'success');
      // Update UI instantly
      setClubs(prev => prev.filter(c => c.id !== clubId));
      // Background refetch to keep database sync
      setTimeout(() => {
        fetchClubs();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast('Unable to delete club.', 'error');
    }
  };

  const categories = ['All', 'Technology', 'Design', 'Business', 'Sports', 'Social'];

  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold display-5 mb-2">Campus <span className="text-gradient">Clubs</span></h1>
          <p className="text-muted lead m-0">Discover, join, and collaborate with like-minded students in our vibrant, futuristic campus ecosystem.</p>
        </div>
        <button className="neon-btn" onClick={() => navigate('/clubs/create')}>
          <i className="bi bi-plus-lg me-2"></i>Create Club
        </button>
      </div>
        {/* Filters and Search */}
        <div className="glass-card p-3 mb-5 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`btn ${categoryFilter === cat ? 'neon-btn' : 'btn-outline-secondary text-light'} rounded-pill px-4`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="position-relative" style={{ minWidth: '300px' }}>
            <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>
            <input 
              type="text" 
              className="form-control glow-input ps-5 rounded-pill" 
              placeholder="Search clubs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Club Cards */}
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary fs-2"></div></div>
        ) : (
          <div className="row g-4">
            {filteredClubs.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-diagram-3 text-muted display-1 mb-3 d-block"></i>
                <h3 className="text-muted">No clubs available</h3>
                <p className="text-muted">Be the first to create one!</p>
              </div>
            ) : filteredClubs.map((club, idx) => (
              <div className="col-md-6 col-lg-4" key={club.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -5 }}
                  className="glass-card h-100 overflow-hidden d-flex flex-column position-relative"
                  onClick={() => navigate(`/clubs/${club.id}`)} style={{ cursor: 'pointer', border: '1px solid rgba(108, 99, 255, 0.2)' }}
                >
                  <div style={{ height: '160px', overflow: 'hidden', background: 'var(--primary-deep)' }}>
                    {club.imageUrl ? (
                      <img src={club.imageUrl} alt={club.name} className="w-100 h-100 object-fit-cover" opacity="0.8" />
                    ) : (
                      <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white opacity-50">
                        <i className="bi bi-diagram-3 display-1"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge text-uppercase" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary-neon)' }}>
                        {club.category || 'Community'}
                      </span>
                      <span className="text-muted small"><i className="bi bi-people-fill me-1"></i>{club.memberCount || 0} Members</span>
                    </div>
                    
                    <h4 className="fw-bold mb-2">{club.name}</h4>
                    <p className="text-muted small flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {club.description}
                    </p>
                    
                    <div className="mt-3 pt-3 border-top border-secondary">
                      <div className="d-flex justify-content-between align-items-center">
                        <button className="btn btn-outline-light btn-sm px-3 rounded-pill" onClick={(e) => { e.stopPropagation(); navigate(`/clubs/${club.id}`); }}>
                          View Details
                        </button>
                        {(user && (user.role === 'ROLE_ADMIN' || Number(club.createdBy) === Number(user.id))) ? (
                          <button 
                            className="btn btn-outline-danger btn-sm px-3 rounded-pill d-flex align-items-center gap-1"
                            style={{
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                              transition: 'all 0.2s ease',
                              padding: '0.4rem 1rem'
                            }}
                            onClick={(e) => handleDeleteClick(club, e)}
                          >
                            <i className="bi bi-trash3"></i> Delete
                          </button>
                        ) : (
                          club.isMember ? (
                            <button className="btn btn-secondary px-4 py-2 btn-sm rounded-pill" style={{ padding: '0.4rem 1rem' }} disabled>
                              <i className="bi bi-check2-circle me-1"></i>Joined
                            </button>
                          ) : (
                            <button className="neon-btn px-4 py-2 btn-sm rounded-pill" style={{ padding: '0.4rem 1rem' }} onClick={(e) => handleJoin(club.id, e)}>
                              Join Club
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop d-flex align-items-center justify-content-center"
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(10, 8, 24, 0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 1050,
            }}
            onClick={() => setDeleteModal({ show: false, clubId: null, clubName: '', memberCount: 0 })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-card p-4 text-center border border-danger border-opacity-30 position-relative"
              style={{
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 50px rgba(239, 68, 68, 0.2)',
                backgroundColor: 'rgba(21, 16, 40, 0.96)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-inline-block p-3 rounded-circle bg-danger bg-opacity-10 mb-4 border border-danger border-opacity-20" style={{ boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)' }}>
                <i className="bi bi-trash3-fill text-danger fs-1"></i>
              </div>
              
              <h3 className="fw-bold text-light mb-3">Delete Club permanently?</h3>
              <p className="text-muted mb-4">
                Are you sure you want to delete <strong className="text-light">{deleteModal.clubName}</strong>? This action is irreversible and will purge all club posts and activities.
              </p>

              {deleteModal.memberCount > 0 && (
                <div className="alert alert-warning border border-warning border-opacity-20 bg-warning bg-opacity-10 text-warning text-start mb-4 rounded-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 mt-1"></i>
                  <div>
                    <strong className="d-block">Warning: Active Members</strong>
                    This club currently has <span className="fw-bold">{deleteModal.memberCount} member{deleteModal.memberCount === 1 ? '' : 's'}</span>. Deleting it will terminate their memberships instantly.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-center gap-3">
                <button 
                  onClick={() => setDeleteModal({ show: false, clubId: null, clubName: '', memberCount: 0 })}
                  className="btn btn-outline-light rounded-pill px-4"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="btn btn-danger rounded-pill px-4"
                  style={{
                    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                    border: 'none',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom glassmorphism success/error Toast notifications */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 9999,
              background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(10px)',
              border: toast.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: toast.type === 'success' ? '0 0 20px rgba(16, 185, 129, 0.25)' : '0 0 20px rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '16px 24px',
              color: toast.type === 'success' ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '600'
            }}
          >
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-4`}></i>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubManagementPage;
