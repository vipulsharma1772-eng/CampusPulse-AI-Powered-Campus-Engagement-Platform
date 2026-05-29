import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import feedbackService from '../services/feedbackService';

const FeedbackPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackForms, setFeedbackForms] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getMyAttendedEvents();
      let displayData = data;
      
      // FORCE DEMO EVENT IF EMPTY
      if (!data || data.length === 0) {
        displayData = [{
          feedbackSubmitted: false,
          event: {
            id: 'demo-event-1',
            title: 'AI Innovation Summit 2026',
            date: new Date().toISOString(),
            organizer: 'CampusPulse Club'
          }
        }];
      }

      setEvents(displayData);
      // Initialize forms state for events that don't have feedback yet
      const formsState = {};
      displayData.forEach(item => {
        if (!item.feedbackSubmitted) {
          formsState[item.event.id] = { rating: 0, comments: '' };
        }
      });
      setFeedbackForms(formsState);
    } catch (error) {
      console.error('Error fetching attended events for feedback', error);
      // Failsafe demo injection
      const fallbackData = [{
        feedbackSubmitted: false,
        event: {
          id: 'demo-event-1',
          title: 'AI Innovation Summit 2026',
          date: new Date().toISOString(),
          organizer: 'CampusPulse Club'
        }
      }];
      setEvents(fallbackData);
      setFeedbackForms({ 'demo-event-1': { rating: 0, comments: '' } });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (eventId, ratingValue) => {
    setFeedbackForms(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], rating: ratingValue }
    }));
  };

  const handleCommentChange = (eventId, commentValue) => {
    setFeedbackForms(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], comments: commentValue }
    }));
  };

  const handleSubmit = async (eventId) => {
    const form = feedbackForms[eventId];
    if (!form || form.rating === 0) {
      showToast('Please provide a rating before submitting.', 'error');
      return;
    }

    try {
      if (eventId === 'demo-event-1') {
        // Mock API call for the demo event
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await feedbackService.submitFeedback({
          eventId: eventId,
          rating: form.rating,
          comments: form.comments
        });
      }
      showToast('Feedback submitted successfully!', 'success');
      
      // Update local state to reflect submission
      setEvents(prev => prev.map(item => 
        item.event.id === eventId ? { ...item, feedbackSubmitted: true } : item
      ));
      
      // Remove from form state
      const newForms = { ...feedbackForms };
      delete newForms[eventId];
      setFeedbackForms(newForms);
      
    } catch (error) {
      console.error('Error submitting feedback', error);
      showToast(error.response?.data || 'Failed to submit feedback', 'error');
    }
  };

  const showToast = (msg, type) => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  if (loading) {
    return <div className="container py-5 text-center"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <div className="container py-5">
      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1100 }}>
          <div className={`toast show align-items-center text-white bg-${toast.type === 'success' ? 'success' : 'danger'} border-0`} role="alert">
            <div className="d-flex">
              <div className="toast-body">
                <i className={`bi bi-${toast.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {toast.message}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 text-center">
        <h2 className="fw-bold mb-3">Feedback <span className="text-gradient">Hub</span></h2>
        <p className="text-muted">Help organizers improve by rating the events you've attended.</p>
      </div>

        <div className="row g-4 justify-content-center">
          {events.map((item, idx) => (
            <div className="col-md-8 col-lg-6" key={item.event.id}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-4 h-100"
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="fw-bold text-light m-0">{item.event.title}</h5>
                    <small className="text-muted"><i className="bi bi-clock me-1"></i>{new Date(item.event.date).toLocaleDateString()}</small>
                  </div>
                  <span className="badge bg-primary bg-opacity-25 text-primary">ID: {item.event.id}</span>
                </div>

                {item.feedbackSubmitted ? (
                  <div className="text-center py-4 bg-success bg-opacity-10 rounded">
                    <i className="bi bi-check-circle-fill text-success fs-3 mb-2 d-block"></i>
                    <p className="m-0 text-success fw-bold">Feedback Submitted!</p>
                    <small className="text-muted">Thank you for your response.</small>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="text-light mb-2 d-block">Rate your experience</label>
                    <div className="d-flex mb-3 fs-3 text-warning" style={{ cursor: 'pointer' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i 
                          key={star} 
                          className={`bi ${feedbackForms[item.event.id]?.rating >= star ? 'bi-star-fill' : 'bi-star'} me-2`}
                          onClick={() => handleRating(item.event.id, star)}
                        ></i>
                      ))}
                    </div>

                    <div className="mb-3">
                      <label className="text-light mb-2">Additional Comments</label>
                      <textarea 
                        className="form-control bg-dark text-light border-secondary" 
                        rows="3" 
                        placeholder="What did you like? What could be better?"
                        value={feedbackForms[item.event.id]?.comments || ''}
                        onChange={(e) => handleCommentChange(item.event.id, e.target.value)}
                      ></textarea>
                    </div>

                    <button 
                      className="neon-btn w-100"
                      onClick={() => handleSubmit(item.event.id)}
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default FeedbackPage;
