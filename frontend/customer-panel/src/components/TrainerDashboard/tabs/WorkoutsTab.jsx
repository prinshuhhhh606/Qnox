import React from 'react';
import { Plus, Sparkles, RefreshCw, Dumbbell } from 'lucide-react';

export default function WorkoutsTab({
  workoutPlans = [],
  setActiveTab,
  setNewWorkoutModal,
  assignWorkoutPlan,
  showToast,
  workoutCategoryFilter = 'All',
  setWorkoutCategoryFilter,
  loadWorkoutPlans,
}) {
  const categories = [
    'All',
    'Chest Workout',
    'Back Workout',
    'Leg Workout',
    'Shoulder Workout',
    'Arms Workout',
    'Full Body',
    'Combat Conditioning',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Workout Plan Architecture</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Design and assign personalized training splits across athletic disciplines. Showing {workoutPlans.length} active routine(s).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loadWorkoutPlans && (
            <button
              onClick={() => loadWorkoutPlans()}
              className="trainer-btn-outline flex items-center gap-2"
              title="Refresh Routines"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
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

      {/* Category Filter Pills */}
      {setWorkoutCategoryFilter && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setWorkoutCategoryFilter(cat);
              }}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border transition whitespace-nowrap ${
                workoutCategoryFilter === cat
                  ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880] font-bold'
                  : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Workout Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {workoutPlans.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-neutral-400 text-xs trainer-glass-card space-y-3">
            <Dumbbell className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-300 font-serif">No routines found in this filter.</p>
            <p className="text-neutral-500 max-w-sm mx-auto">
              Click "Create Routine" above to add a new workout or hit "Refresh" to sync from database.
            </p>
          </div>
        ) : (
          workoutPlans.map((wp) => (
            <div key={wp._id} className="trainer-glass-card p-5 flex flex-col justify-between hover:border-[#c5a880]/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="trainer-badge trainer-badge-gold">{wp.category || 'General'}</span>
                  {wp.aiGenerated && (
                    <span className="text-[10px] text-[#c5a880] flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3" /> AI PROTOCOL
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg text-white font-medium">{wp.title}</h3>
                {wp.description && (
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{wp.description}</p>
                )}
                
                <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                  <div>Duration: <span className="text-neutral-200">{wp.durationWeeks || 4} weeks</span></div>
                  <div>Difficulty: <span className="text-neutral-200">{wp.difficulty || wp.level || 'Intermediate'}</span></div>
                  {wp.goal && <div>Goal: <span className="text-neutral-200">{wp.goal}</span></div>}
                  <div className="pt-1">
                    {wp.member ? (
                      <span className="text-[#c5a880] font-semibold">Assigned to: {wp.member?.name || 'Athlete'}</span>
                    ) : (
                      <span className="text-neutral-500 font-mono text-[10px] uppercase">Library Template (All Members)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                  {wp.status || 'Active'}
                </span>
                <button
                  onClick={() => {
                    const memId = prompt('Enter Member ID to assign this routine:');
                    if (memId) {
                      assignWorkoutPlan(wp._id, memId);
                    } else if (showToast) {
                      showToast('Enter valid athlete ID to assign');
                    }
                  }}
                  className="text-xs text-[#c5a880] hover:text-white uppercase tracking-wider font-semibold transition"
                >
                  Assign Plan &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
