import React, { useState, useEffect } from 'react';
import {
  Compass, MapPin, Navigation, Shield, ShieldAlert, ShieldCheck,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Sliders, Eye,
  Building2, ArrowRight, X, ExternalLink, Search, Layers, Radio
} from 'lucide-react';
import {
  fetchAdminTerritories,
  updateBranchTerritory,
  approveAdminGymOwnerApplication,
  rejectAdminGymOwnerApplication,
} from '../../../services/api';

export default function TerritoryManagementConsole({ onShowToast, onDataChanged }) {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [applications, setApplications] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState({});

  // Branch radius editing state
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [radiusInput, setRadiusInput] = useState(5);
  const [savingRadius, setSavingRadius] = useState(false);

  // Filter & Search
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPin, setSelectedPin] = useState(null);

  // Exceptional Override Modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedAppForOverride, setSelectedAppForOverride] = useState(null);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [overrideAdminNotes, setOverrideAdminNotes] = useState('');
  const [processingOverride, setProcessingOverride] = useState(false);

  // Standard Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAppForReject, setSelectedAppForReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingReject, setProcessingReject] = useState(false);

  const loadTerritoryData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminTerritories();
      if (data) {
        setBranches(data.branches || []);
        setApplications(data.applications || []);
        setConflicts(data.conflicts || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.warn('Territory load notice:', err.message);
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerritoryData();
  }, []);

  const handleStartEditRadius = (branch) => {
    setEditingBranchId(branch._id);
    setRadiusInput(branch.protectionRadiusKm || 5);
  };

  const handleSaveRadius = async (branchId) => {
    setSavingRadius(true);
    try {
      const res = await updateBranchTerritory(branchId, {
        protectionRadiusKm: Number(radiusInput),
      });
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || 'Branch territory protection radius updated.',
        });
      }
      setEditingBranchId(null);
      await loadTerritoryData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSavingRadius(false);
    }
  };

  const handleOpenOverrideModal = (app) => {
    setSelectedAppForOverride(app);
    setOverrideJustification(app.exceptionalApprovalJustification || '');
    setOverrideAdminNotes(app.adminNotes || '');
    setOverrideModalOpen(true);
  };

  const handleConfirmOverride = async () => {
    if (!selectedAppForOverride) return;
    if (!overrideJustification.trim() || overrideJustification.trim().length < 10) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: 'A detailed justification (minimum 10 characters) is required for exceptional territory override.',
        });
      }
      return;
    }

    setProcessingOverride(true);
    try {
      const res = await approveAdminGymOwnerApplication(selectedAppForOverride._id, {
        adminNotes: overrideAdminNotes,
        exceptionalApproval: true,
        exceptionalApprovalJustification: overrideJustification.trim(),
      });
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || 'Exceptional territory approval granted. Invitation dispatched.',
        });
      }
      setOverrideModalOpen(false);
      setSelectedAppForOverride(null);
      await loadTerritoryData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingOverride(false);
    }
  };

  const handleOpenRejectModal = (app) => {
    setSelectedAppForReject(app);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedAppForReject) return;
    if (!rejectionReason.trim()) {
      if (onShowToast) {
        onShowToast({ type: 'error', message: 'Rejection reason is required.' });
      }
      return;
    }

    setProcessingReject(true);
    try {
      const res = await rejectAdminGymOwnerApplication(selectedAppForReject._id, {
        rejectionReason: rejectionReason.trim(),
      });
      if (onShowToast) {
        onShowToast({
          type: 'info',
          message: res.message || 'Application rejected and applicant notified.',
        });
      }
      setRejectModalOpen(false);
      setSelectedAppForReject(null);
      await loadTerritoryData();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingReject(false);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (filterType === 'CONFLICTS' && !app.hasTerritoryConflict && app.status !== 'TERRITORY_CONFLICT') return false;
    if (filterType === 'FRANCHISE' && app.partnershipType !== 'QNOX Franchise Gym') return false;
    if (filterType === 'SAAS' && app.partnershipType !== 'QNOX SaaS Partner Gym') return false;
    if (filterType === 'PENDING' && !['PENDING_APPROVAL', 'TERRITORY_CONFLICT'].includes(app.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        app.applicationId?.toLowerCase().includes(q) ||
        app.gymName?.toLowerCase().includes(q) ||
        app.ownerName?.toLowerCase().includes(q) ||
        app.city?.toLowerCase().includes(q) ||
        app.conflictingBranchName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Territory Header & Alert */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-[10px] tracking-[0.25em] text-[#c5a880] font-bold uppercase mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>EXECUTIVE GEOFENCING & TERRITORIAL INTEGRITY</span>
          </div>
          <h3 className="font-serif text-2xl text-white">
            Company-Owned Branch Territory Protection & Radar
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Safeguard company-owned luxury branch catchments with configurable GPS radii (Default 5 KM) and audit partner applicants.
          </p>
        </div>

        <button
          onClick={loadTerritoryData}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#121212] border border-white/10 hover:border-[#c5a880] text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition flex items-center space-x-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c5a880]' : ''}`} />
          <span>SYNC RADAR</span>
        </button>
      </div>

      {/* Territory Conflict Notice Alert Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full flex-shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold font-mono tracking-wider text-amber-300 uppercase">
                TERRITORY CONFLICT DETECTED &bull; {conflicts.length} APPLICATION(S) IN ACTIVE CATCHMENT
              </div>
              <p className="text-[11px] text-amber-200/80 mt-0.5 font-mono">
                Independent franchise partner applicant(s) fall inside protected company-owned radius. Automatic approval prevented.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterType('CONFLICTS')}
            className="px-3 py-1.5 bg-amber-500 text-black hover:bg-white text-xs font-mono font-bold uppercase tracking-wider transition whitespace-nowrap"
          >
            REVIEW CONFLICTS ({conflicts.length})
          </button>
        </div>
      )}

      {/* 4 Summary Micro-KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-[#0e0e0e] border border-white/10">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            COMPANY BRANCHES
          </span>
          <div className="text-2xl font-serif text-[#c5a880]">{branches.length}</div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">100% Registered with GPS</div>
        </div>
        <div className="p-4 bg-[#0e0e0e] border border-white/10">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            DEFAULT RADIUS
          </span>
          <div className="text-2xl font-serif text-white">5.0 KM</div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">Independently Configurable</div>
        </div>
        <div className="p-4 bg-[#0e0e0e] border border-white/10">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            ACTIVE CONFLICTS
          </span>
          <div className={`text-2xl font-serif ${conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {conflicts.length}
          </div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
            {conflicts.length > 0 ? 'Requires Special Review' : 'Catchment Clear'}
          </div>
        </div>
        <div className="p-4 bg-[#0e0e0e] border border-white/10">
          <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block mb-1">
            PROTECTION POLICY
          </span>
          <div className="text-xs font-mono font-bold text-sky-400 mt-2">SEPARATE SAAS / FRANCHISE</div>
          <div className="text-[10px] font-mono text-neutral-500 mt-0.5">SaaS exempt from territory block</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. INTERACTIVE GEOFENCE RADAR & BRANCH CATCHMENT MAP     */}
      {/* ======================================================== */}
      <div className="p-5 bg-[#0a0a0a] border border-[#c5a880]/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#c5a880] animate-pulse" />
            <h4 className="font-serif text-lg text-white">GPS Geofence Territory Radar</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/40 rounded">
              LIVE RADAR VIEW
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-neutral-400">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c5a880] inline-block" />
              <span>Company Branch</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
              <span>Territory Conflict</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span>Clear Territory</span>
            </span>
          </div>
        </div>

        {/* Radar Graphic Canvas */}
        <div className="relative w-full h-80 bg-[#050505] border border-white/10 overflow-hidden flex items-center justify-center">
          {/* Subtle radar grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,168,128,0.08)_0%,transparent_70%)] pointer-events-none" />
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            {/* Concentric distance circles */}
            <circle cx="50%" cy="50%" r="50" fill="none" stroke="rgba(197,168,128,0.12)" strokeDasharray="3 3" />
            <circle cx="50%" cy="50%" r="90" fill="none" stroke="rgba(197,168,128,0.2)" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="130" fill="none" stroke="rgba(197,168,128,0.15)" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="170" fill="none" stroke="rgba(197,168,128,0.1)" strokeDasharray="5 5" />
            {/* Radar crosshairs */}
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.06)" />
          </svg>

          {/* Center Coordinates Legend */}
          <div className="absolute top-3 left-3 text-[10px] font-mono text-neutral-400 space-y-0.5 bg-black/60 p-2 border border-white/10 backdrop-blur-md">
            <div>CENTRAL SANCTUARY HQ: MAYFAIR</div>
            <div>LAT: 51.5118 &bull; LON: -0.1473</div>
            <div className="text-[#c5a880]">RANGE: 0 - 25 KM RADIUS</div>
          </div>

          {/* Plot Company-Owned Branches */}
          {branches.map((b, idx) => {
            // Coordinate mapping relative to center
            const positions = [
              { x: '50%', y: '50%' }, // Mayfair Center
              { x: '42%', y: '45%' }, // Soho
              { x: '72%', y: '58%' }, // Canary Wharf
            ];
            const pos = positions[idx % positions.length];
            return (
              <div
                key={b._id}
                style={{ left: pos.x, top: pos.y }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                onClick={() => setSelectedPin({ type: 'branch', data: b })}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#c5a880]/20 border border-[#c5a880] flex items-center justify-center text-[#c5a880] shadow-[0_0_15px_rgba(197,168,128,0.4)]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  {/* Visual Protected Radius Aura */}
                  <div className="absolute w-28 h-28 rounded-full border border-[#c5a880]/30 bg-[#c5a880]/5 pointer-events-none animate-pulse" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black border border-[#c5a880] px-2.5 py-1 text-[10px] font-mono text-white whitespace-nowrap pointer-events-none shadow-xl z-30">
                  <span className="text-[#c5a880] font-bold">{b.name}</span> &bull; Protected: {b.protectionRadiusKm || 5} KM
                </div>
              </div>
            );
          })}

          {/* Plot Partner Applications */}
          {applications.slice(0, 10).map((app, idx) => {
            const hasConflict = app.hasTerritoryConflict || app.status === 'TERRITORY_CONFLICT';
            const offsetPositions = [
              { x: '48%', y: '53%' }, // Inside Mayfair
              { x: '35%', y: '40%' }, // Near Soho
              { x: '68%', y: '75%' }, // Outside Canary Wharf
              { x: '25%', y: '65%' }, // Further west
              { x: '82%', y: '35%' }, // North East
            ];
            const pos = offsetPositions[idx % offsetPositions.length];

            return (
              <div
                key={app._id}
                style={{ left: pos.x, top: pos.y }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                onClick={() => setSelectedPin({ type: 'application', data: app })}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                      hasConflict
                        ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                        : app.partnershipType === 'QNOX SaaS Partner Gym'
                        ? 'bg-sky-950 border-sky-400 text-sky-300'
                        : 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    }`}
                  >
                    {hasConflict ? '!' : '✓'}
                  </div>
                  {hasConflict && (
                    <div className="absolute w-10 h-10 rounded-full border border-rose-500/40 animate-ping pointer-events-none" />
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-2 text-[10px] font-mono text-white whitespace-nowrap pointer-events-none shadow-xl z-30">
                  <div className="font-bold text-[#c5a880]">{app.gymName}</div>
                  <div>Policy: {app.partnershipType}</div>
                  <div className={hasConflict ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {hasConflict ? `CONFLICT: ${app.conflictDistanceKm || 'Near'} KM` : 'CLEAR TERRITORY'}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Selected Pin Info Card (Overlay) */}
          {selectedPin && (
            <div className="absolute bottom-3 right-3 max-w-xs bg-[#0c0c0c]/95 border border-[#c5a880] p-3 text-xs font-mono text-white space-y-1.5 shadow-2xl z-30">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="text-[10px] text-[#c5a880] font-bold uppercase">
                  {selectedPin.type === 'branch' ? 'COMPANY BRANCH' : 'PARTNER APPLICATION'}
                </span>
                <button onClick={() => setSelectedPin(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedPin.type === 'branch' ? (
                <>
                  <div className="font-serif font-bold text-sm text-white">{selectedPin.data.name}</div>
                  <div className="text-[11px] text-neutral-400">{selectedPin.data.address}</div>
                  <div className="text-[11px] text-[#c5a880]">
                    Protected Territory: {selectedPin.data.protectionRadiusKm || 5} KM
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    GPS: {selectedPin.data.latitude}, {selectedPin.data.longitude}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-serif font-bold text-sm text-white">{selectedPin.data.gymName}</div>
                  <div className="text-[11px] text-neutral-400">Owner: {selectedPin.data.ownerName} ({selectedPin.data.city})</div>
                  <div className="text-[10px] text-sky-400">{selectedPin.data.partnershipType}</div>
                  {selectedPin.data.hasTerritoryConflict ? (
                    <div className="text-rose-400 text-[11px] font-bold">
                      Conflict with {selectedPin.data.conflictingBranchName} ({selectedPin.data.conflictDistanceKm} KM away)
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-[11px]">Territory Clear</div>
                  )}
                  {selectedPin.data.status === 'TERRITORY_CONFLICT' && (
                    <button
                      onClick={() => handleOpenOverrideModal(selectedPin.data)}
                      className="mt-2 w-full py-1 bg-amber-500 hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider transition"
                    >
                      EXCEPTIONAL OVERRIDE
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. COMPANY-OWNED BRANCHES CONFIGURATION                  */}
      {/* ======================================================== */}
      <div className="p-5 bg-[#0e0e0e] border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block font-semibold">
              BRANCH TERRITORY SETTINGS
            </span>
            <h4 className="font-serif text-lg text-white">Company-Owned Branch Radii Management</h4>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {branches.length} Registered Locations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div key={b._id} className="p-4 bg-[#141414] border border-white/10 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30 rounded">
                    COMPANY-OWNED
                  </span>
                  <h5 className="font-serif font-bold text-white text-base mt-1.5">{b.name}</h5>
                  <p className="text-[11px] text-neutral-400 font-mono line-clamp-1">{b.location}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
                  <Compass className="w-4 h-4" />
                </div>
              </div>

              <div className="p-2.5 bg-[#0a0a0a] border border-white/5 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>GPS LATITUDE:</span>
                  <span className="text-white font-medium">{b.latitude ?? 51.5118}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>GPS LONGITUDE:</span>
                  <span className="text-white font-medium">{b.longitude ?? -0.1473}</span>
                </div>
                <div className="flex justify-between text-neutral-400 border-t border-white/5 pt-1">
                  <span>PROTECTED RADIUS:</span>
                  <span className="text-[#c5a880] font-bold">{b.protectionRadiusKm || 5} KM</span>
                </div>
              </div>

              {/* Radius Configuration Slider/Input */}
              {editingBranchId === b._id ? (
                <div className="space-y-2 pt-2 border-t border-white/10 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Adjust Radius:</span>
                    <span className="text-[#c5a880] font-bold">{radiusInput} KM</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={radiusInput}
                    onChange={(e) => setRadiusInput(e.target.value)}
                    className="w-full accent-[#c5a880] cursor-pointer"
                  />
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => handleSaveRadius(b._id)}
                      disabled={savingRadius}
                      className="flex-1 py-1.5 bg-[#c5a880] hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider transition"
                    >
                      {savingRadius ? 'SAVING...' : 'SAVE RADIUS'}
                    </button>
                    <button
                      onClick={() => setEditingBranchId(null)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-400 uppercase text-[10px]"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditRadius(b)}
                  className="w-full py-1.5 border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white font-mono text-[10px] uppercase tracking-wider transition flex items-center justify-center space-x-1"
                >
                  <Sliders className="w-3 h-3 text-[#c5a880]" />
                  <span>CONFIGURE PROTECTED RADIUS</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PARTNER APPLICATIONS AUDIT & OVERRIDE QUEUE           */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block font-semibold">
              GEOFENCE AUDIT TRAIL
            </span>
            <h4 className="font-serif text-xl text-white">Partner Gym Territory Review Queue</h4>
            <p className="text-xs text-neutral-400">
              Audit distance calculations, enforce franchise exclusivity, and execute exceptional approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search partner, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#c5a880] w-48 font-mono"
              />
            </div>

            {/* Filter Pills */}
            {[
              { id: 'ALL', label: 'All', count: applications.length },
              { id: 'CONFLICTS', label: 'Conflicts', count: conflicts.length, alert: true },
              { id: 'FRANCHISE', label: 'Franchise Gyms', count: applications.filter(a => a.partnershipType === 'QNOX Franchise Gym').length },
              { id: 'SAAS', label: 'SaaS Partners', count: applications.filter(a => a.partnershipType === 'QNOX SaaS Partner Gym').length },
              { id: 'PENDING', label: 'Pending Review', count: applications.filter(a => ['PENDING_APPROVAL', 'TERRITORY_CONFLICT'].includes(a.status)).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition border flex items-center space-x-1.5 ${
                  filterType === tab.id
                    ? 'bg-[#c5a880] text-black border-[#c5a880] font-bold'
                    : 'bg-[#121212] text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  tab.alert && tab.count > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-neutral-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto border border-white/10 bg-[#0d0d0d]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#141414] text-neutral-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Gym / Brand</th>
                <th className="p-3">Policy Type</th>
                <th className="p-3">Location & GPS</th>
                <th className="p-3">Nearest Branch & Distance</th>
                <th className="p-3">Territory Status</th>
                <th className="p-3">Application Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-500">
                    No partner gym applications match the selected territory filter.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const hasConflict = app.hasTerritoryConflict || app.status === 'TERRITORY_CONFLICT';

                  return (
                    <tr key={app._id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 font-bold text-[#c5a880] whitespace-nowrap">
                        {app.applicationId}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white text-sm font-serif">{app.gymName}</div>
                        <div className="text-[11px] text-neutral-400">{app.ownerName} &bull; {app.phone}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          app.partnershipType === 'QNOX Franchise Gym'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                            : 'bg-sky-950/40 text-sky-300 border-sky-500/40'
                        }`}>
                          {app.partnershipType || 'QNOX Franchise Gym'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-white">{app.city}, {app.state}</div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-xs">{app.gymAddress}</div>
                        {app.latitude && app.longitude && (
                          <div className="text-[9px] text-[#c5a880] mt-0.5">
                            {app.latitude}, {app.longitude}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {app.conflictingBranchName ? (
                          <div className="space-y-0.5">
                            <div className="text-white font-medium">{app.conflictingBranchName}</div>
                            <div className={`text-[11px] font-bold ${hasConflict ? 'text-rose-400' : 'text-neutral-300'}`}>
                              {app.conflictDistanceKm !== null && app.conflictDistanceKm !== undefined ? `${app.conflictDistanceKm} KM away` : 'Nearby'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-500">London Central Catchment</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {hasConflict ? (
                          <span className="px-2 py-1 bg-rose-950/70 border border-rose-500/50 text-rose-300 font-bold rounded text-[10px] flex items-center space-x-1 w-max animate-pulse">
                            <ShieldAlert className="w-3 h-3" />
                            <span>TERRITORY CONFLICT</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-bold rounded text-[10px] flex items-center space-x-1 w-max">
                            <ShieldCheck className="w-3 h-3" />
                            <span>TERRITORY CLEAR</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : app.status === 'TERRITORY_CONFLICT'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                            : 'bg-white/5 text-neutral-300 border-white/10'
                        }`}>
                          {app.status}
                        </span>
                        {app.exceptionalApproval && (
                          <div className="text-[9px] text-[#c5a880] mt-0.5">★ Exceptional Override</div>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {app.status === 'TERRITORY_CONFLICT' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenOverrideModal(app)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-white text-black font-bold uppercase text-[10px] transition shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                              title="Review conflict and grant exceptional override"
                            >
                              EXCEPTIONAL OVERRIDE
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(app)}
                              className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-[10px] uppercase font-bold transition"
                            >
                              REJECT
                            </button>
                          </div>
                        ) : app.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenOverrideModal(app)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] transition"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => handleOpenRejectModal(app)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-400 text-[10px] uppercase transition"
                            >
                              REJECT
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[10px]">AUDITED</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: EXCEPTIONAL OVERRIDE APPROVAL                     */}
      {/* ======================================================== */}
      {overrideModalOpen && selectedAppForOverride && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-[#c5a880]/50 w-full max-w-lg p-6 space-y-5 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[#c5a880] block font-bold">
                  SUPER ADMIN OVERRIDE & INVITATION DISPATCH
                </span>
                <h4 className="text-lg font-serif text-white">
                  Approve {selectedAppForOverride.gymName}
                </h4>
              </div>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Territory conflict specific warning */}
            {(selectedAppForOverride.hasTerritoryConflict || selectedAppForOverride.status === 'TERRITORY_CONFLICT') && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/50 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>TERRITORIAL CONFLICT ACTIVE</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  This gym is located <strong>{selectedAppForOverride.conflictDistanceKm || 'nearby'} KM</strong> from company branch <strong>{selectedAppForOverride.conflictingBranchName}</strong> (Protected radius: 5.0 KM).
                </p>
                <p className="text-[10px] text-neutral-400">
                  * Granting approval will override the default geofence restriction. A mandatory audit justification is required below.
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-neutral-300 font-bold mb-1">
                  Super Admin Exceptional Justification * (Min 10 characters)
                </label>
                <textarea
                  rows={3}
                  value={overrideJustification}
                  onChange={(e) => setOverrideJustification(e.target.value)}
                  placeholder="e.g. Authorized by executive board: partner operates non-competing high-altitude hypoxic specialty; royalty sharing agreement attached."
                  className="w-full p-2.5 bg-[#141414] border border-[#c5a880]/40 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={overrideAdminNotes}
                  onChange={(e) => setOverrideAdminNotes(e.target.value)}
                  placeholder="e.g. Commercial dossier verified by Legal."
                  className="w-full p-2 bg-[#141414] border border-white/10 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 bg-transparent hover:bg-white/5 text-neutral-400 text-xs uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={processingOverride || overrideJustification.trim().length < 10}
                className="px-5 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {processingOverride ? (
                  <span>AUTHORIZING & DISPATCHING...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>GRANT OVERRIDE & DISPATCH INVITATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJECT APPLICATION                                */}
      {/* ======================================================== */}
      {rejectModalOpen && selectedAppForReject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-rose-500/40 w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-rose-400 block font-bold">
                  APPLICATION REJECTION
                </span>
                <h4 className="text-lg font-serif text-white">Reject {selectedAppForReject.gymName}</h4>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-neutral-300 font-bold mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Proposed facility is within the exclusive catchment of QNOX Mayfair Sanctuary; territorial exclusivity cannot be waived."
                  className="w-full p-2.5 bg-[#141414] border border-rose-500/40 text-white placeholder-neutral-600 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-transparent text-neutral-400 text-xs uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={processingReject || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-40"
              >
                {processingReject ? 'REJECTING...' : 'CONFIRM REJECTION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
