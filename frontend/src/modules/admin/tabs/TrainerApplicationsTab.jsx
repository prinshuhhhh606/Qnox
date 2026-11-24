import React from 'react';
import { RefreshCw, Shield, CheckCircle } from 'lucide-react';

export default function TrainerApplicationsTab({
  trainerApplications = [],
  pendingTrainerAppsCount = 0,
  trainerAppFilter = 'All',
  setTrainerAppFilter,
  setSelectedTrainerApp,
  setTrainerAppRemarks,
  approvingAppId,
  handleApproveTrainerApp,
  loadTrainerApplications,
}) {
  // Client-side status filtering ensuring 0ms instant reaction
  const displayedApps = (trainerApplications || []).filter((app) => {
    if (!trainerAppFilter || trainerAppFilter === 'All') return true;
    return (app.status || '').toLowerCase() === trainerAppFilter.toLowerCase();
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-2xl text-white">Trainer Accreditation & Applications</h3>
          <p className="text-xs text-neutral-400 font-light">
            Review professional certifications, credentials, and approve trainers before they can access the Coach Dashboard or appear on customer pages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={trainerAppFilter}
            onChange={(e) => {
              setTrainerAppFilter(e.target.value);
              if (loadTrainerApplications) loadTrainerApplications(e.target.value);
            }}
            className="bg-[#0e0e0e] border border-white/20 text-xs px-3 py-2 text-neutral-200 focus:outline-none focus:border-[#c5a880]"
          >
            <option value="All">All Applications</option>
            <option value="Pending">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            onClick={() => loadTrainerApplications && loadTrainerApplications(trainerAppFilter)}
            className="p-2 border border-white/20 hover:border-[#c5a880] text-neutral-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {pendingTrainerAppsCount > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-200">
                {pendingTrainerAppsCount} Trainer Application{pendingTrainerAppsCount > 1 ? 's' : ''} Awaiting Accreditation Approval
              </div>
              <div className="text-xs text-amber-300/70">
                Unapproved trainers cannot log in or appear on customer pages until approved by Admin.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTrainerAppFilter('Pending');
                if (loadTrainerApplications) loadTrainerApplications('Pending');
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase transition"
            >
              Filter Pending ({pendingTrainerAppsCount})
            </button>
            <button
              onClick={() => {
                setTrainerAppFilter('All');
                if (loadTrainerApplications) loadTrainerApplications('All');
              }}
              className="px-3 py-1 border border-white/20 text-neutral-300 hover:text-white text-xs uppercase transition"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {displayedApps.length === 0 ? (
        <div className="p-12 text-center border border-white/10 bg-[#090909]">
          <Shield className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h4 className="font-serif text-base text-neutral-300">No Applications Found</h4>
          <p className="text-xs text-neutral-500 mt-1">There are no trainer applications matching the current filter.</p>
          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setTrainerAppFilter('All');
                loadTrainerApplications();
              }}
              className="px-4 py-2 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs uppercase font-semibold transition"
            >
              Show All Applications
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-400 px-1">
            <div className="flex items-center space-x-2">
              <span>
                Showing all <strong className="text-white font-mono text-sm">{displayedApps.length}</strong> Applications in Queue
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono rounded">
                {pendingTrainerAppsCount} Awaiting Approval
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">
              Real candidate submissions are pinned at the top &bull; Fixed until decision
            </span>
          </div>

          <div className="border border-white/10 bg-[#090909] rounded-lg overflow-x-auto shadow-2xl">
            <table className="qnox-admin-table">
              <thead className="sticky top-0 bg-[#0c0c0c] z-10 border-b border-white/15">
                <tr>
                  <th>APPLICANT</th>
                  <th>APP ID</th>
                  <th>EXPERIENCE</th>
                  <th>SPECIALIZATIONS</th>
                  <th>GYM BASE</th>
                  <th>STATUS</th>
                  <th>SUBMITTED</th>
                  <th className="text-right">COMMAND</th>
                </tr>
              </thead>
              <tbody>
                {displayedApps.map((app) => (
                  <tr key={app._id} className={String(app._id || '').startsWith('app_seed_') ? '' : 'bg-[#c5a880]/5'}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            app.profilePhoto ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="text-white font-medium flex items-center space-x-1.5">
                            <span>{app.fullName}</span>
                            {!String(app._id || '').startsWith('app_seed_') && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/40 rounded font-mono font-bold">
                                NEW APPLICANT
                              </span>
                            )}
                          </div>
                          <div className="text-neutral-500 text-[11px]">{app.email} &bull; {app.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[#c5a880] text-xs font-bold">{app.applicationId}</td>
                    <td className="text-neutral-300 text-xs">{app.experienceYears} Years</td>
                    <td className="text-neutral-300 text-xs">
                      {app.specializations?.slice(0, 2).join(', ') || 'Personal Training'}
                      {app.specializations?.length > 2 && '...'}
                    </td>
                    <td className="text-neutral-400 text-xs">{app.gymName || 'Independent'} ({app.city || 'Mumbai'})</td>
                    <td>
                      <span
                        className={`text-[9px] px-2 py-0.5 uppercase font-bold tracking-wider ${
                          app.status === 'Approved'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : app.status === 'Rejected'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-neutral-400">
                      {new Date(app.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="text-right space-x-2 whitespace-nowrap">
                      {app.status === 'Pending' && (
                        <button
                          onClick={() => handleApproveTrainerApp(app._id, 'Approved via Instant Admin Command')}
                          disabled={approvingAppId === app._id}
                          className="px-3 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black uppercase transition inline-flex items-center space-x-1"
                          title="Instant 1-Click Approve"
                        >
                          <CheckCircle className={`w-3.5 h-3.5 ${approvingAppId === app._id ? 'animate-spin' : ''}`} />
                          <span>{approvingAppId === app._id ? 'APPROVING...' : 'FAST APPROVE'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTrainerApp(app);
                          setTrainerAppRemarks(app.adminRemarks || '');
                        }}
                        className="px-3 py-1 text-xs border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black uppercase transition"
                      >
                        REVIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-[#0c0c0c] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
              <span>
                Showing all <strong className="text-white">{trainerApplications.length}</strong> of{' '}
                <strong className="text-white">{trainerApplications.length}</strong> candidate applications
              </span>
              <span className="text-neutral-500 text-[11px]">
                All requests remain permanently listed here until Approved or Rejected
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
