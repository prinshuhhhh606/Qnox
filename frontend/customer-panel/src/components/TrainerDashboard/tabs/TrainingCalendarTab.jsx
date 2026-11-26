import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Sparkles,
  MapPin,
  Flame
} from 'lucide-react';

export default function TrainingCalendarTab({
  ptSessions = [],
  members = [],
  setNewSessionModal,
  handleUpdatePTSessionStatus,
}) {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'agenda'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Helper: Start of week (Monday)
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Generate 7 days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Navigate calendar
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered sessions
  const filteredSessions = ptSessions.filter((s) => {
    if (selectedStatusFilter === 'All') return true;
    return s.status === selectedStatusFilter;
  });

  // Calculate metrics
  const totalSessions = ptSessions.length;
  const completedSessions = ptSessions.filter((s) => s.status === 'Completed').length;
  const upcomingSessions = ptSessions.filter((s) => s.status === 'Scheduled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#c5a880]" />
            <h2 className="text-2xl font-serif text-white tracking-wide">
              Athletic Schedule & Training Calendar
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Live sanctuary timetable, 1-on-1 private athlete sessions, coaching blocks, and master timetable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setSelectedStatusFilter('All')}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedStatusFilter === 'All' ? 'bg-[#c5a880] text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({totalSessions})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('Scheduled')}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedStatusFilter === 'Scheduled' ? 'bg-[#c5a880] text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Scheduled ({upcomingSessions})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedStatusFilter === 'Completed' ? 'bg-emerald-500 text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Completed ({completedSessions})
            </button>
          </div>

          <button
            onClick={() => setNewSessionModal(true)}
            className="trainer-btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Schedule PT Session
          </button>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-white">{totalSessions}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Total Bookings</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-amber-400">{upcomingSessions}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Upcoming Sessions</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-emerald-400">{completedSessions}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Completed Sessions</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[#c5a880]">{members?.length || 12}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Sanctuary Athletes</p>
        </div>
      </div>

      {/* Calendar Controls & Navigation Bar */}
      <div className="trainer-glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-950/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-serif text-base sm:text-lg font-semibold text-white tracking-wide">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && (
              <span className="text-xs text-neutral-400 font-sans ml-2">
                (Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            )}
          </span>
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-md transition ${
              viewMode === 'week' ? 'bg-[#c5a880] text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-md transition ${
              viewMode === 'agenda' ? 'bg-[#c5a880] text-black font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Agenda View
          </button>
        </div>
      </div>

      {/* Week Grid View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const daySessions = filteredSessions.filter((s) => isSameDay(s.sessionDate, day));
            const todayActive = isToday(day);

            return (
              <div
                key={idx}
                className={`flex flex-col rounded-xl border p-3 min-h-[260px] transition ${
                  todayActive
                    ? 'border-[#c5a880]/60 bg-[#c5a880]/5 ring-1 ring-[#c5a880]/30'
                    : 'border-neutral-800 bg-[#0a0a0a]/80'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold px-1.5 py-0.5 rounded ${
                        todayActive ? 'bg-[#c5a880] text-black' : 'text-white'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {daySessions.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-[#c5a880] font-mono">
                      {daySessions.length}
                    </span>
                  )}
                </div>

                {/* Day's Session Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {daySessions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-neutral-600">
                      <Clock className="w-4 h-4 mb-1 opacity-50" />
                      <span className="text-[10px]">No sessions</span>
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session._id}
                        className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:border-[#c5a880]/40 transition text-left"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-[#c5a880] font-mono font-semibold">
                            {session.startTime || '08:00'} - {session.endTime || '09:00'}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              session.status === 'Completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : session.status === 'Cancelled'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/30'
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-white truncate">
                          {session.member?.name || 'Sanctuary Athlete'}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                          {session.trainingType || 'Strength'} • {session.focusArea || 'Hypertrophy'}
                        </p>

                        {session.notes && (
                          <p className="text-[10px] text-neutral-500 italic truncate mt-1">
                            "{session.notes}"
                          </p>
                        )}

                        {/* Action buttons if scheduled */}
                        {session.status === 'Scheduled' && (
                          <div className="mt-2 pt-2 border-t border-neutral-800 flex justify-end gap-2 text-[10px]">
                            <button
                              onClick={() => handleUpdatePTSessionStatus(session._id, 'Completed')}
                              className="text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              ✓ Done
                            </button>
                            <button
                              onClick={() => handleUpdatePTSessionStatus(session._id, 'Cancelled')}
                              className="text-red-400 hover:text-red-300 font-medium"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Button */}
                <button
                  onClick={() => setNewSessionModal(true)}
                  className="mt-2 w-full py-1 text-[11px] text-neutral-500 hover:text-[#c5a880] hover:bg-neutral-900 rounded border border-dashed border-neutral-800/80 transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Book
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Agenda View */}
      {viewMode === 'agenda' && (
        <div className="trainer-glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/60">
            <h3 className="font-serif text-sm font-semibold text-white tracking-wide">
              Complete Training Agenda ({filteredSessions.length} Sessions)
            </h3>
            <span className="text-xs text-neutral-500">Chronological itinerary</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 text-xs">
              No sessions found matching current filter. Click "Schedule PT Session" to create one.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {filteredSessions.map((session) => (
                <div
                  key={session._id}
                  className="p-4 sm:p-5 hover:bg-neutral-900/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-[#c5a880]">
                        {new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-base font-bold text-white leading-none">
                        {new Date(session.sessionDate).getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base text-white font-semibold">
                          {session.member?.name || 'Sanctuary Athlete'}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            session.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : session.status === 'Cancelled'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/30'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-1">
                        <span className="flex items-center gap-1 text-[#c5a880] font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {session.startTime} - {session.endTime}
                        </span>
                        <span>•</span>
                        <span>{session.trainingType}</span>
                        <span>•</span>
                        <span>{session.focusArea}</span>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-neutral-400 mt-2 bg-neutral-900/60 p-2 rounded border border-neutral-800/80">
                          <span className="text-[#c5a880] font-medium">Coach Note:</span> "{session.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                    <span className="text-xs text-neutral-500 font-mono">
                      {new Date(session.sessionDate).toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>

                    {session.status === 'Scheduled' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdatePTSessionStatus(session._id, 'Completed')}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded text-xs transition"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdatePTSessionStatus(session._id, 'Cancelled')}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
