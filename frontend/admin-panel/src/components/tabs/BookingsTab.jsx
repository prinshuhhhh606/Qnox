import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function BookingsTab({
  bookings = [],
  loadBookings,
  handleSetAttendance,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-white">Daily Masterclass Reservations</h3>
          <p className="text-xs text-neutral-400 font-light">Audit bookings, mark attendance and manage waitlist slots.</p>
        </div>
        <button
          onClick={loadBookings}
          className="px-4 py-2 border border-white/10 text-xs uppercase text-neutral-300 flex items-center space-x-1.5 hover:border-white/30 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH</span>
        </button>
      </div>

      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
        <table className="qnox-admin-table">
          <thead>
            <tr>
              <th>PASS CODE</th>
              <th>SESSION</th>
              <th>SANCTUARY</th>
              <th>MEMBER GUEST</th>
              <th>SCHEDULE</th>
              <th>STATUS</th>
              <th className="text-right">ATTENDANCE</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id}>
                <td className="font-mono text-[#c5a880] font-bold">{b.reservationCode}</td>
                <td>
                  <div className="font-medium text-white">{b.classTitle}</div>
                  <div className="text-[11px] text-neutral-500">{b.category} &bull; {b.trainerName}</div>
                </td>
                <td>{b.clubName}</td>
                <td>
                  <div className="text-white">{b.userName}</div>
                  <div className="text-[11px] text-neutral-500">{b.userEmail}</div>
                </td>
                <td className="font-mono text-xs">{b.day} ({b.startTime})</td>
                <td>
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                      b.status === 'Confirmed'
                        ? 'bg-emerald-950/60 text-emerald-400'
                        : b.status === 'Attended'
                        ? 'bg-sky-950/60 text-sky-400'
                        : 'bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="text-right space-x-1.5">
                  <button
                    onClick={() => handleSetAttendance(b._id, 'Attended')}
                    className="px-2 py-1 text-[11px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60 transition"
                  >
                    ATTENDED
                  </button>
                  <button
                    onClick={() => handleSetAttendance(b._id, 'No-Show')}
                    className="px-2 py-1 text-[11px] bg-neutral-900 text-neutral-400 hover:text-white transition"
                  >
                    NO-SHOW
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
