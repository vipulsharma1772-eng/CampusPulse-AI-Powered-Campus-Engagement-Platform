import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { EVENT_IMAGE_PLACEHOLDER } from '../utils/placeholder';

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('All');
  const [events, setEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Custom toast & modal states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, eventId: null, eventTitle: '', registrantCount: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  const handleDeleteClick = async (event, e) => {
    e.stopPropagation();
    try {
      const attendees = await eventService.getEventAttendees(event.id);
      setDeleteModal({
        show: true,
        eventId: event.id,
        eventTitle: event.title,
        registrantCount: attendees.length
      });
    } catch (err) {
      console.error(err);
      setDeleteModal({
        show: true,
        eventId: event.id,
        eventTitle: event.title,
        registrantCount: 0
      });
    }
  };

  const handleDeleteConfirm = async () => {
    const { eventId } = deleteModal;
    setDeleteModal({ show: false, eventId: null, eventTitle: '', registrantCount: 0 });
    try {
      await eventService.deleteEvent(eventId);
      showToast('Event deleted successfully.', 'success');
      // Update UI instantly
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data || 'Unable to delete event.', 'error');
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const allEvents = await eventService.getAllEvents();
        const registeredData = await eventService.getMyEvents();
        const registeredIds = registeredData.map(item => item.event?.id).filter(Boolean);

        setRegisteredEventIds(registeredIds);
        setEvents(allEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const categories = ['All', 'Technology', 'Design', 'Business', 'Sports', 'Social'];
  
  // Filter out any fake/demo/test/sample events by title and description, displaying all real events globally
  const realEvents = events.filter(event => {
    const title = event.title?.toLowerCase() || '';
    const desc = event.description?.toLowerCase() || '';
    const isMock = title.includes('test') || title.includes('demo') || title.includes('sample') || title.includes('fake') || title.includes('mock') ||
                   desc.includes('test') || desc.includes('demo') || desc.includes('sample') || desc.includes('fake') || desc.includes('mock');
    return !isMock;
  });

  const filteredEvents = realEvents.filter(event => {
    const eventCat = event.category ? event.category.trim().toLowerCase() : '';
    const filterCat = filter.trim().toLowerCase();
    const matchesCategory = filter === 'All' || eventCat === filterCat;

    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold display-5 mb-2">Discover <span className="text-gradient">Events</span></h1>
          <p className="text-muted lead m-0">Find what's happening around campus, tailored by AI.</p>
        </div>
        <button className="neon-btn" onClick={() => navigate('/events/create')}>
          <i className="bi bi-plus-lg me-2"></i>Create Event
        </button>
      </div>



      {/* Filters and Search */}
      <div className="glass-card p-3 mb-5 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button 
              key={cat}
              className={`btn ${filter === cat ? 'neon-btn' : 'btn-outline-secondary text-light'} rounded-pill px-4`}
              onClick={() => setFilter(cat)}
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
            placeholder="Search events..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : (
        <div className="row g-4">
          {realEvents.length === 0 ? (
            <div className="col-12 text-center text-muted py-5">
              <i className="bi bi-calendar-x display-1 d-block mb-3 text-secondary"></i>
              <h3>No Events Available</h3>
              <p className="lead text-muted">No public events have been scheduled on campus yet.</p>
              <button className="neon-btn mt-3" onClick={() => navigate('/events/create')}>
                Create The First Event
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
              <div className="col-12 text-center text-muted py-5">No events found matching the selected category or search.</div>
          ) : filteredEvents.map((event, idx) => {
            const seatsLeft = event.maxParticipants ? event.maxParticipants - (event.currentParticipants || 0) : 'Unlimited';
            const isRegistered = registeredEventIds.includes(event.id);

            return (
              <div className="col-md-6 col-lg-4" key={event.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="glass-card h-100 overflow-hidden d-flex flex-column position-relative"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                    <img src={event.imageUrl || EVENT_IMAGE_PLACEHOLDER} alt={event.title} className="w-100 h-100 object-fit-cover" style={{ transition: 'transform 0.5s', ':hover': { transform: 'scale(1.1)' } }} />
                    <div className="position-absolute bottom-0 end-0 m-2 badge bg-dark opacity-75 border border-secondary">
                      <i className="bi bi-people me-1"></i> {seatsLeft} {typeof seatsLeft === 'number' ? 'Seats Left' : ''}
                    </div>
                  </div>
                  <div className="p-4 d-flex flex-column flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="badge text-uppercase" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary-neon)', border: '1px solid var(--primary-neon)' }}>
                        {event.category || 'Event'}
                      </span>

                    </div>
                    
                    <h4 className="fw-bold mb-3">{event.title}</h4>
                    <div className="d-flex align-items-center text-muted small mb-4">
                      <i className="bi bi-calendar-event me-2"></i> {event.date ? new Date(event.date).toLocaleDateString() : 'TBA'}
                      <i className="bi bi-geo-alt ms-3 me-2"></i> {event.venue || 'Main Campus'}
                    </div>
                    
                    <div className="mt-auto d-flex gap-2">
                      <button className="neon-btn-outline flex-grow-1 py-2" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>View Details</button>
                      {(user && (user.role === 'ROLE_ADMIN' || Number(event.organizerId) === Number(user.id))) && (
                        <button 
                          className="btn btn-outline-danger btn-sm px-3 rounded-pill d-flex align-items-center justify-content-center gap-1"
                          style={{
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                            transition: 'all 0.2s ease',
                            padding: '0.4rem 1rem'
                          }}
                          onClick={(e) => handleDeleteClick(event, e)}
                        >
                          <i className="bi bi-trash3"></i> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
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
            onClick={() => setDeleteModal({ show: false, eventId: null, eventTitle: '', registrantCount: 0 })}
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
                Are you sure you want to delete <strong className="text-light">{deleteModal.eventTitle}</strong>? This action is irreversible and will purge all event registrants, certificates, and attendance data.
              </p>

              {deleteModal.registrantCount > 0 && (
                <div className="alert alert-warning border border-warning border-opacity-20 bg-warning bg-opacity-10 text-warning text-start mb-4 rounded-3 d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 mt-1"></i>
                  <div>
                    <strong className="d-block">Warning: Registered Students</strong>
                    This event has <span className="fw-bold">{deleteModal.registrantCount} registered student{deleteModal.registrantCount === 1 ? '' : 's'}</span>. Deleting it will terminate their registrations instantly.
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-center gap-3">
                <button 
                  onClick={() => setDeleteModal({ show: false, eventId: null, eventTitle: '', registrantCount: 0 })}
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

export default EventsPage;
