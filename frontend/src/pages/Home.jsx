import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ExperienceVideoSection from '../components/ExperienceVideoSection';
import DisciplinesSection from '../components/DisciplinesSection';
import ClubsSection from '../components/ClubsSection';
import MembershipTiers from '../components/MembershipTiers';
import ScheduleSection from '../components/ScheduleSection';
import MasterTrainers from '../components/MasterTrainers';
import EditorialQuotes from '../components/EditorialQuotes';
import Footer from '../components/Footer';
import TourModal from '../components/TourModal';
import AuthModal from '../components/AuthModal';
import MemberPortalModal from '../components/MemberPortalModal';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';
import AdminDashboard from '../components/AdminDashboard';
import Toast from '../components/Toast';
import {
  fetchClubs,
  fetchSchedule,
  fetchMembershipPlans,
  fetchCurrentUser,
  logoutUser,
  getStoredUser
} from '../services/api';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [clubs, setClubs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Modals
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [selectedClubForTour, setSelectedClubForTour] = useState('');
  const [selectedTierForTour, setSelectedTierForTour] = useState('');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  useEffect(() => {
    // Initial Data Fetching
    const loadInitialData = async () => {
      // Authenticated User
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        // If already logged in as Admin and URL requests admin or previously in admin view
        if (['Admin', 'Super Admin'].includes(user.role) && (window.location.hash === '#admin' || sessionStorage.getItem('qnox_view_mode') === 'admin')) {
          setIsAdminDashboardOpen(true);
        }
      }

      // Clubs
      const clubsData = await fetchClubs();
      if (clubsData) setClubs(clubsData);

      // Classes
      const scheduleData = await fetchSchedule();
      if (scheduleData) setClasses(scheduleData);

      // Membership Plans
      const plansData = await fetchMembershipPlans();
      if (plansData) setPlans(plansData);
    };

    loadInitialData();

    // Global listener for Footer Admin shortcut
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
    setIsMemberPortalOpen(false);
    sessionStorage.removeItem('qnox_view_mode');
    window.location.hash = '';
    showToast({ type: 'info', message: 'Signed out of QNOX Sanctuary network.' });
  };

  const handleOpenAdminDashboard = () => {
    setIsAdminDashboardOpen(true);
    sessionStorage.setItem('qnox_view_mode', 'admin');
    window.location.hash = '#admin';
  };

  const handleBackToPublicSite = () => {
    setIsAdminDashboardOpen(false);
    sessionStorage.setItem('qnox_view_mode', 'public');
    window.location.hash = '';
  };

  // If Admin Dashboard is active, render full-screen Admin Command Center
  if (isAdminDashboardOpen && currentUser && ['Admin', 'Super Admin'].includes(currentUser.role)) {
    return (
      <>
        <AdminDashboard
          currentUser={currentUser}
          onBackToSite={handleBackToPublicSite}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] selection:bg-[#c5a880] selection:text-black">
      {/* Navigation */}
      <Navbar
        onOpenTourModal={handleOpenTourModal}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        onOpenAdmin={handleOpenAdminDashboard}
        onLogout={handleLogout}
      />

      {/* Main Sections */}
      <main>
        <Hero onOpenTourModal={handleOpenTourModal} />

        {/* The Red Room Workout Experience Video Showcase */}
        <ExperienceVideoSection onOpenTourModal={handleOpenTourModal} />

        {/* London Clubs Directory */}
        <ClubsSection clubs={clubs} onOpenTourModal={handleOpenTourModal} />

        {/* Curated Disciplines & Sanctuaries */}
        <DisciplinesSection onOpenTourModal={handleOpenTourModal} />

        {/* Membership Tiers & Razorpay Checkout */}
        <MembershipTiers
          plans={plans}
          onOpenTourModal={handleOpenTourModal}
          onSelectPlanForCheckout={(plan) => setSelectedPlanForCheckout(plan)}
        />

        {/* Live Daily Schedule */}
        <ScheduleSection
          classes={classes}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onShowToast={showToast}
        />

        {/* Master Trainers & Coaches */}
        <MasterTrainers onOpenTourModal={handleOpenTourModal} />

        {/* Press Quotes & Brand Ticker */}
        <EditorialQuotes />
      </main>

      {/* Luxury Footer */}
      <Footer onOpenTourModal={handleOpenTourModal} />

      {/* Private Tour Request Modal */}
      <TourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        defaultClub={selectedClubForTour}
        defaultTier={selectedTierForTour}
      />

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (['Admin', 'Super Admin'].includes(user.role)) {
            setIsAdminDashboardOpen(true);
            sessionStorage.setItem('qnox_view_mode', 'admin');
            window.location.hash = '#admin';
            showToast({ type: 'success', message: `Welcome to Executive Command Center, ${user.name}.` });
          } else {
            showToast({ type: 'success', message: `Welcome to QNOX, ${user.name}.` });
          }
        }}
        onShowToast={showToast}
      />

      {/* Member Portal Modal (Residency, Bookings, Receipts) */}
      <MemberPortalModal
        isOpen={isMemberPortalOpen}
        onClose={() => setIsMemberPortalOpen(false)}
        user={currentUser}
        onRenewMembership={(planName) => {
          const matchingPlan = plans.find((p) => p.name === planName) || plans[0];
          setSelectedPlanForCheckout(matchingPlan);
        }}
        onShowToast={showToast}
      />

      {/* Razorpay Membership Checkout Modal */}
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

      {/* Floating Luxury Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
