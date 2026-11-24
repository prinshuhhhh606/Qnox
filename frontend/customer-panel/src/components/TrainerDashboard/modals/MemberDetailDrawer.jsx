import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

export default function MemberDetailDrawer({
  memberDetailDrawer,
  onClose,
  addTrainerMemberNote,
  showToast,
  viewMemberDrawer,
}) {
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!memberDetailDrawer) return null;

  const handleSaveNote = async () => {
    if (!noteContent.trim()) return;
    try {
      setIsSaving(true);
      await addTrainerMemberNote(memberDetailDrawer.member._id, { content: noteContent.trim() });
      showToast('Note appended to athlete history');
      setNoteContent('');
      if (viewMemberDrawer) {
        viewMemberDrawer(memberDetailDrawer.member._id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-[#090909] border-l border-[#c5a880]/20 h-full p-6 overflow-y-auto space-y-6 custom-scrollbar animate-slideLeft">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src={
                memberDetailDrawer.member?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-[#c5a880]/30"
            />
            <div>
              <h3 className="font-serif text-lg text-white">{memberDetailDrawer.member?.name}</h3>
              <p className="text-xs text-[#c5a880]">{memberDetailDrawer.member?.memberCategory || 'General Member'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white transition">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h4 className="font-bold text-[#c5a880] uppercase tracking-wider text-[11px]">Fitness Profile & Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div>Current Weight: <span className="text-white font-medium">{memberDetailDrawer.member?.currentWeight || 70} kg</span></div>
              <div>Target Weight: <span className="text-[#c5a880] font-medium">{memberDetailDrawer.member?.targetWeight || 68} kg</span></div>
              <div>Height: <span className="text-white font-medium">{memberDetailDrawer.member?.heightCm || 178} cm</span></div>
              <div>Goal: <span className="text-white font-medium">{memberDetailDrawer.member?.fitnessGoal || 'General Fitness'}</span></div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Injuries & Medical Conditions</h4>
            <p className="text-neutral-300">
              {memberDetailDrawer.member?.injuries?.length
                ? memberDetailDrawer.member.injuries.join(', ')
                : 'None reported.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
            <h4 className="font-bold text-[#c5a880] uppercase tracking-wider text-[11px]">Add Coach Note</h4>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={2}
              placeholder="Record observation on squat depth, form, fatigue..."
              className="w-full bg-black/60 border border-neutral-800 p-2 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
            <button
              onClick={handleSaveNote}
              disabled={isSaving}
              className="trainer-btn-primary text-xs"
            >
              {isSaving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
