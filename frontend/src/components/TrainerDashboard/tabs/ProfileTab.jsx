import React from 'react';

export default function ProfileTab({
  trainerProfile,
  setTrainerProfile,
  handleSaveProfile,
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-white tracking-wide">Master Coach Profile & Availability</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Update your bio, credentials, active sanctuary working hours, and specializations.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="trainer-glass-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Coach Name
            </label>
            <input
              type="text"
              value={trainerProfile.name}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, name: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={trainerProfile.phone}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, phone: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Working Hours
            </label>
            <input
              type="text"
              value={trainerProfile.workingHours}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, workingHours: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Available Days
            </label>
            <input
              type="text"
              value={trainerProfile.availableDays}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, availableDays: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Specializations (comma separated)
            </label>
            <input
              type="text"
              value={trainerProfile.specialties}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, specialties: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
              Bio & Coaching Philosophy
            </label>
            <textarea
              rows={3}
              value={trainerProfile.bio}
              onChange={(e) => setTrainerProfile({ ...trainerProfile, bio: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button type="submit" className="trainer-btn-primary">
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
