import React, { useState } from 'react';
import { Plus, Award, Ruler, Trash2, Heart, Activity, User, Shield, CheckCircle2 } from 'lucide-react';

export default function AssessmentsTab({
  assessments = [],
  members = [],
  setNewAssessmentModal,
  handleDeleteAssessment,
}) {
  const [selectedMemberId, setSelectedMemberId] = useState('All');

  const filteredAssessments = assessments.filter((as) => {
    if (selectedMemberId === 'All') return true;
    const memberId = as.member?._id || as.member;
    return memberId === selectedMemberId;
  });

  const totalAssessments = assessments.length;
  const avgScore = totalAssessments > 0
    ? Math.round(assessments.reduce((acc, a) => acc + (a.transformationScore || 75), 0) / totalAssessments)
    : 85;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#c5a880]" />
            <h2 className="text-2xl font-serif text-white tracking-wide">
              Biometric & Fitness Assessments
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Standardized athletic benchmarks, circumferences, BMI telemetry, and transformation scores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Member Filter */}
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="All">All Sanctuary Athletes</option>
            {members?.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>

          <button
            onClick={() => setNewAssessmentModal(true)}
            className="trainer-btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Record Assessment</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-white">{totalAssessments}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Total Assessments</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-emerald-400">{avgScore} / 100</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Avg Transformation</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[#c5a880]">{members?.length || 12}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Enrolled Athletes</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-amber-400">Monthly</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Cadence Schedule</p>
        </div>
      </div>

      {/* Assessments List / Detailed Cards */}
      <div className="trainer-glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/60">
          <h3 className="font-serif text-sm font-semibold text-white tracking-wide">
            Logged Assessment Protocols ({filteredAssessments.length})
          </h3>
          <span className="text-xs text-neutral-500">
            {selectedMemberId === 'All' ? 'Displaying all members' : 'Filtered member view'}
          </span>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Ruler className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">No assessments found.</p>
            <p className="text-xs text-neutral-500">
              Click "Record Assessment" above to log biometric data, body fat percentage, and circumference records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {filteredAssessments.map((as) => {
              const assessmentDate = as.assessmentDate || as.date || as.createdAt;
              const waist = as.circumferences?.waist || as.measurements?.waistCm || '-';
              const chest = as.circumferences?.chest || as.measurements?.chestCm || '-';
              const arms = as.circumferences?.leftArm || as.measurements?.leftArmCm || '-';
              const thighs = as.circumferences?.leftThigh || as.measurements?.leftThighCm || '-';

              return (
                <div key={as._id} className="p-5 hover:bg-neutral-900/30 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] font-bold text-xs">
                        {as.member?.name ? as.member.name.charAt(0) : 'A'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">
                          {as.member?.name || 'Sanctuary Athlete'}
                        </h4>
                        <p className="text-[11px] text-neutral-400">
                          {as.member?.fitnessGoal || 'General Fitness'} • Logged on {new Date(assessmentDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="trainer-badge trainer-badge-gold">
                        Score: {as.transformationScore || 85}/100
                      </span>
                      {handleDeleteAssessment && (
                        <button
                          onClick={() => handleDeleteAssessment(as._id)}
                          className="text-neutral-500 hover:text-red-400 p-1 transition"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Weight</span>
                      <strong className="text-white font-mono">{as.weightKg} kg</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Height</span>
                      <strong className="text-neutral-200 font-mono">{as.heightCm} cm</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">BMI</span>
                      <strong className="text-[#c5a880] font-mono">{as.bmi || '22.8'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Body Fat</span>
                      <strong className="text-emerald-400 font-mono">{as.bodyFatPercentage || 15}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Chest / Waist</span>
                      <span className="text-neutral-300 font-mono">{chest} / {waist} cm</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase block">Arms / Thighs</span>
                      <span className="text-neutral-300 font-mono">{arms} / {thighs} cm</span>
                    </div>
                  </div>

                  {/* Performance Tests Snapshot */}
                  {as.performanceTests && (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400 bg-neutral-900/30 px-3 py-1.5 rounded-lg border border-neutral-800/40">
                      <span>Pushups: <strong className="text-white">{as.performanceTests.pushupsCount || 35}</strong></span>
                      <span>•</span>
                      <span>Plank: <strong className="text-white">{as.performanceTests.plankSeconds || 90}s</strong></span>
                      <span>•</span>
                      <span>VO2 Max: <strong className="text-[#c5a880]">{as.performanceTests.vo2Max || 46} ml/kg</strong></span>
                      <span>•</span>
                      <span>Resting HR: <strong className="text-rose-400">{as.performanceTests.restingHeartRate || 62} bpm</strong></span>
                    </div>
                  )}

                  {as.trainerNotes && (
                    <p className="text-[11px] text-neutral-400 italic bg-neutral-950/40 p-2 rounded border border-neutral-900">
                      Coach Note: "{as.trainerNotes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
