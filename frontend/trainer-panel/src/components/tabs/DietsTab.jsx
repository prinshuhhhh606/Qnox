import React from 'react';
import { Utensils, RefreshCw, Sparkles } from 'lucide-react';

export default function DietsTab({
  aiDietForm,
  setAiDietForm,
  aiDietLoading,
  handleGenerateAiDiet,
  generatedAiDiet,
  handleSaveAiDietPlan,
  dietPlans,
}) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Member Diet & Nutrition Management</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Calculate target calories, macronutrient splits, and AI-tailored meal schedules.
          </p>
        </div>
      </div>

      {/* AI Diet Generator Card */}
      <div className="trainer-glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-400" />
          <h3 className="font-serif text-lg text-white">AI Nutrition & Macro Synthesizer</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Dietary Preference
            </label>
            <select
              value={aiDietForm.dietaryPreference}
              onChange={(e) => setAiDietForm({ ...aiDietForm, dietaryPreference: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            >
              <option value="Non-Vegetarian">Non-Vegetarian (Poultry / Fish)</option>
              <option value="Vegetarian">Vegetarian (Lacto / Ovo)</option>
              <option value="Vegan">Vegan (Plant-Based)</option>
              <option value="Keto">Ketogenic (High Fat Low Carb)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Target Daily Calories
            </label>
            <input
              type="number"
              value={aiDietForm.targetCalories}
              onChange={(e) => setAiDietForm({ ...aiDietForm, targetCalories: Number(e.target.value) })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="flex items-end">
            <button
              disabled={aiDietLoading}
              onClick={handleGenerateAiDiet}
              className="w-full trainer-btn-primary flex items-center justify-center gap-2"
            >
              {aiDietLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate AI Diet
            </button>
          </div>
        </div>
      </div>

      {/* Generated AI Diet Review */}
      {generatedAiDiet && (
        <div className="trainer-glass-card p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-xl font-serif text-white">{generatedAiDiet.title}</h3>
              <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                <span>Calories: <strong className="text-white">{generatedAiDiet.targetCalories} kcal</strong></span>
                <span>Protein: <strong className="text-emerald-400">{generatedAiDiet.macros.proteinGrams}g</strong></span>
                <span>Carbs: <strong className="text-[#c5a880]">{generatedAiDiet.macros.carbsGrams}g</strong></span>
                <span>Fats: <strong className="text-amber-400">{generatedAiDiet.macros.fatsGrams}g</strong></span>
              </div>
            </div>
            <button onClick={handleSaveAiDietPlan} className="trainer-btn-primary">
              Save & Assign Diet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedAiDiet.meals.map((meal, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#c5a880]">{meal.category}</span>
                  <span className="text-neutral-500">{meal.time}</span>
                </div>
                <p className="text-xs font-semibold text-neutral-200">{meal.name}</p>
                <ul className="mt-2 space-y-1 text-[11px] text-neutral-400 list-disc list-inside">
                  {meal.items.map((it, itIdx) => (
                    <li key={itIdx}>{it}</li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-neutral-800 flex justify-between text-[10px] text-neutral-500">
                  <span>{meal.calories} kcal</span>
                  <span>P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Diets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dietPlans.map((dp) => (
          <div key={dp._id} className="trainer-glass-card p-5">
            <span className="trainer-badge trainer-badge-gold">{dp.dietaryPreference}</span>
            <h4 className="font-serif text-base text-white font-semibold mt-2">{dp.title}</h4>
            <p className="text-xs text-neutral-400 mt-1">Target: {dp.targetCalories} kcal</p>
            <div className="mt-3 flex gap-2 text-[10px] text-neutral-400">
              <span>Protein: {dp.macros?.proteinGrams}g</span>
              <span>Carbs: {dp.macros?.carbsGrams}g</span>
              <span>Fats: {dp.macros?.fatsGrams}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
