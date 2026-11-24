import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import ClubsPage from './pages/ClubsPage';
import SanctuariesPage from './pages/SanctuariesPage';
import MembershipPage from './pages/MembershipPage';
import TimetablePage from './pages/TimetablePage';
import TrainersPage from './pages/TrainersPage';
import PressPage from './pages/PressPage';
import JoinAsTrainerPage from './pages/JoinAsTrainerPage';
import ApplicationStatusPage from './pages/ApplicationStatusPage';

// Modals & Dashboard
import TourModal from './components/TourModal';
import AuthModal from './components/AuthModal';
import MemberPortalModal from './components/MemberPortalModal';
import PaymentCheckoutModal from './components/PaymentCheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import TrainerDashboard from './components/TrainerDashboard/TrainerDashboard';
import Toast from './components/Toast';

import {
  fetchClubs,
  fetchSchedule,
  fetchMembershipPlans,
  fetchCurrentUser,
  logoutUser,
  getStoredUser,
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [clubs, setClubs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Modals state
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [selectedClubForTour, setSelectedClubForTour] = useState('');
  const [selectedTierForTour, setSelectedTierForTour] = useState('');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('member'); // 'member' | 'trainer'
  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isTrainerDashboardOpen, setIsTrainerDashboardOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  useEffect(() => {
    // Initial global data loading
    const loadInitialData = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        if (
          ['Admin', 'Super Admin'].includes(user.role) &&
          (window.location.hash === '#admin' || sessionStorage.getItem('qnox_view_mode') === 'admin')
        ) {
          setIsAdminDashboardOpen(true);
        } else if (
          user.role === 'Trainer' ||
          (user.role && window.location.hash === '#trainer') ||
          sessionStorage.getItem('qnox_view_mode') === 'trainer'
        ) {
          setIsTrainerDashboardOpen(true);
        }
      }

      const clubsData = await fetchClubs();
      if (clubsData) setClubs(clubsData);

      const scheduleData = await fetchSchedule();
      if (scheduleData) setClasses(scheduleData);

      const plansData = await fetchMembershipPlans();
      if (plansData) setPlans(plansData);
    };

    loadInitialData();

    // Global listener for Admin Suite invocation
    window.openAdminLogin = () => {
      const user = getStoredUser();
      if (user && ['Admin', 'Super Admin'].includes(user.role)) {
        setIsAdminDashboardOpen(true);
        sessionStorage.setItem('qnox_view_mode', 'admin');
        window.location.hash = '#admin';
      } else {
        setIsAuthModalOpen(true);
      }
    };

    return () => {
      delete window.openAdminLogin;
    };
  }, []);

  const showToast = ({ type = 'info', title, message }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenTourModal = (clubName = '', tierName = '') => {
    setSelectedClubForTour(clubName);
    setSelectedTierForTour(tierName);
    setIsTourModalOpen(true);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsAdminDashboardOpen(false);
    setIsTrainerDashboardOpen(false);
    setIsMemberPortalOpen(false);
    sessionStorage.removeItem('qnox_view_mode');
    window.location.hash = '';
    showToast({ type: 'info', message: 'Signed out of QNOX Sanctuary network.' });
  };

  const handleOpenAdminDashboard = () => {
    setIsAdminDashboardOpen(true);
    setIsTrainerDashboardOpen(false);
    sessionStorage.setItem('qnox_view_mode', 'admin');
    window.location.hash = '#admin';
  };

  const handleOpenTrainerDashboard = () => {
    setIsTrainerDashboardOpen(true);
    setIsAdminDashboardOpen(false);
    sessionStorage.setItem('qnox_view_mode', 'trainer');
    window.location.hash = '#trainer';
  };

  const handleBackToPublicSite = () => {
    setIsAdminDashboardOpen(false);
    setIsTrainerDashboardOpen(false);
    sessionStorage.setItem('qnox_view_mode', 'public');
    window.location.hash = '';
  };

  const handleSelectPlanForCheckout = (plan, duration = 'monthly') => {
    setSelectedPlanForCheckout({
      ...plan,
      defaultDuration: duration,
    });
  };

  // If Admin Dashboard is open, render full-screen Admin Command Center
  if (isAdminDashboardOpen && currentUser && ['Admin', 'Super Admin'].includes(currentUser.role)) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <AdminDashboard
          currentUser={currentUser}
          onBackToSite={handleBackToPublicSite}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </BrowserRouter>
    );
  }

  // If Trainer Dashboard is open or user is Trainer, render Coach Command Center
  if (
    isTrainerDashboardOpen ||
    (currentUser?.role === 'Trainer' && sessionStorage.getItem('qnox_view_mode') !== 'public')
  ) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <TrainerDashboard
          currentUser={currentUser}
          onBackToSite={handleBackToPublicSite}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[#050505] text-[#e5e5e5] selection:bg-[#c5a880] selection:text-black flex flex-col justify-between">
        {/* Universal Luxury Navigation */}
        <Navbar
          onOpenTourModal={handleOpenTourModal}
          currentUser={currentUser}
          onOpenAuth={(role = 'member') => {
            setAuthModalRole(role);
            setIsAuthModalOpen(true);
          }}
          onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
          onOpenAdmin={handleOpenAdminDashboard}
          onLogout={handleLogout}
        />

        {/* Client-Side Routed Main Pages */}
        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onOpenTourModal={handleOpenTourModal}
                  onSelectPlanForCheckout={handleSelectPlanForCheckout}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onShowToast={showToast}
                  clubs={clubs}
                  classes={classes}
                  plans={plans}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/clubs"
              element={<ClubsPage onOpenTourModal={handleOpenTourModal} />}
            />
            <Route
              path="/sanctuaries"
              element={<SanctuariesPage onOpenTourModal={handleOpenTourModal} />}
            />
            <Route
              path="/membership"
              element={
                <MembershipPage
                  onOpenTourModal={handleOpenTourModal}
                  onSelectPlanForCheckout={handleSelectPlanForCheckout}
                />
              }
            />
            <Route
              path="/timetable"
              element={
                <TimetablePage
                  currentUser={currentUser}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onShowToast={showToast}
                />
              }
            />
            <Route
              path="/trainers"
              element={<TrainersPage onOpenTourModal={handleOpenTourModal} />}
            />
            <Route
              path="/press"
              element={<PressPage onOpenTourModal={handleOpenTourModal} />}
            />
            <Route
              path="/join-as-trainer"
              element={
                <JoinAsTrainerPage
                  onShowToast={showToast}
                  onOpenTrainerLogin={() => {
                    setAuthModalRole('trainer');
                    setIsAuthModalOpen(true);
                  }}
                />
              }
            />
            <Route
              path="/trainer/application-status"
              element={<ApplicationStatusPage />}
            />
            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Universal Luxury Footer */}
        <Footer onOpenTourModal={handleOpenTourModal} />

        {/* Global Modals */}
        <TourModal
          isOpen={isTourModalOpen}
          onClose={() => setIsTourModalOpen(false)}
          defaultClub={selectedClubForTour}
          defaultTier={selectedTierForTour}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialRole={authModalRole}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            if (['Admin', 'Super Admin'].includes(user.role)) {
              setIsAdminDashboardOpen(true);
              sessionStorage.setItem('qnox_view_mode', 'admin');
              window.location.hash = '#admin';
              showToast({
                type: 'success',
                message: `Welcome to Executive Command Center, ${user.name}.`,
              });
            } else if (user.role === 'Trainer') {
              setIsTrainerDashboardOpen(true);
              sessionStorage.setItem('qnox_view_mode', 'trainer');
              window.location.hash = '#trainer';
              showToast({
                type: 'success',
                message: `Welcome to Coach Command Center, ${user.name}.`,
              });
            } else {
              showToast({ type: 'success', message: `Welcome to QNOX, ${user.name}.` });
            }
          }}
          onShowToast={showToast}
        />

        <MemberPortalModal
          isOpen={isMemberPortalOpen}
          onClose={() => setIsMemberPortalOpen(false)}
          user={currentUser}
          onRenewMembership={(planName, duration = 'monthly') => {
            const matchingPlan = plans.find((p) => p.name === planName) || plans[0];
            handleSelectPlanForCheckout(matchingPlan, duration);
          }}
          onShowToast={showToast}
        />

        {selectedPlanForCheckout && (
          <PaymentCheckoutModal
            isOpen={Boolean(selectedPlanForCheckout)}
            onClose={() => setSelectedPlanForCheckout(null)}
            plan={selectedPlanForCheckout}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSuccess={(resData) => {
              if (currentUser) {
                setCurrentUser((prev) => ({
                  ...prev,
                  membership: resData.membership,
                }));
              }
            }}
            onShowToast={showToast}
          />
        )}

        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </BrowserRouter>
  );
}
