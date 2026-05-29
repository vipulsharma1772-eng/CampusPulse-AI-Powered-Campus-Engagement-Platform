import api from './api';

const sendMessage = async (message) => {
  const response = await api.post('/ai/chat', { message });
  return response.data;
};

const aiService = {
  sendMessage
};

export default aiService;
