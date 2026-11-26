import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TourModal from '../components/TourModal';
import AuthModal from '../components/AuthModal';
import PaymentCheckoutModal from '../components/PaymentCheckoutModal';
import MemberPortalModal from '../components/MemberPortalModal';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function PublicLayout() {
  const { currentUser, setCurrentUser, logout } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [selectedClubForTour, setSelectedClubForTour] = useState('');
  const [selectedTierForTour, setSelectedTierForTour] = useState('');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('member');
  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);

  const handleOpenTourModal = (clubName = '', tierName = '') => {
    setSelectedClubForTour(clubName);
    setSelectedTierForTour(tierName);
    setIsTourModalOpen(true);
  };

  const handleOpenAuth = (role = 'member') => {
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  const handleOpenAdmin = () => {
    sessionStorage.setItem('qnox_view_mode', 'admin');
    window.location.hash = '#admin';
    navigate('/admin');
  };

  const handleLogout = () => {
    logout();
    setIsMemberPortalOpen(false);
    showToast({ type: 'info', message: 'Signed out of QNOX Sanctuary network.' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] selection:bg-[#c5a880] selection:text-black flex flex-col justify-between">
      <Navbar
        onOpenTourModal={handleOpenTourModal}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        <Outlet
          context={{
            onOpenTourModal: handleOpenTourModal,
            onOpenAuth: handleOpenAuth,
            onOpenTrainerLogin: () => handleOpenAuth('trainer'),
            onSelectPlanForCheckout: (plan, duration = 'monthly') => {
              setSelectedPlanForCheckout({ ...plan, defaultDuration: duration });
            },
          }}
        />
      </main>

      <Footer
        onOpenTourModal={handleOpenTourModal}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuth={handleOpenAuth}
      />

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
          if (setCurrentUser) {
            setCurrentUser(user);
          }
          if (['Admin', 'Super Admin'].includes(user?.role)) {
            sessionStorage.setItem('qnox_view_mode', 'admin');
            window.location.hash = '#admin';
            navigate('/admin');
            showToast({
              type: 'success',
              message: `Welcome to Executive Command Center, ${user.name}.`,
            });
          } else if (user?.role === 'Trainer') {
            sessionStorage.setItem('qnox_view_mode', 'trainer');
            window.location.hash = '#trainer';
            navigate('/trainer');
            showToast({
              type: 'success',
              message: `Welcome to Coach Command Center, ${user.name}.`,
            });
          } else {
            showToast({ type: 'success', message: `Welcome to QNOX, ${user?.name}.` });
          }
        }}
        onShowToast={showToast}
      />

      <MemberPortalModal
        isOpen={isMemberPortalOpen}
        onClose={() => setIsMemberPortalOpen(false)}
        user={currentUser}
        onRenewMembership={() => {
          setIsMemberPortalOpen(false);
          navigate('/membership');
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
          onSuccess={() => {
            showToast({
              type: 'success',
              message: 'Sanctuary residency activated successfully.',
            });
          }}
          onShowToast={showToast}
        />
      )}
    </div>
  );
}
