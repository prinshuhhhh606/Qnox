import React from 'react';

export default function CheckInModal({
  isOpen,
  onClose,
  members = [],
  selectedMemberForCheckIn,
  setSelectedMemberForCheckIn,
  activityType,
  setActivityType,
  handleCheckInMember,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="trainer-glass-card w-full max-w-md p-6 space-y-4">
        <h3 className="font-serif text-lg text-white">Record Member Check-In</h3>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Select Member</label>
          <select
            value={selectedMemberForCheckIn}
            onChange={(e) => setSelectedMemberForCheckIn(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="">Choose an athlete...</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Activity Type</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="Workout">Workout (Gym Floor)</option>
            <option value="Private Training">Private Training</option>
            <option value="Spa">Cryo & Spa Sanctuary</option>
            <option value="Class">Master Class</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCheckInMember}
            className="trainer-btn-primary"
          >
            Confirm Check-In
          </button>
        </div>
      </div>
    </div>
  );
}
