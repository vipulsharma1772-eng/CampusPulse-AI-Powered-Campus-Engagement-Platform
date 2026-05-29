import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';

const CertificateGenerator = ({ certificate, event, user }) => {
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600]
      });

      // Background Gradient
      doc.setFillColor(15, 10, 30);
      doc.rect(0, 0, 800, 600, 'F');
      
      // Border
      doc.setDrawColor(108, 99, 255);
      doc.setLineWidth(5);
      doc.rect(20, 20, 760, 560, 'S');
      
      // Inner Border
      doc.setDrawColor(0, 243, 255);
      doc.setLineWidth(1);
      doc.rect(30, 30, 740, 540, 'S');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(48);
      doc.setFont("times", "bold");
      doc.text("Certificate of Completion", 400, 150, { align: 'center' });

      // Subtitle
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(18);
      doc.setFont("helvetica", "normal");
      doc.text("This certifies that", 400, 220, { align: 'center' });

      // Name
      doc.setTextColor(0, 243, 255);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.text(user?.name || "Participant", 400, 280, { align: 'center' });

      // Body text
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text("has successfully attended and completed the event", 400, 340, { align: 'center' });

      // Event Name
      doc.setTextColor(108, 99, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text(event?.title || certificate?.title || "AI Event", 400, 400, { align: 'center' });

      // Date & Signatures
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Date: " + new Date(certificate?.issuedDate || Date.now()).toLocaleDateString(), 150, 500);
      
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      doc.line(600, 480, 700, 480);
      doc.text("CampusPulse Platform", 650, 500, { align: 'center' });

      // Save the PDF
      doc.save(`Certificate_${event?.title || 'Event'}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 text-center h-100 d-flex flex-column justify-content-center"
      style={{ border: '2px solid rgba(108, 99, 255, 0.2)' }}
    >
      <i className="bi bi-patch-check-fill text-gradient mb-3" style={{ fontSize: '4rem' }}></i>
      <h5 className="fw-bold">{event?.title || certificate?.title || 'Event Certificate'}</h5>
      <p className="text-muted small mb-4">
        Issued: {certificate?.issuedDate ? new Date(certificate?.issuedDate).toLocaleDateString() : new Date().toLocaleDateString()}
      </p>
      <button 
        className="neon-btn-outline mt-auto w-100" 
        onClick={generatePDF} 
        disabled={generating}
      >
        {generating ? (
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        ) : (
          <i className="bi bi-download me-2"></i>
        )}
        Download PDF
      </button>
    </motion.div>
  );
};

export default CertificateGenerator;
