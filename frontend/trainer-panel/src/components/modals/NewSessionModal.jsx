import React from 'react';

export default function NewSessionModal({
  isOpen,
  onClose,
  members = [],
  ptSessionForm,
  setPtSessionForm,
  handleSchedulePT,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="trainer-glass-card w-full max-w-md p-6 space-y-4">
        <h3 className="font-serif text-lg text-white">Book VIP Personal Training Session</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1">Athlete</label>
            <select
              value={ptSessionForm.member}
              onChange={(e) => setPtSessionForm({ ...ptSessionForm, member: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="">Choose athlete...</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Date</label>
            <input
              type="date"
              value={ptSessionForm.sessionDate}
              onChange={(e) => setPtSessionForm({ ...ptSessionForm, sessionDate: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1">Start Time</label>
              <input
                type="text"
                value={ptSessionForm.startTime}
                placeholder="09:00"
                onChange={(e) => setPtSessionForm({ ...ptSessionForm, startTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">End Time</label>
              <input
                type="text"
                value={ptSessionForm.endTime}
                placeholder="10:00"
                onChange={(e) => setPtSessionForm({ ...ptSessionForm, endTime: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 mb-1">Session Focus Area</label>
            <input
              type="text"
              value={ptSessionForm.focusArea}
              placeholder="e.g. Kinetic Acceleration & Olympic Lifting"
              onChange={(e) => setPtSessionForm({ ...ptSessionForm, focusArea: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button onClick={handleSchedulePT} className="trainer-btn-primary">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
