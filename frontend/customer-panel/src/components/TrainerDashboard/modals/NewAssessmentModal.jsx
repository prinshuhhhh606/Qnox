import React from 'react';

export default function NewAssessmentModal({
  isOpen,
  onClose,
  members = [],
  assessmentForm,
  setAssessmentForm,
  handleCreateAssessment,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="trainer-glass-card w-full max-w-lg p-6 space-y-4">
        <h3 className="font-serif text-lg text-white">Record Fitness & Transformation Assessment</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Athlete</label>
            <select
              value={assessmentForm.member}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, member: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="">Select athlete...</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={assessmentForm.weightKg}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, weightKg: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Height (cm)</label>
              <input
                type="number"
                value={assessmentForm.heightCm}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, heightCm: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Body Fat %</label>
              <input
                type="number"
                value={assessmentForm.bodyFatPercentage}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, bodyFatPercentage: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Trainer Observations</label>
            <textarea
              rows={2}
              value={assessmentForm.notes}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              placeholder="Posture, mobility, cardiovascular stamina, strength output..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button onClick={handleCreateAssessment} className="trainer-btn-primary">
            Save Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
