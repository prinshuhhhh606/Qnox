import React from 'react';
import { RefreshCw, Check, Search, X, Bell, Trash2, Eye, Phone, Mail } from 'lucide-react';

export default function NotificationsTab({
  adminNotifications = [],
  notifStatusFilter = 'all',
  setNotifStatusFilter,
  notifTypeFilter = 'all',
  setNotifTypeFilter,
  notifSearch = '',
  setNotifSearch,
  notifMetrics = {},
  notifLoading = false,
  runningExpiryEngine = false,
  loadNotifications,
  handleRunExpiryEngine,
  handleMarkAllNotifsAsRead,
  handleMarkNotifAsRead,
  handleDeleteNotif,
  setSelectedDossierMemberId,
  setEditingPlanMember,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase font-bold block mb-1">
            AUTOMATED SURVEILLANCE & RENEWAL SYSTEM
          </span>
          <h3 className="font-serif text-2xl text-white">Membership Expiry & Renewal Alerts</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Monitoring customer memberships against live calendar dates. Advance alerts at 7d, 3d, 1d, expiry date, and +3d follow-ups.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            onClick={handleRunExpiryEngine}
            disabled={runningExpiryEngine}
            className="px-4 py-2.5 bg-[#c5a880] text-black hover:bg-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-2 disabled:opacity-50"
            title="Run background expiry detection engine immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningExpiryEngine ? 'animate-spin' : ''}`} />
            <span>{runningExpiryEngine ? 'RUNNING ENGINE...' : 'RUN EXPIRY ENGINE NOW'}</span>
          </button>

          <button
            onClick={handleMarkAllNotifsAsRead}
            className="px-4 py-2.5 border border-white/20 hover:border-white text-white text-xs tracking-wider uppercase transition-colors flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>MARK ALL AS READ</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setNotifTypeFilter('all');
            setNotifStatusFilter('all');
            loadNotifications('all', 'all', notifSearch);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            notifTypeFilter === 'all' && notifStatusFilter === 'all'
              ? 'border-[#c5a880] text-white bg-[#c5a880]/10'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          ALL ALERTS ({notifMetrics.total || 0})
        </button>
        <button
          onClick={() => {
            setNotifStatusFilter('unread');
            setNotifTypeFilter('all');
            loadNotifications('unread', 'all', notifSearch);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            notifStatusFilter === 'unread'
              ? 'border-rose-500 text-rose-300 bg-rose-950/40'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          UNREAD ALERTS ({notifMetrics.unread || 0})
        </button>
        <button
          onClick={() => {
            setNotifTypeFilter('expired');
            loadNotifications(notifStatusFilter, 'expired', notifSearch);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            notifTypeFilter === 'expired'
              ? 'border-rose-500 text-rose-300 bg-rose-950/40'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          EXPIRED ({notifMetrics.expired || 0})
        </button>
        <button
          onClick={() => {
            setNotifTypeFilter('expiringSoon');
            loadNotifications(notifStatusFilter, 'expiringSoon', notifSearch);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            notifTypeFilter === 'expiringSoon'
              ? 'border-amber-500 text-amber-300 bg-amber-950/40'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          EXPIRING SOON ({notifMetrics.expiringSoon || 0})
        </button>
        <button
          onClick={() => {
            setNotifTypeFilter('renewed');
            loadNotifications(notifStatusFilter, 'renewed', notifSearch);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            notifTypeFilter === 'renewed'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          RENEWED ({notifMetrics.renewed || 0})
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-white/10 px-4 py-2.5">
        <Search className="w-4 h-4 text-neutral-500" />
        <input
          type="text"
          value={notifSearch}
          onChange={(e) => {
            setNotifSearch(e.target.value);
            loadNotifications(notifStatusFilter, notifTypeFilter, e.target.value);
          }}
          placeholder="Search by customer name, email, phone number, tier, or keyword..."
          className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 font-mono"
        />
        {notifSearch && (
          <button
            onClick={() => {
              setNotifSearch('');
              loadNotifications(notifStatusFilter, notifTypeFilter, '');
            }}
            className="text-neutral-500 hover:text-white text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Notifications Feed */}
      {notifLoading ? (
        <div className="py-20 text-center text-neutral-500 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c5a880]" />
          Scanning membership database...
        </div>
      ) : adminNotifications.length === 0 ? (
        <div className="border border-white/10 bg-[#090909] p-12 text-center">
          <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <h4 className="font-serif text-lg text-neutral-300 mb-1">No Notifications Located</h4>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            No membership expiry or renewal alerts match your current filter settings. Click &quot;Run Expiry Engine Now&quot; to scan for pending events.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {adminNotifications.map((notif) => {
            const isExpiredType = ['EXPIRY_TODAY', 'EXPIRY_EXPIRED', 'EXPIRY_FOLLOWUP_3D'].includes(notif.type);
            const isExpiringSoonType = ['EXPIRY_REMINDER_7D', 'EXPIRY_REMINDER_3D', 'EXPIRY_REMINDER_1D'].includes(notif.type);
            const isRenewedType = notif.type === 'MEMBERSHIP_RENEWED';

            let badgeColor = 'border-neutral-500 text-neutral-400';
            let stageLabel = 'NOTICE';
            if (isExpiredType) {
              badgeColor = 'border-rose-500/60 bg-rose-950/40 text-rose-300';
              stageLabel = notif.type === 'EXPIRY_FOLLOWUP_3D' ? 'EXPIRED (+3D FOLLOW-UP)' : 'EXPIRED';
            } else if (isExpiringSoonType) {
              badgeColor = 'border-amber-500/60 bg-amber-950/40 text-amber-300';
              stageLabel = notif.stage ? notif.stage.replace(/_/g, ' ') : 'EXPIRING SOON';
            } else if (isRenewedType) {
              badgeColor = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
              stageLabel = 'RENEWED';
            }

            return (
              <div
                key={notif._id}
                className={`border p-6 bg-[#0a0a0a] transition-all relative ${
                  !notif.isRead
                    ? 'border-white/30 shadow-[0_0_15px_rgba(197,168,128,0.05)]'
                    : 'border-white/10 opacity-90'
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: isExpiredType ? '#f43f5e' : isExpiringSoonType ? '#f59e0b' : isRenewedType ? '#10b981' : '#c5a880',
                }}
              >
                {/* Top Header of Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2.5">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" title="Unread Alert" />
                    )}
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border uppercase ${badgeColor}`}>
                      {stageLabel}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkNotifAsRead(notif._id)}
                        className="px-2.5 py-1 text-[10px] text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 uppercase tracking-wider transition"
                        title="Mark this alert as read"
                      >
                        MARK READ
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteNotif(notif._id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 border border-transparent hover:border-rose-900 transition"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Message */}
                <div className="mb-4">
                  <h4 className="font-serif text-lg text-white font-medium mb-1">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-neutral-300 font-light leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Customer Dossier Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#111111] border border-white/5 text-xs font-mono mb-4">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">CUSTOMER</span>
                    <span className="text-white font-semibold truncate block">{notif.customerName || 'N/A'}</span>
                    <span className="text-[10px] text-neutral-400 truncate block">{notif.customerEmail || ''}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">PHONE / CONTACT</span>
                    <span className="text-neutral-300 block">{notif.customerPhone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">MEMBERSHIP PLAN</span>
                    <span className="text-[#c5a880] font-semibold block">{notif.membershipPlan || 'None'}</span>
                    <span className="text-[10px] text-neutral-400 block">Status: {notif.membershipStatus || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">EXPIRY DATE</span>
                    <span className="text-white block">
                      {notif.membershipEndDate
                        ? new Date(notif.membershipEndDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'None'}
                    </span>
                  </div>
                </div>

                {/* Action Triggers */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  {notif.customerId && (
                    <button
                      onClick={() => setSelectedDossierMemberId(notif.customerId)}
                      className="px-3.5 py-1.5 bg-[#181818] border border-white/20 hover:border-[#c5a880] text-neutral-200 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>VIEW CUSTOMER PROFILE</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEditingPlanMember({
                        _id: notif.customerId,
                        name: notif.customerName,
                        membership: {
                          planName: notif.membershipPlan || 'THE METROPOLITAN',
                          status: notif.membershipStatus || 'Active',
                          endDate: notif.membershipEndDate,
                        },
                      });
                    }}
                    className="px-3.5 py-1.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold tracking-wider uppercase transition flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>RENEW MEMBERSHIP</span>
                  </button>

                  {notif.customerPhone && (
                    <a
                      href={`tel:${notif.customerPhone}`}
                      className="px-3 py-1.5 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3 text-[#c5a880]" />
                      <span>CALL</span>
                    </a>
                  )}

                  {notif.customerEmail && (
                    <a
                      href={`mailto:${notif.customerEmail}?subject=QNOX GYM Membership Renewal Notice`}
                      className="px-3 py-1.5 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1"
                    >
                      <Mail className="w-3 h-3 text-[#c5a880]" />
                      <span>EMAIL FOLLOW-UP</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
