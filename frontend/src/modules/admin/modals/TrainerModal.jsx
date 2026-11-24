import React from 'react';
import { X } from 'lucide-react';
import ImageUploadField from '../../../components/ImageUploadField';

export default function TrainerModal({
  isOpen,
  onClose,
  editingTrainer,
  trainerForm,
  setTrainerForm,
  handleSaveTrainer,
}) {
  if (!isOpen) return null;

  return (
    <div className="qnox-checkout-backdrop">
      <div className="qnox-checkout-dialog max-w-lg">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-serif text-2xl text-white mb-4">
          {editingTrainer ? 'Edit Master Coach' : 'Add Master Coach'}
        </h3>
        <form onSubmit={handleSaveTrainer} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Coach Name</label>
            <input
              required
              type="text"
              value={trainerForm.name}
              onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Role & Specialization</label>
            <input
              required
              type="text"
              value={trainerForm.role}
              onChange={(e) => setTrainerForm({ ...trainerForm, role: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="HEAD OF STRENGTH"
            />
          </div>
          <ImageUploadField
            label="Coach Photo (Upload or URL)"
            value={trainerForm.photo}
            onChange={(url) => setTrainerForm({ ...trainerForm, photo: url })}
            placeholder="https://images.unsplash.com/..."
          />
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Biography</label>
            <textarea
              required
              rows={3}
              value={trainerForm.bio}
              onChange={(e) => setTrainerForm({ ...trainerForm, bio: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4 hover:bg-[#d8bf9b] transition"
          >
            SAVE MASTER COACH
          </button>
        </form>
      </div>
    </div>
  );
}
