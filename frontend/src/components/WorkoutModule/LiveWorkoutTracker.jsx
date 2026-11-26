import React, { useState, useEffect, useRef } from 'react';
import {
  Clock, Play, Pause, RotateCcw, Check, CheckCircle2, ChevronRight,
  ChevronLeft, AlertCircle, Dumbbell, Flame, X, Shield, Volume2
} from 'lucide-react';
import { logUserSessionSet, completeUserWorkoutSession, cancelUserWorkoutSession } from '../../services/api';

export default function LiveWorkoutTracker({
  session,
  onComplete,
  onCancel,
  showToast,
}) {
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [liveSession, setLiveSession] = useState(session);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restInitialSeconds, setRestInitialSeconds] = useState(60);

  // Set logging form state for current exercise
  const [setForm, setSetForm] = useState({
    reps: 10,
    weightKg: 20,
  });
  const [loggingSet, setLoggingSet] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);

  // Web Audio Context for synthesized rest timer chime
  const playRestChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  // Workout Duration Stopwatch
  useEffect(() => {
    const startTime = new Date(liveSession.startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [liveSession.startedAt]);

  // Rest Countdown Timer
  useEffect(() => {
    let interval = null;
    if (isResting && restSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            playRestChime();
            if (showToast) showToast('Rest period ended! Prepare for next set.', 'info');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restSecondsLeft === 0) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft]);

  const currentExercise = liveSession.exercises && liveSession.exercises[currentExIndex];

  // Set default reps and rest when changing exercise
  useEffect(() => {
    if (currentExercise) {
      const parsedReps = parseInt(currentExercise.targetReps) || 10;
      setSetForm((prev) => ({
        ...prev,
        reps: parsedReps,
      }));
      setRestInitialSeconds(currentExercise.restSeconds || 60);
    }
  }, [currentExIndex, currentExercise]);

  const handleStartRest = (seconds) => {
    const s = seconds || currentExercise?.restSeconds || 60;
    setRestInitialSeconds(s);
    setRestSecondsLeft(s);
    setIsResting(true);
  };

  const handleAddRestTime = (secondsToAdd) => {
    setRestSecondsLeft((prev) => prev + secondsToAdd);
  };

  const handleLogSet = async () => {
    if (!currentExercise || loggingSet) return;
    try {
      setLoggingSet(true);
      const setNumber = (currentExercise.completedSets?.length || 0) + 1;
      const res = await logUserSessionSet(liveSession._id, {
        exerciseIndex: currentExIndex,
        setNumber,
        reps: Number(setForm.reps) || 10,
        weightKg: Number(setForm.weightKg) || 0,
      });

      if (res.success && res.data) {
        setLiveSession(res.data);
        if (showToast) showToast(`Set ${setNumber} logged! Rest interval triggered.`);
        handleStartRest(currentExercise.restSeconds || 60);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to log set', 'error');
    } finally {
      setLoggingSet(false);
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setCompletingSession(true);
      const res = await completeUserWorkoutSession(liveSession._id, {
        notes: 'Discipline upheld in Sanctuary session.',
        userRating: 5,
      });
      if (res.success && res.data) {
        onComplete(res.data.summary);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to complete session', 'error');
    } finally {
      setCompletingSession(false);
    }
  };

  const handleQuitWorkout = async () => {
    if (!window.confirm('Are you sure you want to exit and abandon this workout session?')) return;
    try {
      await cancelUserWorkoutSession(liveSession._id);
      if (showToast) showToast('Workout session ended.', 'info');
      onCancel();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
      onCancel();
    }
  };

  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalExercises = liveSession.exercises?.length || 1;
  const completedExercises = liveSession.exercises?.filter((e) => e.isCompleted).length || 0;
  const progressPercent = Math.round((completedExercises / totalExercises) * 100);

  return (
    <div className="fixed inset-0 z-[90] bg-[#050505] flex flex-col text-white animate-fadeIn overflow-y-auto">
      {/* Top HUD Bar */}
      <header className="border-b border-white/10 bg-[#080808] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-serif font-bold text-white tracking-wide flex items-center gap-2">
              <span>{liveSession.planTitle || 'Sanctuary Protocol'}</span>
              <span className="text-[10px] text-[#c5a880] font-mono px-2 py-0.5 rounded bg-[#c5a880]/10 border border-[#c5a880]/30 hidden sm:inline">
                {liveSession.dayName} • {liveSession.dayFocus}
              </span>
            </h2>
          </div>
        </div>

        {/* Stopwatch & Action Buttons */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <button
            disabled={completingSession}
            onClick={handleFinishWorkout}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Finish Workout</span>
          </button>

          <button
            onClick={handleQuitWorkout}
            className="text-neutral-500 hover:text-red-400 p-1.5 transition-colors"
            title="Cancel Session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full bg-neutral-900 h-1">
        <div
          className="bg-gradient-to-r from-[#c5a880] to-emerald-400 h-1 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Tracker Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Exercise Quick-Switch Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {liveSession.exercises?.map((ex, idx) => {
            const isCurrent = idx === currentExIndex;
            const isDone = ex.isCompleted;
            return (
              <button
                key={idx}
                onClick={() => setCurrentExIndex(idx)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#c5a880] text-black border-[#c5a880] font-bold shadow-md'
                    : isDone
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                <span>{idx + 1}. {ex.name}</span>
              </button>
            );
          })}
        </div>

        {/* Current Exercise Detail Card */}
        {currentExercise && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 sm:p-7 space-y-6 shadow-xl relative">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30">
                    Exercise {currentExIndex + 1} of {totalExercises}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Target: <strong className="text-white">{currentExercise.targetMuscle}</strong>
                  </span>
                </div>
                <h3 className="text-2xl font-serif text-white font-semibold mt-1">
                  {currentExercise.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <span className="bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800">
                  Target Sets: <strong className="text-[#c5a880]">{currentExercise.targetSets}</strong>
                </span>
                <span className="bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800">
                  Target Reps: <strong className="text-emerald-400">{currentExercise.targetReps}</strong>
                </span>
              </div>
            </div>

            {/* Biomechanical Instructions */}
            {currentExercise.instructions && (
              <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#c5a880] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Form & Technique: </strong>
                  {currentExercise.instructions}
                </div>
              </div>
            )}

            {/* Logged Sets History Table */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                Sets Completed ({currentExercise.completedSets?.length || 0} / {currentExercise.targetSets})
              </h4>

              {currentExercise.completedSets && currentExercise.completedSets.length > 0 ? (
                <div className="space-y-2">
                  {currentExercise.completedSets.map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                          ✓
                        </span>
                        <span className="font-semibold text-white">Set {s.setNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-neutral-300">
                        <span>Weight: <strong className="text-white">{s.weightKg} kg</strong></span>
                        <span>Reps: <strong className="text-[#c5a880]">{s.reps}</strong></span>
                        <span className="text-[10px] text-neutral-500 hidden sm:inline">
                          {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic p-3 bg-neutral-950/40 rounded-lg border border-neutral-900">
                  No sets logged yet. Complete your first set below to trigger the rest timer.
                </p>
              )}
            </div>

            {/* Active Set Logging Inputs */}
            <div className="bg-neutral-950 p-4 sm:p-5 rounded-xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#c5a880]">
                  Log Set {(currentExercise.completedSets?.length || 0) + 1}
                </h5>
                <span className="text-[11px] text-neutral-500">
                  Default Rest: {currentExercise.restSeconds || 60}s
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={setForm.weightKg}
                    onChange={(e) => setSetForm({ ...setForm, weightKg: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-sm font-mono text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Reps Done
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={setForm.reps}
                    onChange={(e) => setSetForm({ ...setForm, reps: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-sm font-mono text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <button
                    disabled={loggingSet}
                    onClick={handleLogSet}
                    className="w-full py-2.5 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{loggingSet ? 'Saving...' : 'Mark Set Done'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Rest Timer HUD */}
            <div className={`p-4 rounded-xl border transition-all ${
              isResting
                ? 'bg-amber-950/20 border-amber-500/40 shadow-lg animate-pulse'
                : 'bg-neutral-950/60 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isResting ? 'text-amber-400 animate-spin' : 'text-neutral-400'}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    {isResting ? 'Recovery Interval Active' : 'Rest Timer'}
                  </span>
                </div>

                <span className="font-mono text-xl sm:text-2xl font-extrabold text-amber-400">
                  {formatTime(restSecondsLeft)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartRest(currentExercise.restSeconds || 60)}
                    className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700 transition"
                  >
                    {currentExercise.restSeconds || 60}s
                  </button>
                  <button
                    onClick={() => handleStartRest(90)}
                    className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700 transition"
                  >
                    90s
                  </button>
                  <button
                    onClick={() => handleAddRestTime(15)}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-[#c5a880] text-xs rounded border border-neutral-700 transition"
                  >
                    +15s
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isResting ? (
                    <button
                      onClick={() => setIsResting(false)}
                      className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsResting(true)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-500 transition"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsResting(false);
                      setRestSecondsLeft(0);
                    }}
                    className="px-2.5 py-1 text-neutral-400 hover:text-white text-xs transition"
                  >
                    Skip Rest
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Between Exercises */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentExIndex === 0}
                onClick={() => setCurrentExIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Exercise</span>
              </button>

              <span className="text-xs text-neutral-500 font-mono">
                {currentExIndex + 1} / {totalExercises}
              </span>

              <button
                disabled={currentExIndex === totalExercises - 1}
                onClick={() => setCurrentExIndex((prev) => Math.min(totalExercises - 1, prev + 1))}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <span>Next Exercise</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
