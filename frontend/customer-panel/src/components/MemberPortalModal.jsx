import React, { useState, useEffect, useRef } from 'react';
import { X, User, Crown, Calendar, CreditCard, Clock, FileText, CheckCircle, AlertTriangle, ArrowRight, Shield, Camera, Bell, Check, Sparkles, Pause, Play, RefreshCw, Power, Zap, Dumbbell } from 'lucide-react';
import {
  fetchMyBookings,
  cancelClassBooking,
  fetchMyPayments,
  uploadImageFile,
  updateUserProfile,
  fetchMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchMyMembership,
  submitFreezeRequest,
  submitCancellationRequest,
  toggleAutoRenew,
  startFreeTrial,
} from '../services/api';
import ReceiptModal from './ReceiptModal';
import AiWorkoutModule from './WorkoutModule/AiWorkoutModule';
import './MemberPortalModal.css';

export default function MemberPortalModal({ isOpen, onClose, user, onRenewMembership, onShowToast }) {
  const [activeTab, setActiveTab] = useState('residency'); // 'residency' | 'bookings' | 'payments' | 'notifications'
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Membership Lifecycle & Management state
  const [membershipData, setMembershipData] = useState(null);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [freezeDays, setFreezeDays] = useState(30);
  const [freezeReason, setFreezeReason] = useState('Personal / Travel Leave');
  const [cancelReason, setCancelReason] = useState('');
  const [submittingLifecycle, setSubmittingLifecycle] = useState(false);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);

  const handleStartTrialFromPortal = async () => {
    setStartingTrial(true);
    try {
      const res = await startFreeTrial();
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
      await loadMembershipDetails();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setStartingTrial(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBookings();
      loadPayments();
      loadNotifications();
      loadMembershipDetails();
    }
  }, [isOpen]);

  const loadMembershipDetails = async () => {
    try {
      const data = await fetchMyMembership();
      if (data) {
        setMembershipData(data);
        setAutoRenewEnabled(data.autoRenew !== false);
      }
    } catch (err) {
      console.warn(err.message);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const res = await toggleAutoRenew();
      setAutoRenewEnabled(res.data.autoRenew);
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleFreezeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLifecycle(true);
    try {
      const res = await submitFreezeRequest({ freezeDays, reason: freezeReason });
      setShowFreezeModal(false);
      loadMembershipDetails();
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSubmittingLifecycle(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLifecycle(true);
    try {
      const res = await submitCancellationRequest({ reason: cancelReason });
      setShowCancelModal(false);
      loadMembershipDetails();
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSubmittingLifecycle(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetchMyNotifications();
      if (res && res.data) {
        setNotifications(res.data);
        setNotifUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.warn(err.message);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllNotificationsRead();
      loadNotifications();
      if (onShowToast) onShowToast({ type: 'success', message: 'All notifications marked as read.' });
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await fetchMyBookings();
      if (data) setBookings(data);
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);
    try {
      const data = await fetchMyPayments();
      if (data) setPayments(data);
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleCancelBooking = async (id, title) => {
    if (!window.confirm(`Are you certain you wish to cancel reservation for ${title}? Your reserved slot will be released back to the sanctuary waitlist.`)) {
      return;
    }

    try {
      await cancelClassBooking(id, 'Cancelled from Member Portal');
      if (onShowToast) onShowToast({ type: 'info', message: 'Reservation cancelled. Slot released.' });
      loadBookings();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message || 'Cancellation rejected.' });
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      let avatarUrl = '';
      try {
        const res = await uploadImageFile(file);
        if (res && res.url) avatarUrl = res.url;
      } catch (err) {
        // Fallback to local data URL
      }

      if (!avatarUrl) {
        avatarUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      await updateUserProfile({ avatar: avatarUrl });
      user.avatar = avatarUrl;
      if (onShowToast) onShowToast({ type: 'success', message: 'Profile photo updated successfully.' });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: 'Failed to update photo.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!isOpen || !user) return null;

  const membership = membershipData?.membership || user.membership || { status: 'None', planName: 'None' };
  const currentStatus = membershipData?.status || membership.status || 'None';
  const isFrozen = currentStatus === 'Frozen' || membership.isFrozen;
  const isSuspended = currentStatus === 'Suspended';
  const pendingRequest = membershipData?.pendingRequest;

  const now = new Date();
  const endDate = membership.endDate ? new Date(membership.endDate) : null;
  const startDate = membership.startDate ? new Date(membership.startDate) : null;

  const daysRemaining = membershipData?.daysRemaining !== undefined && membershipData?.daysRemaining !== null
    ? membershipData.daysRemaining
    : endDate
    ? Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpired = currentStatus === 'Expired' || (daysRemaining !== null && daysRemaining <= 0);
  const isExpiringSoon = !isExpired && !isFrozen && !isSuspended && (currentStatus === 'Expiring Soon' || (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7));
  const isActive = !isExpired && !isFrozen && !isSuspended && (currentStatus === 'Active' || isExpiringSoon);

  // 3-Day Free Trial calculations
  const trial = membershipData?.trial || user.trial || {};
  const isTrialActive = !isActive && trial.status === 'Active' && (trial.remainingMs > 0 || (trial.endDate && new Date(trial.endDate) > now));
  const isTrialExpired = !isActive && (trial.status === 'Expired' || (trial.endDate && new Date(trial.endDate) <= now));
  const canStartTrial = !isActive && !isTrialActive && !isTrialExpired && !trial.hasUsedTrial;

  return (
    <>
      <div className="qnox-portal-backdrop">
        <div className="qnox-portal-dialog">
          
          {/* Top Header Bar */}
          <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                className="relative w-14 h-14 rounded-full bg-[#181818] border border-[#c5a880]/60 flex items-center justify-center text-white font-serif text-lg font-bold overflow-hidden cursor-pointer group"
                title="Click to upload profile photo from computer"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-[#c5a880]" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h3 className="font-serif text-xl sm:text-2xl text-white">{user.name}</h3>
                  <span
                    className={`text-[9px] font-mono font-bold px-2.5 py-0.5 uppercase tracking-widest border ${
                      isTrialActive
                        ? 'border-emerald-400 bg-emerald-950/70 text-emerald-300 animate-pulse'
                        : isTrialExpired
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                        : isExpired
                        ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                        : isExpiringSoon
                        ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                        : isActive
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                        : 'border-white/20 bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    {isTrialActive
                      ? 'FREE TRIAL ACTIVE'
                      : isTrialExpired
                      ? 'FREE TRIAL EXPIRED'
                      : isExpired
                      ? 'EXPIRED'
                      : isExpiringSoon
                      ? 'EXPIRING SOON'
                      : isActive
                      ? 'ACTIVE'
                      : 'NO ACTIVE PLAN'}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                  {user.email} &bull; ID: QNX-{user.id ? user.id.slice(-6).toUpperCase() : 'MEMBER'}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                  className="text-[10px] text-[#c5a880] hover:text-white uppercase tracking-wider underline mt-0.5"
                >
                  {avatarUploading ? 'Uploading...' : 'Upload Profile Photo'}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 px-8 bg-[#070707] overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('residency')}
              className={`qnox-portal-tab ${activeTab === 'residency' ? 'active' : ''}`}
            >
              MY RESIDENCY
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`qnox-portal-tab relative flex items-center space-x-1.5 ${activeTab === 'workouts' ? 'active' : ''}`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>AI WORKOUTS & TRACKER</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`qnox-portal-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            >
              BOOKED SESSIONS ({bookings.filter(b => b.status === 'Confirmed').length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`qnox-portal-tab ${activeTab === 'payments' ? 'active' : ''}`}
            >
              INVOICES & RECEIPTS ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`qnox-portal-tab relative flex items-center space-x-1.5 ${activeTab === 'notifications' ? 'active' : ''}`}
            >
              <Bell className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>NOTIFICATIONS</span>
              {notifUnreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-rose-600 text-white font-bold rounded-full animate-pulse">
                  {notifUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="qnox-portal-content">
            
            {/* TAB 1: RESIDENCY */}
            {activeTab === 'residency' && (
              <div className="space-y-6">
                {/* Pending Request Banner */}
                {pendingRequest && (
                  <div className="bg-[#c5a880]/15 border border-[#c5a880]/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start space-x-3">
                      <Clock className="w-4 h-4 text-[#c5a880] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#c5a880] block">
                          CONCIERGE REVIEW PENDING: {pendingRequest.type.toUpperCase()} REQUEST
                        </span>
                        <p className="text-neutral-300 font-light mt-0.5">
                          Submitted on {new Date(pendingRequest.createdAt).toLocaleDateString('en-GB')}: &quot;{pendingRequest.reason}&quot;. Our executive team is processing your dossier.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-[#c5a880]/20 border border-[#c5a880]/40 text-[#c5a880] whitespace-nowrap">
                      STATUS: PENDING
                    </span>
                  </div>
                )}

                {/* Frozen Status Banner */}
                {isFrozen && (
                  <div className="bg-sky-950/40 border border-sky-400/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <Pause className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-sky-300 font-semibold mb-1">
                          Residency Currently Paused / Frozen
                        </h5>
                        <p className="text-xs text-sky-200/80 font-light leading-relaxed">
                          {membership.freezeDetails?.reason ? `Reason: "${membership.freezeDetails.reason}". ` : ''}
                          Your {membership.freezeDetails?.remainingDaysAtFreeze || daysRemaining || 0} remaining days are safeguarded. Contact executive concierge or admin to unfreeze anytime.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suspended Status Banner */}
                {isSuspended && (
                  <div className="bg-rose-950/40 border border-rose-500/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-rose-300 font-semibold mb-1">
                          Residency Privileges Suspended
                        </h5>
                        <p className="text-xs text-rose-200/80 font-light leading-relaxed">
                          {membership.suspensionDetails?.reason ? `Administrative note: "${membership.suspensionDetails.reason}". ` : ''}
                          Facility access has been paused. Please contact executive concierge to resolve your status.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expiring Soon Warning Banner */}
                {isExpiringSoon && (
                  <div className="bg-amber-950/40 border border-amber-500/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-amber-300 font-semibold mb-1">
                          Your membership is expiring soon. Renew now to continue your fitness journey.
                        </h5>
                        <p className="text-xs text-amber-200/80 font-light leading-relaxed">
                          {daysRemaining > 0 ? `Only ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining` : 'Expires today'} (Valid until {endDate?.toLocaleDateString('en-GB')}). Renew today to maintain uninterrupted access to our luxury London sanctuaries.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onRenewMembership(membership.planName || 'THE METROPOLITAN');
                      }}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex-shrink-0"
                    >
                      RENEW MEMBERSHIP
                    </button>
                  </div>
                )}

                {/* Expired Warning Banner */}
                {isExpired && (
                  <div className="bg-rose-950/40 border border-rose-500/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-rose-300 font-semibold mb-1">
                          Your membership has expired. Renew your plan to continue enjoying QNOX GYM facilities.
                        </h5>
                        <p className="text-xs text-rose-200/80 font-light leading-relaxed">
                          Your residency expired on {endDate ? endDate.toLocaleDateString('en-GB') : 'Past Expiry'}. Biometric access and facility reservations are on hold.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onRenewMembership(membership.planName || 'THE METROPOLITAN');
                      }}
                      className="px-5 py-2.5 bg-rose-500 hover:bg-white text-white hover:text-black text-xs font-bold uppercase tracking-wider transition whitespace-nowrap flex-shrink-0"
                    >
                      RENEW MEMBERSHIP
                    </button>
                  </div>
                )}

                {/* Active 3-Day Free Trial Banner */}
                {isTrialActive && (
                  <div className="bg-gradient-to-r from-emerald-950/60 via-[#0a1a12] to-emerald-950/60 border border-emerald-500/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-serif text-sm text-emerald-300 font-semibold">
                            Free Trial Active &bull; {trial.remainingHours || 0}h {trial.remainingMinutes || 0}m Remaining
                          </h5>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                            VIP PASS
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed mt-1">
                          Your 72-hour trial is active until {trial.endDate ? new Date(trial.endDate).toLocaleString('en-GB') : '72 hours'}. You have full access to class reservations, hydrotherapy spa, and sanctuary facilities.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onRenewMembership('THE METROPOLITAN');
                      }}
                      className="px-5 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider transition whitespace-nowrap flex-shrink-0 shadow-lg"
                    >
                      UPGRADE MEMBERSHIP
                    </button>
                  </div>
                )}

                {/* Expired Free Trial Banner */}
                {isTrialExpired && !isActive && (
                  <div className="bg-gradient-to-r from-rose-950/60 via-[#1a0a0a] to-rose-950/60 border border-rose-500/70 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-rose-300 font-semibold mb-1">
                          Free Trial Expired
                        </h5>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed">
                          Your 3-Day Free Trial has expired. Choose a membership plan to continue enjoying unrestricted access to our luxury London sanctuaries.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onRenewMembership('THE METROPOLITAN');
                      }}
                      className="px-5 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider transition whitespace-nowrap flex-shrink-0"
                    >
                      UPGRADE MEMBERSHIP
                    </button>
                  </div>
                )}

                {/* Eligible For Trial Banner (No Membership & Never Used Trial) */}
                {canStartTrial && (
                  <div className="bg-[#121212] border border-[#c5a880]/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <Zap className="w-5 h-5 text-[#c5a880] flex-shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <h5 className="font-serif text-sm text-[#c5a880] font-semibold mb-1">
                          Complimentary 3-Day Free Trial Available
                        </h5>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed">
                          Activate your 72-hour all-access sanctuary pass now with zero payment required.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStartTrialFromPortal}
                      disabled={startingTrial}
                      className="px-5 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider transition whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                    >
                      {startingTrial ? 'ACTIVATING...' : 'START 3-DAY FREE TRIAL'}
                    </button>
                  </div>
                )}

                {/* Main Residency Tier Dossier Card */}
                <div className="bg-[#101010] border border-white/10 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-semibold block mb-1">
                        CURRENT RESIDENCY TIER
                      </span>
                      <h4 className="font-serif text-3xl text-white mb-2">
                        {isActive
                          ? (membership.planName || 'Active Membership')
                          : isTrialActive
                          ? '3-Day VIP Sanctuary Trial'
                          : isTrialExpired
                          ? 'Free Trial (Expired)'
                          : (membership.planName && membership.planName !== 'None' ? membership.planName : 'No Active Membership')}
                      </h4>
                      <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-md">
                        {isActive
                          ? `Valid until ${endDate ? endDate.toLocaleDateString('en-GB') : 'Ongoing'}. Includes unlimited slate pool, altitude access, cryotherapy and concierge laundry.`
                          : isTrialActive
                          ? `Complimentary VIP sanctuary access active until ${trial.endDate ? new Date(trial.endDate).toLocaleString('en-GB') : '72 hours'}. Upgrade anytime to an annual or monthly plan.`
                          : isTrialExpired
                          ? 'Your 3-day sanctuary trial has concluded. Please select an official residency tier to restore master privileges.'
                          : isFrozen
                          ? 'Residency paused. Your remaining days will resume upon activation.'
                          : isSuspended
                          ? 'Residency currently suspended.'
                          : isExpired
                          ? `Residency ended on ${endDate ? endDate.toLocaleDateString('en-GB') : 'recently'}. Please renew your plan to restore full privileges.`
                          : 'You do not have an active membership residency. Start your 3-day trial or select a tier to gain access.'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isActive ? (
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">
                            {isExpiringSoon ? 'URGENT RENEWAL' : 'RENEWAL STATUS'}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onRenewMembership(membership.planName);
                            }}
                            className={`px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${
                              isExpiringSoon
                                ? 'bg-amber-400 hover:bg-white text-black'
                                : 'bg-[#c5a880] text-black hover:bg-white'
                            }`}
                          >
                            RENEW MEMBERSHIP
                          </button>
                        </div>
                      ) : isTrialActive || isTrialExpired ? (
                        <div className="text-right">
                          <span className="text-[10px] text-[#c5a880] uppercase tracking-widest block mb-2">
                            {isTrialActive ? 'ACTIVE TRIAL' : 'UPGRADE REQUIRED'}
                          </span>
                          <button
                            onClick={() => {
                              onClose();
                              onRenewMembership('THE METROPOLITAN');
                            }}
                            className="px-6 py-3 bg-[#c5a880] text-black hover:bg-white text-xs font-bold tracking-widest uppercase transition-colors shadow-lg"
                          >
                            UPGRADE MEMBERSHIP
                          </button>
                        </div>
                      ) : isExpired ? (
                        <div className="text-right">
                          <span className="text-[10px] text-rose-400 uppercase tracking-widest block mb-2">STATUS: EXPIRED</span>
                          <button
                            onClick={() => {
                              onClose();
                              onRenewMembership(membership.planName || 'THE METROPOLITAN');
                            }}
                            className="px-6 py-3 bg-rose-600 hover:bg-white text-white hover:text-black text-xs font-bold tracking-widest uppercase transition-colors"
                          >
                            RENEW MEMBERSHIP
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          {canStartTrial && (
                            <button
                              onClick={handleStartTrialFromPortal}
                              disabled={startingTrial}
                              className="px-5 py-3 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs font-bold tracking-widest uppercase transition-colors"
                            >
                              START 3-DAY TRIAL
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onRenewMembership('THE METROPOLITAN');
                            }}
                            className="px-6 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors"
                          >
                            UPGRADE MEMBERSHIP
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4-Stat Date & Remaining Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#0a0a0a] border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">START DATE</span>
                      <span className="text-white font-medium">
                        {startDate ? startDate.toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">EXPIRY DATE</span>
                      <span className="text-white font-medium">
                        {endDate ? endDate.toLocaleDateString('en-GB') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">REMAINING DAYS</span>
                      <span
                        className={`font-semibold ${
                          isExpired
                            ? 'text-rose-400'
                            : isExpiringSoon
                            ? 'text-amber-400'
                            : isFrozen
                            ? 'text-sky-400'
                            : 'text-[#c5a880]'
                        }`}
                      >
                        {isExpired
                          ? `Expired (${Math.abs(daysRemaining || 0)}d ago)`
                          : isFrozen
                          ? `${membership.freezeDetails?.remainingDaysAtFreeze || daysRemaining || 0}d (Frozen)`
                          : daysRemaining !== null
                          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                          : 'Ongoing'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">MEMBERSHIP STATUS</span>
                      <span
                        className={`font-bold ${
                          isExpired
                            ? 'text-rose-400'
                            : isSuspended
                            ? 'text-rose-400'
                            : isFrozen
                            ? 'text-sky-400'
                            : isExpiringSoon
                            ? 'text-amber-400'
                            : isActive
                            ? 'text-emerald-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {isExpired
                          ? 'EXPIRED'
                          : isSuspended
                          ? 'SUSPENDED'
                          : isFrozen
                          ? 'FROZEN'
                          : isExpiringSoon
                          ? 'EXPIRING SOON'
                          : isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Lifecycle Controls: Freeze / Cancel / Auto-Renew */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      {isActive && !isFrozen && (
                        <button
                          onClick={() => setShowFreezeModal(true)}
                          disabled={Boolean(pendingRequest)}
                          className="px-3.5 py-2 border border-sky-500/40 text-sky-400 hover:bg-sky-950/40 text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 disabled:opacity-40"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>REQUEST FREEZE</span>
                        </button>
                      )}

                      {(isActive || isFrozen) && (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          disabled={Boolean(pendingRequest)}
                          className="px-3.5 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 disabled:opacity-40"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>REQUEST CANCELLATION</span>
                        </button>
                      )}
                    </div>

                    {/* Auto-renew Switch */}
                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">
                        AUTO-RENEWAL: <strong className={autoRenewEnabled ? 'text-emerald-400' : 'text-neutral-500'}>{autoRenewEnabled ? 'ENABLED' : 'PAUSED'}</strong>
                      </span>
                      <button
                        onClick={handleToggleAutoRenew}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${autoRenewEnabled ? 'bg-[#c5a880]' : 'bg-neutral-800'}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${autoRenewEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Membership Privileges Checklist */}
                <div className="border border-white/10 p-6 bg-[#0c0c0c]">
                  <h5 className="text-xs tracking-[0.2em] uppercase text-[#c5a880] font-semibold mb-4">
                    SANCTUARY PRIVILEGES DOSSIER
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-300">
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-[#c5a880]" />
                      <span>Biometric Club Access: {isActive ? 'ACTIVE' : 'LOCKED'}</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-[#c5a880]" />
                      <span>25m Ozone Natural Slate Pools & Spa</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-[#c5a880]" />
                      <span>Hypoxic 3000 Altitude Suites</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle className="w-4 h-4 text-[#c5a880]" />
                      <span>Sub-Zero Cryotherapy (-110°C) Priority Booking</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOOKED SESSIONS */}
            {activeTab === 'bookings' && (
              <div>
                {loadingBookings ? (
                  <div className="py-12 text-center text-xs text-neutral-500 tracking-widest uppercase">
                    LOADING SANCTUARY RESERVATIONS...
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="py-12 text-center border border-white/10 bg-[#0e0e0e] p-8">
                    <p className="text-sm text-neutral-400 font-light mb-4">You have no active class reservations on record.</p>
                    <a
                      href="#timetable"
                      onClick={onClose}
                      className="inline-block px-5 py-2.5 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs font-semibold tracking-widest uppercase transition-colors"
                    >
                      BROWSE DAILY TIMETABLE
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((b) => (
                      <div
                        key={b._id}
                        className="bg-[#0f0f0f] border border-white/10 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="text-center shrink-0 border-r border-white/10 pr-4">
                            <span className="font-serif text-xl text-white block">{b.startTime}</span>
                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{b.day}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-[9px] px-2 py-0.5 bg-white/5 text-[#c5a880] uppercase tracking-wider">
                                {b.category}
                              </span>
                              <span className={`text-[9px] uppercase px-2 py-0.5 ${
                                b.status === 'Confirmed' ? 'text-emerald-400 bg-emerald-950/40' : 'text-neutral-500 bg-neutral-900'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <h5 className="font-serif text-lg text-white">{b.classTitle}</h5>
                            <p className="text-xs text-neutral-400">{b.clubName} &bull; {b.trainerName}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                          <div className="text-right">
                            <span className="text-[9px] text-neutral-500 uppercase tracking-widest block">PASS ID</span>
                            <span className="font-mono text-xs text-[#c5a880] font-bold">{b.reservationCode}</span>
                          </div>

                          {b.status === 'Confirmed' && (
                            <button
                              onClick={() => handleCancelBooking(b._id, b.classTitle)}
                              className="px-3.5 py-1.5 border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-[11px] tracking-wider uppercase transition-colors"
                            >
                              CANCEL
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: INVOICES & PAYMENTS */}
            {activeTab === 'payments' && (
              <div>
                {loadingPayments ? (
                  <div className="py-12 text-center text-xs text-neutral-500 tracking-widest uppercase">
                    LOADING FINANCIAL AUDIT TRAIL...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-12 text-center border border-white/10 bg-[#0e0e0e] p-8">
                    <p className="text-sm text-neutral-400 font-light">No billing invoices found under your dossier.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="bg-[#0f0f0f] border border-white/10 p-5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-mono text-xs text-[#c5a880] font-semibold">{p.invoiceNumber}</span>
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-950/60 text-emerald-400 uppercase tracking-widest">
                              {p.status}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-white">{p.planName} ({p.duration.toUpperCase()})</div>
                          <div className="text-xs text-neutral-500">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : 'Verified'} &bull; Order: {p.orderId}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="font-serif text-lg text-white font-bold">
                            ₹{p.amount?.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="px-4 py-2 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs font-semibold tracking-wider uppercase transition-colors flex items-center space-x-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>TAX INVOICE</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#c5a880] font-semibold block mb-0.5">
                      CONCIERGE DISPATCHES
                    </span>
                    <h4 className="font-serif text-xl text-white">Membership Alerts & Notices</h4>
                  </div>
                  {notifications.some((n) => !n.isRead) && (
                    <button
                      onClick={handleMarkAllNotifsRead}
                      className="px-3 py-1.5 border border-white/20 hover:border-white text-neutral-300 hover:text-white text-[11px] uppercase tracking-wider transition"
                    >
                      MARK ALL AS READ
                    </button>
                  )}
                </div>

                {loadingNotifs ? (
                  <div className="py-12 text-center text-neutral-500 font-mono text-xs">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="border border-white/10 bg-[#0c0c0c] p-10 text-center">
                    <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">No notifications at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => {
                      const isExpiry = notif.type?.startsWith('EXPIRY');
                      return (
                        <div
                          key={notif._id}
                          className={`border p-5 bg-[#0f0f0f] transition ${
                            !notif.isRead ? 'border-white/30 bg-[#121212]' : 'border-white/10'
                          }`}
                          style={{
                            borderLeftWidth: '4px',
                            borderLeftColor: isExpiry ? '#c5a880' : '#10b981',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" />
                              )}
                              <span className="font-serif text-base text-white font-semibold">
                                {notif.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300 font-light leading-relaxed mb-4">
                            {notif.message}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            {isExpiry ? (
                              <button
                                onClick={() => {
                                  onClose();
                                  onRenewMembership(membership.planName || 'THE METROPOLITAN');
                                }}
                                className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition flex items-center space-x-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>RENEW MEMBERSHIP</span>
                              </button>
                            ) : (
                              <span />
                            )}

                            {!notif.isRead && (
                              <button
                                onClick={() => handleMarkNotifRead(notif._id)}
                                className="text-[10px] text-neutral-400 hover:text-white uppercase tracking-wider underline"
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: AI WORKOUT ASSISTANT & LIVE TRACKER */}
            {activeTab === 'workouts' && (
              <AiWorkoutModule
                user={user}
                showToast={(msg, type) => {
                  if (onShowToast) onShowToast({ message: msg, type: type || 'success' });
                }}
              />
            )}

          </div>

        </div>
      </div>

      {/* Freeze Request Modal */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/20 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-sky-400 font-bold uppercase block">RESIDENCY SUSPENSION</span>
                <h4 className="font-serif text-lg text-white font-semibold">Request Membership Freeze</h4>
              </div>
              <button
                onClick={() => setShowFreezeModal(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Pause your residency without forfeiting your membership days. Remaining active days are banked and resume upon unfreezing.
            </p>

            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  FREEZE DURATION
                </label>
                <select
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                >
                  <option value={15}>15 Days (Short Leave)</option>
                  <option value={30}>30 Days (Standard Monthly Pause)</option>
                  <option value={45}>45 Days (Extended Leave)</option>
                  <option value={60}>60 Days (Maximum Policy Allowance)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  REASON FOR FREEZE
                </label>
                <textarea
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. International travel, medical recovery, executive reassignment..."
                  className="w-full bg-[#141414] border border-white/10 p-3 text-xs text-white focus:border-[#c5a880] outline-none resize-none font-light"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(false)}
                  className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingLifecycle}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submittingLifecycle ? (
                    <span>TRANSMITTING...</span>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>SUBMIT FREEZE REQUEST</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-rose-500/30 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-rose-400 font-bold uppercase block">RESIDENCY TERMINATION</span>
                <h4 className="font-serif text-lg text-white font-semibold">Request Cancellation</h4>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-light leading-relaxed">
              Notice: Cancelling your residency forfeits current locker allocation, grandfathered residency pricing, and biometric access to all London clubs upon approval.
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  PRIMARY REASON FOR DEPARTURE
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Please provide details regarding your departure..."
                  className="w-full bg-[#141414] border border-white/10 p-3 text-xs text-white focus:border-rose-400 outline-none resize-none font-light"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                >
                  KEEP MEMBERSHIP
                </button>
                <button
                  type="submit"
                  disabled={submittingLifecycle}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submittingLifecycle ? (
                    <span>PROCESSING...</span>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" />
                      <span>CONFIRM REQUEST</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}
    </>
  );
}
