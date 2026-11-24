import React from 'react';

export default function NewExerciseModal({
  isOpen,
  onClose,
  exerciseForm,
  setExerciseForm,
  handleCreateExercise,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="trainer-glass-card w-full max-w-lg p-6 space-y-4">
        <h3 className="font-serif text-lg text-white">Add Custom Movement & Exercise</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Exercise Name</label>
            <input
              type="text"
              value={exerciseForm.name}
              onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
              placeholder="e.g. Incline Dumbbell Bench Press"
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Category</label>
              <select
                value={exerciseForm.category}
                onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Chest Workout">Chest Workout</option>
                <option value="Back Workout">Back Workout</option>
                <option value="Leg Workout">Leg Workout</option>
                <option value="Shoulder Workout">Shoulder Workout</option>
                <option value="Arms Workout">Arms Workout</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Target Muscle</label>
              <input
                type="text"
                value={exerciseForm.targetMuscle}
                onChange={(e) => setExerciseForm({ ...exerciseForm, targetMuscle: e.target.value })}
                placeholder="e.g. Upper Pectorals"
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Equipment</label>
              <select
                value={exerciseForm.equipment}
                onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Dumbbells">Dumbbells</option>
                <option value="Barbells">Barbells</option>
                <option value="Cables">Cables</option>
                <option value="Machines">Machines</option>
                <option value="Bodyweight">Bodyweight</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Difficulty</label>
              <select
                value={exerciseForm.difficulty}
                onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Form Instructions & Execution</label>
            <textarea
              rows={2}
              value={exerciseForm.instructions}
              onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
              placeholder="Maintain 30-degree incline, plant feet firmly, control the eccentric phase..."
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
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
          <button onClick={handleCreateExercise} className="trainer-btn-primary">
            Save Movement
          </button>
        </div>
      </div>
    </div>
  );
}
