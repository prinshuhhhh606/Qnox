import React from 'react';
import { X } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';

export default function ClubModal({
  isOpen,
  onClose,
  editingClub,
  clubForm,
  setClubForm,
  handleSaveClub,
}) {
  if (!isOpen) return null;

  return (
    <div className="qnox-checkout-backdrop">
      <div className="qnox-checkout-dialog max-w-lg">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="font-serif text-2xl text-white mb-4">
          {editingClub ? 'Edit Sanctuary' : 'Commission New Sanctuary'}
        </h3>
        <form onSubmit={handleSaveClub} className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Sanctuary Name</label>
            <input
              required
              type="text"
              value={clubForm.name}
              onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="QNOX Mayfair Sanctuary"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Location / District</label>
            <input
              required
              type="text"
              value={clubForm.location}
              onChange={(e) => setClubForm({ ...clubForm, location: e.target.value })}
              className="qnox-modal-form-input"
              placeholder="Mayfair, London W1K"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Address</label>
            <input
              required
              type="text"
              value={clubForm.address}
              onChange={(e) => setClubForm({ ...clubForm, address: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <ImageUploadField
            label="Sanctuary Hero Image (Upload or URL)"
            value={clubForm.heroImage}
            onChange={(url) => setClubForm({ ...clubForm, heroImage: url })}
            placeholder="https://images.unsplash.com/..."
          />
          <div>
            <label className="text-[10px] uppercase text-neutral-400 block mb-1">Description</label>
            <textarea
              required
              rows={2}
              value={clubForm.description}
              onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
              className="qnox-modal-form-input"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4 hover:bg-[#d8bf9b] transition"
          >
            SAVE SANCTUARY
          </button>
        </form>
      </div>
    </div>
  );
}
