import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';

const AdminDashboard = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

      const myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Platform Engagement',
            data: [65, 59, 80, 81, 56, 85, 90],
            backgroundColor: gradient,
            borderColor: '#8B5CF6',
            borderWidth: 2,
            pointBackgroundColor: '#6C63FF',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#F8FAFC' }
            }
          },
          scales: {
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#94A3B8' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8' }
            }
          }
        }
      });

      return () => myChart.destroy();
    }
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold m-0"><span className="text-gradient">Admin</span> Intelligence</h2>
          <p className="text-muted">Platform analytics and management.</p>
        </div>
        <button className="neon-btn"><i className="bi bi-plus-lg me-2"></i>Create Event</button>
      </div>

      <div className="row g-4 mb-5">
        {[
          { title: 'Total Users', value: '1,245', icon: 'bi-people', inc: '+12%' },
          { title: 'Active Events', value: '48', icon: 'bi-calendar-event', inc: '+5%' },
          { title: 'Total Registrations', value: '8,402', icon: 'bi-check2-circle', inc: '+24%' },
          { title: 'AI Accuracy', value: '94%', icon: 'bi-robot', inc: '+2%' }
        ].map((stat, idx) => (
          <div className="col-md-6 col-lg-3" key={idx}>
            <motion.div whileHover={{ y: -5 }} className="glass-card p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="m-0 text-muted">{stat.title}</h6>
                <div className="p-2 rounded" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <i className={`bi ${stat.icon} text-gradient`}></i>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between">
                <h3 className="fw-bold m-0">{stat.value}</h3>
                <span className="text-success small fw-bold">{stat.inc} <i className="bi bi-arrow-up"></i></span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Chart */}
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <h5 className="fw-bold mb-4">Engagement Trends</h5>
            <div style={{ height: '300px' }}>
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-4">
          <div className="glass-card p-4 h-100">
            <h5 className="fw-bold mb-4">Recent Registrations</h5>
            <div className="d-flex flex-column gap-3">
              {[
                { name: 'Alice Chen', event: 'Web3 Summit', time: '2 mins ago' },
                { name: 'Mark Davis', event: 'AI Ethics', time: '15 mins ago' },
                { name: 'Sarah Wilson', event: 'Design Sprint', time: '1 hour ago' },
                { name: 'James Lee', event: 'Web3 Summit', time: '2 hours ago' },
              ].map((activity, idx) => (
                <div key={idx} className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div className="rounded-circle bg-gradient me-3" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="fw-bold text-white">{activity.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h6 className="m-0 fw-bold fs-6">{activity.name}</h6>
                    <small className="text-muted">{activity.event} • {activity.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
