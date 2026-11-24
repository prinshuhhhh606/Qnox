import React from 'react';
import { Plus } from 'lucide-react';

export default function ExercisesTab({
  exercises,
  exerciseSearch,
  setExerciseSearch,
  loadExerciseLibrary,
  setNewExerciseModal,
}) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Exercise & Movement Library</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Standard and custom biomechanical exercise protocols with equipment filters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search exercise..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadExerciseLibrary()}
            className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          />
          <button
            onClick={() => setNewExerciseModal(true)}
            className="trainer-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-neutral-500 text-xs trainer-glass-card">
            No exercises found matching criteria.
          </div>
        ) : (
          exercises.map((ex) => (
            <div key={ex._id} className="trainer-glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="trainer-badge trainer-badge-gold">{ex.category}</span>
                <span className="text-[10px] text-neutral-500">{ex.difficulty}</span>
              </div>
              <h4 className="font-serif text-base text-white font-semibold">{ex.name}</h4>
              <p className="text-xs text-neutral-400 mt-1">Target: {ex.targetMuscle}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Equipment: {ex.equipment}</p>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                Default: {ex.defaultSets} sets × {ex.defaultReps} ({ex.restTimeSec}s rest)
              </div>
              {ex.instructions && (
                <p className="text-[10px] text-neutral-500 mt-2 line-clamp-2">{ex.instructions}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
