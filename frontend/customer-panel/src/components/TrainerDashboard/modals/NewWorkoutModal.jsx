import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function NewWorkoutModal({
  isOpen,
  onClose,
  workoutForm,
  setWorkoutForm,
  handleCreateWorkout,
  members = [],
  creatingWorkout = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="trainer-glass-card w-full max-w-lg p-6 space-y-4">
        <h3 className="font-serif text-lg text-white">Create Custom Workout Routine</h3>
        
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Routine Title *</label>
            <input
              type="text"
              value={workoutForm.title}
              onChange={(e) => setWorkoutForm({ ...workoutForm, title: e.target.value })}
              placeholder="e.g. Hypertrophy Split: Upper Power"
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Assign to Athlete (Optional)</label>
            <select
              value={workoutForm.member || ''}
              onChange={(e) => setWorkoutForm({ ...workoutForm, member: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="">General Library Template (Not Assigned)</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Category</label>
              <select
                value={workoutForm.category}
                onChange={(e) => setWorkoutForm({ ...workoutForm, category: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Chest Workout">Chest Workout</option>
                <option value="Back Workout">Back Workout</option>
                <option value="Leg Workout">Leg Workout</option>
                <option value="Shoulder Workout">Shoulder Workout</option>
                <option value="Arms Workout">Arms Workout</option>
                <option value="Full Body">Full Body</option>
                <option value="Combat Conditioning">Combat Conditioning</option>
                <option value="Aquatic Endurance">Aquatic Endurance</option>
                <option value="Cryo Mobility">Cryo Mobility</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Target Goal</label>
              <select
                value={workoutForm.goal || 'Muscle Gain'}
                onChange={(e) => setWorkoutForm({ ...workoutForm, goal: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Strength Training">Strength Training</option>
                <option value="Fat Loss">Fat Loss</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Recovery & Mobility">Recovery & Mobility</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Difficulty Level</label>
              <select
                value={workoutForm.difficulty}
                onChange={(e) => setWorkoutForm({ ...workoutForm, difficulty: e.target.value, level: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Elite">Elite</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="52"
                value={workoutForm.durationWeeks}
                onChange={(e) => setWorkoutForm({ ...workoutForm, durationWeeks: Number(e.target.value) })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Routine Description</label>
            <textarea
              rows={2}
              value={workoutForm.description}
              onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
              placeholder="Outline the training stimulus, rep cadences, and rest intervals..."
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            disabled={creatingWorkout}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateWorkout}
            disabled={creatingWorkout}
            className="trainer-btn-primary flex items-center gap-2"
          >
            {creatingWorkout && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{creatingWorkout ? 'Creating Routine...' : 'Create Workout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
