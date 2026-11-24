import React from 'react';
import {
  Sparkles, CheckSquare, Users, CheckCircle, UserCheck, Award,
  Calendar, Plus, Clock
} from 'lucide-react';

export default function OverviewTab({
  currentUser,
  stats,
  todaySessions,
  recentAttendance,
  setActiveTab,
  setCheckInModal,
  setNewSessionModal,
  handleUpdatePTSessionStatus,
  handleCheckOutMember,
}) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="trainer-glass-card p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-4 border-l-[#c5a880]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="trainer-badge trainer-badge-gold">TRAINER COMMAND</span>
            <span className="text-xs text-neutral-400">Mayfair Performance Sanctuary</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
            Welcome, Coach {currentUser?.name || 'Marcus'}
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-xl">
            Here is your real-time athlete readiness matrix, schedule, and transformation queue for today.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('ai-workouts')}
            className="trainer-btn-primary flex items-center gap-2 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI Workout Assistant
          </button>
          <button
            onClick={() => setCheckInModal(true)}
            className="trainer-btn-outline flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Mark Check-In
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="trainer-glass-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Assigned Members</span>
            <Users className="w-4 h-4 text-[#c5a880]" />
          </div>
          <div className="text-3xl font-serif text-white font-semibold">{stats.totalAssignedMembers}</div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {stats.activeMembers} active memberships
          </div>
        </div>

        <div className="trainer-glass-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Today Present</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-serif text-white font-semibold">{stats.todayPresent}</div>
          <div className="text-[11px] text-neutral-400 mt-2">
            {stats.todayAbsent} members pending check-in
          </div>
        </div>

        <div className="trainer-glass-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Personal Clients</span>
            <UserCheck className="w-4 h-4 text-[#c5a880]" />
          </div>
          <div className="text-3xl font-serif text-white font-semibold">{stats.ptClients}</div>
          <div className="text-[11px] text-[#c5a880] mt-2">
            {stats.todaySessionsCount} sessions today
          </div>
        </div>

        <div className="trainer-glass-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs uppercase tracking-wider">Assessments Due</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-serif text-white font-semibold">{stats.pendingAssessments}</div>
          <div className="text-[11px] text-amber-400/90 mt-2">
            Requires transformation review
          </div>
        </div>
      </div>

      {/* Today's Schedule & Attendance Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule */}
        <div className="lg:col-span-2 trainer-glass-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#c5a880]" />
              <h3 className="font-serif text-base tracking-wide text-neutral-100 uppercase">
                Today's Training Schedule
              </h3>
            </div>
            <button
              onClick={() => setNewSessionModal(true)}
              className="text-xs text-[#c5a880] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" /> Book Session
            </button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No sessions scheduled for today yet.
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-[#c5a880]/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#c5a880]/30 flex items-center justify-center font-bold text-xs text-[#c5a880]">
                      {session.startTime.slice(0, 5)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-200">
                        {session.member?.name || 'Athletic Member'}
                      </p>
                      <p className="text-[11px] text-neutral-400">{session.trainingType} • {session.focusArea}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`trainer-badge ${
                        session.status === 'Completed'
                          ? 'trainer-badge-green'
                          : session.status === 'Cancelled'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'trainer-badge-gold'
                      }`}
                    >
                      {session.status}
                    </span>
                    {session.status === 'Scheduled' && (
                      <button
                        onClick={() => handleUpdatePTSessionStatus(session._id, 'Completed')}
                        className="p-1.5 text-xs text-neutral-400 hover:text-emerald-400 rounded"
                        title="Mark Completed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent Attendance */}
        <div className="trainer-glass-card p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c5a880]" />
              <h3 className="font-serif text-base tracking-wide text-neutral-100 uppercase">
                Live Club Access
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs text-[#c5a880] hover:underline uppercase tracking-wider"
            >
              View All
            </button>
          </div>

          {recentAttendance.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">No recent swipes.</div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.slice(0, 5).map((rec) => (
                <div key={rec._id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-neutral-200">{rec.memberName}</p>
                    <p className="text-[10px] text-neutral-500">
                      {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rec.activityType}
                    </p>
                  </div>
                  {rec.checkOut ? (
                    <span className="text-[10px] text-neutral-500">Out {rec.durationMinutes}m</span>
                  ) : (
                    <button
                      onClick={() => handleCheckOutMember(rec._id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40"
                    >
                      Check-Out
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
