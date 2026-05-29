import api from './api';

const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

const getDashboardStats = async () => {
  const response = await api.get('/users/dashboard');
  return response.data;
};

const getUserActivityDetails = async () => {
  const response = await api.get('/users/activity-details');
  return response.data;
};

const updateProfile = async (profileData) => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
};

const updatePassword = async (passwordData) => {
  const response = await api.put('/users/password', passwordData);
  return response.data;
};

const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/image', formData);
  return response.data;
};

const getCombinedRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

export default { getUserProfile, getDashboardStats, getUserActivityDetails, updateProfile, updatePassword, uploadProfileImage, getCombinedRecommendations };
