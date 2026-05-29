import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const SmartAttendancePage = () => {
  const { user } = useAuth();
  const [scanned, setScanned] = useState(false);

  const simulateScan = () => {
    setScanned(true);
    setTimeout(() => {
      alert("Attendance marked successfully!");
      setScanned(false);
    }, 1500);
  };

  return (
    <div className="container py-5 text-center">
      <h2 className="fw-bold mb-4"><i className="bi bi-qr-code-scan text-gradient me-2"></i>Smart Attendance</h2>
      <p className="text-muted mb-5">Scan this QR code at any event terminal to mark your attendance.</p>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-5 d-inline-block mx-auto mb-4"
        onClick={simulateScan}
        style={{ cursor: 'pointer' }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="bg-white p-3 rounded-3 mb-3 d-inline-block">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user?.id || 'mock-id'}`} alt="My QR Code" />
        </div>
        <h5 className="fw-bold m-0">{user?.name}</h5>
        <p className="text-muted small m-0">{user?.email}</p>
        {scanned && <div className="mt-3 text-success"><div className="spinner-border spinner-border-sm me-2"></div>Processing scan...</div>}
      </motion.div>
      <p className="small text-muted">(Click the QR code to simulate a scan)</p>
    </div>
  );
};

export default SmartAttendancePage;
