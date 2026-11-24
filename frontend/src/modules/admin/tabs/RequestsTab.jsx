import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';

export default function RequestsTab({
  membershipRequests = [],
  requestsFilter = 'All',
  setRequestsFilter,
  requestsStatusFilter = 'All',
  setRequestsStatusFilter,
  loadingRequests = false,
  loadMembershipRequests,
  setSelectedRequestAction,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-sky-400 uppercase font-bold block mb-1">
            EXECUTIVE MEMBERSHIP SURVEILLANCE
          </span>
          <h3 className="font-serif text-2xl text-white">Membership Requests Console</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Review and process customer freeze and cancellation requests with automatic date adjustments and notification dispatches.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadMembershipRequests()}
            className="px-4 py-2 border border-white/10 hover:border-white/30 text-neutral-300 text-xs tracking-wider uppercase transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin text-[#c5a880]' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-neutral-500 uppercase tracking-widest text-[10px] mr-2">TYPE:</span>
          {['All', 'Freeze', 'Cancellation'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setRequestsFilter(t);
              }}
              className={`px-3 py-1 text-xs uppercase tracking-wider font-mono border transition ${
                requestsFilter === t
                  ? 'border-[#c5a880] text-white bg-[#c5a880]/10 font-bold'
                  : 'border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-neutral-500 uppercase tracking-widest text-[10px] mr-2">STATUS:</span>
          {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setRequestsStatusFilter(s);
              }}
              className={`px-3 py-1 text-xs uppercase tracking-wider font-mono border transition ${
                requestsStatusFilter === s
                  ? s === 'Pending'
                    ? 'border-sky-500 text-sky-300 bg-sky-950/30 font-bold'
                    : s === 'Approved'
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30 font-bold'
                    : s === 'Rejected'
                    ? 'border-rose-500 text-rose-300 bg-rose-950/30 font-bold'
                    : 'border-[#c5a880] text-white bg-[#c5a880]/10 font-bold'
                  : 'border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      {loadingRequests ? (
        <div className="py-20 text-center text-xs text-neutral-500 font-mono tracking-widest uppercase">
          LOADING MEMBERSHIP REQUESTS...
        </div>
      ) : membershipRequests.length === 0 ? (
        <div className="p-12 text-center border border-white/10 bg-[#0a0a0a]">
          <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <h4 className="font-serif text-lg text-white mb-1">No Membership Requests Found</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            There are currently no customer freeze or cancellation requests matching the selected filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10 bg-[#0a0a0a]">
          <table className="w-full text-left text-xs text-neutral-300 font-mono">
            <thead className="bg-[#121212] text-[#c5a880] uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4">Duration / Specifics</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {membershipRequests.map((req) => (
                <tr key={req._id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4">
                    <div className="font-sans font-semibold text-white">{req.userName}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">{req.userEmail}</div>
                    {req.memberId && (
                      <span className="text-[9px] px-1 bg-white/5 text-[#c5a880] border border-white/10 inline-block mt-0.5">
                        {req.memberId}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.type === 'Freeze'
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-500/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-300">
                    {req.type === 'Freeze' ? (
                      <div>
                        <span>{req.freezeDays || 30} Days Pause</span>
                        {req.freezeStartDate && (
                          <div className="text-[10px] text-neutral-500">
                            From {new Date(req.freezeStartDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span>Voluntary Departure</span>
                        {req.refundAmount > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            Refund: ₹{req.refundAmount.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 max-w-xs font-sans text-neutral-300 font-light truncate" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="p-4 text-neutral-400">
                    {new Date(req.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'Pending'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                          : req.status === 'Approved'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    {req.status === 'Pending' ? (
                      <>
                        <button
                          onClick={() => setSelectedRequestAction({ request: req, action: 'approve' })}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider transition"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() => setSelectedRequestAction({ request: req, action: 'reject' })}
                          className="px-3 py-1 border border-rose-500/50 text-rose-400 hover:bg-rose-950/40 text-xs font-bold uppercase tracking-wider transition"
                        >
                          REJECT
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-neutral-500">
                        Reviewed by {req.reviewedByName || 'Admin'}
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
  );
}
