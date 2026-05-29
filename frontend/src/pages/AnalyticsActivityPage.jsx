import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import clubService from '../services/clubService';

const AnalyticsActivityPage = () => {
  const navigate = useNavigate();
  
  // Dashboard overall data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Table Tabs & Filters
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'EVENTS' | 'CLUBS'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterClub, setFilterClub] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [clubs, setClubs] = useState([]);
  
  // Directory Toggle
  const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(true);

  // All Registered Users list modal
  const [usersModalOpen, setUsersModalOpen] = useState(false);

  // Detailed Student Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [errorStudent, setErrorStudent] = useState(false);
  const [modalTab, setModalTab] = useState('events'); // 'events' or 'clubs'

  // Fetch telemetry data from backend
  const fetchCampusActivityData = (silent = false, club = filterClub) => {
    if (!silent) setLoading(true);
    analyticsService.getCampusActivity(club)
      .then(res => {
        if (res) {
          setData(res);
        } else {
          if (!silent) setError(true);
        }
      })
      .catch(err => {
        console.error("Error fetching campus activity analytics:", err);
        if (!silent) setError(true);
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    // Fetch all clubs dynamically once
    clubService.getAllClubs()
      .then(res => {
        if (res) {
          setClubs(res);
        }
      })
      .catch(err => console.error("Error loading clubs:", err));
  }, []);

  useEffect(() => {
    // Initial Load on filter change
    fetchCampusActivityData(false, filterClub);

    // Live real-time updates: dynamic database telemetry polling every 6 seconds
    const interval = setInterval(() => {
      fetchCampusActivityData(true, filterClub);
    }, 6000);

    return () => clearInterval(interval);
  }, [filterClub]);

  // Safe Date Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'TBA';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'TBA';
    }
  };

  // Safe Category Lookup helper
  const getCategoryData = (catName) => {
    const defaultVal = { category: catName, totalEvents: 0, totalParticipants: 0, attendanceCount: 0, totalClubs: 0, totalClubMembers: 0 };
    if (!data || !data.categoryAnalytics) return defaultVal;
    return data.categoryAnalytics.find(c => c.category?.toLowerCase() === catName.toLowerCase()) || defaultVal;
  };

  // Detailed student timeline overlay fetcher
  const handleRowClick = (studentId) => {
    if (!studentId) return;
    setSelectedStudentId(studentId);
    setLoadingStudent(true);
    setErrorStudent(false);
    setModalOpen(true);
    setModalTab('events');
    
    analyticsService.getStudentActivity(studentId)
      .then(res => {
        setStudentData(res);
      })
      .catch(err => {
        console.error("Error fetching student detailed metrics:", err);
        setErrorStudent(true);
      })
      .finally(() => {
        setLoadingStudent(false);
      });
  };

  // Clickable card navigation handles
  const handleCardClick = (tabType) => {
    setActiveTab(tabType);
    setTimeout(() => {
      document.getElementById('telemetry-directory')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border text-primary pulse-glow mb-4" role="status" style={{ width: '4rem', height: '4rem', color: '#a855f7' }}></div>
          <h4 className="text-light fw-bold">Connecting Global Campus Node...</h4>
          <p className="text-muted small">Loading real-time institutional activity tables</p>
        </div>
      </div>
    );
  }

  // Error Fallback
  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
          <div className="glass-card p-5 text-center border border-danger border-opacity-20" style={{ maxWidth: '500px' }}>
            <i className="bi bi-exclamation-triangle-fill text-danger display-3 mb-4 d-block"></i>
            <h3 className="fw-bold text-light mb-3">Telemetry Feed Offline</h3>
            <p className="text-muted mb-4">We were unable to establish a secure link with the dynamic multi-user registries. Please retry.</p>
            <div className="d-flex justify-content-center gap-3">
              <button onClick={() => fetchCampusActivityData(false)} className="neon-btn px-4">
                <i className="bi bi-arrow-clockwise me-2"></i>Reconnect
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light rounded-pill px-4">
                <i className="bi bi-house me-2"></i>Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract lists for dropdown filters dynamically from backend rows safely
  const activityRows = data?.activityRows || [];
  const uniqueEvents = [...new Set(activityRows.filter(r => r.type && r.type.startsWith('EVENT') && r.eventName).map(r => r.eventName))];

  // Apply tab selection, search, and dropdown filters
  const filteredActivityRows = activityRows.filter(row => {
    const matchesTab = activeTab === 'ALL' || 
                       (activeTab === 'EVENTS' && row.type && row.type.startsWith('EVENT')) || 
                       (activeTab === 'CLUBS' && row.type === 'CLUB');
                       
    const matchesSearch = row.studentName ? row.studentName.toLowerCase().includes(searchTerm.toLowerCase().trim()) : searchTerm === '';
    const matchesEvent = filterEvent === '' || row.eventName === filterEvent;
    const matchesClub = filterClub === '' || (row.clubName && row.clubName.toLowerCase().trim() === filterClub.toLowerCase().trim());
    const matchesCategory = filterCategory === '' || (row.eventCategory && row.eventCategory.toLowerCase().trim() === filterCategory.toLowerCase().trim());
    
    return matchesTab && matchesSearch && matchesEvent && matchesClub && matchesCategory;
  });

  // Embedded Page Styles
  const pageStyles = `
    .glass-card {
      background: rgba(20, 16, 38, 0.65);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    
    .text-gradient {
      background: linear-gradient(135deg, #00f2fe 0%, #4facfe 35%, #a855f7 70%, #d946ef 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .text-neon {
      color: #00ffcc !important;
      text-shadow: 0 0 10px rgba(0, 255, 204, 0.35);
    }

    .text-purple {
      color: #c084fc !important;
      text-shadow: 0 0 10px rgba(192, 132, 252, 0.35);
    }

    .text-cyan {
      color: #22d3ee !important;
      text-shadow: 0 0 10px rgba(34, 211, 238, 0.35);
    }

    .text-pink {
      color: #f43f5e !important;
      text-shadow: 0 0 10px rgba(244, 63, 94, 0.35);
    }

    .text-amber {
      color: #fbbf24 !important;
      text-shadow: 0 0 10px rgba(251, 191, 36, 0.35);
    }

    .text-emerald {
      color: #34d399 !important;
      text-shadow: 0 0 10px rgba(52, 211, 153, 0.35);
    }

    .neon-btn {
      background: linear-gradient(90deg, #6b21a8, #a855f7);
      border: none;
      color: white;
      font-weight: 600;
      border-radius: 50px;
      padding: 10px 24px;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
      transition: all 0.3s ease;
    }

    .neon-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.75);
    }

    .overflow-auto::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .overflow-auto::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
    }

    .overflow-auto::-webkit-scrollbar-thumb {
      background: rgba(168, 85, 247, 0.25);
      border-radius: 10px;
    }

    .overflow-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(168, 85, 247, 0.5);
    }

    .hover-glow-row {
      transition: all 0.2s ease-in-out;
      cursor: pointer;
    }

    .hover-glow-row:hover {
      background: rgba(168, 85, 247, 0.08) !important;
      box-shadow: inset 0 0 15px rgba(168, 85, 247, 0.1);
    }

    .live-pulse-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      background: rgba(52, 211, 153, 0.1);
      color: #34d399;
      border: 1px solid rgba(52, 211, 153, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #34d399;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.9);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
        box-shadow: 0 0 10px rgba(52, 211, 153, 0.8);
      }
      100% {
        transform: scale(0.9);
        opacity: 0.8;
      }
    }

    .attendance-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      font-weight: 700;
      color: #ffffff !important;
      border-radius: 20px;
      min-width: 95px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 0.72rem;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    
    .badge-attended {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(34, 197, 94, 0.5) 100%) !important;
    }
    
    .badge-joined {
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.5) 0%, rgba(34, 197, 94, 0.5) 100%) !important;
    }
    
    .badge-missed {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.5) 0%, rgba(225, 29, 72, 0.5) 100%) !important;
    }
    
    .badge-pending {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.5) 0%, rgba(217, 119, 6) 100%) !important;
    }
  `;

  return (
    <div className="container py-5">
      <style>{pageStyles}</style>

      {/* Header Area */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center">
          <button onClick={() => navigate('/dashboard')} className="btn btn-outline-light rounded-pill px-4 me-3">
            <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
          </button>
          <h2 className="fw-bold m-0 text-light">
            <i className="bi bi-globe text-gradient me-2"></i>Campus Activity Level
          </h2>
        </div>

        {/* Live Auto-Update Pulse Badge */}
        <div className="live-pulse-badge">
          <div className="pulse-dot"></div>
          <span>Live Telemetry Connection Online</span>
        </div>
      </div>
      <p className="text-muted mb-5">Complete Platform-Wide Academic Intelligence tracking engagement across all users, events, and clubs.</p>

      {/* THE 6 GLOBAL MULTI-USER ANALYTICS CARDS */}
      <div className="row g-4 mb-5">
        {/* Card 1: Total Registered Users (Click to Open Users List) */}
        <div className="col-lg-4 col-md-6">
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => setUsersModalOpen(true)}
            className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20"
            style={{ cursor: 'pointer', borderLeft: '3px solid #fbbf24' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Total Registered Users</h6>
              <div className="rounded p-2" style={{ background: 'rgba(251, 191, 36, 0.15)' }}>
                <i className="bi bi-people fs-4 text-amber"></i>
              </div>
            </div>
            <h2 className="fw-bold text-amber display-6 mb-2">{data.totalRegisteredUsers} Users</h2>
            <p className="text-muted small m-0"><i className="bi bi-arrow-right-short me-1"></i>Click to view directory roster</p>
          </motion.div>
        </div>

        {/* Card 2: Total Event Registrations (Click to filter table to Events) */}
        <div className="col-lg-4 col-md-6">
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => handleCardClick('EVENTS')}
            className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20"
            style={{ cursor: 'pointer', borderLeft: '3px solid #c084fc' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Total Event Registrations</h6>
              <div className="rounded p-2" style={{ background: 'rgba(192, 132, 252, 0.15)' }}>
                <i className="bi bi-calendar2-check-fill fs-4 text-purple"></i>
              </div>
            </div>
            <h2 className="fw-bold text-purple display-6 mb-2">{data.totalEventRegistrations} Joins</h2>
            <p className="text-muted small m-0"><i className="bi bi-funnel me-1"></i>Click to view event registrations</p>
          </motion.div>
        </div>

        {/* Card 3: Total Club Registrations (Click to filter table to Clubs) */}
        <div className="col-lg-4 col-md-6">
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => handleCardClick('CLUBS')}
            className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20"
            style={{ cursor: 'pointer', borderLeft: '3px solid #22d3ee' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Total Club Registrations</h6>
              <div className="rounded p-2" style={{ background: 'rgba(34, 211, 238, 0.15)' }}>
                <i className="bi bi-people-fill fs-4 text-cyan"></i>
              </div>
            </div>
            <h2 className="fw-bold text-cyan display-6 mb-2">{data.totalClubRegistrations} Joins</h2>
            <p className="text-muted small m-0"><i className="bi bi-funnel me-1"></i>Click to view club memberships</p>
          </motion.div>
        </div>

        {/* Card 4: Total Active Users */}
        <div className="col-lg-4 col-md-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20"
            style={{ borderLeft: '3px solid #34d399' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Total Active Users</h6>
              <div className="rounded p-2" style={{ background: 'rgba(52, 211, 153, 0.15)' }}>
                <i className="bi bi-lightning-charge fs-4 text-emerald"></i>
              </div>
            </div>
            <h2 className="fw-bold text-emerald display-6 mb-2">{data.totalActiveUsers} Active</h2>
            <p className="text-muted small m-0">Joined at least 1 club or event</p>
          </motion.div>
        </div>

        {/* Card 5: Most Popular Event Category */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20" style={{ borderLeft: '3px solid #f43f5e' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Top Category</h6>
              <div className="rounded p-2" style={{ background: 'rgba(244, 63, 94, 0.15)' }}>
                <i className="bi bi-tag fs-4 text-pink"></i>
              </div>
            </div>
            <h2 className="fw-bold text-pink display-6 mb-2 text-truncate" title={data.mostPopularCategory}>{data.mostPopularCategory || 'N/A'}</h2>
            <p className="text-muted small m-0">Highest participant count</p>
          </div>
        </div>

        {/* Card 6: Most Joined Club */}
        <div className="col-lg-4 col-md-6">
          <div className="glass-card p-4 h-100 position-relative overflow-hidden border border-secondary border-opacity-20" style={{ borderLeft: '3px solid #6366f1' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase fw-bold m-0" style={{ fontSize: '0.8rem' }}>Most Joined Club</h6>
              <div className="rounded p-2" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                <i className="bi bi-hexagon fs-4 text-primary-neon" style={{ color: '#6366f1' }}></i>
              </div>
            </div>
            <h2 className="fw-bold display-6 mb-2 text-truncate" style={{ color: '#a5b4fc' }} title={data.mostJoinedClub}>{data.mostJoinedClub || 'None'}</h2>
            <p className="text-muted small m-0">Largest community membership</p>
          </div>
        </div>
      </div>


      {/* CATEGORY-WISE ENGAGEMENT SUMMARY */}
      <h4 className="fw-bold mb-4 text-light">
        <i className="bi bi-grid-3x3-gap-fill text-gradient me-2"></i>Category Analytics Breakdown
      </h4>
      <div className="row row-cols-1 row-cols-md-3 row-cols-lg-5 g-4 mb-5">
        {['Technology', 'Design', 'Business', 'Social', 'Sports'].map((cat, idx) => {
          let catColor = '#2563eb';
          let icon = 'bi-cpu';
          if (cat === 'Design') { catColor = '#f43f5e'; icon = 'bi-palette'; }
          else if (cat === 'Business') { catColor = '#00f2fe'; icon = 'bi-briefcase'; }
          else if (cat === 'Social') { catColor = '#c084fc'; icon = 'bi-people'; }
          else if (cat === 'Sports') { catColor = '#fbbf24'; icon = 'bi-trophy'; }

          return (
            <div className="col" key={idx}>
              <div className="glass-card p-4 h-100 border border-secondary border-opacity-10" style={{ borderLeft: `3px solid ${catColor}` }}>
                <div className="d-flex align-items-center mb-3">
                  <i className={`bi ${icon} fs-4 me-2`} style={{ color: catColor }}></i>
                  <h6 className="m-0 fw-bold text-light">{cat}</h6>
                </div>
                <div className="d-grid gap-2 small">
                  <div className="d-flex justify-content-between text-muted">
                    <span>Total Events:</span>
                    <span className="text-light fw-semibold">{getCategoryData(cat).totalEvents}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Registrants:</span>
                    <span className="text-light fw-semibold">{getCategoryData(cat).totalParticipants}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Clubs:</span>
                    <span className="text-light fw-semibold">{getCategoryData(cat).totalClubs}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Club Members:</span>
                    <span className="text-light fw-semibold">{getCategoryData(cat).totalClubMembers}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted">
                    <span>Attended:</span>
                    <span className="text-light fw-semibold">{getCategoryData(cat).attendanceCount}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UNIFIED CHRONOLOGICAL TELEMETRY DIRECTORY */}
      <div id="telemetry-directory" className="glass-card overflow-hidden border border-secondary border-opacity-20 mb-5">
        <div className="p-4 bg-transparent border-bottom border-secondary border-opacity-10">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h4 className="fw-bold m-0 text-light">
                <i className="bi bi-table text-gradient me-2"></i>Global Telemetry Directory
              </h4>
              <span className="text-muted small"><i className="bi bi-info-circle me-1"></i>Click any student row to view their deep activity timelines</span>
            </div>
            <button 
              onClick={() => setIsTelemetryExpanded(!isTelemetryExpanded)}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-2 text-light hover-glow-row"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {isTelemetryExpanded ? (
                <><i className="bi bi-caret-up-fill"></i> Collapse</>
              ) : (
                <><i className="bi bi-caret-down-fill"></i> Expand</>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isTelemetryExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              {/* SEARCH CONTROLS */}
              <div className="p-4 bg-transparent border-bottom border-secondary border-opacity-10">
                <div className="row g-3">
            {/* Search Box */}
            <div className="col-12">
              <div className="input-group">
                <span className="input-group-text bg-dark border-secondary border-opacity-20 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-dark border-secondary border-opacity-20 text-light shadow-none" 
                  placeholder="Search student by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Directory Body */}
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle m-0 border-0">
            <thead className="bg-transparent border-bottom border-secondary border-opacity-30">
              <tr>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Student Name</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Joined Event</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Event Category</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Club Joined</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Attendance Status</th>
                <th className="py-3 px-4 text-muted small text-uppercase fw-bold border-0">Registration Date</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {filteredActivityRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted border-0">
                    <i className="bi bi-inbox fs-2 mb-2 d-block opacity-50"></i>
                    No activity logs found matching the directory parameters.
                  </td>
                </tr>
              ) : (
                filteredActivityRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className="border-bottom border-secondary border-opacity-10 hover-glow-row"
                    onClick={() => handleRowClick(row.studentId)}
                  >
                    <td className="py-3 px-4 border-0 fw-semibold text-light">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle p-2 bg-dark me-2 border border-secondary border-opacity-20 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-person text-purple"></i>
                        </div>
                        <div>
                          <span className="d-block">{row.studentName}</span>
                          <span className="text-muted small fw-normal">{row.studentEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 border-0 fw-medium text-light">{row.eventName || <span className="text-muted opacity-30">—</span>}</td>
                    <td className="py-3 px-4 border-0">
                      {row.eventCategory ? (
                        <span className="badge bg-secondary bg-opacity-20 text-muted" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>{row.eventCategory}</span>
                      ) : (
                        <span className="text-muted opacity-30">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 border-0 fw-semibold text-cyan">{row.clubName || <span className="text-muted opacity-30">—</span>}</td>
                    <td className="py-3 px-4 border-0">
                      <span className={`attendance-badge ${
                        row.attendanceStatus === 'ATTENDED' ? 'badge-attended' :
                        row.attendanceStatus === 'JOINED' ? 'badge-joined' :
                        row.attendanceStatus === 'MISSED' ? 'badge-missed' :
                        'badge-pending'
                      }`}>
                        {row.attendanceStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-0 text-muted small">{formatDate(row.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL 1: PLATFORM USERS ROSTER DIRECTORY */}
      <AnimatePresence>
        {usersModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop d-flex align-items-center justify-content-center"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(10, 8, 24, 0.88)',
              backdropFilter: 'blur(10px)',
              zIndex: 1050,
            }}
            onClick={() => setUsersModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-card p-4 overflow-hidden position-relative"
              style={{
                width: '90%',
                maxWidth: '650px',
                maxHeight: '80vh',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 20px 50px rgba(251, 191, 36, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(21, 16, 40, 0.96)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-4 border-bottom border-secondary border-opacity-10 pb-3">
                <div>
                  <h4 className="fw-bold text-light m-0"><i className="bi bi-people-fill text-amber me-2"></i>Campus Platform Directory</h4>
                  <p className="text-muted small m-0 mt-1">Catalog of all registered system participants.</p>
                </div>
                <button 
                  onClick={() => setUsersModalOpen(false)}
                  className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Roster Scroll pane */}
              <div className="flex-grow-1 overflow-auto pe-2" style={{ maxHeight: 'calc(80vh - 160px)' }}>
                {(!data.usersList || data.usersList.length === 0) ? (
                  <p className="text-muted text-center py-5">No user records found.</p>
                ) : (
                  <div className="d-grid gap-3">
                    {data.usersList.map((user) => (
                      <div 
                        key={user.id} 
                        className="p-3 rounded border border-secondary border-opacity-10 d-flex justify-content-between align-items-center hover-glow-row"
                        style={{ background: 'rgba(255,255,255,0.015)' }}
                        onClick={() => {
                          setUsersModalOpen(false);
                          handleRowClick(user.id);
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle p-2 bg-dark border border-warning border-opacity-20 d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                            <i className="bi bi-person-fill text-amber"></i>
                          </div>
                          <div>
                            <h6 className="m-0 fw-semibold text-light">{user.name}</h6>
                            <span className="text-muted small">{user.email}</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-secondary bg-opacity-20 text-muted border border-secondary border-opacity-30 me-2" style={{ fontSize: '0.7rem' }}>
                            {user.role}
                          </span>
                          <span className="text-amber small"><i className="bi bi-chevron-right"></i></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-top border-secondary border-opacity-10 pt-3 mt-4 text-end">
                <button onClick={() => setUsersModalOpen(false)} className="btn btn-outline-light rounded-pill px-4 shadow-none">
                  Dismiss Directory
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: INDIVIDUAL STUDENT TIMELINE MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop d-flex align-items-center justify-content-center"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(10, 8, 24, 0.88)',
              backdropFilter: 'blur(10px)',
              zIndex: 1050,
            }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-card p-4 overflow-hidden position-relative"
              style={{
                width: '92%',
                maxWidth: '850px',
                maxHeight: '90vh',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 20px 50px rgba(168, 85, 247, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(21, 16, 40, 0.96)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="d-flex justify-content-between align-items-start mb-4 border-bottom border-secondary border-opacity-10 pb-3">
                <div>
                  <h3 className="fw-bold text-light m-0">Student Engagement Timeline</h3>
                  <p className="text-muted small m-0 mt-1">Detailed registration activity profile for the selected student.</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px' }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Modal Scrollable Contents */}
              <div className="flex-grow-1 overflow-auto pe-2" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                {loadingStudent ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: '320px' }}>
                    <div className="spinner-border text-primary pulse-glow mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem', color: '#a855f7' }}></div>
                    <h5 className="text-light fw-bold">Parsing Student Intel...</h5>
                    <p className="text-muted small">Loading chronological engagement timelines</p>
                  </div>
                ) : errorStudent || !studentData ? (
                  <div className="text-center py-5">
                    <i className="bi bi-exclamation-triangle text-danger display-4 mb-3"></i>
                    <h5 className="text-light">Failed to compile student data</h5>
                    <p className="text-muted">A connection issue occurred when fetching data for student ID: {selectedStudentId}. Please try again.</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {/* Left Column: Stats & Gauge */}
                    <div className="col-md-5">
                      <div className="glass-card p-4 text-center border border-secondary border-opacity-10 h-100">
                        {/* Student Name */}
                        <div className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center border border-primary border-opacity-20 mb-3" style={{ width: '70px', height: '70px' }}>
                          <i className="bi bi-person-badge fs-2 text-gradient"></i>
                        </div>
                        <h4 className="fw-bold text-light mb-1">{studentData.studentName}</h4>
                        <p className="text-muted small mb-4">{studentData.studentEmail}</p>

                        {/* Participation Dial */}
                        <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.75rem' }}>Participation Index</h6>
                        <div className="position-relative d-inline-flex align-items-center justify-content-center mb-4">
                          <h1 className="fw-bold text-gradient m-0 display-4">{studentData.participationScore}%</h1>
                        </div>

                        {/* Progress Indicator */}
                        <div className="progress bg-dark mb-4" style={{ height: '10px', borderRadius: '10px' }}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ 
                              width: `${studentData.participationScore || 0}%`, 
                              background: 'linear-gradient(90deg, #6b21a8, #a855f7)',
                              borderRadius: '10px'
                            }}
                          ></div>
                        </div>

                        <div className="d-grid gap-2 text-start pt-3 border-top border-secondary border-opacity-10 small">
                          <div className="d-flex justify-content-between text-muted">
                            <span>Most Active Category:</span>
                            <span className="text-cyan fw-bold">{studentData.mostActiveCategory || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between text-muted">
                            <span>Events Registered:</span>
                            <span className="text-light fw-bold">{studentData.joinedEvents?.length || 0}</span>
                          </div>
                          <div className="d-flex justify-content-between text-muted">
                            <span>Events Attended:</span>
                            <span className="text-success fw-bold">{studentData.attendedEvents?.length || 0}</span>
                          </div>
                          <div className="d-flex justify-content-between text-muted">
                            <span>Clubs Joined:</span>
                            <span className="text-purple fw-bold">{studentData.joinedClubs?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Timelines */}
                    <div className="col-md-7">
                      <div className="glass-card p-4 border border-secondary border-opacity-10 h-100">
                        {/* Tab Headers */}
                        <div className="d-flex border-bottom border-secondary border-opacity-10 mb-4">
                          <button 
                            className={`btn flex-grow-1 fw-bold border-0 rounded-0 pb-2 shadow-none ${modalTab === 'events' ? 'text-purple border-bottom border-purple border-2' : 'text-muted'}`}
                            onClick={() => setModalTab('events')}
                          >
                            Registered Events ({studentData.joinedEvents?.length || 0})
                          </button>
                          <button 
                            className={`btn flex-grow-1 fw-bold border-0 rounded-0 pb-2 shadow-none ${modalTab === 'clubs' ? 'text-purple border-bottom border-purple border-2' : 'text-muted'}`}
                            onClick={() => setModalTab('clubs')}
                          >
                            Active Clubs ({studentData.joinedClubs?.length || 0})
                          </button>
                        </div>

                        {/* TAB 1: Registered Events */}
                        {modalTab === 'events' && (
                          <div className="d-grid gap-3 overflow-auto" style={{ maxHeight: '290px' }}>
                            {!studentData.joinedEvents || studentData.joinedEvents.length === 0 ? (
                              <div className="text-center text-muted py-5">
                                <i className="bi bi-calendar-x fs-2 mb-2 d-block opacity-45"></i>
                                <span className="small">This student hasn't registered for any events yet.</span>
                              </div>
                            ) : (
                              studentData.joinedEvents.map((evt, idx) => (
                                <div key={idx} className="p-3 rounded border border-secondary border-opacity-10" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="m-0 fw-semibold text-light">{evt.title}</h6>
                                      <span className="badge bg-secondary bg-opacity-20 text-muted mt-1" style={{ fontSize: '0.65rem' }}>{evt.category}</span>
                                    </div>
                                    <span className={`attendance-badge ${
                                      evt.attendanceStatus === 'ATTENDED' ? 'badge-attended' :
                                      evt.attendanceStatus === 'MISSED' ? 'badge-missed' :
                                      'badge-pending'
                                    }`} style={{ fontSize: '0.7rem' }}>
                                      {evt.attendanceStatus || 'PENDING'}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center mt-3 text-muted small">
                                    <span><i className="bi bi-calendar-event me-1"></i>Event: {formatDate(evt.date)}</span>
                                    <span>Reg: {formatDate(evt.registrationDate)}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* TAB 2: Active Clubs */}
                        {modalTab === 'clubs' && (
                          <div className="d-grid gap-3 overflow-auto" style={{ maxHeight: '290px' }}>
                            {!studentData.joinedClubs || studentData.joinedClubs.length === 0 ? (
                              <div className="text-center text-muted py-5">
                                <i className="bi bi-people fs-2 mb-2 d-block opacity-45"></i>
                                <span className="small">This student hasn't joined any clubs yet.</span>
                              </div>
                            ) : (
                              studentData.joinedClubs.map((club, idx) => (
                                <div key={idx} className="p-3 rounded border border-secondary border-opacity-10 d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                  <div>
                                    <h6 className="m-0 fw-semibold text-light">{club.name}</h6>
                                    <span className="badge bg-secondary bg-opacity-20 text-muted mt-1" style={{ fontSize: '0.65rem' }}>{club.category}</span>
                                  </div>
                                  <div className="text-end text-muted small">
                                    <span className="d-block">Joined Date</span>
                                    <span className="fw-medium text-light mt-1 d-block">{formatDate(club.joinedAt)}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-top border-secondary border-opacity-10 pt-3 mt-4 text-end">
                <button onClick={() => setModalOpen(false)} className="neon-btn px-4">
                  Dismiss Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyticsActivityPage;
