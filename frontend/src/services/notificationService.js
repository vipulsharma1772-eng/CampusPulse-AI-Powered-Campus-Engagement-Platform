import api from './api';

const getUserNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.post('/notifications/mark-read');
  return response.data;
};

export default {
  getUserNotifications,
  markAllAsRead
};
