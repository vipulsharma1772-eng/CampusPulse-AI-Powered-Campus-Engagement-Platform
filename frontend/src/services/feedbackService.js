import api from './api';

const getMyAttendedEvents = async () => {
  const response = await api.get('/feedback/my-events');
  return response.data;
};

const submitFeedback = async (feedbackData) => {
  const response = await api.post('/feedback/submit', feedbackData);
  return response.data;
};

export default {
  getMyAttendedEvents,
  submitFeedback
};
