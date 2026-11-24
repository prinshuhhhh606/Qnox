import React from 'react';
import { Plus } from 'lucide-react';

export default function AttendanceTab({
  attendanceRecords,
  setCheckInModal,
  handleCheckOutMember,
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Member Attendance Management</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Track check-in, check-out, duration, and authorized club access.
          </p>
        </div>
        <button
          onClick={() => setCheckInModal(true)}
          className="trainer-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Check-In Member
        </button>
      </div>

      <div className="trainer-glass-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Check-In Time</th>
              <th className="py-3 px-4">Check-Out Time</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Activity</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-neutral-500">
                  No attendance swipes recorded today.
                </td>
              </tr>
            ) : (
              attendanceRecords.map((rec) => (
                <tr key={rec._id} className="hover:bg-neutral-900/40">
                  <td className="py-3 px-4 font-semibold text-neutral-200">{rec.memberName}</td>
                  <td className="py-3 px-4 text-neutral-400">
                    {new Date(rec.checkIn).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    {rec.checkOut ? new Date(rec.checkOut).toLocaleString() : (
                      <span className="text-amber-400 font-medium">In Sanctuary</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-neutral-300">
                    {rec.checkOut ? `${rec.durationMinutes} mins` : 'Active'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="trainer-badge trainer-badge-gold">{rec.activityType}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {!rec.checkOut && (
                      <button
                        onClick={() => handleCheckOutMember(rec._id)}
                        className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40"
                      >
                        Check-Out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
