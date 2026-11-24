import React from 'react';
import { useNavigate } from 'react-router-dom';
import TrainerDashboard from '../components/TrainerDashboard';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function TrainerDashboardPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleBackToSite = () => {
    if (window.location.port === '3002') {
      window.location.href = 'http://localhost:3000';
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <TrainerDashboard
        currentUser={currentUser}
        onBackToSite={handleBackToSite}
        onLogout={handleLogout}
        onShowToast={(msg, type) => showToast({ type: type || 'info', message: msg })}
      />
    </div>
  );
}
