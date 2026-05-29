import api from './api';

const getAllClubs = async () => {
  const response = await api.get('/clubs');
  return response.data;
};

const getMyClubs = async () => {
  const response = await api.get('/clubs/my');
  return response.data;
};

const joinClub = async (id) => {
  const response = await api.post(`/clubs/${id}/join`);
  return response.data;
};

const createClub = async (clubData) => {
  const response = await api.post('/clubs', clubData);
  return response.data;
};

const getClubDetails = async (id) => {
  const response = await api.get(`/clubs/${id}`);
  return response.data;
};

const leaveClub = async (id) => {
  const response = await api.post(`/clubs/${id}/leave`);
  return response.data;
};

const getClubPosts = async (id) => {
  const response = await api.get(`/clubs/${id}/posts`);
  return response.data;
};

const createClubPost = async (id, postData) => {
  const response = await api.post(`/clubs/${id}/posts`, postData);
  return response.data;
};

const deleteClub = async (id) => {
  const response = await api.delete(`/clubs/${id}`);
  return response.data;
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/image', formData);
  return response.data;
};

export default {
  getAllClubs,
  getMyClubs,
  joinClub,
  createClub,
  getClubDetails,
  leaveClub,
  getClubPosts,
  createClubPost,
  uploadImage,
  deleteClub
};
