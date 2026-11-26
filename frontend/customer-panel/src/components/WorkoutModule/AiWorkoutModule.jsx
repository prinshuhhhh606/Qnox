import React, { useState, useEffect } from 'react';
import {
  Sparkles, Dumbbell, Play, CheckCircle2, Bookmark, BookmarkCheck,
  Clock, Flame, Calendar, Award, Trash2, ArrowRight, RefreshCw,
  ChevronDown, ChevronUp, Shield, BarChart3, ListFilter, Activity
} from 'lucide-react';
import {
  generateUserAiWorkout,
  saveUserWorkoutPlan,
  approveUserWorkoutPlan,
  getUserActiveWorkoutPlan,
  getUserSavedWorkoutPlans,
  deleteUserSavedWorkoutPlan,
  startUserWorkoutSession,
  getCurrentUserWorkoutSession,
  getUserWorkoutProgressDashboard
} from '../../services/api';
import LiveWorkoutTracker from './LiveWorkoutTracker';
import WorkoutCompletionModal from './WorkoutCompletionModal';

export default function AiWorkoutModule({ user, showToast }) {
  // Navigation Sub-tab: 'generator' | 'details' | 'saved' | 'progress'
  const [activeSubTab, setActiveSubTab] = useState('generator');

  // Generator State
  const [form, setForm] = useState({
    goal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    daysPerWeek: 4,
    limitations: 'None',
    focus: 'Hypertrophy & Strength',
    availableEquipment: 'Full Sanctuary Athletic Gym',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);

  // Active / Selected Workout Plan State
  const [activePlan, setActivePlan] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [loadingActivePlan, setLoadingActivePlan] = useState(false);

  // Saving / Approving Loading States
  const [savingPlan, setSavingPlan] = useState(false);
  const [approvingPlan, setApprovingPlan] = useState(false);

  // Saved Plans Library
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Progress Dashboard Data
  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Live Workout Session State
  const [liveSession, setLiveSession] = useState(null);
  const [startingSession, setStartingSession] = useState(false);

  // Completion Modal State
  const [completedSummary, setCompletedSummary] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Load Active Plan, Ongoing Session & Progress on Mount
  useEffect(() => {
    loadActivePlan();
    checkOngoingSession();
    loadSavedPlans();
    loadProgressDashboard();
  }, []);

  const loadActivePlan = async () => {
    try {
      setLoadingActivePlan(true);
      const res = await getUserActiveWorkoutPlan();
      if (res.success && res.data) {
        setActivePlan(res.data);
      }
    } catch (err) {
      console.warn('Notice loading active plan:', err.message);
    } finally {
      setLoadingActivePlan(false);
    }
  };

  const checkOngoingSession = async () => {
    try {
      const res = await getCurrentUserWorkoutSession();
      if (res.success && res.data) {
        setLiveSession(res.data);
      }
    } catch (err) {
      console.warn('Notice checking ongoing session:', err.message);
    }
  };

  const loadSavedPlans = async () => {
    try {
      setLoadingSaved(true);
      const res = await getUserSavedWorkoutPlans();
      if (res.success && res.data) {
        setSavedPlans(res.data);
      }
    } catch (err) {
      console.warn('Notice loading saved plans:', err.message);
    } finally {
      setLoadingSaved(false);
    }
  };

  const loadProgressDashboard = async () => {
    try {
      setLoadingProgress(true);
      const res = await getUserWorkoutProgressDashboard();
      if (res.success && res.data) {
        setProgressData(res.data);
      }
    } catch (err) {
      console.warn('Notice loading progress dashboard:', err.message);
    } finally {
      setLoadingProgress(false);
    }
  };

  // 1. Generate AI Workout Plan
  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      const res = await generateUserAiWorkout(form);
      if (res.success && res.data) {
        setGeneratedPlan(res.data);
        if (showToast) showToast('AI Workout Protocol synthesized! Review your split below.');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to synthesize plan', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // 2. Approve Plan (Validates, saves approvedAt, sets active, redirects to Details)
  const handleApprovePlan = async (planToApprove) => {
    const plan = planToApprove || generatedPlan;
    if (!plan || approvingPlan) return;

    try {
      setApprovingPlan(true);
      const payload = {
        planId: plan._id || undefined,
        planData: plan._id ? undefined : plan,
      };

      const res = await approveUserWorkoutPlan(payload);
      if (res.success && res.data) {
        setActivePlan(res.data);
        if (showToast) showToast('Workout protocol approved & activated as your primary regimen!');
        loadSavedPlans();
        loadProgressDashboard();
        // Redirect to Workout Details screen
        setActiveSubTab('details');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to approve workout plan', 'error');
    } finally {
      setApprovingPlan(false);
    }
  };

  // 3. Save Plan (Saves permanently, prevents duplicates, shows in Saved section)
  const handleSavePlan = async (planToSave) => {
    const plan = planToSave || generatedPlan;
    if (!plan || savingPlan) return;

    try {
      setSavingPlan(true);
      const res = await saveUserWorkoutPlan(plan);
      if (res.success && res.data) {
        if (res.isDuplicate) {
          if (showToast) showToast('This plan is already saved in your sanctuary library.', 'info');
        } else {
          if (showToast) showToast('Workout protocol saved to your library!');
        }
        loadSavedPlans();
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to save workout plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  // 4. Start Live Workout Session
  const handleStartWorkout = async (planId, dayIdx = 0, forceNew = false) => {
    try {
      setStartingSession(true);
      const res = await startUserWorkoutSession({
        planId: planId || (activePlan && activePlan._id),
        dayIndex: dayIdx,
        forceNew,
      });

      if (res.success && res.data) {
        if (res.hasActiveSession && !forceNew) {
          if (showToast) showToast('Resuming your active workout session.');
        } else {
          if (showToast) showToast('Live workout session started. Focus & execute!');
        }
        setLiveSession(res.data);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to start workout session', 'error');
    } finally {
      setStartingSession(false);
    }
  };

  // 5. Delete Saved Plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to remove this plan from your library?')) return;
    try {
      const res = await deleteUserSavedWorkoutPlan(planId);
      if (res.success) {
        if (showToast) showToast('Workout plan removed from your library.');
        loadSavedPlans();
        if (activePlan && activePlan._id === planId) {
          setActivePlan(null);
        }
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to delete plan', 'error');
    }
  };

  // 6. Handle Completion from Live Session
  const handleSessionCompleted = (summary) => {
    setLiveSession(null);
    setCompletedSummary(summary);
    setShowCompletionModal(true);
    loadProgressDashboard();
  };

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* Ongoing Session Quick Banner */}
      {liveSession && (
        <div className="bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/10 border border-amber-500/40 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-amber-400">
                Live Workout Session In Progress
              </p>
              <h4 className="text-sm font-semibold text-white">
                {liveSession.planTitle} ({liveSession.dayName})
              </h4>
            </div>
          </div>
          <button
            onClick={() => setLiveSession({ ...liveSession })}
            className="px-4 py-2 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow hover:opacity-95 transition"
          >
            Resume Live HUD
          </button>
        </div>
      )}

      {/* Sub-Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#c5a880]" />
            <span>AI Workout Assistance & Biomechanics</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Personalized progressive overload, active training regimens, and real-time execution tracking.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveSubTab('generator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeSubTab === 'generator'
                ? 'bg-[#c5a880] text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            AI Generator
          </button>

          <button
            onClick={() => setActiveSubTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              activeSubTab === 'details'
                ? 'bg-[#c5a880] text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Workout Details</span>
            {activePlan && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
              activeSubTab === 'saved'
                ? 'bg-[#c5a880] text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Saved Plans ({savedPlans.length})
          </button>

          <button
            onClick={() => setActiveSubTab('progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
              activeSubTab === 'progress'
                ? 'bg-[#c5a880] text-black font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. AI WORKOUT GENERATOR & REVIEW VIEW                */}
      {/* ==================================================== */}
      {activeSubTab === 'generator' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Generator Parameters Card */}
          <div className="bg-neutral-900/60 border border-neutral-800 p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#c5a880]" />
              <h3 className="text-base font-serif font-bold text-white">
                Biomechanical Calibration Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                  Primary Fitness Goal
                </label>
                <select
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                >
                  <option value="Muscle Gain">Muscle Gain (Hypertrophy)</option>
                  <option value="Fat Loss">Fat Loss & Conditioning</option>
                  <option value="Strength Training">Pure Strength (Powerlifting)</option>
                  <option value="Endurance">Endurance & Athletic Mobility</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                  Experience Level
                </label>
                <select
                  value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                >
                  <option value="Beginner">Beginner (Foundational Movements)</option>
                  <option value="Intermediate">Intermediate (Progressive Overload)</option>
                  <option value="Advanced">Advanced (High Intensity & Volume)</option>
                  <option value="Elite">Elite (Max Performance)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                  Weekly Training Frequency
                </label>
                <select
                  value={form.daysPerWeek}
                  onChange={(e) => setForm({ ...form, daysPerWeek: Number(e.target.value) })}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                >
                  <option value={3}>3 Days (Push / Pull / Legs)</option>
                  <option value={4}>4 Days (Upper / Lower Hypertrophy)</option>
                  <option value={5}>5 Days (Athletic Bro Split)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                  Injury Constraints & Limitations (AI Substitutes Exercises)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild lower back sensitivity, avoid overhead pressing, tight wrists"
                  value={form.limitations}
                  onChange={(e) => setForm({ ...form, limitations: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 text-xs text-white py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={generating}
                  onClick={handleGeneratePlan}
                  className="w-full py-2.5 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 h-[40px] disabled:opacity-50"
                >
                  {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{generating ? 'Synthesizing...' : 'Synthesize AI Plan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Plan Review Card */}
          {generatedPlan && (
            <div className="bg-neutral-900/60 border border-[#c5a880]/40 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl relative animate-fadeIn">
              {/* Header with Review Data */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-neutral-800">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      AI Synthesized Plan Review
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30">
                      {generatedPlan.difficulty} Level
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {generatedPlan.goal}
                    </span>
                  </div>

                  <h3 className="text-2xl font-serif text-white font-bold">{generatedPlan.title}</h3>
                  <p className="text-xs text-neutral-300 max-w-2xl">{generatedPlan.description}</p>
                </div>

                {/* Approve & Save Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <button
                    disabled={savingPlan}
                    onClick={() => handleSavePlan(generatedPlan)}
                    className="flex-1 lg:flex-none px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs tracking-wider uppercase rounded-xl border border-neutral-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {savingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4 text-[#c5a880]" />}
                    <span>{savingPlan ? 'Saving...' : 'Save Plan'}</span>
                  </button>

                  <button
                    disabled={approvingPlan}
                    onClick={() => handleApprovePlan(generatedPlan)}
                    className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:opacity-95 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {approvingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{approvingPlan ? 'Approving...' : 'Approve Plan'}</span>
                  </button>
                </div>
              </div>

              {/* Target Muscle Groups & Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                    Target Muscle Groups
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedPlan.targetMuscles?.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-medium text-[11px] border border-neutral-800">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                    Est. Workout Duration
                  </span>
                  <span className="font-mono text-base font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {generatedPlan.estimatedDurationMinutes} Minutes / Session
                  </span>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
                    Program Horizon
                  </span>
                  <span className="font-mono text-base font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#c5a880]" />
                    {generatedPlan.durationWeeks} Weeks Periodization
                  </span>
                </div>
              </div>

              {/* Weekly Split Days & Exercise Breakdown */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  Detailed Weekly Split & Exercise Breakdown
                </h4>

                <div className="space-y-4">
                  {generatedPlan.weeklySchedule?.map((day, dIdx) => (
                    <div key={dIdx} className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#c5a880]">
                            {day.day}
                          </span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-xs font-medium text-white">{day.focus}</span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {day.exercises?.length || 0} Exercises • ~{day.estimatedMinutes || 45}m
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {day.exercises?.map((ex, exIdx) => (
                          <div key={exIdx} className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800/80 space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="font-semibold text-xs text-white">{ex.name}</h5>
                              <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                                {ex.targetMuscle}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-[#c5a880]">
                              <span><strong>{ex.sets}</strong> Sets</span>
                              <span>•</span>
                              <span><strong>{ex.reps}</strong> Reps</span>
                              <span>•</span>
                              <span className="text-neutral-400">Rest: <strong>{ex.restSeconds || ex.restTimeSec}s</strong></span>
                            </div>

                            {ex.instructions && (
                              <p className="text-[10px] text-neutral-400 italic bg-neutral-950/40 p-1.5 rounded border border-neutral-900">
                                💡 {ex.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. WORKOUT DETAILS SCREEN VIEW                       */}
      {/* ==================================================== */}
      {activeSubTab === 'details' && (
        <div className="space-y-6 animate-fadeIn">
          {activePlan ? (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active Training Regimen
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30">
                      {activePlan.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-white font-bold mt-1">{activePlan.title}</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl">{activePlan.description}</p>
                </div>

                {/* Big "Start Workout" Button */}
                <button
                  disabled={startingSession}
                  onClick={() => handleStartWorkout(activePlan._id, selectedDayIndex)}
                  className="px-6 py-3 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition-all shadow-xl flex items-center justify-center gap-2 min-w-[170px]"
                >
                  {startingSession ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-black" />}
                  <span>{startingSession ? 'Igniting...' : 'Start Workout'}</span>
                </button>
              </div>

              {/* Day Split Tabs */}
              {activePlan.weeklySchedule && activePlan.weeklySchedule.length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {activePlan.weeklySchedule.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDayIndex(idx)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-all border ${
                          selectedDayIndex === idx
                            ? 'bg-[#c5a880] text-black border-[#c5a880] shadow'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {day.day} • {day.focus}
                      </button>
                    ))}
                  </div>

                  {/* Selected Day Exercise Breakdown */}
                  {activePlan.weeklySchedule[selectedDayIndex] && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-neutral-400">
                        <span className="uppercase tracking-wider font-bold text-[#c5a880]">
                          {activePlan.weeklySchedule[selectedDayIndex].day} Routine ({activePlan.weeklySchedule[selectedDayIndex].exercises?.length || 0} Exercises)
                        </span>
                        <span className="font-mono">
                          Est. Duration: ~{activePlan.weeklySchedule[selectedDayIndex].estimatedMinutes || 45} mins
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePlan.weeklySchedule[selectedDayIndex].exercises?.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-white">
                                {exIdx + 1}. {ex.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                                {ex.targetMuscle}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#c5a880]">
                              <span>Sets: <strong>{ex.sets}</strong></span>
                              <span>•</span>
                              <span>Reps: <strong>{ex.reps}</strong></span>
                              <span>•</span>
                              <span className="text-neutral-400">Rest Timer: <strong>{ex.restSeconds || ex.restTimeSec}s</strong></span>
                            </div>

                            {ex.instructions && (
                              <p className="text-[11px] text-neutral-400 leading-relaxed pt-1 border-t border-neutral-900">
                                {ex.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-10 text-center space-y-3">
              <Dumbbell className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-base font-serif text-white font-semibold">No Active Workout Plan</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Generate an AI Workout Plan in the AI Generator tab or pick one from your Saved Plans library and click "Approve Plan".
              </p>
              <button
                onClick={() => setActiveSubTab('generator')}
                className="mt-2 px-5 py-2.5 bg-[#c5a880] text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:opacity-95 transition"
              >
                Go to AI Generator
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. SAVED WORKOUT PLANS VIEW                          */}
      {/* ==================================================== */}
      {activeSubTab === 'saved' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
              Sanctuary Workout Library ({savedPlans.length})
            </h3>
            <span className="text-xs text-neutral-500">Permanently saved in MongoDB</span>
          </div>

          {savedPlans.length === 0 ? (
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-10 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-base font-serif text-white font-semibold">No Saved Workout Plans</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                When you synthesize AI routines, click "Save Plan" to store them in your permanent library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlans.map((plan) => {
                const isActive = activePlan && activePlan._id === plan._id;
                return (
                  <div key={plan._id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-[#c5a880]/40 transition-all shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30">
                          {plan.goal || 'Hypertrophy'}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Active Regimen
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeletePlan(plan._id)}
                        className="text-neutral-500 hover:text-red-400 p-1 transition"
                        title="Delete from Library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-lg font-serif text-white font-semibold">{plan.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{plan.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>Difficulty: <strong className="text-white">{plan.difficulty}</strong></span>
                      <span>•</span>
                      <span>Split: <strong className="text-[#c5a880]">{plan.weeklySchedule?.length || 4} Days</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => {
                          setActivePlan(plan);
                          setActiveSubTab('details');
                        }}
                        className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
                      >
                        View Details
                      </button>

                      {!isActive && (
                        <button
                          onClick={() => handleApprovePlan(plan)}
                          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black text-xs font-bold transition hover:opacity-95"
                        >
                          Set as Active
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. WORKOUT PROGRESS DASHBOARD VIEW                   */}
      {/* ==================================================== */}
      {activeSubTab === 'progress' && (
        <div className="space-y-6 animate-fadeIn">
          {progressData ? (
            <div className="space-y-6">
              {/* Stat Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-white">
                    {progressData.totalCompletedWorkouts || 0}
                  </h4>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">Completed Workouts</p>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-white">
                    {progressData.totalMinutes || 0}m
                  </h4>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">Total Minutes</p>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-white">
                    {progressData.totalCalories || 0}
                  </h4>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">Est. Calories Burned</p>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl text-center">
                  <div className="w-8 h-8 rounded-full bg-[#c5a880]/15 text-[#c5a880] flex items-center justify-center mx-auto mb-1">
                    <Dumbbell className="w-4 h-4" />
                  </div>
                  <h4 className="text-2xl font-bold font-mono text-white">
                    {progressData.totalSets || 0}
                  </h4>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">Sets Completed</p>
                </div>
              </div>

              {/* Weekly Activity Visualizer */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#c5a880]" />
                  <span>Weekly Sanctuary Training Activity (Last 7 Days)</span>
                </h4>

                <div className="grid grid-cols-7 gap-2 pt-2">
                  {progressData.weeklyActivity?.map((item, idx) => (
                    <div key={idx} className="text-center space-y-2">
                      <div className="h-24 bg-neutral-950 rounded-lg p-1.5 flex flex-col justify-end border border-neutral-800/80">
                        <div
                          className={`w-full rounded transition-all duration-500 ${
                            item.workoutCount > 0 ? 'bg-[#c5a880]' : 'bg-neutral-800/40'
                          }`}
                          style={{
                            height: item.workoutCount > 0 ? `${Math.min(100, item.durationMinutes * 1.5 + 20)}%` : '6px',
                          }}
                        />
                      </div>
                      <span className="block text-[11px] font-bold text-neutral-300">{item.day}</span>
                      <span className="block text-[9px] text-neutral-500">{item.durationMinutes}m</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Workout History Log */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Recent Workout Execution History
                </h4>

                {progressData.recentHistory && progressData.recentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {progressData.recentHistory.map((s) => (
                      <div
                        key={s._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs gap-2"
                      >
                        <div>
                          <h5 className="font-semibold text-white">{s.planTitle}</h5>
                          <p className="text-[11px] text-[#c5a880]">{s.dayName} • {s.dayFocus}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-neutral-400">
                          <span>Duration: <strong className="text-white">{Math.round((s.durationSeconds || 0) / 60)} mins</strong></span>
                          <span>Sets: <strong className="text-white">{s.totalSetsCompleted || 0}</strong></span>
                          <span>Calories: <strong className="text-rose-400">{s.caloriesBurned || 0} kcal</strong></span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(s.endedAt || s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic p-4 text-center">
                    No workout history recorded yet. Complete your first session to populate history.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-500">Loading progress telemetry...</div>
          )}
        </div>
      )}

      {/* Live Workout Session Fullscreen HUD */}
      {liveSession && (
        <LiveWorkoutTracker
          session={liveSession}
          onComplete={handleSessionCompleted}
          onCancel={() => setLiveSession(null)}
          showToast={showToast}
        />
      )}

      {/* Workout Completion Celebration Modal */}
      <WorkoutCompletionModal
        isOpen={showCompletionModal}
        summary={completedSummary}
        onClose={() => {
          setShowCompletionModal(false);
          setActiveSubTab('progress');
        }}
      />
    </div>
  );
}
