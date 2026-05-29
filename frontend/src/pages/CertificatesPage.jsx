import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import certificateService from '../services/certificateService';

const CertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = () => {
    setLoading(true);
    certificateService.getMyCertificates()
      .then(data => {
        console.log("Certificates fetched:", data);
        setCertificates(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDownload = async (id) => {
    try {
      const blob = await certificateService.downloadCertificate(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download certificate', e);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handlePreview = async (id) => {
    try {
      const blob = await certificateService.downloadCertificate(id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to preview certificate', e);
      alert('Failed to preview certificate. Please try again.');
    }
  };

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-award text-gradient me-2"></i>My Certificates</h2>
      <p className="text-muted mb-5">View and download your earned certificates for attended events.</p>
      
      <div className="row g-4">
        {certificates.length === 0 && (
          <div className="col-12 text-center py-5">
            <i className="bi bi-file-earmark-pdf display-1 text-muted mb-3 d-block"></i>
            <h4 className="text-muted">No certificates earned yet.</h4>
            <p className="text-muted">Join and complete events to earn certificates!</p>
          </div>
        )}
        {certificates.map((cert, idx) => (
          <div className="col-md-6 col-lg-4" key={cert.id}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-4 h-100 d-flex flex-column position-relative"
              style={{ border: '1px solid rgba(108, 99, 255, 0.2)' }}
            >
              <div className="position-absolute" style={{ top: '15px', right: '15px', opacity: 0.2 }}>
                <i className="bi bi-patch-check-fill display-4"></i>
              </div>
              <h5 className="fw-bold text-gradient mb-1" style={{ paddingRight: '50px' }}>{cert.eventName}</h5>
              <p className="text-muted small mb-3">Organized by {cert.clubName}</p>
              
              <div className="mb-4 mt-auto">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted small">Completion Date:</span>
                  <span className="fw-bold small">{cert.issuedDate}</span>
                </div>
                <div className="d-flex flex-column mb-2">
                  <span className="text-muted small">Certificate ID:</span>
                  <span className="font-monospace small opacity-75" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {cert.certificateNumber || cert.id}
                  </span>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-light flex-grow-1" 
                  onClick={() => handlePreview(cert.id)}
                >
                  <i className="bi bi-eye me-2"></i>Preview
                </button>
                <button 
                  className="neon-btn flex-grow-1" 
                  onClick={() => handleDownload(cert.id)}
                >
                  <i className="bi bi-download me-2"></i>Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CertificatesPage;
