import api from './api';

const getAllEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

const getRecommendedEvents = async () => {
  const response = await api.get('/events/recommended');
  return response.data;
};

const getUpcomingEvents = async () => {
  const response = await api.get('/events/upcoming');
  return response.data;
};

const getTrendingEvents = async () => {
  const response = await api.get('/events/trending');
  return response.data;
};

const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

const getEventAttendees = async (id) => {
  const response = await api.get(`/events/${id}/attendees`);
  return response.data;
};

const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data;
};

const registerForEvent = async (id) => {
  const response = await api.post(`/events/${id}/register`);
  return response.data;
};

const getMyEvents = async () => {
  const response = await api.get('/registrations/my-events');
  return response.data;
};

const getRegistrationStatus = async (eventId) => {
  const response = await api.get(`/registrations/status/${eventId}`);
  return response.data;
};

const cancelRegistration = async (eventId) => {
  const response = await api.delete(`/registrations/${eventId}`);
  return response.data;
};

const markAttendance = async (eventId) => {
  const response = await api.post(`/events/${eventId}/attend`);
  return response.data;
};

const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data;
};

export default {
  getAllEvents,
  getRecommendedEvents,
  getUpcomingEvents,
  getTrendingEvents,
  getEventById,
  getEventAttendees,
  createEvent,
  registerForEvent,
  getMyEvents,
  getRegistrationStatus,
  cancelRegistration,
  markAttendance,
  deleteEvent
};
