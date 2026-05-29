import api from './api';

const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

const register = async (name, username, email, password, role) => {
  const response = await api.post('/auth/register', { name, username, email, password, role });
  return response.data;
};

const resetPassword = async (email, newPassword) => {
  const response = await api.post('/auth/reset-password', { email, newPassword });
  return response.data;
};

export default { login, register, resetPassword };
