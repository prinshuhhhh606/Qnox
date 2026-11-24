import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function PlansTab({
  plans = [],
  setShowPlanModal,
  setEditingPlan,
  setPlanForm,
  handleTogglePlan,
  handleDeletePlan,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-white">Membership Residency Tiers</h3>
          <p className="text-xs text-neutral-400 font-light">Configure multi-month pricing, benefits and visibility.</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setPlanForm({
              name: '',
              code: '',
              subtitle: '',
              description: '',
              pricing: { monthly: 1200, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
              benefits: 'Unlimited access, Slate pool, Altitude suite',
            });
            setShowPlanModal(true);
          }}
          className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2 hover:bg-[#d8bf9b] transition"
        >
          <Plus className="w-4 h-4" />
          <span>NEW TIER</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p._id} className="bg-[#090909] border border-white/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#c5a880] font-bold">{p.code}</span>
                <button
                  onClick={() => handleTogglePlan(p._id)}
                  className={`text-[9px] px-2 py-0.5 uppercase font-bold tracking-widest ${
                    p.isActive
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                      : 'bg-neutral-900 text-neutral-500'
                  }`}
                >
                  {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              <h4 className="font-serif text-2xl text-white mb-1">{p.name}</h4>
              <p className="text-xs text-neutral-400 font-light mb-4">{p.subtitle}</p>

              <div className="text-sm font-serif text-[#c5a880] mb-4">
                ₹{p.pricing?.monthly?.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-neutral-400 font-mono uppercase font-light">/ month</span>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300">
                {p.benefits?.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-6">
              <button
                onClick={() => {
                  setEditingPlan(p);
                  setPlanForm({
                    name: p.name,
                    code: p.code,
                    subtitle: p.subtitle,
                    description: p.description,
                    pricing: p.pricing,
                    benefits: Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits,
                  });
                  setShowPlanModal(true);
                }}
                className="flex-1 py-2 border border-white/20 text-neutral-300 hover:text-white text-xs uppercase transition"
              >
                EDIT
              </button>
              <button
                onClick={() => handleDeletePlan(p._id, p.name)}
                className="px-3 py-2 text-rose-400 hover:text-rose-200 text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
