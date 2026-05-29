import api from './api';

const getPendingEvents = async () => {
  const response = await api.get('/admin/events/pending');
  return response.data;
};

const getPendingClubs = async () => {
  const response = await api.get('/admin/clubs/pending');
  return response.data;
};

const approveEvent = async (id) => {
  const response = await api.put(`/admin/events/${id}/approve`);
  return response.data;
};

const rejectEvent = async (id) => {
  const response = await api.put(`/admin/events/${id}/reject`);
  return response.data;
};

const approveClub = async (id) => {
  const response = await api.put(`/admin/clubs/${id}/approve`);
  return response.data;
};

const rejectClub = async (id) => {
  const response = await api.put(`/admin/clubs/${id}/reject`);
  return response.data;
};

export default {
  getPendingEvents,
  getPendingClubs,
  approveEvent,
  rejectEvent,
  approveClub,
  rejectClub
};
