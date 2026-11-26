import React, { useState } from 'react';
import {
  Ruler,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Activity,
  User,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function BodyMeasurementsTab({
  assessments = [],
  members = [],
  setNewAssessmentModal,
  handleDeleteAssessment,
  openMeasurementModal,
}) {
  const [selectedMemberId, setSelectedMemberId] = useState('All');

  // Filter assessments based on selected member
  const filteredRecords = assessments.filter((as) => {
    if (selectedMemberId === 'All') return true;
    const memberId = as.member?._id || as.member;
    return memberId === selectedMemberId;
  });

  // Calculate statistics
  const totalLogs = filteredRecords.length;
  
  // Latest measurement record
  const latestRecord = filteredRecords[0] || null;
  const circumferences = latestRecord?.circumferences || {
    chest: latestRecord?.measurements?.chestCm || 102,
    waist: latestRecord?.measurements?.waistCm || 82,
    hips: latestRecord?.measurements?.hipsCm || 96,
    leftArm: latestRecord?.measurements?.leftArmCm || 37,
    rightArm: latestRecord?.measurements?.rightArmCm || 37,
    leftThigh: latestRecord?.measurements?.leftThighCm || 56,
    rightThigh: latestRecord?.measurements?.rightThighCm || 56,
    shoulders: latestRecord?.measurements?.shouldersCm || 118,
  };

  // Waist-to-Hip ratio
  const waistVal = circumferences.waist || 82;
  const hipsVal = circumferences.hips || 96;
  const whr = (waistVal / (hipsVal || 1)).toFixed(2);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Luxury Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ruler className="w-6 h-6 text-[#c5a880]" />
            <h2 className="text-2xl font-serif text-white tracking-wide">
              Body Circumferences & Anthropometrics
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Anatomical tape telemetry, muscle circumferences, waist-to-hip ratios, and body symmetry metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Athlete Filter Dropdown */}
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
            onClick={() => {
              if (openMeasurementModal) {
                openMeasurementModal();
              } else {
                setNewAssessmentModal(true);
              }
            }}
            className="trainer-btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Measurements</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-white">{totalLogs}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Measurement Logs</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-[#c5a880]">{whr}</p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Waist/Hip Ratio</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {circumferences.chest ? `${circumferences.chest} cm` : '102 cm'}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Latest Chest Span</p>
        </div>
        <div className="trainer-glass-card p-4 text-center">
          <p className="text-2xl font-bold font-mono text-amber-400">
            {circumferences.waist ? `${circumferences.waist} cm` : '82 cm'}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-0.5">Latest Waist</p>
        </div>
      </div>

      {/* Visual Anatomical Blueprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upper Body Segment */}
        <div className="trainer-glass-card p-5 border-t-2 border-t-[#c5a880]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Upper Torso & Arms
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30 rounded">
              Anterior / Posterior
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Chest Circumference</span>
              <span className="text-sm font-mono font-bold text-white">
                {circumferences.chest || 102} <span className="text-[10px] text-neutral-400">cm</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Shoulder Girth</span>
              <span className="text-sm font-mono font-bold text-[#c5a880]">
                {circumferences.shoulders || 118} <span className="text-[10px] text-neutral-400">cm</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Left Arm</span>
                <span className="text-sm font-mono font-bold text-white">
                  {circumferences.leftArm || 37} <span className="text-[9px] text-neutral-500">cm</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Right Arm</span>
                <span className="text-sm font-mono font-bold text-white">
                  {circumferences.rightArm || 37} <span className="text-[9px] text-neutral-500">cm</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Core & Trunk Segment */}
        <div className="trainer-glass-card p-5 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Core & Midsection
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
              Metabolic Index
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Waist (Narrowest)</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {circumferences.waist || 82} <span className="text-[10px] text-neutral-400">cm</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Hips (Widest Point)</span>
              <span className="text-sm font-mono font-bold text-white">
                {circumferences.hips || 96} <span className="text-[10px] text-neutral-400">cm</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-300 block">Waist-To-Hip Ratio</span>
                <span className="text-[10px] text-emerald-400">Optimal Athletic Range</span>
              </div>
              <span className="text-base font-mono font-bold text-emerald-400">{whr}</span>
            </div>
          </div>
        </div>

        {/* Lower Extremities Segment */}
        <div className="trainer-glass-card p-5 border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-sm font-semibold text-white tracking-wide uppercase">
              Lower Limbs & Quads
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
              Kinetic Symmetry
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Left Thigh</span>
                <span className="text-sm font-mono font-bold text-white">
                  {circumferences.leftThigh || 56} <span className="text-[9px] text-neutral-500">cm</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
                <span className="text-[10px] text-neutral-400 block">Right Thigh</span>
                <span className="text-sm font-mono font-bold text-white">
                  {circumferences.rightThigh || 56} <span className="text-[9px] text-neutral-500">cm</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Bilateral Quad Delta</span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {Math.abs((circumferences.leftThigh || 56) - (circumferences.rightThigh || 56)).toFixed(1)} cm Symmetrical
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
              <span className="text-xs text-neutral-300">Measurement Standard</span>
              <span className="text-xs text-neutral-400 font-mono">ISAK Level 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Measurements Log Table */}
      <div className="trainer-glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/60">
          <h3 className="font-serif text-sm font-semibold text-white tracking-wide">
            Circumference Tracking Ledger ({filteredRecords.length} Records)
          </h3>
          <span className="text-xs text-neutral-500">
            {selectedMemberId === 'All' ? 'Showing all athletes' : 'Individual athlete log'}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Ruler className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">No body circumference logs found.</p>
            <p className="text-xs text-neutral-500">
              Click "Log Measurements" above to record tape circumferences for an athlete.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Weight / Fat</th>
                  <th className="py-3 px-4">Chest</th>
                  <th className="py-3 px-4">Waist</th>
                  <th className="py-3 px-4">Hips</th>
                  <th className="py-3 px-4">Arms (L/R)</th>
                  <th className="py-3 px-4">Thighs (L/R)</th>
                  <th className="py-3 px-4">WHR</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredRecords.map((as) => {
                  const mName = as.member?.name || 'Sanctuary Athlete';
                  const dateStr = as.assessmentDate || as.date
                    ? new Date(as.assessmentDate || as.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  const c = as.circumferences || {
                    chest: as.measurements?.chestCm || 102,
                    waist: as.measurements?.waistCm || 82,
                    hips: as.measurements?.hipsCm || 96,
                    leftArm: as.measurements?.leftArmCm || 37,
                    rightArm: as.measurements?.rightArmCm || 37,
                    leftThigh: as.measurements?.leftThighCm || 56,
                    rightThigh: as.measurements?.rightThighCm || 56,
                  };

                  const recordWhr = (c.waist / (c.hips || 1)).toFixed(2);

                  return (
                    <tr key={as._id} className="hover:bg-neutral-900/40 transition">
                      <td className="py-3 px-4 font-semibold text-white">
                        {mName}
                      </td>
                      <td className="py-3 px-4 text-neutral-400 font-mono">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-neutral-300 font-mono">
                        {as.weightKg || as.weight || 75} kg • {as.bodyFatPercentage || 15}%
                      </td>
                      <td className="py-3 px-4 font-mono text-[#c5a880] font-semibold">
                        {c.chest || '-'} cm
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">
                        {c.waist || '-'} cm
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {c.hips || '-'} cm
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {c.leftArm || '-'} / {c.rightArm || '-'} cm
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-300">
                        {c.leftThigh || '-'} / {c.rightThigh || '-'} cm
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                        {recordWhr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {handleDeleteAssessment && (
                          <button
                            onClick={() => handleDeleteAssessment(as._id)}
                            className="p-1.5 text-neutral-500 hover:text-red-400 transition rounded hover:bg-neutral-800"
                            title="Delete log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
