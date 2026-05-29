import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const AnalyticsDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboardStats()
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary"></div></div>;

  // 1. Event Analytics Charts
  const eventTrendsData = {
    labels: stats?.attendanceTrendsLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Registrations / Attendance Trends',
      data: stats?.attendanceTrendsData || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#6c63ff',
      backgroundColor: 'rgba(108, 99, 255, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  const eventCategoriesData = {
    labels: stats?.popularCategoriesLabels || ['Social', 'Business', 'Design', 'Technology'],
    datasets: [{
      label: 'Attendance by Category',
      data: stats?.popularCategoriesData || [0, 0, 0, 0],
      backgroundColor: ['#ff6584', '#6c63ff', '#4facfe', '#00f2fe']
    }]
  };

  // 2. Club Analytics Charts
  const clubTrendsData = {
    labels: stats?.clubJoinTrendsLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Club Membership Trends',
      data: stats?.clubJoinTrendsData || [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#00f2fe',
      backgroundColor: 'rgba(0, 242, 254, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  const popularClubsData = {
    labels: stats?.popularClubsLabels || ['No Clubs'],
    datasets: [{
      label: 'Total Club Members',
      data: stats?.popularClubsData || [0],
      backgroundColor: ['#6c63ff', '#4facfe', '#00f2fe', '#ff6584']
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#F8FAFC'
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#94A3B8'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94A3B8'
        }
      }
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4"><i className="bi bi-graph-up-arrow text-gradient me-2"></i>Analytics Intelligence</h2>
      <p className="text-muted mb-5">Real-time dynamic insights on campus events and club engagement.</p>

      {/* EVENT ANALYTICS SECTION */}
      <div className="mb-5">
        <h4 className="fw-bold mb-4 text-light d-flex align-items-center">
          <span className="p-2 rounded me-2 bg-gradient" style={{ background: 'rgba(108, 99, 255, 0.1)' }}>
            <i className="bi bi-calendar-event text-gradient"></i>
          </span>
          Event Intelligence & Attendance
        </h4>

        {/* Event Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card futuristic-glow-card p-4 text-center"
              onClick={() => navigate('/analytics/registrations')}
              style={{ cursor: 'pointer' }}
            >
              <h1 className="fw-bold text-gradient display-4">{stats?.totalUsers || 0}</h1>
              <p className="text-muted m-0">Total Students Registered</p>
            </motion.div>
          </div>
          <div className="col-md-4">
            <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4 text-center">
              <h1 className="fw-bold text-gradient display-4">{stats?.totalEvents || 0}</h1>
              <p className="text-muted m-0">Events Hosted</p>
            </motion.div>
          </div>
          <div className="col-md-4">
            <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4 text-center">
              <h1 className="fw-bold text-gradient display-4">{stats?.averageSatisfaction || '95%'}</h1>
              <p className="text-muted m-0">Average User Satisfaction</p>
            </motion.div>
          </div>
        </div>

        {/* Event Charts */}
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold mb-4">Attendance Over Time</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line data={eventTrendsData} options={chartOptions} />
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold mb-4">Popular Categories</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={eventCategoriesData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="my-5 border-secondary" style={{ opacity: 0.15 }} />

      {/* CLUB ANALYTICS SECTION */}
      <div>
        <h4 className="fw-bold mb-4 text-light d-flex align-items-center">
          <span className="p-2 rounded me-2 bg-gradient" style={{ background: 'rgba(0, 242, 254, 0.1)' }}>
            <i className="bi bi-people text-gradient"></i>
          </span>
          Club Communities & Join Trends
        </h4>

        {/* Club Stats Cards */}
        <div className="row g-4 mb-4 justify-content-center">
          <div className="col-md-6 col-lg-4">
            <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4 text-center">
              <h1 className="fw-bold text-gradient display-4">
                {stats?.totalClubMembers || 0}
              </h1>
              <p className="text-muted m-0">Total Club Memberships</p>
            </motion.div>
          </div>
          <div className="col-md-6 col-lg-4">
            <motion.div whileHover={{ y: -5 }} className="glass-card futuristic-glow-card p-4 text-center">
              <h1 className="fw-bold text-gradient display-4">
                {stats?.totalStudentsInClubs || 0}
              </h1>
              <p className="text-muted m-0">Unique Students in Clubs</p>
            </motion.div>
          </div>
        </div>

        {/* Club Charts */}
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold mb-4">Club Join Trends</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line data={clubTrendsData} options={chartOptions} />
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="glass-card p-4">
              <h5 className="fw-bold mb-4">Most Popular Clubs</h5>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={popularClubsData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
