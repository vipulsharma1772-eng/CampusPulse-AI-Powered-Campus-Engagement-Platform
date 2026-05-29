import api from './api';

const getDashboardStats = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

const getRegistrationsDetails = async () => {
  const response = await api.get('/analytics/registrations-details');
  return response.data;
};

const getCampusActivity = async (clubName = '') => {
  const url = clubName ? `/analytics/campus-activity?club=${encodeURIComponent(clubName)}` : '/analytics/campus-activity';
  const response = await api.get(url);
  return response.data;
};

const getStudentActivity = async (userId) => {
  const response = await api.get(`/analytics/student-activity/${userId}`);
  return response.data;
};

export default {
  getDashboardStats,
  getRegistrationsDetails,
  getCampusActivity,
  getStudentActivity
};
