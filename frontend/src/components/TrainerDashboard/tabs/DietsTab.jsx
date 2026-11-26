import React, { useState } from 'react';
import { Utensils, RefreshCw, Sparkles, CheckCircle2, Trash2, ChevronDown, ChevronUp, User, Flame } from 'lucide-react';

export default function DietsTab({
  aiDietForm,
  setAiDietForm,
  aiDietLoading,
  savingDiet = false,
  handleGenerateAiDiet,
  generatedAiDiet,
  handleSaveAiDietPlan,
  handleDeleteDietPlan,
  dietPlans = [],
  members = [],
}) {
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Assign To Member (Optional)
            </label>
            <select
              value={aiDietForm.memberId || ''}
              onChange={(e) => setAiDietForm({ ...aiDietForm, memberId: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            >
              <option value="">General Sanctuary Template (All)</option>
              {members?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.membershipTier || 'Member'})
                </option>
              ))}
            </select>
          </div>

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
              <option value="High Protein">High Protein</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Target Daily Calories
            </label>
            <input
              type="number"
              value={aiDietForm.targetCalories || 2400}
              onChange={(e) => setAiDietForm({ ...aiDietForm, targetCalories: Number(e.target.value) })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="flex items-end">
            <button
              disabled={aiDietLoading}
              onClick={handleGenerateAiDiet}
              className="w-full trainer-btn-primary flex items-center justify-center gap-2 h-[38px]"
            >
              {aiDietLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiDietLoading ? 'Synthesizing...' : 'Generate AI Diet'}
            </button>
          </div>
        </div>
      </div>

      {/* Generated AI Diet Review */}
      {generatedAiDiet && (
        <div className="trainer-glass-card p-6 space-y-5 animate-fadeIn border border-[#c5a880]/30 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  AI Synthesized Protocol
                </span>
                {aiDietForm.memberId && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/30 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Target: {members?.find((m) => m._id === aiDietForm.memberId)?.name || 'Selected Member'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-serif text-white mt-1.5">{generatedAiDiet.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-2">
                <span className="flex items-center gap-1 text-white bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <strong>{generatedAiDiet.targetCalories || generatedAiDiet.dailyCalorieTarget || 2400} kcal</strong>
                </span>
                <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  Protein: <strong className="text-emerald-400">{generatedAiDiet.macros?.proteinGrams || 150}g</strong>
                </span>
                <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  Carbs: <strong className="text-[#c5a880]">{generatedAiDiet.macros?.carbsGrams || 200}g</strong>
                </span>
                <span className="bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                  Fats: <strong className="text-amber-400">{generatedAiDiet.macros?.fatsGrams || 60}g</strong>
                </span>
              </div>
            </div>
            <button
              disabled={savingDiet}
              onClick={handleSaveAiDietPlan}
              className="trainer-btn-primary flex items-center justify-center gap-2 min-w-[180px] disabled:opacity-50"
            >
              {savingDiet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Protocol...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Assign Diet</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedAiDiet.meals?.map((meal, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-[#c5a880] tracking-wide">{meal.category || meal.mealCategory}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">{meal.time}</span>
                </div>
                <p className="text-xs font-semibold text-neutral-200">{meal.name}</p>
                <ul className="mt-2.5 space-y-1 text-[11px] text-neutral-300 list-disc list-inside">
                  {Array.isArray(meal.items) ? (
                    meal.items.map((it, itIdx) => <li key={itIdx}>{it}</li>)
                  ) : (
                    <li>{meal.items || 'Standard balanced nutrition'}</li>
                  )}
                </ul>
                {meal.instructions && (
                  <p className="mt-2 text-[10px] text-neutral-500 italic bg-neutral-950/40 p-1.5 rounded border border-neutral-900">
                    💡 {meal.instructions}
                  </p>
                )}
                <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex justify-between text-[11px] text-neutral-400">
                  <span className="text-white font-medium">{meal.calories} kcal</span>
                  <span>P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g</span>
                </div>
              </div>
            ))}
          </div>

          {generatedAiDiet.guidelines && generatedAiDiet.guidelines.length > 0 && (
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 mt-2">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-[#c5a880] mb-2">Coach Guidelines</h4>
              <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
                {generatedAiDiet.guidelines.map((g, gIdx) => (
                  <li key={gIdx}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Saved Diets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-white">Active Sanctuary Nutrition Protocols</h3>
          <span className="text-xs text-neutral-500">
            {dietPlans.length} {dietPlans.length === 1 ? 'Protocol' : 'Protocols'} Registered
          </span>
        </div>

        {dietPlans.length === 0 ? (
          <div className="trainer-glass-card p-10 text-center space-y-3">
            <Utensils className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">No diet plans saved yet.</p>
            <p className="text-xs text-neutral-500">
              Use the AI Nutrition & Macro Synthesizer above to generate and assign personalized diet protocols.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietPlans.map((dp) => {
              const isExpanded = expandedPlanId === dp._id;
              const targetCals = dp.targetCalories || dp.dailyCalorieTarget || 2400;
              return (
                <div key={dp._id} className="trainer-glass-card p-5 space-y-3 transition-all hover:border-[#c5a880]/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="trainer-badge trainer-badge-gold">{dp.dietaryPreference || 'Nutrition'}</span>
                      {dp.member?.name ? (
                        <span className="trainer-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {dp.member.name}
                        </span>
                      ) : (
                        <span className="trainer-badge bg-neutral-800 text-neutral-400">General Template</span>
                      )}
                    </div>
                    {handleDeleteDietPlan && (
                      <button
                        onClick={() => handleDeleteDietPlan(dp._id)}
                        className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete Diet Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif text-base text-white font-semibold">{dp.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Target: <strong className="text-white">{targetCals} kcal</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] text-neutral-400 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                    <span>Protein: <strong className="text-emerald-400">{dp.macros?.proteinGrams || 150}g</strong></span>
                    <span>•</span>
                    <span>Carbs: <strong className="text-[#c5a880]">{dp.macros?.carbsGrams || 200}g</strong></span>
                    <span>•</span>
                    <span>Fats: <strong className="text-amber-400">{dp.macros?.fatsGrams || 60}g</strong></span>
                  </div>

                  {dp.meals && dp.meals.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(dp._id)}
                        className="text-xs text-[#c5a880] hover:text-[#e2caa8] flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Hide Meals ({dp.meals.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            View Meals ({dp.meals.length})
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3 animate-fadeIn">
                          {dp.meals.map((m, mIdx) => (
                            <div key={mIdx} className="text-xs p-2.5 rounded bg-neutral-900/80 border border-neutral-800">
                              <div className="flex justify-between text-[11px] font-semibold text-[#c5a880] mb-1">
                                <span>{m.mealCategory || m.category}</span>
                                <span className="text-neutral-500 font-normal">{m.time}</span>
                              </div>
                              <p className="text-neutral-300 font-medium">{m.name}</p>
                              <p className="text-neutral-400 text-[11px] mt-1">
                                {Array.isArray(m.items) ? m.items.join(', ') : m.items}
                              </p>
                              <div className="mt-1.5 text-[10px] text-neutral-500 flex justify-between">
                                <span>{m.calories} kcal</span>
                                <span>P: {m.protein}g | C: {m.carbs}g | F: {m.fats}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
