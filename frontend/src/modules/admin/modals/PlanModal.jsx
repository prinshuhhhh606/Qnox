import React from 'react';
import { X } from 'lucide-react';

export default function PlanModal({
  isOpen,
  onClose,
  editingPlan,
  planForm,
  setPlanForm,
  handleSavePlan,
}) {
  if (!isOpen) return null;

  return (
    <div className="qnox-checkout-backdrop">
      <div className="qnox-checkout-dialog max-w-lg">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-serif text-2xl text-white mb-4">
          {editingPlan ? 'Edit Membership Tier' : 'Commission New Tier'}
        </h3>
        <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Plan Name</label>
            <input
              required
              type="text"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="e.g. THE METROPOLITAN"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Code</label>
            <input
              required
              type="text"
              value={planForm.code}
              onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="METRO"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Subtitle</label>
            <input
              required
              type="text"
              value={planForm.subtitle}
              onChange={(e) => setPlanForm({ ...planForm, subtitle: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="London Multi-Sanctuary Access"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-neutral-400 block mb-1">Monthly Price (₹)</label>
              <input
                required
                type="number"
                value={planForm.pricing?.monthly}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    pricing: { ...planForm.pricing, monthly: Number(e.target.value) },
                  })
                }
                className="qnox-modal-form-input"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-neutral-400 block mb-1">Yearly Price (₹)</label>
              <input
                required
                type="number"
                value={planForm.pricing?.yearly}
                onChange={(e) =>
                  setPlanForm({
                    ...planForm,
                    pricing: { ...planForm.pricing, yearly: Number(e.target.value) },
                  })
                }
                className="qnox-modal-form-input"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Benefits (Comma-separated)</label>
            <input
              type="text"
              value={planForm.benefits}
              onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4 hover:bg-[#d8bf9b] transition"
          >
            SAVE MEMBERSHIP TIER
          </button>
        </form>
      </div>
    </div>
  );
}
