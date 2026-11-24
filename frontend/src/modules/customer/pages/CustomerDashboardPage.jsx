import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberPortalModal from '../../../components/MemberPortalModal';
import { useAuth } from '../../../hooks/useAuth';
import { useNotifications } from '../../../hooks/useNotifications';

export default function CustomerDashboardPage() {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <MemberPortalModal
        isOpen={isOpen}
        onClose={handleClose}
        user={currentUser}
        onRenewMembership={() => {
          navigate('/membership');
        }}
        onShowToast={(toastObj) => showToast(toastObj)}
      />
    </div>
  );
}
