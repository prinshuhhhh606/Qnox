import React from 'react';
import ImageUploadField from '../../ImageUploadField';
import { Camera, User } from 'lucide-react';

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
          Update your portrait DP, bio, credentials, active sanctuary working hours, and specializations.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="trainer-glass-card p-6 space-y-6">
        {/* Profile Picture / DP Upload Section */}
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#c5a880] bg-neutral-800 shrink-0 flex items-center justify-center shadow-lg">
              {trainerProfile.photo ? (
                <img
                  src={trainerProfile.photo}
                  alt={trainerProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-neutral-500" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 w-full">
              <span className="text-xs font-semibold text-white tracking-wide block mb-1">
                Official Coach Portrait Photo (DP)
              </span>
              <p className="text-[11px] text-neutral-400 mb-3">
                This dynamic photo will be displayed to all members across the homepage roster, timetable, and consultation bookings.
              </p>
              <ImageUploadField
                label="UPLOAD PROFILE DP OR PASTE IMAGE URL"
                value={trainerProfile.photo || ''}
                onChange={(url) => setTrainerProfile({ ...trainerProfile, photo: url })}
                placeholder="https://images.unsplash.com/... or upload file"
              />
            </div>
          </div>
        </div>

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
