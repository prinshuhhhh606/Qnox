import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

export default function WorkoutsTab({
  workoutPlans,
  setActiveTab,
  setNewWorkoutModal,
  assignWorkoutPlan,
  showToast,
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Workout Plan Architecture</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Design and assign personalized training splits across 12 athletic categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('ai-workouts')}
            className="trainer-btn-outline flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#c5a880]" /> AI Generator
          </button>
          <button
            onClick={() => setNewWorkoutModal(true)}
            className="trainer-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Routine
          </button>
        </div>
      </div>

      {/* Workout Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workoutPlans.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-neutral-500 text-xs trainer-glass-card">
            No routines created yet. Click "Create Routine" or generate one using the AI Generator.
          </div>
        ) : (
          workoutPlans.map((wp) => (
            <div key={wp._id} className="trainer-glass-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="trainer-badge trainer-badge-gold">{wp.category}</span>
                  {wp.aiGenerated && (
                    <span className="text-[10px] text-[#c5a880] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base text-neutral-100 font-semibold">{wp.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{wp.description}</p>
                
                <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                  <div>Duration: <span className="text-neutral-200">{wp.durationWeeks} weeks</span></div>
                  <div>Target: <span className="text-neutral-200">{wp.targetAudience}</span></div>
                  {wp.member && (
                    <div className="text-[#c5a880]">Assigned to: {wp.member?.name || 'Athlete'}</div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500">Status: {wp.status}</span>
                <button
                  onClick={() => {
                    const memId = prompt('Enter Member ID or Name to assign this plan:');
                    if (memId && wp.member?._id) assignWorkoutPlan(wp._id, wp.member._id);
                    else showToast('Plan assigned to active roster!');
                  }}
                  className="text-xs text-[#c5a880] hover:underline uppercase tracking-wider"
                >
                  Assign Plan
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
