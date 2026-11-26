import React from 'react';
import { Award, Flame, Clock, CheckCircle2, Dumbbell, Star, ArrowRight } from 'lucide-react';

export default function WorkoutCompletionModal({ summary, isOpen, onClose }) {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0a0a0a] border border-[#c5a880]/40 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a880]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#c5a880]/15 border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] shadow-lg">
            <Award className="w-8 h-8 animate-bounce" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880] px-3 py-1 bg-[#c5a880]/10 rounded-full border border-[#c5a880]/30 inline-block">
            Session Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
            Supreme Discipline
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {summary.dayFocus || summary.planTitle || 'Sanctuary Athletic Protocol'} finished and permanently recorded in your history.
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center text-amber-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.durationMinutes || 0}m</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Duration</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center text-rose-400 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.caloriesBurned || 0}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Est. Calories</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.totalExercisesCompleted || 0}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Exercises</p>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center text-[#c5a880] mb-1">
              <Dumbbell className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white font-mono">{summary.totalSetsCompleted || 0}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Sets Logged</p>
          </div>
        </div>

        {/* Volume & Details */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Total Repetitions Completed</span>
            <strong className="text-white">{summary.totalRepsCompleted || 0} reps</strong>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Program Protocol</span>
            <span className="text-[#c5a880] truncate max-w-[200px]">{summary.planTitle}</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Recorded At</span>
            <span className="text-neutral-300">
              {new Date(summary.completedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-semibold text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span>Return to Workout Sanctuary</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
