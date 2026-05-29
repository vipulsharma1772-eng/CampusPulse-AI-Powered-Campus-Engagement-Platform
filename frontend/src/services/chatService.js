import api from './api';

const getRecentChats = async () => {
  const response = await api.get('/chats/recent');
  return response.data;
};

const openChat = async (username) => {
  const response = await api.post(`/chats/open?username=${encodeURIComponent(username)}`);
  return response.data;
};

const getMessages = async (chatId) => {
  const response = await api.get(`/chats/${chatId}/messages`);
  return response.data;
};

const sendMessage = async (chatId, content, imageUrl = null) => {
  const payload = { content };
  if (imageUrl) {
    payload.imageUrl = imageUrl;
  }
  const response = await api.post(`/chats/${chatId}/messages`, payload);
  return response.data;
};

const searchUsers = async (query) => {
  const response = await api.get(`/users/search?username=${encodeURIComponent(query)}`);
  return response.data;
};

const blockUser = async (userId) => {
  const response = await api.post(`/chats/block/${userId}`);
  return response.data;
};

const unblockUser = async (userId) => {
  const response = await api.delete(`/chats/unblock/${userId}`);
  return response.data;
};

const getBlockedUsers = async () => {
  const response = await api.get('/chats/blocked');
  return response.data;
};

export default {
  getRecentChats,
  openChat,
  getMessages,
  sendMessage,
  searchUsers,
  blockUser,
  unblockUser,
  getBlockedUsers
};
