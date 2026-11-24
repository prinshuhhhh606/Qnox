import React from 'react';

export default function ReportsTab({ reports }) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-serif text-white tracking-wide">Coach Performance & Transformation Reports</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Adherence metrics, session completion rates, and client satisfaction scores.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="trainer-glass-card p-5">
          <span className="text-xs uppercase text-neutral-400">Session Completion Rate</span>
          <div className="text-3xl font-serif text-emerald-400 font-semibold mt-2">
            {reports?.completionRate || 96}%
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {reports?.completedSessions || 44} sessions completed of {reports?.totalSessions || 46}
          </p>
        </div>

        <div className="trainer-glass-card p-5">
          <span className="text-xs uppercase text-neutral-400">Client Adherence & Progress</span>
          <div className="text-3xl font-serif text-[#c5a880] font-semibold mt-2">
            {reports?.clientFeedbackScore || '4.95'}/5.0
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Elite athlete satisfaction index</p>
        </div>

        <div className="trainer-glass-card p-5">
          <span className="text-xs uppercase text-neutral-400">Total Assessments Completed</span>
          <div className="text-3xl font-serif text-white font-semibold mt-2">
            {reports?.assessmentsDone || 18}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Biometric reports generated</p>
        </div>
      </div>
    </div>
  );
}
