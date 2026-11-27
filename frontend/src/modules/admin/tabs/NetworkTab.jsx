import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, CheckCircle, XCircle, Clock, DollarSign,
  QrCode, RefreshCw, Building, Award, AlertTriangle, ArrowRight, UserCheck,
  Copy, ExternalLink, Mail, Phone, MapPin, Building2, Eye, Filter, Search, X
} from 'lucide-react';
import {
  fetchMultiGymAnalytics,
  fetchPartnershipApplications,
  reviewPartnershipApplication,
  fetchPartnerSettlements,
  disbursePartnerSettlement,
  verifyMemberCheckIn,
  fetchClubs,
  fetchAdminTenants,
  updateAdminTenantStatus,
  fetchAdminGymOwnerApplications,
  approveAdminGymOwnerApplication,
  rejectAdminGymOwnerApplication,
} from '../../../services/api';

export default function NetworkTab({ onShowToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Gym Owner Applications Pre-Approval Pipeline state
  const [gymApplications, setGymApplications] = useState([]);
  const [loadingGymApps, setLoadingGymApps] = useState(false);
  const [gymAppFilter, setGymAppFilter] = useState('All');
  const [gymAppSearch, setGymAppSearch] = useState('');
  const [selectedGymApp, setSelectedGymApp] = useState(null);
  const [showGymAppModal, setShowGymAppModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [activeAppActionId, setActiveAppActionId] = useState(null);
  const [processingGymAppId, setProcessingGymAppId] = useState(null);
  const [invitationResult, setInvitationResult] = useState(null);

  // QR Scanner verification state
  const [qrInputToken, setQrInputToken] = useState('');
  const [selectedScanClubId, setSelectedScanClubId] = useState('');
  const [verifyingScan, setVerifyingScan] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  // Review & Disburse processing states
  const [processingAppId, setProcessingAppId] = useState(null);
  const [processingSettlementId, setProcessingSettlementId] = useState(null);

  const loadData = async () => {
    setLoadingAnalytics(true);
    setLoadingApps(true);
    setLoadingSettlements(true);
    setLoadingTenants(true);
    setLoadingGymApps(true);
    try {
      const [analyticsData, appsData, settlementsData, clubsData, tenantsData, gymAppsData] = await Promise.allSettled([
        fetchMultiGymAnalytics(),
        fetchPartnershipApplications(),
        fetchPartnerSettlements(),
        fetchClubs(),
        fetchAdminTenants(),
        fetchAdminGymOwnerApplications(),
      ]);

      if (analyticsData.status === 'fulfilled' && analyticsData.value) {
        setAnalytics(analyticsData.value);
      }
      if (appsData.status === 'fulfilled' && appsData.value) {
        setApplications(appsData.value);
      }
      if (settlementsData.status === 'fulfilled' && settlementsData.value) {
        setSettlements(settlementsData.value);
      }
      if (tenantsData.status === 'fulfilled' && tenantsData.value?.data) {
        setTenants(tenantsData.value.data);
      }
      if (gymAppsData.status === 'fulfilled' && gymAppsData.value?.data) {
        setGymApplications(gymAppsData.value.data);
      }
      if (clubsData.status === 'fulfilled' && clubsData.value) {
        const list = Array.isArray(clubsData.value) ? clubsData.value : clubsData.value.data || [];
        setClubs(list);
        if (list.length > 0 && !selectedScanClubId) {
          setSelectedScanClubId(list[0]._id);
        }
      }
    } catch (e) {
      console.warn('Network data load error:', e.message);
    } finally {
      setLoadingAnalytics(false);
      setLoadingApps(false);
      setLoadingSettlements(false);
      setLoadingTenants(false);
      setLoadingGymApps(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenApproveGymModal = (app) => {
    setActiveAppActionId(app._id);
    setSelectedGymApp(app);
    setAdminNotesInput(app.adminNotes || '');
    setInvitationResult(null);
    setShowApproveModal(true);
  };

  const handleConfirmApproveGym = async () => {
    if (!activeAppActionId) return;
    setProcessingGymAppId(activeAppActionId);
    try {
      const res = await approveAdminGymOwnerApplication(activeAppActionId, { adminNotes: adminNotesInput });
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Application approved and invitation dispatched!' });
      setInvitationResult(res.data);
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingGymAppId(null);
    }
  };

  const handleOpenRejectGymModal = (app) => {
    setActiveAppActionId(app._id);
    setSelectedGymApp(app);
    setRejectionReasonInput('');
    setShowRejectModal(true);
  };

  const handleConfirmRejectGym = async () => {
    if (!activeAppActionId) return;
    if (!rejectionReasonInput.trim()) {
      if (onShowToast) onShowToast({ type: 'error', message: 'Rejection reason is required.' });
      return;
    }
    setProcessingGymAppId(activeAppActionId);
    try {
      const res = await rejectAdminGymOwnerApplication(activeAppActionId, { rejectionReason: rejectionReasonInput });
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Application rejected and applicant notified.' });
      setShowRejectModal(false);
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingGymAppId(null);
    }
  };

  const handleApproveApp = async (id, agreedRate = 250) => {
    setProcessingAppId(id);
    try {
      await reviewPartnershipApplication(id, {
        status: 'Approved',
        agreedRate: Number(agreedRate) || 250,
        adminRemarks: 'Verified and onboarded into QNOX All-Access Partner Network.',
      });
      if (onShowToast) onShowToast({ type: 'success', message: 'Partner gym approved for All-Access Network!' });
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApp = async (id) => {
    const reason = window.prompt('Enter rejection reason for partner gym application:');
    if (!reason) return;
    setProcessingAppId(id);
    try {
      await reviewPartnershipApplication(id, {
        status: 'Rejected',
        adminRemarks: reason,
      });
      if (onShowToast) onShowToast({ type: 'info', message: 'Application rejected.' });
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleDisburse = async (settlementId) => {
    const ref = window.prompt('Enter bank transfer / payout transaction reference (e.g. UTR-98471):');
    if (!ref) return;
    setProcessingSettlementId(settlementId);
    try {
      await disbursePartnerSettlement(settlementId, { paymentReference: ref });
      if (onShowToast) onShowToast({ type: 'success', message: 'Partner settlement payout logged as Disbursed.' });
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingSettlementId(null);
    }
  };

  const handleToggleTenantStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateAdminTenantStatus(tenantId, { status: newStatus });
      if (onShowToast) onShowToast({ type: 'success', message: `Tenant status changed to ${newStatus}.` });
      loadData();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleVerifyQRCheckIn = async (e) => {
    e.preventDefault();
    if (!qrInputToken.trim()) return;
    setVerifyingScan(true);
    setScanResult(null);
    setScanError('');
    try {
      const res = await verifyMemberCheckIn({
        qrToken: qrInputToken.trim(),
        clubId: selectedScanClubId,
      });
      setScanResult(res.data);
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
      setQrInputToken('');
      loadData();
    } catch (err) {
      setScanError(err.message || 'QR Check-in verification failed.');
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setVerifyingScan(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[10px] tracking-[0.25em] text-[#c5a880] font-bold uppercase mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL ARCHITECTURE & ALL-ACCESS ECOSYSTEM</span>
          </div>
          <h2 className="font-serif text-2xl text-white">Multi-Gym SaaS & All-Access Network Console</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Centrally manage company-owned branches, multi-tenant SaaS gyms, All-Access partner applications, and revenue settlements.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 border border-white/10 hover:border-white/30 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          <span>SYNC NETWORK DATA</span>
        </button>
      </div>

      {/* 4 High-Level Multi-Tier KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0e0e0e] border border-white/10 space-y-2">
          <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-mono block">
            SAAS RECURRING REVENUE (MRR)
          </span>
          <div className="font-serif text-3xl text-emerald-400">
            ₹{analytics?.saasEcosystem?.mrrSaaS?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            {analytics?.saasEcosystem?.activeSubscriptions || 0} Active Tenant Subscriptions
          </div>
        </div>

        <div className="p-5 bg-[#0e0e0e] border border-white/10 space-y-2">
          <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-mono block">
            MULTI-GYM NETWORK BRANCHES
          </span>
          <div className="font-serif text-3xl text-[#c5a880]">
            {analytics?.networkOverview?.totalBranches || 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            {analytics?.networkOverview?.companyOwnedGyms || 0} Company &bull; {analytics?.networkOverview?.saasPartnerGyms || 0} SaaS Partners
          </div>
        </div>

        <div className="p-5 bg-[#0e0e0e] border border-white/10 space-y-2">
          <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-mono block">
            ALL-ACCESS NETWORK PASSES
          </span>
          <div className="font-serif text-3xl text-sky-400">
            {analytics?.memberships?.allAccessMembers || 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Cross-sanctuary check-in privileges active
          </div>
        </div>

        <div className="p-5 bg-[#0e0e0e] border border-white/10 space-y-2">
          <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-mono block">
            PARTNER SETTLEMENTS DUE
          </span>
          <div className="font-serif text-3xl text-amber-400">
            ₹{analytics?.settlements?.pendingPayouts?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            ₹{analytics?.settlements?.disbursedPayouts?.toLocaleString('en-IN') || 0} disbursed to date
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. GYM OWNER APPLICATIONS (PRE-APPROVAL PIPELINE)       */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#c5a880] font-semibold block">
                PRE-APPROVAL ONBOARDING AUDIT
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/40 rounded-full">
                GATEWAY 1
              </span>
            </div>
            <h3 className="font-serif text-xl text-white">Gym Owner Partnership Applications</h3>
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Review B2B gym partnership requests, audit credentials, and grant single-use invitation links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by ID, name, city..."
                value={gymAppSearch}
                onChange={(e) => setGymAppSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c5a880] w-48 sm:w-60 font-mono"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2 bg-[#121212] border border-white/10 hover:border-[#c5a880] text-neutral-300 hover:text-white transition"
              title="Refresh applications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingGymApps ? 'animate-spin text-[#c5a880]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'All', label: 'All Applications', count: gymApplications.length },
            { key: 'PENDING_APPROVAL', label: 'Pending Approval', count: gymApplications.filter(a => a.status === 'PENDING_APPROVAL').length, highlight: true },
            { key: 'APPROVED', label: 'Approved', count: gymApplications.filter(a => a.status === 'APPROVED').length },
            { key: 'REGISTERED', label: 'Registered', count: gymApplications.filter(a => a.status === 'REGISTERED').length },
            { key: 'REJECTED', label: 'Rejected', count: gymApplications.filter(a => a.status === 'REJECTED').length },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setGymAppFilter(f.key)}
              className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition flex items-center space-x-1.5 border ${
                gymAppFilter === f.key
                  ? 'bg-[#c5a880] text-black border-[#c5a880] font-bold shadow-[0_0_10px_rgba(197,168,128,0.2)]'
                  : 'bg-[#0e0e0e] text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                gymAppFilter === f.key
                  ? 'bg-black text-[#c5a880]'
                  : f.highlight && f.count > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-white/10 text-neutral-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Applications Table */}
        {loadingGymApps ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-500 uppercase tracking-widest bg-[#0c0c0c] border border-white/10">
            <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-[#c5a880]" />
            Auditing Gym Owner Applications Pipeline...
          </div>
        ) : (
          (() => {
            const filtered = gymApplications.filter((app) => {
              if (gymAppFilter !== 'All' && app.status !== gymAppFilter) return false;
              if (gymAppSearch.trim()) {
                const q = gymAppSearch.toLowerCase();
                return (
                  app.applicationId?.toLowerCase().includes(q) ||
                  app.ownerName?.toLowerCase().includes(q) ||
                  app.gymName?.toLowerCase().includes(q) ||
                  app.email?.toLowerCase().includes(q) ||
                  app.city?.toLowerCase().includes(q)
                );
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="p-8 text-center border border-white/10 bg-[#0e0e0e] text-xs text-neutral-500 font-mono">
                  No gym owner applications match current filter criteria.
                </div>
              );
            }

            return (
              <div className="overflow-x-auto border border-white/10 bg-[#0c0c0c]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[9px] uppercase tracking-wider text-[#c5a880] bg-[#141414] border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Application ID</th>
                      <th className="p-3.5">Gym / Brand Name</th>
                      <th className="p-3.5">Applicant / Owner</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5 text-center">Scale</th>
                      <th className="p-3.5 text-center">Applied Date</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Pre-Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-neutral-300">
                    {filtered.map((app) => {
                      const isPending = app.status === 'PENDING_APPROVAL';
                      const isApproved = app.status === 'APPROVED';
                      const isRegistered = app.status === 'REGISTERED';
                      const isRejected = app.status === 'REJECTED';

                      return (
                        <tr key={app._id} className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-white">
                            <span className="text-[#c5a880]">{app.applicationId}</span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{app.gymName}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate max-w-xs">{app.gymAddress}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-white font-medium">{app.ownerName}</div>
                            <div className="text-[10px] text-neutral-400">{app.email}</div>
                            <div className="text-[10px] text-neutral-500">{app.phone}</div>
                          </td>
                          <td className="p-3.5">
                            <div>{app.city}, {app.state}</div>
                            <div className="text-[10px] text-neutral-500">{app.country || 'India'}</div>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="text-white font-bold">{app.branchCount || 1} Br</span>
                            <div className="text-[10px] text-neutral-500">~{app.expectedMembers || 100} mbrs</div>
                          </td>
                          <td className="p-3.5 text-center text-neutral-400 whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
                                isApproved
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                                  : isRegistered
                                  ? 'bg-sky-950/70 text-sky-400 border border-sky-500/40'
                                  : isRejected
                                  ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-950/70 text-amber-400 border border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedGymApp(app);
                                  setShowGymAppModal(true);
                                }}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[10px] uppercase font-bold tracking-wider transition border border-white/10 flex items-center space-x-1"
                                title="View Application Dossier"
                              >
                                <Eye className="w-3 h-3 text-[#c5a880]" />
                                <span>VIEW</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleOpenApproveGymModal(app)}
                                    disabled={processingGymAppId === app._id}
                                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-[10px] uppercase font-bold tracking-wider transition border border-emerald-500/40 flex items-center space-x-1 disabled:opacity-50"
                                    title="Approve and dispatch invitation"
                                  >
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    <span>APPROVE</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenRejectGymModal(app)}
                                    disabled={processingGymAppId === app._id}
                                    className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] uppercase font-bold tracking-wider transition border border-rose-500/40 flex items-center space-x-1 disabled:opacity-50"
                                    title="Reject application"
                                  >
                                    <XCircle className="w-3 h-3 text-rose-400" />
                                    <span>REJECT</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>

      {/* Multi-Tenant B2B SaaS Partner Gyms Ecosystem */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#c5a880] font-semibold block">
              B2B MULTI-TENANT ECOSYSTEM
            </span>
            <h3 className="font-serif text-xl text-white">SaaS Partner Gyms & Tenant Quotas</h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {tenants.filter(t => t.type === 'SaaS-Partner').length} Independent SaaS Tenants
          </span>
        </div>

        {loadingTenants ? (
          <div className="py-8 text-center text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Loading tenant organizations...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center border border-white/10 bg-[#0e0e0e] text-xs text-neutral-500">
            No SaaS partner gyms registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 bg-[#0c0c0c]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[9px] uppercase tracking-wider text-[#c5a880] bg-[#141414] border-b border-white/10">
                <tr>
                  <th className="p-3.5">Gym / Brand</th>
                  <th className="p-3.5">Owner / Contact</th>
                  <th className="p-3.5">Plan / Cycle</th>
                  <th className="p-3.5 text-center">Branches</th>
                  <th className="p-3.5 text-center">Coaches</th>
                  <th className="p-3.5 text-center">Members</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                {tenants.map((t) => (
                  <tr key={t._id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-[10px] text-neutral-500">{t.city || 'Metro'} • {t.type}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{t.ownerName || t.owner?.name || 'Owner'}</div>
                      <div className="text-[10px] text-neutral-500">{t.ownerEmail || t.contactEmail}</div>
                    </td>
                    <td className="p-3.5 uppercase text-[#c5a880]">
                      {t.subscription?.planName || t.subscription?.planCode || 'STARTER'}
                    </td>
                    <td className="p-3.5 text-center">
                      {t.liveStats?.branches || 0} / {t.branchesLimit}
                    </td>
                    <td className="p-3.5 text-center">
                      {t.liveStats?.trainers || 0} / {t.trainersLimit}
                    </td>
                    <td className="p-3.5 text-center">
                      {t.liveStats?.members || 0} / {t.membersLimit}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 text-[9px] uppercase font-bold ${
                        t.status === 'Active'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {t.type === 'SaaS-Partner' && (
                        <button
                          onClick={() => handleToggleTenantStatus(t._id, t.status)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                            t.status === 'Active'
                              ? 'border border-amber-500/40 text-amber-400 hover:bg-amber-950/40'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-black'
                          }`}
                        >
                          {t.status === 'Active' ? 'SUSPEND' : 'ACTIVATE'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Universal QR Check-In Scanner Engine */}
      <div className="p-6 bg-[#0c0c0c] border border-[#c5a880]/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-white">Universal QR Pass Verification Scanner</h3>
              <p className="text-xs text-neutral-400 font-light">
                Desk Reception & Gate verification engine for Home-Club and All-Access Network check-ins.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            LIVE DESK SCANNER
          </span>
        </div>

        <form onSubmit={handleVerifyQRCheckIn} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
              TARGET SANCTUARY / BRANCH LOCATION
            </label>
            <select
              value={selectedScanClubId}
              onChange={(e) => setSelectedScanClubId(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 px-3 py-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
            >
              {clubs.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.gymType || 'Company-Owned'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1 font-mono">
              PASTE / SCAN MEMBER DYNAMIC QR TOKEN
            </label>
            <input
              type="text"
              required
              value={qrInputToken}
              onChange={(e) => setQrInputToken(e.target.value)}
              placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-[#141414] border border-white/10 px-3 py-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={verifyingScan || !qrInputToken.trim()}
              className="w-full py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{verifyingScan ? 'VERIFYING PASS...' : 'VERIFY & CHECK IN'}</span>
            </button>
          </div>
        </form>

        {/* Scan Result Card */}
        {scanResult && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-400">
                  {scanResult.passType} &bull; ACCESS GRANTED
                </span>
                <h4 className="font-serif text-lg text-white font-bold mt-1">
                  {scanResult.member.name} ({scanResult.member.memberId || 'MEMBER'})
                </h4>
                <p className="text-xs text-neutral-300 font-light">
                  Plan: {scanResult.member.planName} &bull; Verified at {scanResult.club.name}
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-emerald-400 font-bold block">HEADCOUNT RECORDED</span>
              <span className="text-neutral-400 text-[10px]">Current Occupancy: {scanResult.club.currentOccupancy}</span>
            </div>
          </div>
        )}

        {scanError && (
          <div className="p-4 bg-rose-950/30 border border-rose-500/50 flex items-center space-x-3 text-rose-300 text-xs">
            <XCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <strong className="block font-bold">ACCESS DENIED:</strong>
              <span>{scanError}</span>
            </div>
          </div>
        )}
      </div>

      {/* All-Access Partnership Applications Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-sky-400 font-semibold block">
              PARTNER EXPANSION PIPELINE
            </span>
            <h3 className="font-serif text-xl text-white">All-Access Network Partnership Applications</h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {applications.filter((a) => a.status === 'Pending').length} Pending Review
          </span>
        </div>

        {loadingApps ? (
          <div className="py-12 text-center text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Loading partner applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center border border-white/10 bg-[#0e0e0e] text-xs text-neutral-500">
            No independent partner gym applications on record.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 bg-[#0c0c0c]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[9px] uppercase tracking-wider text-[#c5a880] bg-[#141414] border-b border-white/10">
                <tr>
                  <th className="p-3.5">Gym / Branch</th>
                  <th className="p-3.5">Owner / Contact</th>
                  <th className="p-3.5">Facilities Offered</th>
                  <th className="p-3.5">Agreed Rate</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{app.clubName}</div>
                      <div className="text-[10px] text-neutral-400">{app.location}</div>
                    </td>
                    <td className="p-3.5">
                      <div>{app.owner ? app.owner.name : 'Gym Owner'}</div>
                      <div className="text-[10px] text-neutral-500">{app.owner ? app.owner.email : 'N/A'}</div>
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      <div className="truncate max-w-xs">{app.offeredFacilities?.join(', ') || 'Standard Facilities'}</div>
                      <div className="text-[10px] text-neutral-500">Cap: {app.maxDailyNetworkVisitors || 30} visitors/day</div>
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      ₹{app.agreedRatePerVisit || app.requestedRatePerVisit || 250}/visit
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          app.status === 'Approved'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : app.status === 'Rejected'
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                      {app.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApproveApp(app._id, app.agreedRatePerVisit)}
                            disabled={processingAppId === app._id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleRejectApp(app._id)}
                            disabled={processingAppId === app._id}
                            className="px-2.5 py-1 border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                          >
                            REJECT
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">
                          {app.adminRemarks || 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Partner Settlement Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-emerald-400 font-semibold block">
              REVENUE SHARING & LEDGER
            </span>
            <h3 className="font-serif text-xl text-white">Partner Gym Monthly Settlement Records</h3>
          </div>
        </div>

        {loadingSettlements ? (
          <div className="py-12 text-center text-xs font-mono text-neutral-500 uppercase tracking-widest">
            Loading settlement ledger...
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-8 text-center border border-white/10 bg-[#0e0e0e] text-xs text-neutral-500">
            No partner settlement records accrued yet. Check-ins at partner gyms will automatically log here.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 bg-[#0c0c0c]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[9px] uppercase tracking-wider text-[#c5a880] bg-[#141414] border-b border-white/10">
                <tr>
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Partner Sanctuary</th>
                  <th className="p-3.5">Check-Ins</th>
                  <th className="p-3.5">Gross Payable</th>
                  <th className="p-3.5">Platform Fee (20%)</th>
                  <th className="p-3.5">Net Payout</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-neutral-300">
                {settlements.map((s) => (
                  <tr key={s._id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-bold text-white">
                      {s.periodMonth}/{s.periodYear}
                    </td>
                    <td className="p-3.5">{s.partnerClubName}</td>
                    <td className="p-3.5 font-bold text-sky-400">{s.totalCheckIns}</td>
                    <td className="p-3.5">₹{s.totalGrossPayable?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-neutral-500">₹{s.platformFeeAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 font-bold text-emerald-400">₹{s.netPayoutAmount?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          s.status === 'Disbursed'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {s.status === 'Pending' ? (
                        <button
                          onClick={() => handleDisburse(s._id)}
                          disabled={processingSettlementId === s._id}
                          className="px-3 py-1 bg-[#c5a880] hover:bg-white text-black text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                        >
                          DISBURSE PAYOUT
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-500">
                          Ref: {s.paymentReference || 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: VIEW APPLICATION DOSSIER                       */}
      {/* ======================================================== */}
      {showGymAppModal && selectedGymApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono block">
                  PARTNERSHIP APPLICATION DOSSIER
                </span>
                <h3 className="text-xl font-serif text-white">{selectedGymApp.gymName}</h3>
                <span className="text-xs font-mono text-neutral-400">ID: {selectedGymApp.applicationId}</span>
              </div>
              <button
                onClick={() => setShowGymAppModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#141414] border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 block">Owner / Applicant</span>
                <span className="text-white font-bold">{selectedGymApp.ownerName}</span>
                <div className="text-neutral-400">{selectedGymApp.email}</div>
                <div className="text-neutral-400">{selectedGymApp.phone}</div>
              </div>

              <div className="p-3 bg-[#141414] border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 block">Location & Address</span>
                <span className="text-white">{selectedGymApp.city}, {selectedGymApp.state}</span>
                <div className="text-neutral-400">{selectedGymApp.country || 'India'}</div>
                <div className="text-[11px] text-neutral-500">{selectedGymApp.gymAddress}</div>
              </div>

              <div className="p-3 bg-[#141414] border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 block">Projected Scale</span>
                <span className="text-white font-bold">{selectedGymApp.branchCount || 1} Branches</span>
                <div className="text-neutral-400">Expected Members: {selectedGymApp.expectedMembers || 100}</div>
              </div>

              <div className="p-3 bg-[#141414] border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 block">Status & Audit</span>
                <span className="font-bold text-[#c5a880]">{selectedGymApp.status}</span>
                <div className="text-neutral-500">
                  Applied: {new Date(selectedGymApp.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {selectedGymApp.businessDescription && (
              <div className="p-3 bg-[#141414] border border-white/5 text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase text-neutral-500 block">Business & Facility Description</span>
                <p className="text-neutral-300 leading-relaxed">{selectedGymApp.businessDescription}</p>
              </div>
            )}

            {selectedGymApp.adminNotes && (
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase text-amber-400 block font-bold">Admin Audit Notes</span>
                <p className="text-neutral-300">{selectedGymApp.adminNotes}</p>
              </div>
            )}

            {selectedGymApp.rejectionReason && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase text-rose-400 block font-bold">Rejection Reason</span>
                <p className="text-rose-200">{selectedGymApp.rejectionReason}</p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              {selectedGymApp.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={() => {
                      setShowGymAppModal(false);
                      handleOpenApproveGymModal(selectedGymApp);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-mono uppercase tracking-wider font-bold transition flex items-center space-x-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    <span>APPROVE APPLICATION</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowGymAppModal(false);
                      handleOpenRejectGymModal(selectedGymApp);
                    }}
                    className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white text-xs font-mono uppercase tracking-wider font-bold transition flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>REJECT APPLICATION</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowGymAppModal(false)}
                className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] text-white text-xs font-mono uppercase tracking-wider transition border border-white/10"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: APPROVE APPLICATION & DISPATCH INVITATION       */}
      {/* ======================================================== */}
      {showApproveModal && selectedGymApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-emerald-500/30 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-mono block">
                  OFFICIAL PRE-APPROVAL CLEARANCE
                </span>
                <h3 className="text-lg font-serif text-white">Approve {selectedGymApp.gymName}</h3>
              </div>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setInvitationResult(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!invitationResult ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <p className="text-emerald-300 font-medium">
                    Approving this application will:
                  </p>
                  <ul className="list-disc list-inside text-neutral-300 space-y-0.5 text-[11px]">
                    <li>Mark application status as <strong>APPROVED</strong>.</li>
                    <li>Generate a cryptographically secure, single-use token valid for 7 days.</li>
                    <li>Send an official registration invitation email to <strong>{selectedGymApp.email}</strong>.</li>
                    <li>Allow the applicant to set their password and choose a SaaS subscription.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Internal Admin Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="e.g. Credentials and facility photos verified. Approved for Starter/Professional onboarding."
                    className="w-full p-2.5 bg-[#141414] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    className="px-4 py-2 bg-transparent hover:bg-white/5 text-neutral-400 text-xs uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleConfirmApproveGym}
                    disabled={processingGymAppId === activeAppActionId}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {processingGymAppId === activeAppActionId ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ISSUING INVITATION...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>CONFIRM & DISPATCH INVITATION</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Application Approved & Invitation Created!</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    An email with the one-time registration link has been dispatched to <strong>{selectedGymApp.email}</strong>.
                  </p>
                </div>

                {invitationResult.invitationUrl && (
                  <div className="p-3 bg-[#141414] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 uppercase">Direct Invitation Link:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(invitationResult.invitationUrl);
                          if (onShowToast) onShowToast({ type: 'success', message: 'Invitation link copied to clipboard!' });
                        }}
                        className="px-2 py-0.5 bg-[#c5a880] text-black text-[10px] font-bold uppercase tracking-wider hover:bg-white transition flex items-center space-x-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>COPY LINK</span>
                      </button>
                    </div>
                    <div className="p-2 bg-black text-[11px] text-[#c5a880] break-all border border-white/5 select-all">
                      {invitationResult.invitationUrl}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setInvitationResult(null);
                    }}
                    className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black text-xs uppercase tracking-wider font-bold transition"
                  >
                    DONE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REJECT APPLICATION                             */}
      {/* ======================================================== */}
      {showRejectModal && selectedGymApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-rose-500/30 w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-rose-400 font-mono block">
                  APPLICATION REJECTION NOTICE
                </span>
                <h3 className="text-lg font-serif text-white">Reject {selectedGymApp.gymName}</h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-neutral-300 space-y-1">
                <p className="text-rose-300 font-medium">Rejection Compliance Protocol:</p>
                <p className="text-[11px]">
                  Please state a professional reason for rejection. This will be recorded in the audit log and emailed to <strong>{selectedGymApp.email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Does not meet current luxury tier specifications or regional capacity requirements for QNOX Network."
                  className="w-full p-2.5 bg-[#141414] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-white/5 text-neutral-400 text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleConfirmRejectGym}
                  disabled={processingGymAppId === activeAppActionId || !rejectionReasonInput.trim()}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs uppercase tracking-wider font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {processingGymAppId === activeAppActionId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>DISPATCHING NOTICE...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>CONFIRM REJECTION</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
