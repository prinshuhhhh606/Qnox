import React, { useState, useEffect } from 'react';
import {
  Globe, Shield, CheckCircle, XCircle, Clock, DollarSign,
  QrCode, RefreshCw, Building, Award, AlertTriangle, ArrowRight, UserCheck
} from 'lucide-react';
import {
  fetchMultiGymAnalytics,
  fetchPartnershipApplications,
  reviewPartnershipApplication,
  fetchPartnerSettlements,
  disbursePartnerSettlement,
  verifyMemberCheckIn,
  fetchClubs,
} from '../../services/api';

export default function NetworkTab({ onShowToast }) {
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [clubs, setClubs] = useState([]);

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
    try {
      const [analyticsData, appsData, settlementsData, clubsData] = await Promise.allSettled([
        fetchMultiGymAnalytics(),
        fetchPartnershipApplications(),
        fetchPartnerSettlements(),
        fetchClubs(),
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
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    </div>
  );
}
