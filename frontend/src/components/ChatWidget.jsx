import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import aiService from '../services/aiService';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm your CampusPulse assistant. Ask me anything about events, clubs, or recommendations!", sender: 'ai' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userText = input.trim();
    const newUserMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Call real backend AI endpoint
      const response = await aiService.sendMessage(userText);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: response.response, 
        sender: 'ai' 
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.", 
        sender: 'ai' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div 
        className="position-fixed pulse-glow" 
        style={{ bottom: '30px', right: '30px', zIndex: 1060, cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="d-flex align-items-center justify-content-center bg-gradient"
          style={{ 
            width: '60px', height: '60px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--primary-deep), var(--primary-neon))',
            boxShadow: '0 4px 15px rgba(108, 99, 255, 0.5)'
          }}
        >
          <i className={isOpen ? "bi bi-x-lg text-white fs-4" : "bi bi-robot text-white fs-4"}></i>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="position-fixed d-flex flex-column"
            style={{ 
              bottom: '100px', 
              right: '30px', 
              width: '350px', 
              height: '500px', 
              zIndex: 1050, 
              overflow: 'hidden',
              background: '#1a1a2e', // Solid background instead of transparent glass
              borderRadius: '15px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div className="p-3 border-bottom d-flex align-items-center" style={{ background: 'linear-gradient(90deg, #2d2d44, #1a1a2e)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <i className="bi bi-robot text-gradient fs-4 me-2"></i>
              <h5 className="m-0 text-white fw-bold">AI Assistant</h5>
            </div>
            
            {/* Messages */}
            <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', background: '#121220' }}>
              {messages.map(msg => (
                <div key={msg.id} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : ''}`}>
                  <div 
                    className={`p-3 rounded-3 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white' : ''}`}
                    style={{ 
                      maxWidth: '85%', 
                      fontSize: '0.95rem',
                      lineHeight: '1.4',
                      background: msg.sender === 'ai' ? '#2d2d44' : '', // Solid opaque background for AI
                      color: msg.sender === 'ai' ? '#ffffff' : '',
                      borderBottomRightRadius: msg.sender === 'user' ? '0' : '15px',
                      borderBottomLeftRadius: msg.sender === 'ai' ? '0' : '15px',
                      whiteSpace: 'pre-line' // To support newlines in AI text
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="d-flex mb-3">
                  <div className="p-3 rounded-3" style={{ background: '#2d2d44', borderBottomLeftRadius: '0' }}>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-top" style={{ background: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ask a question..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  style={{ 
                    background: '#2d2d44', 
                    border: '1px solid rgba(139, 92, 246, 0.5)', 
                    color: '#fff',
                    borderRadius: '20px 0 0 20px',
                    paddingLeft: '15px'
                  }}
                />
                <button 
                  className="btn btn-primary px-3" 
                  onClick={handleSend}
                  disabled={isTyping}
                  style={{ borderRadius: '0 20px 20px 0' }}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
            
            <style jsx="true">{`
              .typing-indicator span {
                display: inline-block;
                width: 6px;
                height: 6px;
                background-color: #8b5cf6;
                border-radius: 50%;
                margin: 0 2px;
                animation: bounce 1.4s infinite ease-in-out both;
              }
              .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
              .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
              }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
