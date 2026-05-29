import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'STUDENT'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.register(formData.name, formData.username, formData.email, formData.password, formData.role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center py-5" style={{ minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 w-100"
        style={{ maxWidth: '500px' }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
             <i className="bi bi-person-plus fs-1 text-gradient"></i>
          </div>
          <h2 className="fw-bold">Create Account</h2>
          <p className="text-muted">Join the intelligent campus network</p>
        </div>

        {error && <div className="alert alert-danger" style={{ background: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b', border: 'none' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-muted small">Full Name</label>
            <input 
              type="text" 
              name="name"
              className="form-control glow-input" 
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label text-muted small">Username</label>
            <input 
              type="text" 
              name="username"
              className="form-control glow-input" 
              placeholder="e.g. priyanshu_sharma"
              value={formData.username}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label text-muted small">Email Address</label>
            <input 
              type="email" 
              name="email"
              className="form-control glow-input" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label text-muted small">Password</label>
            <div className="password-toggle-container">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                className="form-control glow-input" 
                value={formData.password}
                onChange={handleChange}
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
          </div>
          <div className="mb-4">
            <label className="form-label text-muted small">Account Type</label>
            <select 
              name="role"
              className="form-select glow-input" 
              value={formData.role}
              onChange={handleChange}
              style={{ backgroundImage: 'none' }}
            >
              <option value="STUDENT" className="bg-dark text-light">Student</option>
              <option value="ORGANIZER" className="bg-dark text-light">Event Organizer</option>
            </select>
          </div>
          <button type="submit" className="neon-btn w-100 py-3 mb-3" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Sign Up
          </button>
          
          <div className="text-center mt-4">
            <p className="text-muted mb-0">Already have an account? <Link to="/login" className="text-gradient text-decoration-none fw-bold">Sign in</Link></p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
