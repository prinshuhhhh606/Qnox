import React, { useState, useEffect, useRef } from 'react';
import { X, User, Crown, Calendar, CreditCard, Clock, FileText, CheckCircle, AlertTriangle, ArrowRight, Shield, Camera, Bell, Check, Sparkles, Pause, Play, RefreshCw, Power, Zap, Dumbbell, QrCode } from 'lucide-react';
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
  fetchMyFreezeHistory,
  cancelMyFreezeRequest,
  fetchFreezePolicy,
  generateMyQRAccessPass,
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
  const [freezeDays, setFreezeDays] = useState(14);
  const [freezeReason, setFreezeReason] = useState('Travelling');
  const [freezeStartDate, setFreezeStartDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [freezeNotes, setFreezeNotes] = useState('');
  const [freezeDocUrl, setFreezeDocUrl] = useState('');
  const [freezeHistory, setFreezeHistory] = useState([]);
  const [loadingFreezeHistory, setLoadingFreezeHistory] = useState(false);

  // Digital Dynamic QR Access Pass State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrPassData, setQrPassData] = useState(null);
  const [loadingQrPass, setLoadingQrPass] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(90);

  const handleOpenQrPass = async () => {
    setShowQrModal(true);
    setLoadingQrPass(true);
    try {
      const res = await generateMyQRAccessPass();
      if (res && res.success && res.data) {
        setQrPassData(res.data);
        setQrTimeLeft(res.data.expiresInSeconds || 90);
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoadingQrPass(false);
    }
  };

  useEffect(() => {
    let timer = null;
    if (showQrModal && qrTimeLeft > 0) {
      timer = setInterval(() => {
        setQrTimeLeft((prev) => {
          if (prev <= 1) {
            handleOpenQrPass();
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQrModal, qrTimeLeft]);
  const [freezePolicy, setFreezePolicy] = useState({
    minDays: 7,
    maxDays: 30,
    annualLimit: 60,
    annualDaysUsed: 0,
    remainingAnnualDays: 60,
  });
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingLifecycle, setSubmittingLifecycle] = useState(false);
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);

  const loadFreezeData = async () => {
    setLoadingFreezeHistory(true);
    try {
      const [hist, pol] = await Promise.allSettled([
        fetchMyFreezeHistory(),
        fetchFreezePolicy(),
      ]);
      if (hist.status === 'fulfilled' && hist.value) {
        setFreezeHistory(hist.value);
      }
      if (pol.status === 'fulfilled' && pol.value) {
        setFreezePolicy(pol.value);
      }
    } catch (e) {
      console.warn('Failed loading freeze info:', e.message);
    } finally {
      setLoadingFreezeHistory(false);
    }
  };

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
      loadFreezeData();
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
      const res = await submitFreezeRequest({
        requestedStartDate: freezeStartDate,
        requestedDuration: Number(freezeDays),
        reason: freezeReason,
        additionalNotes: freezeNotes,
        supportingDocument: freezeDocUrl,
      });
      setShowFreezeModal(false);
      setFreezeNotes('');
      setFreezeDocUrl('');
      await Promise.all([loadMembershipDetails(), loadFreezeData()]);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || 'Your membership freeze request has been submitted successfully and is awaiting approval.',
        });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSubmittingLifecycle(false);
    }
  };

  const handleCancelPendingFreeze = async (reqId) => {
    if (!window.confirm('Are you sure you want to cancel this pending freeze request?')) return;
    setCancellingRequestId(reqId);
    try {
      const res = await cancelMyFreezeRequest(reqId);
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Freeze request cancelled successfully.' });
      await Promise.all([loadMembershipDetails(), loadFreezeData()]);
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setCancellingRequestId(null);
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
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a] flex-shrink-0">
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
          <div className="qnox-portal-tabs-nav flex items-center border-b border-white/10 px-4 sm:px-6 bg-[#070707] overflow-x-auto overflow-y-hidden flex-shrink-0 h-14 min-h-[56px] scrollbar-none">
            <button
              onClick={() => setActiveTab('residency')}
              className={`qnox-portal-tab whitespace-nowrap flex-shrink-0 h-full flex items-center justify-center px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                activeTab === 'residency' ? 'active' : ''
              }`}
            >
              <span>MY RESIDENCY</span>
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`qnox-portal-tab whitespace-nowrap flex-shrink-0 h-full flex items-center justify-center px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                activeTab === 'workouts' ? 'active' : ''
              }`}
            >
              <Dumbbell className="w-4 h-4 text-[#c5a880] mr-2 flex-shrink-0" />
              <span>AI WORKOUTS & TRACKER</span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`qnox-portal-tab whitespace-nowrap flex-shrink-0 h-full flex items-center justify-center px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                activeTab === 'bookings' ? 'active' : ''
              }`}
            >
              <span>BOOKED SESSIONS ({bookings.filter(b => b.status === 'Confirmed').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`qnox-portal-tab whitespace-nowrap flex-shrink-0 h-full flex items-center justify-center px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                activeTab === 'payments' ? 'active' : ''
              }`}
            >
              <span>INVOICES & RECEIPTS ({payments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`qnox-portal-tab whitespace-nowrap flex-shrink-0 h-full flex items-center justify-center px-4 sm:px-5 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                activeTab === 'notifications' ? 'active' : ''
              }`}
            >
              <Bell className="w-4 h-4 text-[#c5a880] mr-2 flex-shrink-0" />
              <span>NOTIFICATIONS</span>
              {notifUnreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-rose-600 text-white font-bold rounded-full animate-pulse">
                  {notifUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="qnox-portal-content flex-1 min-h-0 overflow-y-auto p-5 sm:p-7">
            
            {/* TAB 1: RESIDENCY */}
            {activeTab === 'residency' && (
              <div className="space-y-6">
                {/* Dynamic Status Banners */}
                {membershipData?.activeFreezeRequest?.status === 'Pending' && (
                  <div className="bg-amber-950/40 border border-amber-500/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="flex items-start space-x-3.5">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 block font-serif text-sm">
                          PENDING FREEZE APPROVAL: REQUEST #{membershipData.activeFreezeRequest.requestId}
                        </span>
                        <p className="text-neutral-300 font-light mt-1 leading-relaxed">
                          Requested pause of <strong className="text-white">{membershipData.activeFreezeRequest.requestedDuration} days</strong> starting on <strong className="text-white">{new Date(membershipData.activeFreezeRequest.requestedStartDate).toLocaleDateString('en-GB')}</strong> ({membershipData.activeFreezeRequest.reason}).
                          Your membership remains <strong className="text-emerald-400">ACTIVE</strong> until approved start date.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-amber-950 border border-amber-500/50 text-amber-300 whitespace-nowrap">
                      STATUS: PENDING REVIEW
                    </span>
                  </div>
                )}

                {membershipData?.activeFreezeRequest?.status === 'Approved' && (
                  <div className="bg-sky-950/40 border border-sky-400/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="flex items-start space-x-3.5">
                      <Pause className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-sky-300 block font-serif text-sm">
                          APPROVED FREEZE SCHEDULED: REQUEST #{membershipData.activeFreezeRequest.requestId}
                        </span>
                        <p className="text-sky-200/90 font-light mt-1 leading-relaxed">
                          Your freeze of <strong className="text-white">{membershipData.activeFreezeRequest.approvedDuration || membershipData.activeFreezeRequest.requestedDuration} days</strong> is approved and scheduled from <strong className="text-white">{new Date(membershipData.activeFreezeRequest.scheduledStartDate).toLocaleDateString('en-GB')}</strong> to <strong className="text-white">{new Date(membershipData.activeFreezeRequest.scheduledEndDate).toLocaleDateString('en-GB')}</strong>.
                          Your membership privileges remain <strong className="text-emerald-400">ACTIVE</strong> until {new Date(membershipData.activeFreezeRequest.scheduledStartDate).toLocaleDateString('en-GB')}.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-sky-950 border border-sky-400/50 text-sky-300 whitespace-nowrap">
                      STATUS: SCHEDULED
                    </span>
                  </div>
                )}

                {/* Frozen Status Banner */}
                {isFrozen && (
                  <div className="bg-sky-950/60 border border-sky-400 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <Pause className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-serif text-sm text-sky-300 font-semibold mb-1">
                          Residency Currently Paused / Frozen
                        </h5>
                        <p className="text-xs text-sky-200/90 font-light leading-relaxed">
                          {membership.freezeDetails?.reason ? `Reason: "${membership.freezeDetails.reason}". ` : ''}
                          Your {membership.freezeDetails?.remainingDaysAtFreeze || daysRemaining || 0} remaining paid days are safeguarded and will be added back upon unfreezing. Biometric club access and new session bookings are temporarily suspended.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-sky-900 border border-sky-400 text-sky-200 whitespace-nowrap">
                      STATUS: FROZEN
                    </span>
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
                          type="button"
                          onClick={() => {
                            if (membershipData?.activeFreezeRequest?.status === 'Pending') {
                              if (onShowToast) onShowToast({
                                type: 'info',
                                message: `Freeze request #${membershipData.activeFreezeRequest.requestId || ''} is already pending concierge review.`
                              });
                              return;
                            }
                            setShowFreezeModal(true);
                          }}
                          className="px-3.5 py-2 border border-sky-500/40 text-sky-400 hover:bg-sky-950/40 hover:border-sky-400 text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>REQUEST FREEZE</span>
                        </button>
                      )}

                      {(isActive || isFrozen) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (membershipData?.pendingRequest && membershipData.pendingRequest.type === 'Cancellation') {
                              if (onShowToast) onShowToast({
                                type: 'info',
                                message: 'A cancellation request is already pending concierge review.'
                              });
                              return;
                            }
                            setShowCancelModal(true);
                          }}
                          className="px-3.5 py-2 border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 hover:border-rose-400 text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>REQUEST CANCELLATION</span>
                        </button>
                      )}

                      {(isActive || isTrialActive) && (
                        <button
                          type="button"
                          onClick={handleOpenQrPass}
                          className="px-3.5 py-2 border border-[#c5a880]/50 text-[#c5a880] hover:bg-[#c5a880]/10 hover:border-[#c5a880] text-xs font-semibold tracking-wider uppercase transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>DIGITAL ACCESS PASS</span>
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

                {/* Freeze Request History */}
                <div className="border border-white/10 p-6 bg-[#0c0c0c] space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-sky-400 font-semibold block">
                        MEMBERSHIP LIFECYCLE
                      </span>
                      <h5 className="font-serif text-base text-white font-medium">
                        Freeze Request History & Annual Quota
                      </h5>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Annual Used: <span className="text-white font-bold">{freezePolicy.annualDaysUsed || 0}</span> / {freezePolicy.annualLimit || 60} Days
                      <span className="text-sky-400 ml-2">({freezePolicy.remainingAnnualDays !== undefined ? freezePolicy.remainingAnnualDays : 60}d remaining)</span>
                    </div>
                  </div>

                  {loadingFreezeHistory ? (
                    <div className="py-6 text-center text-xs text-neutral-500 font-mono tracking-widest uppercase">
                      Loading freeze records...
                    </div>
                  ) : freezeHistory.length === 0 ? (
                    <p className="text-xs text-neutral-500 font-light italic">
                      No membership freeze requests on record.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="text-[9px] uppercase tracking-wider text-neutral-500 border-b border-white/10">
                          <tr>
                            <th className="pb-2">Request ID</th>
                            <th className="pb-2">Start Date</th>
                            <th className="pb-2">Duration</th>
                            <th className="pb-2">Reason</th>
                            <th className="pb-2">Submitted</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Action / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-neutral-300">
                          {freezeHistory.map((item) => (
                            <tr key={item._id || item.requestId} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 text-[#c5a880] font-bold">{item.requestId || 'FRZ-N/A'}</td>
                              <td className="py-2.5">
                                {item.scheduledStartDate
                                  ? new Date(item.scheduledStartDate).toLocaleDateString('en-GB')
                                  : item.requestedStartDate
                                  ? new Date(item.requestedStartDate).toLocaleDateString('en-GB')
                                  : 'N/A'}
                              </td>
                              <td className="py-2.5">
                                {item.approvedDuration ? `${item.approvedDuration}d (Approved)` : `${item.requestedDuration}d (Req)`}
                              </td>
                              <td className="py-2.5 text-neutral-400">{item.reason}</td>
                              <td className="py-2.5 text-neutral-500">
                                {new Date(item.createdAt).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-2.5">
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                    item.status === 'Pending'
                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                      : item.status === 'Approved'
                                      ? 'bg-sky-950/60 text-sky-300 border border-sky-400/50'
                                      : item.status === 'Frozen'
                                      ? 'bg-blue-950/70 text-blue-300 border border-blue-400'
                                      : item.status === 'Resumed'
                                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                      : item.status === 'Rejected'
                                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                      : 'bg-neutral-900 text-neutral-400 border border-neutral-700'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                {item.status === 'Pending' ? (
                                  <button
                                    onClick={() => handleCancelPendingFreeze(item._id)}
                                    disabled={cancellingRequestId === item._id}
                                    className="text-[10px] text-rose-400 hover:text-white uppercase tracking-wider underline disabled:opacity-50"
                                  >
                                    {cancellingRequestId === item._id ? 'Cancelling...' : 'Cancel'}
                                  </button>
                                ) : item.adminRemarks || item.rejectionReason ? (
                                  <span className="text-[10px] text-neutral-400 italic max-w-xs truncate inline-block" title={item.adminRemarks || item.rejectionReason}>
                                    {item.adminRemarks || item.rejectionReason}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-600">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
        <div className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e0e0e] border border-[#c5a880]/40 w-full max-w-xl p-6 sm:p-7 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-sky-400 font-bold uppercase block">
                  RESIDENCY SUSPENSION PROTOCOL
                </span>
                <h4 className="font-serif text-xl text-white font-semibold">
                  Membership Freeze Dossier
                </h4>
              </div>
              <button
                onClick={() => setShowFreezeModal(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-light leading-relaxed">
              Safeguard your paid residency during travel or recovery. Submitting this request keeps your membership <strong className="text-emerald-400">ACTIVE</strong> until the approved freeze start date. Once approved, frozen days are not deducted and will be credited back on resumption.
            </p>

            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              {/* Pre-filled Read-Only Membership Information */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#080808] border border-white/10 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">1. Member Name</span>
                  <span className="text-white font-medium truncate block">{user.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">2. Member ID</span>
                  <span className="text-[#c5a880] font-bold truncate block">
                    {user.memberId || `QNX-${user.id ? user.id.slice(-6).toUpperCase() : 'MEMBER'}`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">3. Membership Plan</span>
                  <span className="text-white font-medium truncate block">{membership.planName || 'THE METROPOLITAN'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">4. Assigned Club</span>
                  <span className="text-neutral-300 truncate block">{user.homeClubName || 'Mayfair Sanctuary'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">5. Plan Start Date</span>
                  <span className="text-neutral-300 block">{startDate ? startDate.toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-500 uppercase block">6. Current Expiry Date</span>
                  <span className="text-neutral-300 block">{endDate ? endDate.toLocaleDateString('en-GB') : 'N/A'}</span>
                </div>
              </div>

              {/* Editable Requested Dates and Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                    7. REQUESTED FREEZE START DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={freezeStartDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={endDate ? new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                    onChange={(e) => setFreezeStartDate(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                  />
                  <span className="text-[9px] text-neutral-500 block mt-1">
                    Membership remains Active until this date
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                      8. FREEZE DURATION ({freezeDays} DAYS) *
                    </label>
                    <span className="text-[9px] text-sky-400 font-mono">
                      Annual quota: {freezePolicy.annualLimit || 60}d max ({freezePolicy.remainingAnnualDays !== undefined ? freezePolicy.remainingAnnualDays : 60}d left)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={freezePolicy.minDays || 7}
                    max={Math.min(freezePolicy.maxDays || 30, freezePolicy.remainingAnnualDays || 30)}
                    value={freezeDays}
                    onChange={(e) => setFreezeDays(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-0.5">
                    <span>Min: 7 days</span>
                    <span className="text-sky-300 font-bold">{freezeDays} Days Selected</span>
                    <span>Max: 30 days</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                  9. FREEZE REASON *
                </label>
                <select
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 px-3 py-2 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                >
                  <option value="Travelling">Travelling</option>
                  <option value="Medical">Medical</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Work Commitments">Work Commitments</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                  10. ADDITIONAL NOTES (OPTIONAL)
                </label>
                <textarea
                  value={freezeNotes}
                  onChange={(e) => setFreezeNotes(e.target.value)}
                  rows={2}
                  placeholder="Provide any specific context or travel dates for concierge review..."
                  className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none resize-none font-light"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
                  11. SUPPORTING DOCUMENT (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={freezeDocUrl}
                  onChange={(e) => setFreezeDocUrl(e.target.value)}
                  placeholder="Medical slip, flight itinerary link, or document reference..."
                  className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(false)}
                  className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submittingLifecycle || (freezePolicy.remainingAnnualDays !== undefined && freezePolicy.remainingAnnualDays < freezeDays)}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-40"
                >
                  {submittingLifecycle ? (
                    <span>TRANSMITTING DOSSIER...</span>
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
        <div className="fixed inset-0 z-[2000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
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

      {/* Dynamic Digital QR Access Pass Modal (Phase 3: All-Access Network) */}
      {showQrModal && (
        <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0b0b] border border-[#c5a880]/60 max-w-sm w-full p-6 text-white text-center shadow-2xl relative rounded-xl animate-fadeIn">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white border border-white/10 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-block px-3 py-1 bg-[#c5a880]/10 border border-[#c5a880]/40 text-[#c5a880] text-[10px] font-mono uppercase tracking-widest rounded-full mb-3">
              Dynamic Anti-Replay Token
            </div>

            <h3 className="font-serif text-xl font-bold mb-1">{user?.name}</h3>
            <p className="text-xs text-neutral-400 font-mono mb-4">
              ID: QNX-{user?.id ? user.id.slice(-6).toUpperCase() : 'MEMBER'} &bull; {qrPassData?.membershipTier || 'RESIDENCY'}
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-xl mx-auto w-56 h-56 flex items-center justify-center shadow-inner">
              {loadingQrPass ? (
                <div className="text-black text-xs font-mono animate-pulse flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#c5a880]" />
                  <span>Generating Secure Pass...</span>
                </div>
              ) : qrPassData?.qrCodeUrl ? (
                <img
                  src={qrPassData.qrCodeUrl}
                  alt="Access QR Pass"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPassData?.qrToken || 'QNOX-MEMBER-PASS')}`}
                  alt="Dynamic QR Code"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Countdown timer */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono">
              <Clock className="w-4 h-4 text-[#c5a880]" />
              <span className="text-neutral-300">
                Auto-rotates in: <strong className="text-amber-400">{qrTimeLeft}s</strong>
              </span>
            </div>

            <div className="mt-4 p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg text-left text-[11px] text-neutral-400 space-y-1">
              <div className="flex justify-between">
                <span>Access Scope:</span>
                <strong className="text-white">{qrPassData?.accessType || 'All-Access Network'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Home Club:</span>
                <strong className="text-white">{qrPassData?.homeClub || 'Mayfair Sanctuary'}</strong>
              </div>
            </div>

            <button
              onClick={handleOpenQrPass}
              className="mt-4 w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Regenerate Pass Now</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
