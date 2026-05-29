import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import eventService from '../services/eventService';
import clubService from '../services/clubService';
import { useAuth } from '../context/AuthContext';
import { EVENT_IMAGE_PLACEHOLDER } from '../utils/placeholder';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [club, setClub] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [regStatus, setRegStatus] = useState({ registered: false, status: null });
  const [timeLeft, setTimeLeft] = useState('');

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
      await eventService.deleteEvent(id);
      showToast('Event deleted successfully.', 'success');
      setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data || 'Unable to delete event.', 'error');
    }
  };

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');

  useEffect(() => {
    setCommentsLoading(true);
    try {
      const key = `event-comments-${id}`;
      const storedComments = JSON.parse(localStorage.getItem(key)) || [];
      storedComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setComments(storedComments);
    } catch (err) {
      console.error("Error loading comments:", err);
      setCommentsError("Failed to load comments.");
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      const userName = loggedInUser?.name || 'Anonymous';
      
      const nameParts = userName.split(' ');
      const initials = nameParts.map(part => part[0]).slice(0, 2).join('').toUpperCase();

      const newComment = {
        id: Date.now().toString(),
        userName: userName,
        userInitials: initials,
        text: commentText.trim(),
        timestamp: new Date().toISOString()
      };

      const key = `event-comments-${id}`;
      const updatedComments = [newComment, ...comments];
      localStorage.setItem(key, JSON.stringify(updatedComments));
      
      setComments(updatedComments);
      setCommentText('');
    } catch (err) {
      console.error("Error saving comment:", err);
      setCommentsError("Failed to post comment. Please try again.");
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, statusData, attendeesData] = await Promise.all([
          eventService.getEventById(id),
          eventService.getRegistrationStatus(id),
          eventService.getEventAttendees(id)
        ]);

        const title = eventData.title?.toLowerCase() || '';
        const desc = eventData.description?.toLowerCase() || '';
        const isMock = title.includes('test') || title.includes('demo') || title.includes('sample') || title.includes('fake') || title.includes('mock') ||
                       desc.includes('test') || desc.includes('demo') || desc.includes('sample') || desc.includes('fake') || desc.includes('mock');
        
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        const isCreatedByUser = eventData.organizerId === loggedInUser?.id;
        const isJoinedByUser = statusData.registered;

        if (isMock) {
          alert("This event is not accessible.");
          navigate('/events');
          return;
        }

        setEvent(eventData);
        setRegStatus(statusData);
        setAttendees(attendeesData);
        
        if (eventData.clubId) {
          const clubData = await clubService.getClubDetails(eventData.clubId);
          setClub(clubData);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load event details");
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!event?.date) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const eventDate = new Date(event.date).getTime();
      const distance = eventDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("Event Started/Ended");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await eventService.registerForEvent(id);
      console.log("Join event success, certificate should be generated");
      setRegStatus({ registered: true, status: 'ATTENDED' });
      // update attendees list
      const newAttendees = await eventService.getEventAttendees(id);
      setAttendees(newAttendees);
      alert('Successfully registered for this event!');
    } catch (e) {
      alert(e.response?.data || 'An error occurred during registration.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    setRegistering(true);
    try {
      await eventService.cancelRegistration(id);
      setRegStatus({ registered: false, status: null });
      const newAttendees = await eventService.getEventAttendees(id);
      setAttendees(newAttendees);
      alert('Registration cancelled.');
    } catch (e) {
      alert(e.response?.data || 'An error occurred.');
    } finally {
      setRegistering(false);
    }
  };

  const handleAttend = async () => {
    setRegistering(true);
    try {
      await eventService.markAttendance(id);
      setRegStatus({ registered: true, status: 'ATTENDED' });
      alert('Attendance marked! Hope you enjoyed the event.');
    } catch (e) {
      alert(e.response?.data || 'An error occurred.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;
  if (!event) return null;

  return (
    <div className="container py-5">
      <button className="btn btn-link text-light text-decoration-none mb-4 p-0 d-flex align-items-center" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-2"></i> Back
      </button>

      <div className="row g-5">
        <div className="col-lg-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden mb-5"
          >
            <div style={{ height: '400px', width: '100%' }}>
              <img src={event.imageUrl || EVENT_IMAGE_PLACEHOLDER} alt={event.title} className="w-100 h-100 object-fit-cover" />
            </div>
            <div className="p-4 p-md-5">
              <div className="d-flex flex-wrap gap-2 mb-4">
                <span className="badge text-uppercase py-2 px-3" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary-neon)', border: '1px solid var(--primary-neon)' }}>
                  {event.category || 'Event'}
                </span>
                {event.tags && event.tags.split(',').map(tag => (
                  <span key={tag} className="badge bg-dark py-2 px-3 text-light border border-secondary">{tag.trim()}</span>
                ))}
              </div>
              
              <h1 className="fw-bold mb-4">{event.title}</h1>
              
              <div className="mb-4">
                <h5 className="fw-bold text-muted mb-3">About This Event</h5>
                <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                  {event.description}
                </p>
              </div>

              {club && (
                <div className="d-flex align-items-center p-3 rounded glass-card border border-secondary">
                  <div className="me-3">
                    <img src={club.imageUrl || 'https://via.placeholder.com/50'} alt={club.name} className="rounded-circle" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <small className="text-muted text-uppercase fw-bold d-block">Organized By</small>
                    <span className="fw-bold text-light fs-5 cursor-pointer" onClick={() => navigate(`/clubs/${club.id}`)}>{club.name}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Discussion Scaffold */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
            <h4 className="fw-bold mb-4"><i className="bi bi-chat-text text-gradient me-2"></i>Discussion</h4>
            
            {commentsError && (
              <div className="alert alert-danger py-2 mb-3 small" style={{ background: 'rgba(220, 53, 69, 0.2)', color: '#ea868f', border: '1px solid rgba(220, 53, 69, 0.4)' }}>
                {commentsError}
              </div>
            )}

            {/* Comments List */}
            {commentsLoading && comments.length === 0 ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : comments.length === 0 ? (
              <div className="p-4 text-center text-muted border border-secondary border-dashed rounded mb-4">
                <i className="bi bi-chat-square-dots fs-1 mb-2 d-block text-secondary"></i>
                No comments yet. Start the discussion!
              </div>
            ) : (
              <div className="d-grid gap-3 mb-4 pe-1" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 rounded glass-card border border-secondary d-flex gap-3 align-items-start">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold border border-primary text-light" style={{ width: '40px', height: '40px', background: 'rgba(108, 99, 255, 0.1)', flexShrink: 0, fontSize: '14px' }}>
                      {comment.userInitials}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-light small">{comment.userName}</span>
                        <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="m-0 text-muted small" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Section */}
            <div className="mt-3 d-flex gap-2">
              <input 
                type="text" 
                className="form-control glow-input bg-transparent text-light" 
                placeholder="Ask a question or share thoughts..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePostComment();
                  }
                }}
                disabled={commentsLoading}
              />
              <button className="neon-btn" onClick={handlePostComment} disabled={commentsLoading || !commentText.trim()}>
                {commentsLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send"></i>}
              </button>
            </div>
          </motion.div>
        </div>

        <div className="col-lg-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 sticky-top" style={{ top: '100px' }}
          >
            {/* Creator Actions */}
            {(user && (user.role === 'ROLE_ADMIN' || Number(event.organizerId) === Number(user.id))) && (
              <button 
                className="btn btn-outline-danger w-100 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 mb-4"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleDeleteClick}
              >
                <i className="bi bi-trash3-fill"></i> Delete Event
              </button>
            )}

            {/* Countdown */}
            <div className="text-center mb-4 p-3 rounded border border-primary bg-dark bg-opacity-50">
              <small className="text-uppercase text-muted fw-bold d-block mb-1">Starts In</small>
              <h4 className="fw-bold text-gradient m-0" style={{ fontFamily: 'monospace' }}>{timeLeft || '---'}</h4>
            </div>

            <div className="d-flex align-items-center mb-4">
              <div className="bg-gradient p-2 rounded me-3 text-white" style={{ background: 'var(--primary-deep)' }}>
                <i className="bi bi-calendar-event fs-5"></i>
              </div>
              <div>
                <small className="text-muted d-block text-uppercase fw-bold">Date & Time</small>
                <span>{event.date ? new Date(event.date).toLocaleString() : 'TBA'}</span>
              </div>
            </div>

            <div className="d-flex align-items-center mb-4">
              <div className="bg-gradient p-2 rounded me-3 text-white" style={{ background: 'var(--primary-deep)' }}>
                <i className="bi bi-geo-alt fs-5"></i>
              </div>
              <div>
                <small className="text-muted d-block text-uppercase fw-bold">Location</small>
                <span>{event.venue || 'TBA'}</span>
              </div>
            </div>

            <div className="d-flex align-items-center mb-4">
              <div className="bg-gradient p-2 rounded me-3 text-white" style={{ background: 'var(--primary-deep)' }}>
                <i className="bi bi-people fs-5"></i>
              </div>
              <div>
                <small className="text-muted d-block text-uppercase fw-bold">Seats left</small>
                <span>{event.maxParticipants ? event.maxParticipants - attendees.length : 'Unlimited'}</span>
              </div>
            </div>

            {/* Attendees Display */}
            <div className="mb-4">
              <small className="text-muted d-block text-uppercase fw-bold mb-2">Attending ({attendees.length})</small>
              <div className="d-flex flex-wrap gap-1">
                {attendees.slice(0, 5).map(user => (
                  <img key={user.id} src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} alt={user.username} title={user.username} className="rounded-circle border border-primary" style={{ width: '35px', height: '35px' }} />
                ))}
                {attendees.length > 5 && (
                  <div className="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center text-muted" style={{ width: '35px', height: '35px', fontSize: '12px' }}>
                    +{attendees.length - 5}
                  </div>
                )}
                {attendees.length === 0 && <span className="text-muted small">Be the first to join!</span>}
              </div>
            </div>

            <hr className="border-secondary my-4" />

            {!regStatus.registered ? (
              <button className="neon-btn w-100 py-3 d-flex justify-content-center align-items-center" onClick={handleRegister} disabled={registering}>
                {registering ? <div className="spinner-border spinner-border-sm me-2"></div> : <i className="bi bi-ticket-perforated fs-5 me-2"></i>}
                {registering ? 'Processing...' : 'Register Now'}
              </button>
            ) : (
              <div className="d-flex flex-column gap-3">
                <div className="alert alert-success m-0 border-0 p-3 d-flex flex-column align-items-center text-center" style={{ background: 'rgba(25, 135, 84, 0.2)', color: '#20c997' }}>
                  <i className="bi bi-check-circle-fill fs-3 mb-2"></i>
                  <strong>{regStatus.status === 'ATTENDED' ? 'Attended' : 'Registered'}</strong>
                  <div className="small mb-3">{regStatus.status === 'ATTENDED' ? 'Thanks for coming!' : 'Your seat is reserved.'}</div>
                  
                  {/* QR Code Section */}
                  {regStatus.status !== 'ATTENDED' && (
                    <div className="bg-white p-2 rounded mb-2">
                      <QRCodeSVG value={`campuspulse-event-${event.id}-attendance`} size={120} />
                    </div>
                  )}
                  {regStatus.status !== 'ATTENDED' && <small className="text-muted d-block mt-2">Scan at venue</small>}
                </div>

                {regStatus.status !== 'ATTENDED' && (
                  <button className="btn btn-primary w-100 py-3 fw-bold" onClick={handleAttend} disabled={registering} style={{ background: 'var(--primary-neon)', border: 'none', color: '#000' }}>
                    <i className="bi bi-qr-code-scan me-2"></i> Simulate QR Scan
                  </button>
                )}
                
                {regStatus.status !== 'ATTENDED' && (
                  <button className="btn btn-outline-danger w-100 py-2" onClick={handleCancel} disabled={registering}>
                    Cancel Registration
                  </button>
                )}
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
              
              <h3 className="fw-bold text-light mb-3">Delete Event permanently?</h3>
              <p className="text-muted mb-4">
                Are you sure you want to delete <strong className="text-light">{event.title}</strong>? This action is irreversible and will purge all event registrants, certificates, and attendance data.
              </p>

              {attendees.length > 0 && (
                <div className="alert alert-warning border border-warning border-opacity-20 bg-warning bg-opacity-10 text-warning text-start mb-4 rounded-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 mt-1"></i>
                  <div>
                    <strong className="d-block">Warning: Registered Students</strong>
                    This event has <span className="fw-bold">{attendees.length} registered student{attendees.length === 1 ? '' : 's'}</span>. Deleting it will terminate their registrations instantly.
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
                  Delete Event
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

export default EventDetailsPage;
