import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import AdminDashboard from './pages/AdminDashboard';
import EventsPage from './pages/EventsPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import SmartAttendancePage from './pages/SmartAttendancePage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import AnalyticsRegistrationsPage from './pages/AnalyticsRegistrationsPage';
import AnalyticsActivityPage from './pages/AnalyticsActivityPage';
import CertificatesPage from './pages/CertificatesPage';
import ClubManagementPage from './pages/ClubManagementPage';
import CreateClubPage from './pages/CreateClubPage';
import ClubDetailsPage from './pages/ClubDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailsPage from './pages/EventDetailsPage';
import MyEventsPage from './pages/MyEventsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChatPage from './pages/ChatPage';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roleRequired && user?.role !== roleRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      {!isAuthenticated && <Navbar publicMode={true} />}
      
      <div className="main-content" style={{ minHeight: '80vh' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/events/create" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />
          <Route path="/my-events" element={<ProtectedRoute><MyEventsPage /></ProtectedRoute>} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/recommendations" element={<ProtectedRoute><AIRecommendationsPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><SmartAttendancePage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboardPage /></ProtectedRoute>} />
          <Route path="/analytics/registrations" element={<ProtectedRoute><AnalyticsRegistrationsPage /></ProtectedRoute>} />
          <Route path="/analytics/activity" element={<ProtectedRoute><AnalyticsActivityPage /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
          <Route path="/clubs" element={<ProtectedRoute><ClubManagementPage /></ProtectedRoute>} />
          <Route path="/clubs/create" element={<ProtectedRoute><CreateClubPage /></ProtectedRoute>} />
          <Route path="/clubs/:id" element={<ProtectedRoute><ClubDetailsPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />

          <Route path="/admin" element={
            <ProtectedRoute roleRequired="ROLE_ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
      
      <ChatWidget />
    </Router>
  );
};

export default App;
