import React from 'react';
import { X, CheckCircle } from 'lucide-react';

export default function TrainerAppDetailDrawer({
  app,
  onClose,
  trainerAppRemarks,
  setTrainerAppRemarks,
  approvingAppId,
  handleApproveTrainerApp,
  handleRejectTrainerApp,
}) {
  if (!app) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/25 flex justify-between transition-all duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Left-side transparent area allowing full visibility of dashboard */}
      <div
        className="hidden lg:flex items-start justify-start p-6 flex-1 cursor-pointer"
        onClick={onClose}
        title="Click to dismiss review drawer"
      >
        <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm border border-white/20 text-neutral-300 text-xs font-mono rounded hover:bg-black hover:border-[#c5a880] hover:text-white transition flex items-center space-x-2 shadow-2xl">
          <span>&larr; Click dashboard to return</span>
        </span>
      </div>

      <div
        className="w-full max-w-xl bg-[#0d0d0d] border-l border-[#c5a880]/30 shadow-[-20px_0_50px_rgba(0,0,0,0.85)] h-full p-6 overflow-y-auto space-y-6 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono">
              APPLICATION ID &bull; {app.applicationId}
            </span>
            <h3 className="font-serif text-xl text-white font-semibold">{app.fullName}</h3>
            <p className="text-xs text-neutral-400">{app.email} &bull; {app.phone}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#121212] border border-white/5">
            <span className="text-[10px] uppercase text-neutral-500 block">Experience</span>
            <span className="text-white font-medium">{app.experienceYears} Years</span>
          </div>
          <div className="p-3 bg-[#121212] border border-white/5">
            <span className="text-[10px] uppercase text-neutral-500 block">Qualifications</span>
            <span className="text-white font-medium">{app.qualifications}</span>
          </div>
          <div className="p-3 bg-[#121212] border border-white/5">
            <span className="text-[10px] uppercase text-neutral-500 block">Gym Base / City</span>
            <span className="text-white font-medium">{app.gymName || 'Independent'} ({app.city})</span>
          </div>
          <div className="p-3 bg-[#121212] border border-white/5">
            <span className="text-[10px] uppercase text-neutral-500 block">Current Status</span>
            <span className="text-[#c5a880] font-bold uppercase">{app.status}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">Professional Bio</span>
          <p className="text-xs text-neutral-300 bg-[#121212] p-3 border border-white/5 leading-relaxed">
            "{app.bio}"
          </p>
        </div>

        {app.specializations?.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Specializations</span>
            <div className="flex flex-wrap gap-1.5">
              {app.specializations.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-[#181818] border border-white/10 text-[#c5a880] text-[10px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Documents */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1.5">Submitted Credentials</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#121212] border border-white/5 flex items-center justify-between">
              <span className="text-neutral-300">Fitness Certification</span>
              {app.certificationDocument ? (
                <a
                  href={app.certificationDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] underline"
                >
                  ✓ View Certificate
                </a>
              ) : (
                <span className="text-neutral-500 text-[11px]">Pending</span>
              )}
            </div>
            <div className="p-2.5 bg-[#121212] border border-white/5 flex items-center justify-between">
              <span className="text-neutral-300">Government ID Proof</span>
              {app.identityProofDocument ? (
                <a
                  href={app.identityProofDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] underline"
                >
                  ✓ View ID Proof
                </a>
              ) : (
                <span className="text-neutral-500 text-[11px]">Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Administrative Remarks */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">
            Administrative Remarks / Notes
          </label>
          <textarea
            rows={2}
            value={trainerAppRemarks}
            onChange={(e) => setTrainerAppRemarks(e.target.value)}
            placeholder="e.g. Credentials verified against UKSCA registry. Approved for Master Coach roster."
            className="w-full bg-[#121212] border border-white/10 text-xs text-white p-2.5 focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white uppercase"
          >
            Close
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleRejectTrainerApp(app._id)}
              className="px-4 py-2 border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 text-xs uppercase font-semibold transition"
            >
              Reject Application
            </button>

            <button
              type="button"
              disabled={approvingAppId === app._id}
              onClick={() => handleApproveTrainerApp(app._id)}
              className="px-6 py-2 bg-gradient-to-r from-[#c5a880] to-[#9b7e52] hover:opacity-95 text-black text-xs uppercase font-bold tracking-wider shadow-lg shadow-[#c5a880]/20 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle className={`w-4 h-4 ${approvingAppId === app._id ? 'animate-spin' : ''}`} />
              <span>{approvingAppId === app._id ? 'Activating Trainer...' : 'Approve & Activate Trainer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
