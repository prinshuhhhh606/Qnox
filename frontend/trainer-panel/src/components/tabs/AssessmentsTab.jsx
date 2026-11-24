import React from 'react';
import { Plus } from 'lucide-react';

export default function AssessmentsTab({
  assessments,
  setNewAssessmentModal,
}) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Biometric & Transformation Assessments
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Log BMI, circumferences (chest, arms, waist, thighs), body fat %, and transformation reports.
          </p>
        </div>
        <button
          onClick={() => setNewAssessmentModal(true)}
          className="trainer-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Record Assessment
        </button>
      </div>

      {/* Assessments List */}
      <div className="trainer-glass-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Athlete</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Weight</th>
              <th className="py-3 px-4">BMI</th>
              <th className="py-3 px-4">Body Fat %</th>
              <th className="py-3 px-4">Waist / Chest</th>
              <th className="py-3 px-4">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {assessments.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-neutral-500">
                  No transformation assessments logged yet.
                </td>
              </tr>
            ) : (
              assessments.map((as) => (
                <tr key={as._id} className="hover:bg-neutral-900/40">
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    {as.member?.name || 'Athlete'}
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    {new Date(as.assessmentDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-neutral-200">{as.weightKg} kg</td>
                  <td className="py-3 px-4 text-[#c5a880]">{as.bmi || '23.4'}</td>
                  <td className="py-3 px-4 text-neutral-300">{as.bodyFatPercentage || 14}%</td>
                  <td className="py-3 px-4 text-neutral-400">
                    {as.circumferences?.waist || '-'}cm / {as.circumferences?.chest || '-'}cm
                  </td>
                  <td className="py-3 px-4">
                    <span className="trainer-badge trainer-badge-green">
                      {as.transformationScore || 92}/100
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
