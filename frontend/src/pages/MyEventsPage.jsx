import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import { EVENT_IMAGE_PLACEHOLDER } from '../utils/placeholder';

const MyEventsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      const [registeredData, allEvents] = await Promise.all([
        eventService.getMyEvents(),
        eventService.getAllEvents()
      ]);

      // Joined events:
      const joinedEvents = registeredData.map(item => ({
        event: item.event,
        registration: item.registration
      })).filter(item => item.event);

      // Created events:
      const createdEvents = allEvents
        .filter(e => e.organizerId === loggedInUser?.id)
        .filter(e => !joinedEvents.some(item => item.event?.id === e.id)) // avoid duplicates if already joined
        .map(e => ({
          event: e,
          registration: { id: `created-${e.id}`, attendanceStatus: 'ORGANIZER' } // mock registration status for created events
        }));

      setMyEvents([...joinedEvents, ...createdEvents]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    // Filter out fake/demo/test/sample events
    const realEvents = myEvents.filter(item => {
      const title = item.event?.title?.toLowerCase() || '';
      const desc = item.event?.description?.toLowerCase() || '';
      return !title.includes('test') && !title.includes('demo') && !title.includes('sample') && !title.includes('fake') && !title.includes('mock') &&
             !desc.includes('test') && !desc.includes('demo') && !desc.includes('sample') && !desc.includes('fake') && !desc.includes('mock');
    });

    if (activeTab === 'upcoming') {
      return realEvents.filter(item => {
        return (item.event?.date && new Date(item.event.date) >= new Date()) || 
               item.registration?.attendanceStatus === 'PENDING';
      });
    }
    if (activeTab === 'attended') {
      return realEvents.filter(item => {
        return (item.event?.date && new Date(item.event.date) < new Date()) || 
               item.registration?.attendanceStatus === 'ATTENDED';
      });
    }
    return realEvents;
  };

  const filtered = getFilteredEvents();

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold display-5 mb-2">My <span className="text-gradient">Events</span></h1>
          <p className="text-muted lead m-0">Track your registrations and campus engagement.</p>
        </div>
      </div>

      <div className="glass-card p-3 mb-5 d-flex flex-wrap gap-3">
        <button className={`btn ${activeTab === 'attended' ? 'neon-btn' : 'btn-outline-secondary text-light'} rounded-pill px-4`} onClick={() => setActiveTab('attended')}>
          Attended History
        </button>
        <button className={`btn ${activeTab === 'all' ? 'neon-btn' : 'btn-outline-secondary text-light'} rounded-pill px-4`} onClick={() => setActiveTab('all')}>
          All Time
        </button>
      </div>

      <div className="row g-4">
        {filtered.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">
            <i className="bi bi-calendar-x display-1 d-block mb-3"></i>
            <h4>No events found in this category.</h4>
            <button className="btn btn-link text-primary mt-3" onClick={() => navigate('/events')}>Discover Events</button>
          </div>
        ) : filtered.map((item, idx) => {
          const { event, registration } = item;
          return (
            <div className="col-md-6 col-lg-4" key={registration.id}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card h-100 overflow-hidden d-flex flex-column position-relative"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/events/${event?.id}`)}
              >
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img src={event?.imageUrl || EVENT_IMAGE_PLACEHOLDER} alt={event?.title || 'Unknown Event'} className="w-100 h-100 object-fit-cover" />
                </div>
                <div className="p-4 d-flex flex-column flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge text-uppercase" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary-neon)' }}>
                      {event?.category || 'Event'}
                    </span>
                     {registration.attendanceStatus === 'ORGANIZER' ? (
                       <span className="badge text-white" style={{ background: 'rgba(108, 99, 255, 0.4)', border: '1px solid var(--primary-neon)' }}><i className="bi bi-person-workspace me-1"></i>Organizer</span>
                     ) : registration.attendanceStatus === 'ATTENDED' ? (
                       <span className="badge bg-success text-white"><i className="bi bi-check-circle me-1"></i>Attended</span>
                     ) : (
                       <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i>Upcoming</span>
                     )}
                  </div>
                  <h5 className="fw-bold mb-3">{event?.title || 'Unknown Event'}</h5>
                  <div className="d-flex align-items-center text-muted small mb-3">
                    <i className="bi bi-calendar-event me-2"></i> {event?.date ? new Date(event.date).toLocaleDateString() : 'TBA'}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyEventsPage;
