import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import notificationService from '../services/notificationService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.getUserNotifications()
      .then(data => setNotifications(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0"><i className="bi bi-bell-fill text-gradient me-2"></i>Notifications</h2>
        {notifications.some(n => !n.readStatus) && (
          <button className="neon-btn-outline btn-sm" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="glass-card p-4">
        {notifications.length === 0 && <p className="text-muted text-center m-0 py-4">You're all caught up!</p>}
        <div className="list-group list-group-flush bg-transparent">
          {notifications.map((notif, idx) => (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="list-group-item bg-transparent text-light border-bottom border-secondary py-3 d-flex align-items-center"
            >
              <i className={`bi ${notif.readStatus ? 'bi-envelope-open' : 'bi-envelope-fill text-gradient'} me-3 fs-4`}></i>
              <div className="flex-grow-1">
                <h6 className="mb-1">{notif.title}</h6>
                <p className="mb-0 text-muted small">{notif.message}</p>
              </div>
              <small className="text-muted">{new Date(notif.createdAt).toLocaleDateString()}</small>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
