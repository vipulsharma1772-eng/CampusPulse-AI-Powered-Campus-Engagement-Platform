import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import api from '../services/api';

const ChatPage = () => {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Image Upload States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // Loading states
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Load recent chats initially
  useEffect(() => {
    fetchRecentChats(true);
    
    // Live update polling for recent chats every 4 seconds
    const interval = setInterval(() => {
      fetchRecentChats(false);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Poll for messages in active chat every 3 seconds
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.chatId, true); // Silent loading

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(activeChat.chatId, false);
      }, 3000);
    } else {
      setMessages([]);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [activeChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRecentChats = async (showLoader = false) => {
    if (showLoader) setChatsLoading(true);
    try {
      const data = await chatService.getRecentChats();
      setRecentChats(data || []);
    } catch (err) {
      console.error("Error loading recent chats:", err);
    } finally {
      if (showLoader) setChatsLoading(false);
    }
  };

  const fetchMessages = async (chatId, silent = false) => {
    if (silent) setMessagesLoading(true);
    try {
      const data = await chatService.getMessages(chatId);
      // Only update state if message counts differ to prevent rendering overhead
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) {
          return data || [];
        }
        return prev;
      });
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (silent) setMessagesLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await chatService.searchUsers(query);
      setSearchResults(results || []);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  const handleOpenChat = async (partner) => {
    try {
      const chat = await chatService.openChat(partner.username);
      setActiveChat(chat);
      setSearchQuery('');
      setSearchResults([]);
      fetchRecentChats(false);
    } catch (err) {
      console.error("Error opening chat:", err);
      alert("Could not open conversation with this user.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat || sending) return;
 
    const textToSend = messageText.trim();
    setMessageText('');
    setSending(true);
 
    try {
      const savedMsg = await chatService.sendMessage(activeChat.chatId, textToSend);
      setMessages(prev => [...prev, savedMsg]);
      fetchRecentChats(false);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!activeChat) return;
    try {
      await chatService.blockUser(activeChat.otherUser.id);
      setActiveChat(prev => ({
        ...prev,
        isBlocked: true
      }));
      setShowBlockModal(false);
      fetchRecentChats(false);
    } catch (err) {
      console.error(err);
      alert("Failed to block user.");
    }
  };

  const handleUnblockUserLocally = async () => {
    if (!activeChat) return;
    try {
      await chatService.unblockUser(activeChat.otherUser.id);
      setActiveChat(prev => ({
        ...prev,
        isBlocked: false
      }));
      fetchRecentChats(false);
    } catch (err) {
      console.error(err);
      alert("Failed to unblock user.");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat');

    try {
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.url) {
        // Send the message immediately with the image URL
        const savedMsg = await chatService.sendMessage(activeChat.chatId, '', response.data.url);
        setMessages(prev => [...prev, savedMsg]);
        fetchRecentChats(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert(err.response?.data?.error || 'Error uploading image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="container py-4">
      {/* Dynamic Futuristic Styled Styles */}
      <style>{`
        .chat-container {
          height: calc(100vh - 160px);
          min-height: 500px;
          display: flex;
          background: rgba(20, 16, 38, 0.65);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }

        .chat-sidebar {
          width: 320px;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          background: rgba(15, 12, 30, 0.5);
        }

        .chat-main {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          background: rgba(20, 16, 38, 0.1);
          position: relative;
        }

        .glass-search-input {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          color: #ffffff !important;
          font-size: 0.9rem;
          padding: 10px 15px 10px 38px !important;
          box-shadow: none !important;
          transition: all 0.3s ease;
        }

        .glass-search-input:focus {
          border-color: rgba(168, 85, 247, 0.5) !important;
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.15) !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .search-icon-wrapper {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .user-list-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          margin-bottom: 4px;
        }

        .user-list-item:hover {
          background: rgba(168, 85, 247, 0.08);
          box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.05);
        }

        .user-list-item.active {
          background: rgba(168, 85, 247, 0.15);
          border-left: 3px solid #a855f7;
          box-shadow: inset 0 0 15px rgba(168, 85, 247, 0.1);
        }

        .avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid #0f0c1e;
          box-shadow: 0 0 8px #22c55e;
        }

        .chat-body-scroll {
          flex-grow: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-body-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .chat-body-scroll::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 10px;
        }

        .message-bubble {
          max-width: 60%;
          padding: 12px 18px;
          border-radius: 16px;
          font-size: 0.95rem;
          line-height: 1.5;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }

        .message-bubble.sent {
          align-self: flex-end;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: #ffffff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.25);
        }

        .message-bubble.received {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .chat-input-wrapper {
          padding: 16px 24px;
          background: rgba(15, 12, 30, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .search-results-overlay {
          position: absolute;
          top: 65px;
          left: 15px;
          right: 15px;
          background: rgba(20, 16, 40, 0.98);
          border: 1px solid rgba(168, 85, 247, 0.25);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
        }
      `}</style>

      <div className="chat-container">
        {/* SIDEBAR LEFT */}
        <div className="chat-sidebar p-3">
          {/* User Search */}
          <div className="position-relative mb-4">
            <span className="search-icon-wrapper">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control glass-search-input" 
              placeholder="Search user by username..." 
              value={searchQuery}
              onChange={handleSearch}
            />

            {/* Search Results Overlay Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && searchQuery.trim() !== '' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="search-results-overlay p-2"
                >
                  <h6 className="text-muted small text-uppercase px-2 mb-2">Search Results</h6>
                  {searchResults.map(partner => (
                    <div 
                      key={partner.id}
                      className="d-flex align-items-center gap-2 p-2 rounded hover-glow-row"
                      style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.01)' }}
                      onClick={() => handleOpenChat(partner)}
                    >
                      <img 
                        src={partner.profileImage || `https://ui-avatars.com/api/?name=${partner.name}&background=A855F7&color=fff`} 
                        alt={partner.name}
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px' }}
                      />
                      <div className="min-w-0">
                        <span className="text-light fw-semibold d-block text-truncate small">{partner.name}</span>
                        <span className="text-muted small d-block">@{partner.username}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h6 className="text-muted small text-uppercase fw-bold px-2 mb-3">Conversations</h6>
          
          {/* Chats Scroll pane */}
          <div className="flex-grow-1 overflow-auto pe-1 d-flex flex-column gap-1">
            {chatsLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary spinner-border-sm"></div></div>
            ) : recentChats.length === 0 ? (
              <p className="text-muted small text-center py-5">No active conversations.<br/>Search above to start a chat!</p>
            ) : (
              recentChats.map(chat => {
                const partner = chat.otherUser;
                const isActive = activeChat?.chatId === chat.chatId;
                return (
                  <div 
                    key={chat.chatId}
                    className={`user-list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveChat(chat)}
                  >
                    <div className="avatar-container me-3">
                      <img 
                        src={partner.profileImage || `https://ui-avatars.com/api/?name=${partner.name}&background=6C63FF&color=fff`} 
                        alt={partner.name}
                        className="rounded-circle"
                        style={{ width: '42px', height: '42px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <div className="online-dot"></div>
                    </div>
                    
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="text-light fw-bold text-truncate small" style={{ fontSize: '0.92rem' }}>{partner.name}</span>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(chat.lastMessageTimestamp)}</small>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-1">
                        <span className="text-muted small text-truncate" style={{ fontSize: '0.78rem', maxWidth: '170px' }}>
                          {chat.lastMessageContent || 'No messages'}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="badge bg-purple rounded-circle d-flex align-items-center justify-content-center" style={{ width: '18px', height: '18px', fontSize: '0.65rem' }}>
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT WINDOW RIGHT */}
        <div className="chat-main">
          {activeChat ? (
            <>
              {/* Header Details */}
              <div className="chat-header p-3 bg-dark bg-opacity-20 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="avatar-container">
                    <img 
                      src={activeChat.otherUser.profileImage || `https://ui-avatars.com/api/?name=${activeChat.otherUser.name}&background=6C63FF&color=fff`} 
                      alt={activeChat.otherUser.name}
                      className="rounded-circle"
                      style={{ width: '40px', height: '40px', border: '2px solid rgba(168, 85, 247, 0.4)' }}
                    />
                    <div className="online-dot"></div>
                  </div>
                  <div>
                    <h6 className="text-light fw-bold m-0">{activeChat.otherUser.name}</h6>
                    <small className="text-muted">@{activeChat.otherUser.username} • {activeChat.otherUser.role}</small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {activeChat.isBlocked && (
                    <span className="badge bg-danger bg-opacity-20 text-danger rounded-pill" style={{ border: '1px solid rgba(220, 53, 69, 0.25)', padding: '6px 12px' }}>
                      <i className="bi bi-shield-fill-x me-1"></i>User Blocked
                    </span>
                  )}
                  {!activeChat.isBlocked ? (
                    <button 
                      onClick={() => setShowBlockModal(true)}
                      className="btn btn-outline-danger btn-sm rounded-pill d-flex align-items-center gap-1 py-1 px-3"
                      style={{ border: '1px solid rgba(220, 53, 69, 0.4)', background: 'rgba(220, 53, 69, 0.05)', color: '#ef4444', fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-slash-circle me-1"></i>Block User
                    </button>
                  ) : (
                    <button 
                      onClick={handleUnblockUserLocally}
                      className="btn btn-outline-success btn-sm rounded-pill d-flex align-items-center gap-1 py-1 px-3"
                      style={{ border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981', fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-shield-fill-check me-1"></i>Unblock
                    </button>
                  )}
                  <span className="badge bg-secondary bg-opacity-20 text-muted d-none d-md-inline-block" style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px' }}>
                    <i className="bi bi-shield-lock me-1"></i>Private Session
                  </span>
                </div>
              </div>

              {/* Chat Scrollbody */}
              <div className="chat-body-scroll">
                {messagesLoading && messages.length === 0 ? (
                  <div className="text-center py-5 my-auto"><div className="spinner-border text-primary"></div></div>
                ) : (
                  messages.map(msg => {
                    const isSentByMe = msg.senderId === user.id;
                    return (
                      <div 
                        key={msg.id}
                        className={`d-flex flex-column ${isSentByMe ? 'align-items-end' : 'align-items-start'}`}
                      >
                        <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`} style={{ padding: msg.imageUrl && msg.content === '[Image]' ? '4px' : undefined }}>
                          {msg.imageUrl && (
                            <img 
                              src={`http://localhost:8080${msg.imageUrl}`} 
                              alt="Attached media" 
                              className="img-fluid rounded shadow-sm" 
                              style={{ 
                                maxHeight: '250px', 
                                cursor: 'zoom-in', 
                                display: 'block',
                                marginBottom: msg.content !== '[Image]' ? '10px' : '0' 
                              }}
                              onClick={() => setPreviewImage(`http://localhost:8080${msg.imageUrl}`)}
                            />
                          )}
                          {msg.content !== '[Image]' && msg.content}
                        </div>
                        <span className="text-muted mt-1 px-2" style={{ fontSize: '0.68rem' }}>
                          {formatDate(msg.timestamp)} {isSentByMe && (msg.read ? <i className="bi bi-check2-all text-cyan ms-1"></i> : <i className="bi bi-check2 text-muted ms-1"></i>)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Typing Area */}
              {activeChat.isBlocked ? (
                <div className="chat-input-wrapper py-4 px-4 text-center rounded-3" style={{ border: '1px dashed rgba(220, 53, 69, 0.25)', background: 'rgba(220, 53, 69, 0.03)' }}>
                  <i className="bi bi-shield-fill-x text-danger fs-3 mb-2 d-block"></i>
                  <span className="text-danger fw-bold d-block mb-1" style={{ fontSize: '0.92rem' }}>You have blocked this user.</span>
                  <small className="text-muted d-block mb-3">You must unblock this user to send and receive new messages.</small>
                  <button className="btn btn-outline-success btn-sm rounded-pill px-4 py-2" onClick={handleUnblockUserLocally} style={{ border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)', color: '#10b981' }}>
                    <i className="bi bi-shield-fill-check me-2"></i>Unblock User
                  </button>
                </div>
              ) : activeChat.hasBlockedMe ? (
                <div className="chat-input-wrapper py-4 px-4 text-center rounded-3" style={{ border: '1px dashed rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <i className="bi bi-lock-fill text-muted fs-3 mb-2 d-block"></i>
                  <span className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.92rem' }}>Messaging is temporarily unavailable.</span>
                  <small className="text-muted d-block">You cannot send messages to this user at this time.</small>
                </div>
              ) : (
                <div className="chat-input-wrapper">
                  <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '52px', height: '52px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || sending}
                    >
                      {uploadingImage ? (
                        <span className="spinner-border spinner-border-sm text-muted"></span>
                      ) : (
                        <i className="bi bi-image fs-5 text-muted"></i>
                      )}
                    </button>
                    <input 
                      type="text" 
                      className="form-control glow-input bg-transparent text-light border-secondary border-opacity-30 py-3 px-4 rounded-pill shadow-none"
                      placeholder="Type a private message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      className="neon-btn rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '52px', height: '52px', flexShrink: 0, padding: 0 }}
                      disabled={(!messageText.trim() && !uploadingImage) || sending}
                    >
                      {sending ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <i className="bi bi-send-fill fs-5" style={{ transform: 'translateX(1px)' }}></i>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center m-auto text-center py-5 px-3">
              <div className="rounded-circle p-4 mb-4" style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                <i className="bi bi-chat-left-dots fs-1 text-gradient"></i>
              </div>
              <h4 className="fw-bold text-light mb-2">Campus Private Messenger</h4>
              <p className="text-muted small" style={{ maxWidth: '350px' }}>
                Secure, end-to-end institutional private sessions. Select an active conversation or lookup an online student handle to chat privately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Image Preview Overlay */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1070, backdropFilter: 'blur(5px)' }}
            onClick={() => setPreviewImage(null)}
          >
            <button className="btn btn-close btn-close-white position-absolute top-0 end-0 m-4" onClick={() => setPreviewImage(null)}></button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewImage} 
              alt="Preview" 
              className="img-fluid rounded shadow-lg" 
              style={{ maxHeight: '90vh', maxWidth: '90vw' }} 
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Block User Confirmation Modal Overlay */}
      <AnimatePresence>
        {showBlockModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ background: 'rgba(0,0,0,0.85)', zIndex: 1080, backdropFilter: 'blur(8px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-5 text-center w-100 mx-3"
              style={{ maxWidth: '420px', border: '1px solid rgba(220, 53, 69, 0.25)' }}
            >
              <div className="rounded-circle p-3 d-inline-block mb-4" style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
                <i className="bi bi-shield-fill-x fs-1 text-danger"></i>
              </div>
              <h4 className="fw-bold text-light mb-3">Block User</h4>
              <p className="text-muted small mb-4">
                Are you sure you want to block this user? You will no longer receive private messages from them.
              </p>
              <div className="d-flex gap-3">
                <button className="btn btn-outline-secondary rounded-pill w-100 py-2 text-light border-secondary border-opacity-35" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger rounded-pill w-100 py-2" onClick={handleBlockUser} style={{ background: 'linear-gradient(135deg, #dc3545 0%, #bd2130 100%)', border: 'none', boxShadow: '0 0 15px rgba(220, 53, 69, 0.3)' }}>
                  Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
