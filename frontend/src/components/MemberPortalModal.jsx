import React, { useState, useEffect, useRef } from 'react';
import { X, User, Crown, Calendar, CreditCard, Clock, FileText, CheckCircle, AlertTriangle, ArrowRight, Shield, Camera } from 'lucide-react';
import { fetchMyBookings, cancelClassBooking, fetchMyPayments, uploadImageFile, updateUserProfile } from '../services/api';
import ReceiptModal from './ReceiptModal';
import './MemberPortalModal.css';

export default function MemberPortalModal({ isOpen, onClose, user, onRenewMembership, onShowToast }) {
  const [activeTab, setActiveTab] = useState('residency'); // 'residency' | 'bookings' | 'payments'
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadBookings();
      loadPayments();
    }
  }, [isOpen]);

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

  const membership = user.membership || { status: 'None', planName: 'None' };
  const isActive = membership.status === 'Active';

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
                  <span className={`qnox-status-badge ${isActive ? 'active' : 'neutral'}`}>
                    {membership.status || 'NO ACTIVE PLAN'}
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
          <div className="flex border-b border-white/10 px-8 bg-[#070707]">
            <button
              onClick={() => setActiveTab('residency')}
              className={`qnox-portal-tab ${activeTab === 'residency' ? 'active' : ''}`}
            >
              MY RESIDENCY
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
          </div>

          {/* Tab Content */}
          <div className="qnox-portal-content">
            
            {/* TAB 1: RESIDENCY */}
            {activeTab === 'residency' && (
              <div className="space-y-6">
                <div className="bg-[#101010] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-semibold block mb-1">
                      CURRENT RESIDENCY TIER
                    </span>
                    <h4 className="font-serif text-3xl text-white mb-2">
                      {membership.planName || 'No Active Membership'}
                    </h4>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed max-w-md">
                      {isActive
                        ? `Valid until ${membership.endDate ? new Date(membership.endDate).toLocaleDateString('en-GB') : 'Ongoing'}. Includes unlimited slate pool, altitude access & concierge laundry.`
                        : 'You do not have an active membership residency. Select a tier to gain unrestricted access to our London sanctuaries.'}
                    </p>
                  </div>

                  <div>
                    {isActive ? (
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-2">RENEWAL STATUS</span>
                        <button
                          onClick={() => { onClose(); onRenewMembership(membership.planName); }}
                          className="px-6 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors"
                        >
                          EXTEND RESIDENCY
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onClose(); onRenewMembership('THE METROPOLITAN'); }}
                        className="px-6 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors"
                      >
                        EXPLORE TIERS
                      </button>
                    )}
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

          </div>

        </div>
      </div>

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
