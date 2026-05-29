import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="container-fluid p-0">
      {/* Hero Section */}
      <section className="d-flex align-items-center" style={{ minHeight: '90vh', position: 'relative' }}>
        <div className="position-absolute w-100 h-100 top-0 start-0" style={{ zIndex: -1 }}>
           {/* Decorative background blobs handled in index.css */}
        </div>
        
        <div className="container py-5">
          <div className="row align-items-center g-5">
            {/* Left Side (Text content) */}
            <div className="col-lg-7 text-start">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="badge glass-card px-3 py-2 mb-4 text-gradient pulse-glow" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-stars me-2"></i>AI-Powered Campus Experience
                </div>
                <h1 className="display-3 fw-bold mb-4" style={{ letterSpacing: '-1px', lineHeight: '1.2' }}>
                  Elevate Your <span className="text-gradient">Campus Life</span> <br/> with Intelligence.
                </h1>
                <p className="lead text-muted mb-0" style={{ maxWidth: '620px', fontSize: '1.25rem', lineHeight: '1.7' }}>
                  Discover events, join clubs, and get personalized AI recommendations tailored just for you. The future of campus engagement is here.
                </p>
              </motion.div>
            </div>

            {/* Right Side (Action Buttons stacked/nicely aligned) */}
            <div className="col-lg-5">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="d-flex flex-column gap-4 align-items-center align-items-lg-stretch mx-auto"
                style={{ maxWidth: '360px' }}
              >
                <Link to="/events" className="hero-glow-btn px-5 py-4 w-100 text-center fs-5 justify-content-center">
                  <i className="bi bi-calendar-event me-3"></i>Explore Events
                </Link>
                <Link to="/clubs" className="hero-glow-btn px-5 py-4 w-100 text-center fs-5 justify-content-center">
                  <i className="bi bi-diagram-3 me-3"></i>Explore Clubs
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Smarter Campus Engagement</h2>
            <p className="text-muted">Everything you need in one unified platform</p>
          </div>
          
          <div className="row justify-content-center g-4">
            {[
              { icon: 'bi-robot', title: 'AI Recommendations', desc: 'Smart event suggestions based on your interests and branch.' },
              { icon: 'bi-qr-code-scan', title: 'Smart Attendance', desc: 'Seamlessly mark attendance using QR codes at events.' },
              { icon: 'bi-graph-up-arrow', title: 'Analytics Dashboard', desc: 'Track your participation and engagement over time.' },
              { icon: 'bi-award', title: 'Automated Certificates', desc: 'Get instant certificates upon event completion.' },
              { icon: 'bi-calendar3', title: 'Smart Event Management', desc: 'Create, manage & track campus events seamlessly.' },
              { icon: 'bi-activity', title: 'Live Event Tracking', desc: 'Monitor registrations, attendance & engagement in real-time.' },
              { icon: 'bi-people-fill', title: 'Club Communities', desc: 'Join, manage and grow campus clubs effortlessly.' }
            ].map((feat, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="glass-card p-4 h-100 text-center animate-floating"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  <div className="d-inline-block p-3 rounded-circle mb-3" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <i className={`bi ${feat.icon} fs-2 text-gradient`}></i>
                  </div>
                  <h5 className="fw-bold mb-3">{feat.title}</h5>
                  <p className="text-muted small">{feat.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 border-top border-secondary mt-5" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="container text-center text-muted">
          <p className="mb-0">© 2026 CampusPulse Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
