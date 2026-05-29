import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const LoginPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Clear success message from history state so it doesn't persist on refresh
  useEffect(() => {
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
      // Auto-hide the success message after 4 seconds
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const data = await authService.login(email, password);
      
      const userObj = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role
      };
      
      login(userObj, data.token);
      
      if (data.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 w-100"
        style={{ maxWidth: '450px' }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
             <i className="bi bi-person-bounding-box fs-1 text-gradient"></i>
          </div>
          <h2 className="fw-bold">Welcome Back</h2>
          <p className="text-muted">Enter your credentials to continue</p>
        </div>

        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="alert alert-success d-flex align-items-center" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <i className="bi bi-check-circle-fill me-2 fs-5"></i>
            <div>{success}</div>
          </motion.div>
        )}
        
        {error && <div className="alert alert-danger" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: 'none' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted small">Email Address</label>
            <input 
              type="email" 
              className="form-control glow-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="mb-5">
            <label className="form-label text-muted small">Password</label>
            <div className="password-toggle-container">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control glow-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
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
            <div className="text-end mt-2">
              <Link 
                to="/forgot-password" 
                className="forgot-password-link text-decoration-none"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          <button type="submit" className="neon-btn w-100 py-3 mb-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Sign In
          </button>
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">Don't have an account? <Link to="/register" className="text-gradient text-decoration-none fw-bold">Sign up</Link></p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
