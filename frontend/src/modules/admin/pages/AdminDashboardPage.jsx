import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../../../components/AdminDashboard';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';

export default function AdminDashboardPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const handleBackToSite = () => {
    sessionStorage.setItem('qnox_view_mode', 'public');
    window.location.hash = '';
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleShowToast = (payload, fallbackType = 'info') => {
    if (typeof payload === 'object' && payload !== null) {
      showToast({
        type: payload.type || fallbackType,
        title: payload.title,
        message: typeof payload.message === 'string' ? payload.message : (payload.message?.message || JSON.stringify(payload.message || payload)),
      });
    } else {
      showToast({
        type: fallbackType,
        message: String(payload || ''),
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <AdminDashboard
        currentUser={currentUser}
        onBackToSite={handleBackToSite}
        onLogout={handleLogout}
        onShowToast={handleShowToast}
      />
    </div>
  );
}
