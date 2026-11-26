import React, { useState } from 'react';
import { Ruler, Award, X, CheckCircle2, Activity, Heart, Shield } from 'lucide-react';

export default function NewAssessmentModal({
  isOpen,
  onClose,
  members = [],
  assessmentForm,
  setAssessmentForm,
  handleCreateAssessment,
  initialTab = 'circumferences', // 'circumferences' | 'performance'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'circumferences');

  if (!isOpen) return null;

  // Helper to update circumferences
  const updateCircumference = (key, value) => {
    setAssessmentForm({
      ...assessmentForm,
      circumferences: {
        ...(assessmentForm.circumferences || {}),
        [key]: Number(value) || 0,
      },
    });
  };

  // Helper to update performance tests
  const updatePerformance = (key, value) => {
    setAssessmentForm({
      ...assessmentForm,
      performanceTests: {
        ...(assessmentForm.performanceTests || {}),
        [key]: typeof value === 'number' ? Number(value) : value,
      },
    });
  };

  const circumferences = assessmentForm.circumferences || {};
  const performance = assessmentForm.performanceTests || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#c5a880]/30 rounded-xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#c5a880]/10 border border-[#c5a880]/20 text-[#c5a880]">
              {activeTab === 'circumferences' ? <Ruler className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif text-lg text-white font-medium">
                {activeTab === 'circumferences' ? 'Log Body Measurements & Circumferences' : 'Record Athletic Fitness Assessment'}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Official anthropometric ledger & athletic performance benchmarks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('circumferences')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'circumferences'
                ? 'border-[#c5a880] text-[#c5a880]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>Body Circumferences</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'performance'
                ? 'border-[#c5a880] text-[#c5a880]'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Athletic Benchmarks</span>
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Athlete Selection & Core Biometrics (Shared) */}
          <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1">Select Sanctuary Athlete *</label>
              <select
                value={assessmentForm.member}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, member: e.target.value })}
                className="w-full bg-black/60 border border-neutral-700 py-2.5 px-3 rounded text-neutral-100 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="">-- Choose Athlete --</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-neutral-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={assessmentForm.weightKg || 75}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, weightKg: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-neutral-700 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={assessmentForm.heightCm || 178}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, heightCm: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-neutral-700 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Body Fat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={assessmentForm.bodyFatPercentage || 15}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, bodyFatPercentage: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-neutral-700 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>
          </div>

          {/* TAB 1: CIRCUMFERENCES */}
          {activeTab === 'circumferences' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs uppercase font-serif tracking-wider text-[#c5a880] font-semibold">
                Anatomical Circumferences (cm)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={circumferences.chest ?? 102}
                    onChange={(e) => updateCircumference('chest', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={circumferences.waist ?? 82}
                    onChange={(e) => updateCircumference('waist', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Hips (cm)</label>
                  <input
                    type="number"
                    value={circumferences.hips ?? 96}
                    onChange={(e) => updateCircumference('hips', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Left Arm (cm)</label>
                  <input
                    type="number"
                    value={circumferences.leftArm ?? 37}
                    onChange={(e) => updateCircumference('leftArm', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Right Arm (cm)</label>
                  <input
                    type="number"
                    value={circumferences.rightArm ?? 37}
                    onChange={(e) => updateCircumference('rightArm', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Shoulders (cm)</label>
                  <input
                    type="number"
                    value={circumferences.shoulders ?? 118}
                    onChange={(e) => updateCircumference('shoulders', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Left Thigh (cm)</label>
                  <input
                    type="number"
                    value={circumferences.leftThigh ?? 56}
                    onChange={(e) => updateCircumference('leftThigh', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Right Thigh (cm)</label>
                  <input
                    type="number"
                    value={circumferences.rightThigh ?? 56}
                    onChange={(e) => updateCircumference('rightThigh', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATHLETIC PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-xs uppercase font-serif tracking-wider text-[#c5a880] font-semibold">
                Standardized Athletic Tests & Health
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Max Pushups</label>
                  <input
                    type="number"
                    value={performance.pushupsCount ?? 35}
                    onChange={(e) => updatePerformance('pushupsCount', Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Plank Hold (sec)</label>
                  <input
                    type="number"
                    value={performance.plankSeconds ?? 90}
                    onChange={(e) => updatePerformance('plankSeconds', Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">VO2 Max</label>
                  <input
                    type="number"
                    value={performance.vo2Max ?? 46}
                    onChange={(e) => updatePerformance('vo2Max', Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={performance.restingHeartRate ?? 62}
                    onChange={(e) => updatePerformance('restingHeartRate', Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Transformation Score (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={assessmentForm.transformationScore || 85}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, transformationScore: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-emerald-400 font-bold focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Cadence / Type</label>
                  <select
                    value={assessmentForm.assessmentType || 'Monthly'}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, assessmentType: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="Initial">Initial Baseline</option>
                    <option value="Monthly">Monthly Evaluation</option>
                    <option value="Quarterly">Quarterly Benchmark</option>
                    <option value="Final">Peak Milestone</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Coach Notes */}
          <div>
            <label className="block text-neutral-400 mb-1">Coach Observations & Recommendations</label>
            <textarea
              rows={2}
              value={assessmentForm.notes || ''}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              placeholder="Record notes on mobility, muscle symmetry, cardiovascular stamina, posture..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={() => setActiveTab(activeTab === 'circumferences' ? 'performance' : 'circumferences')}
            className="text-xs text-[#c5a880] hover:underline"
          >
            {activeTab === 'circumferences' ? 'Switch to Athletic Tests →' : '← Switch to Body Circumferences'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAssessment}
              className="trainer-btn-primary flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Record</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
