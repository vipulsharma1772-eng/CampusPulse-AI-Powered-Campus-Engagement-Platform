import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clubService from '../services/clubService';
import { useAuth } from '../context/AuthContext';

const ClubDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  // Custom toast & modal states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleDeleteClick = () => {
    setDeleteModal({ show: true });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal({ show: false });
    try {
      await clubService.deleteClub(id);
      showToast('Club deleted successfully.', 'success');
      setTimeout(() => {
        navigate('/clubs');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast('Unable to delete club.', 'error');
    }
  };

  const fetchDetails = async () => {
    try {
      const data = await clubService.getClubDetails(id);
      setClubData(data);
      const postsData = await clubService.getClubPosts(id);
      setPosts(postsData);
    } catch (err) {
      console.error(err);
      alert('Failed to load club details');
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, navigate]);

  const handleJoinLeave = async () => {
    try {
      if (clubData.isMember) {
        await clubService.leaveClub(id);
      } else {
        await clubService.joinClub(id);
      }
      fetchDetails();
    } catch (e) {
      alert(e.response?.data || 'An error occurred.');
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      await clubService.createClubPost(id, { content: newPost });
      setNewPost('');
      const postsData = await clubService.getClubPosts(id);
      setPosts(postsData);
    } catch (e) {
      alert(e.response?.data || 'Must be a member to post.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary fs-2"></div></div>;
  if (!clubData) return null;

  const { club, isMember, memberCount } = clubData;

  return (
    <div className="container py-5">
      <button className="btn btn-link text-light text-decoration-none mb-4 p-0 d-flex align-items-center" onClick={() => navigate('/clubs')}>
        <i className="bi bi-arrow-left me-2"></i> Back to Clubs
      </button>

      <div className="row g-5">
        <div className="col-lg-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden mb-5">
            <div style={{ height: '300px', width: '100%', background: 'var(--primary-deep)' }}>
              {club.imageUrl ? (
                <img src={club.imageUrl} alt={club.name} className="w-100 h-100 object-fit-cover" />
              ) : (
                <div className="w-100 h-100 d-flex justify-content-center align-items-center text-white opacity-50">
                  <i className="bi bi-diagram-3" style={{ fontSize: '100px' }}></i>
                </div>
              )}
            </div>
            <div className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <span className="badge mb-3 text-uppercase" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary-neon)', border: '1px solid var(--primary-neon)' }}>
                    {club.category || 'Community'}
                  </span>
                  <h1 className="fw-bold mb-0">{club.name}</h1>
                </div>
                <div className="d-flex gap-2">
                  {(user && (user.role === 'ROLE_ADMIN' || Number(club.createdBy) === Number(user.id))) && (
                    <button 
                      className="btn btn-outline-danger px-4 py-2 rounded-pill d-flex align-items-center gap-1"
                      style={{
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={handleDeleteClick}
                    >
                      <i className="bi bi-trash3"></i> Delete Club
                    </button>
                  )}
                  <button className={`btn ${isMember ? 'btn-outline-danger' : 'neon-btn'} px-4 py-2`} onClick={handleJoinLeave}>
                    {isMember ? 'Leave Club' : 'Join Club'}
                  </button>
                </div>
              </div>
              
              <h5 className="fw-bold text-muted mb-3">About Us</h5>
              <p className="mb-4" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{club.description}</p>
              
              {club.tags && (
                <div className="d-flex flex-wrap gap-2">
                  {club.tags.split(',').map(tag => (
                    <span key={tag} className="badge bg-dark border border-secondary text-light px-3 py-2 rounded-pill">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Discussion Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="fw-bold mb-4">Announcements & Discussions</h3>
            
            {isMember ? (
              <div className="glass-card p-4 mb-4">
                <form onSubmit={handlePost}>
                  <textarea className="form-control bg-dark text-light border-secondary mb-3" rows="3" placeholder="Share an announcement or start a discussion..."
                    value={newPost} onChange={e => setNewPost(e.target.value)} required></textarea>
                  <div className="text-end">
                    <button type="submit" className="neon-btn px-4" disabled={posting}>
                      {posting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="alert alert-dark border-secondary text-center py-4 mb-4">
                <i className="bi bi-lock-fill fs-4 d-block mb-2 text-muted"></i>
                You must join the club to participate in discussions.
              </div>
            )}

            <div className="d-flex flex-column gap-3">
              {posts.length === 0 ? (
                <p className="text-muted text-center py-4">No posts yet. Be the first to start a discussion!</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="glass-card p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-secondary rounded-circle d-flex justify-content-center align-items-center text-white me-3" style={{ width: '40px', height: '40px' }}>
                          {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <h6 className="m-0 fw-bold">{post.authorName}</h6>
                      </div>
                      <small className="text-muted">{new Date(post.createdAt).toLocaleString()}</small>
                    </div>
                    <p className="m-0" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Stats */}
        <div className="col-lg-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 sticky-top" style={{ top: '100px' }}>
            <h4 className="fw-bold mb-4">Club Overview</h4>
            
            <div className="d-flex align-items-center mb-4">
              <div className="bg-gradient p-3 rounded me-3 text-white" style={{ background: 'var(--primary-deep)' }}>
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <h3 className="m-0 fw-bold">{memberCount}</h3>
                <small className="text-muted text-uppercase fw-bold">Active Members</small>
              </div>
            </div>

            <div className="d-flex align-items-center mb-4">
              <div className="bg-gradient p-3 rounded me-3 text-white" style={{ background: 'var(--primary-deep)' }}>
                <i className="bi bi-chat-left-text fs-4"></i>
              </div>
              <div>
                <h3 className="m-0 fw-bold">{posts.length}</h3>
                <small className="text-muted text-uppercase fw-bold">Total Discussions</small>
              </div>
            </div>

            <hr className="border-secondary my-4" />
            
            <h6 className="fw-bold text-muted mb-3">Club Info</h6>
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-person-badge text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Club Head / Organizer</span>
                  <strong>{club.clubHeadName || 'N/A'}</strong>
                </div>
              </div>
              
              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-calendar-event text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Start Date</span>
                  <strong>{club.startDate ? new Date(club.startDate).toLocaleDateString() : 'N/A'}</strong>
                </div>
              </div>

              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-clock text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Meeting Timings</span>
                  <strong>{club.timing || 'N/A'}</strong>
                </div>
              </div>

              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-geo-alt text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Meeting Location</span>
                  <strong>{club.venue || 'N/A'}</strong>
                </div>
              </div>

              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-people text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Max Members Limit</span>
                  <strong>{club.maxMembers ? `${club.maxMembers} Students` : 'Unlimited'}</strong>
                </div>
              </div>

              <div className="d-flex align-items-center text-light small">
                <i className="bi bi-envelope text-gradient me-3 fs-5" style={{ width: '24px' }}></i>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: '0.75rem' }}>Contact Email</span>
                  <a href={`mailto:${club.contactEmail}`} className="text-gradient text-decoration-none fw-bold">{club.contactEmail || 'N/A'}</a>
                </div>
              </div>
            </div>

            <hr className="border-secondary my-4" />
            
            <h6 className="fw-bold text-muted mb-3">Status</h6>
            {isMember ? (
              <div className="alert alert-success m-0 border-0 d-flex align-items-center" style={{ background: 'rgba(25, 135, 84, 0.2)', color: '#20c997' }}>
                <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                You are a member!
              </div>
            ) : (
              <div className="alert alert-secondary m-0 border-0 d-flex align-items-center bg-dark text-light">
                <i className="bi bi-info-circle-fill fs-4 me-3 text-primary"></i>
                Not a member yet
              </div>
            )}
          </motion.div>
        </div>
      </div>

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
            onClick={() => setDeleteModal({ show: false })}
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
                Are you sure you want to delete <strong className="text-light">{club.name}</strong>? This action is irreversible and will purge all club posts and activities.
              </p>

              {memberCount > 0 && (
                <div className="alert alert-warning border border-warning border-opacity-20 bg-warning bg-opacity-10 text-warning text-start mb-4 rounded-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 mt-1"></i>
                  <div>
                    <strong className="d-block">Warning: Active Members</strong>
                    This club currently has <span className="fw-bold">{memberCount} member{memberCount === 1 ? '' : 's'}</span>. Deleting it will terminate their memberships instantly.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-center gap-3">
                <button 
                  onClick={() => setDeleteModal({ show: false })}
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

export default ClubDetailsPage;
