import React from 'react';
import { Sparkles, RefreshCw, Check } from 'lucide-react';

export default function AiWorkoutsTab({
  aiWorkoutForm,
  setAiWorkoutForm,
  members,
  aiWorkoutLoading,
  handleGenerateAiWorkout,
  generatedAiWorkout,
  handleSaveAiWorkoutPlan,
}) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#c5a880]" />
          <h2 className="text-2xl font-serif text-white tracking-wide">AI Workout Assistant Engine</h2>
        </div>
        <p className="text-xs text-neutral-400">
          Synthesize an evidence-based athletic split factoring in age, injury profile, frequency, and equipment.
        </p>
      </div>

      <div className="trainer-glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
            Target Member
          </label>
          <select
            value={aiWorkoutForm.memberId}
            onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, memberId: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="">Select Athlete (Optional)</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name} ({m.fitnessGoal || 'General'})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
            Fitness Goal
          </label>
          <select
            value={aiWorkoutForm.goal}
            onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, goal: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="Muscle Gain">Muscle Gain (Hypertrophy)</option>
            <option value="Fat Loss">Fat Loss & Conditioning</option>
            <option value="Strength Training">Pure Strength (Powerlifting)</option>
            <option value="Endurance">Endurance & Athletic Mobility</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
            Experience Level
          </label>
          <select
            value={aiWorkoutForm.experienceLevel}
            onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, experienceLevel: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="Beginner">Beginner (Foundational Movements)</option>
            <option value="Intermediate">Intermediate (Progressive Overload)</option>
            <option value="Advanced">Advanced (High Volume & Intensity)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
            Weekly Training Split
          </label>
          <select
            value={aiWorkoutForm.daysPerWeek}
            onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, daysPerWeek: Number(e.target.value) })}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value={3}>3 Days (Full Body / Push-Pull-Legs)</option>
            <option value={4}>4 Days (Upper / Lower Hypertrophy)</option>
            <option value={5}>5 Days (Bro Split / Athletic Conditioning)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
            Medical & Injury Constraints (AI Considers Exercise Substitutes)
          </label>
          <input
            type="text"
            placeholder="e.g. Mild lower back strain, avoid heavy spinal loading, tight shoulder capsules"
            value={aiWorkoutForm.limitations}
            onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, limitations: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            disabled={aiWorkoutLoading}
            onClick={handleGenerateAiWorkout}
            className="trainer-btn-primary flex items-center gap-2"
          >
            {aiWorkoutLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Biomechanics...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate AI Workout Protocol
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated AI Workout Review */}
      {generatedAiWorkout && (
        <div className="trainer-glass-card p-6 border-l-4 border-l-[#c5a880] space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <span className="trainer-badge trainer-badge-gold">AI PROTOCOL SYNTHESIZED</span>
              <h3 className="text-xl font-serif text-white mt-1">{generatedAiWorkout.title}</h3>
              <p className="text-xs text-neutral-400 mt-1">{generatedAiWorkout.description}</p>
            </div>
            <button
              onClick={handleSaveAiWorkoutPlan}
              className="trainer-btn-primary flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Approve & Save Plan
            </button>
          </div>

          {/* Weekly Split Days */}
          <div className="space-y-4">
            {generatedAiWorkout.weeklySchedule.map((day, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#c5a880] uppercase tracking-wider">{day.day}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-xs text-neutral-300 font-medium">{day.focus}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {day.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="p-2.5 rounded bg-black/40 border border-neutral-800/80">
                      <p className="font-semibold text-neutral-200">{ex.exerciseName}</p>
                      <p className="text-[11px] text-[#c5a880]">{ex.sets} sets × {ex.reps} ({ex.restTimeSec}s rest)</p>
                      <p className="text-[10px] text-neutral-500 mt-1">{ex.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
