import React, { useState } from 'react';
import {
  TrendingUp, Award, Calendar, Flame, CheckCircle2,
  Clock, ArrowUpRight, ArrowDownRight, User, Dumbbell, Shield, Sparkles
} from 'lucide-react';

export default function ProgressTrackingTab({
  members = [],
  assessments = [],
  workoutPlans = [],
  showToast,
}) {
  const [selectedMemberId, setSelectedMemberId] = useState(
    members && members.length > 0 ? members[0]._id : ''
  );

  const selectedMember = members.find((m) => m._id === selectedMemberId) || (members[0] || null);

  // Member's specific assessments sorted by date
  const memberAssessments = assessments
    .filter((a) => (a.member?._id || a.member) === selectedMemberId)
    .sort((a, b) => new Date(a.assessmentDate || a.date) - new Date(b.assessmentDate || b.date));

  // Compute metrics
  const startingWeight = memberAssessments.length > 0
    ? memberAssessments[0].weightKg
    : (selectedMember?.currentWeight ? selectedMember.currentWeight + 4 : 78);

  const currentWeight = memberAssessments.length > 0
    ? memberAssessments[memberAssessments.length - 1].weightKg
    : (selectedMember?.currentWeight || 74);

  const targetWeight = selectedMember?.targetWeight || (startingWeight > currentWeight ? 70 : 80);
  const weightDelta = (currentWeight - startingWeight).toFixed(1);
  const isLoss = Number(weightDelta) < 0;

  const startingBf = memberAssessments.length > 0 ? (memberAssessments[0].bodyFatPercentage || 18) : 18;
  const currentBf = memberAssessments.length > 0 ? (memberAssessments[memberAssessments.length - 1].bodyFatPercentage || 14) : 14;
  const bfDelta = (currentBf - startingBf).toFixed(1);

  // Member assigned plans
  const memberPlans = workoutPlans.filter(
    (p) => (p.member?._id || p.member) === selectedMemberId
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header and Athlete Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c5a880]" />
            <h2 className="text-2xl font-serif text-white tracking-wide">
              Longitudinal Transformation Telemetry
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Track weight deltas, body fat reduction trends, adherence velocity, and athletic milestones.
          </p>
        </div>

        {/* Member Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-[11px] uppercase tracking-wider text-neutral-400 whitespace-nowrap">
            Athlete:
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full sm:w-64 bg-neutral-900 border border-neutral-800 text-xs text-white py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.fitnessGoal || 'General Fitness'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMember ? (
        <div className="space-y-6">
          {/* Key Metric Velocity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="trainer-glass-card p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                Body Weight Delta
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">{currentWeight} kg</span>
                <span className={`text-xs font-semibold flex items-center ${isLoss ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isLoss ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  {Math.abs(weightDelta)} kg
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-3 pt-2 border-t border-neutral-800">
                <span>Start: <strong>{startingWeight} kg</strong></span>
                <span>Target: <strong className="text-[#c5a880]">{targetWeight} kg</strong></span>
              </div>
            </div>

            <div className="trainer-glass-card p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                Body Fat Reduction
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-emerald-400">{currentBf}%</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {Math.abs(bfDelta)}%
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-3 pt-2 border-t border-neutral-800">
                <span>Starting: <strong>{startingBf}%</strong></span>
                <span>Category: <strong className="text-white">Athletic</strong></span>
              </div>
            </div>

            <div className="trainer-glass-card p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                Program Consistency Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-[#c5a880]">92%</span>
                <span className="text-xs font-semibold text-emerald-400">High Adherence</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-3 pt-2 border-t border-neutral-800">
                <span>Weekly Target: <strong>4 Sessions</strong></span>
                <span>Streak: <strong className="text-white">6 Weeks</strong></span>
              </div>
            </div>

            <div className="trainer-glass-card p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                Transformation Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-white">88 / 100</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Elite
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-3 pt-2 border-t border-neutral-800">
                <span>Evaluated: <strong>Monthly</strong></span>
                <span>Next Due: <strong className="text-neutral-300">Dec 15</strong></span>
              </div>
            </div>
          </div>

          {/* Transformation Goal Progress Bar */}
          <div className="trainer-glass-card p-6 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white uppercase tracking-wider">
                Overall Goal Trajectory: {selectedMember.fitnessGoal || 'Hypertrophy & Fat Loss'}
              </span>
              <span className="font-mono text-[#c5a880] font-bold">78% Progress to Target</span>
            </div>
            <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden border border-neutral-800">
              <div className="bg-gradient-to-r from-[#c5a880] to-emerald-400 h-2.5 rounded-full transition-all duration-1000 w-[78%]" />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>Baseline: {startingWeight} kg</span>
              <span>Current Checkpoint: {currentWeight} kg</span>
              <span>Final Milestone: {targetWeight} kg</span>
            </div>
          </div>

          {/* Circumference Evolution Table */}
          <div className="trainer-glass-card p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-sm font-semibold text-white tracking-wide">
                Circumference & Morphological Changes
              </h3>
              <span className="text-xs text-neutral-500 font-mono">
                {memberAssessments.length} Logged Checkpoints
              </span>
            </div>

            {memberAssessments.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-6 text-center">
                No biometric assessment records yet for this athlete. Record an assessment in the "Fitness Assessment" tab.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Body Fat</th>
                      <th className="py-2.5 px-3">Chest</th>
                      <th className="py-2.5 px-3">Waist</th>
                      <th className="py-2.5 px-3">Hips</th>
                      <th className="py-2.5 px-3">Arms</th>
                      <th className="py-2.5 px-3">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {memberAssessments.map((as, idx) => (
                      <tr key={as._id || idx} className="hover:bg-neutral-900/40">
                        <td className="py-2.5 px-3 text-neutral-300">
                          {new Date(as.assessmentDate || as.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">{as.weightKg} kg</td>
                        <td className="py-2.5 px-3 text-emerald-400">{as.bodyFatPercentage}%</td>
                        <td className="py-2.5 px-3 text-neutral-300">{as.circumferences?.chest || as.measurements?.chestCm || '-'} cm</td>
                        <td className="py-2.5 px-3 text-neutral-300">{as.circumferences?.waist || as.measurements?.waistCm || '-'} cm</td>
                        <td className="py-2.5 px-3 text-neutral-300">{as.circumferences?.hips || as.measurements?.hipsCm || '-'} cm</td>
                        <td className="py-2.5 px-3 text-neutral-300">{as.circumferences?.leftArm || as.measurements?.leftArmCm || '-'} cm</td>
                        <td className="py-2.5 px-3">
                          <span className="trainer-badge trainer-badge-gold">
                            {as.transformationScore || 85}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transformation Milestones & Timeline */}
          <div className="trainer-glass-card p-6 space-y-4">
            <h3 className="font-serif text-sm font-semibold text-white tracking-wide">
              Athletic Transformation Milestones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Achieved</span>
                </div>
                <h4 className="font-semibold text-white">Initial Conditioning Phase Complete</h4>
                <p className="text-neutral-400 text-[11px]">
                  Completed foundational 4-week split with zero missed training sessions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/80 border border-[#c5a880]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#c5a880]">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">In Progress</span>
                </div>
                <h4 className="font-semibold text-white">Body Fat Sub-15% Target</h4>
                <p className="text-neutral-400 text-[11px]">
                  Currently at {currentBf}%. Target is 13.5% with high-protein macro regimen.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Award className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Upcoming</span>
                </div>
                <h4 className="font-semibold text-neutral-300">Peak Athletic Hypertrophy Benchmark</h4>
                <p className="text-neutral-500 text-[11px]">
                  Targeted for Week 8 post heavy progressive overload mesocycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="trainer-glass-card p-12 text-center text-neutral-500">
          No athlete selected. Enroll athletes to review progress telemetry.
        </div>
      )}
    </div>
  );
}
