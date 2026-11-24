import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function ClubsTab({
  clubs = [],
  setShowClubModal,
  setEditingClub,
  setClubForm,
  handleDeleteClub,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-white">Sanctuary Portfolio Locations</h3>
          <p className="text-xs text-neutral-400 font-light">Mayfair, Soho, Canary Wharf, Marylebone & Obsidian Tower Flagship.</p>
        </div>
        <button
          onClick={() => {
            setEditingClub(null);
            setClubForm({
              name: '',
              slug: '',
              location: '',
              address: '',
              tagline: '',
              description: '',
              heroImage: '',
              status: 'OPEN',
            });
            setShowClubModal(true);
          }}
          className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2 hover:bg-[#d8bf9b] transition"
        >
          <Plus className="w-4 h-4" />
          <span>NEW SANCTUARY</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clubs.map((c) => (
          <div key={c._id || c.slug} className="bg-[#090909] border border-white/10 p-5 flex flex-col justify-between">
            <div>
              <img src={c.heroImage} alt={c.name} className="w-full aspect-[16/10] object-cover mb-4" />
              <span className="text-[9px] px-2 py-0.5 bg-black border border-[#c5a880]/40 text-[#c5a880] uppercase font-bold mb-2 inline-block">
                {c.status}
              </span>
              <h4 className="font-serif text-xl text-white mb-1">{c.name}</h4>
              <p className="text-xs text-neutral-400 font-light mb-3">{c.location}</p>
              <p className="text-xs text-neutral-500 line-clamp-3">{c.description}</p>
            </div>

            <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-6">
              <button
                onClick={() => {
                  setEditingClub(c);
                  setClubForm(c);
                  setShowClubModal(true);
                }}
                className="flex-1 py-1.5 border border-white/20 text-xs uppercase hover:text-white transition"
              >
                EDIT
              </button>
              <button
                onClick={() => handleDeleteClub(c._id)}
                className="px-3 py-1.5 text-rose-400 hover:text-rose-200 text-xs transition"
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
