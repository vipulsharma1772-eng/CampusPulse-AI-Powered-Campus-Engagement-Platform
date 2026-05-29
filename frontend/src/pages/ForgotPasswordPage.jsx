import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, newPassword);
      setSuccess("Password updated successfully");
      
      // Clear form fields
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect to login page after 2 seconds with success state
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password updated successfully' } });
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check if email exists.');
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 w-100"
        style={{ maxWidth: '480px', border: '1px solid rgba(139, 92, 246, 0.4)' }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
             <i className="bi bi-shield-lock fs-1 text-gradient"></i>
          </div>
          <h2 className="fw-bold">Reset Password</h2>
          <p className="text-muted">Enter your email and new password credentials</p>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="alert alert-success d-flex align-items-center" 
            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
          >
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{success}</div>
          </motion.div>
        )}
        
        {error && (
          <div 
            className="alert alert-danger" 
            style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: 'none' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small">Email Address</label>
            <input 
              type="email" 
              className="form-control glow-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-muted small">New Password</label>
            <div className="password-toggle-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control glow-input" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} fs-4`}></i>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small">Confirm New Password</label>
            <div className="password-toggle-container">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="form-control glow-input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} fs-4`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="neon-btn w-100 py-3 mb-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Reset Password
          </button>
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">Remembered your password? <Link to="/login" className="text-gradient text-decoration-none fw-bold">Sign in</Link></p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
