import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ScrollToTop from './components/ScrollToTop';
import AppRoutes from './routes/AppRoutes';

function AppInitializer() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Hash & view mode detection for seamless backwards compatibility
    if (window.location.hash === '#admin' || sessionStorage.getItem('qnox_view_mode') === 'admin') {
      if (currentUser && ['Admin', 'Super Admin'].includes(currentUser.role)) {
        navigate('/admin');
      }
    } else if (window.location.hash === '#trainer' || sessionStorage.getItem('qnox_view_mode') === 'trainer') {
      if (currentUser && currentUser.role === 'Trainer') {
        navigate('/trainer');
      }
    }

    window.openAdminLogin = () => {
      sessionStorage.setItem('qnox_view_mode', 'admin');
      window.location.hash = '#admin';
      navigate('/admin');
    };

    return () => {
      delete window.openAdminLogin;
    };
  }, [currentUser, navigate]);

  return <AppRoutes />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ScrollToTop />
          <AppInitializer />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
