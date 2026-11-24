import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function TrainersTab({
  trainers = [],
  setShowTrainerModal,
  setEditingTrainer,
  setTrainerForm,
  handleDeleteTrainer,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-white">Master Practitioners Roster</h3>
          <p className="text-xs text-neutral-400 font-light">Olympic strength coaches, biomechanists and striking specialists.</p>
        </div>
        <button
          onClick={() => {
            setEditingTrainer(null);
            setTrainerForm({
              name: '',
              role: '',
              title: '',
              badge: 'MASTER COACH',
              email: '',
              phone: '',
              bio: '',
              photo: '',
              specialties: 'Olympic Lifting, VO2 Max',
            });
            setShowTrainerModal(true);
          }}
          className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2 hover:bg-[#d8bf9b] transition"
        >
          <Plus className="w-4 h-4" />
          <span>NEW COACH</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trainers.map((t) => (
          <div key={t._id} className="bg-[#090909] border border-white/10 p-5 flex flex-col justify-between">
            <div>
              <img src={t.photo} alt={t.name} className="w-full aspect-[4/5] object-cover mb-4" />
              <span className="text-[9px] text-[#c5a880] tracking-widest uppercase font-bold block mb-1">{t.badge}</span>
              <h4 className="font-serif text-xl text-white">{t.name}</h4>
              <p className="text-xs text-neutral-400 font-light mt-1 mb-3">{t.role}</p>
              <p className="text-xs text-neutral-500 line-clamp-2">{t.bio}</p>
            </div>

            <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-4">
              <button
                onClick={() => {
                  setEditingTrainer(t);
                  setTrainerForm({
                    name: t.name,
                    role: t.role,
                    title: t.title,
                    badge: t.badge,
                    email: t.email,
                    phone: t.phone,
                    bio: t.bio,
                    photo: t.photo,
                    specialties: Array.isArray(t.specialties) ? t.specialties.join(', ') : t.specialties,
                  });
                  setShowTrainerModal(true);
                }}
                className="flex-1 py-1.5 border border-white/20 text-xs uppercase hover:text-white transition"
              >
                EDIT
              </button>
              <button
                onClick={() => handleDeleteTrainer(t._id)}
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
