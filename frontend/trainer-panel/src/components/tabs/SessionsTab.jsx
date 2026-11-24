import React from 'react';
import { Plus } from 'lucide-react';

export default function SessionsTab({
  ptSessions,
  setNewSessionModal,
  handleUpdatePTSessionStatus,
}) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Personal Training & VIP Sanctuary Calendar
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage 1-on-1 private athlete sessions, coaching notes, and completions.
          </p>
        </div>
        <button
          onClick={() => setNewSessionModal(true)}
          className="trainer-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Schedule PT Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ptSessions.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-neutral-500 text-xs trainer-glass-card">
            No personal training sessions scheduled. Click "Schedule PT Session" to book one.
          </div>
        ) : (
          ptSessions.map((s) => (
            <div key={s._id} className="trainer-glass-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#c5a880]">{s.startTime} - {s.endTime}</span>
                  <span className={`trainer-badge ${s.status === 'Completed' ? 'trainer-badge-green' : 'trainer-badge-gold'}`}>
                    {s.status}
                  </span>
                </div>
                <h4 className="font-serif text-base text-neutral-100 font-semibold">{s.member?.name || 'Athlete'}</h4>
                <p className="text-xs text-neutral-400 mt-1">{s.trainingType} • {s.focusArea}</p>
                {s.notes && <p className="text-[11px] text-neutral-500 mt-2 italic">"{s.notes}"</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-500">
                  {new Date(s.sessionDate).toLocaleDateString()}
                </span>
                {s.status === 'Scheduled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdatePTSessionStatus(s._id, 'Completed')}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleUpdatePTSessionStatus(s._id, 'Cancelled')}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
