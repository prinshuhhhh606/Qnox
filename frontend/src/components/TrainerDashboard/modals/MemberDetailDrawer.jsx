import React, { useState } from 'react';
import {
  X,
  Activity,
  Dumbbell,
  Utensils,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle,
} from 'lucide-react';

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

  const {
    member = {},
    workoutPlans = [],
    dietPlans = [],
    assessments = [],
    attendanceHistory = [],
  } = memberDetailDrawer;

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !member._id) return;
    try {
      setIsSaving(true);
      await addTrainerMemberNote(member._id, { content: noteContent.trim() });
      if (showToast) showToast('Coach note appended to athlete dossier');
      setNoteContent('');
      if (viewMemberDrawer) {
        viewMemberDrawer(member._id);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-[#0a0a0a] border border-[#c5a880]/30 rounded-xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#c5a880]/40 bg-neutral-800 shrink-0">
              <img
                src={
                  member.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                }
                alt={member.name || 'Member'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl text-white font-medium">{member.name || 'Athlete'}</h3>
                <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30 rounded">
                  {member.memberCategory || member.role || 'Resident Athlete'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                {member.email} {member.phone ? `• ${member.phone}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            aria-label="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
          
          {/* Left Column (5 Cols): Biometrics, Injuries, Attendance */}
          <div className="md:col-span-5 space-y-4">
            {/* Fitness Profile & Biometrics */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-[#c5a880] font-bold text-[11px] tracking-wider uppercase">
                <Activity className="w-4 h-4" />
                <span>Fitness Profile & Biometrics</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-neutral-300">
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-500 block uppercase">Current Weight</span>
                  <span className="text-sm font-semibold text-white">{member.currentWeight || 70} kg</span>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-500 block uppercase">Target Weight</span>
                  <span className="text-sm font-semibold text-[#c5a880]">{member.targetWeight || 68} kg</span>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-500 block uppercase">Height</span>
                  <span className="text-sm font-semibold text-white">{member.heightCm || 178} cm</span>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-[10px] text-neutral-500 block uppercase">Target Goal</span>
                  <span className="text-xs font-semibold text-emerald-400 truncate block">{member.fitnessGoal || 'General Fitness'}</span>
                </div>
              </div>
            </div>

            {/* Medical Conditions & Injuries */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] tracking-wider uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Injuries & Medical Clearance</span>
              </div>
              <p className="text-neutral-300 bg-black/40 p-2.5 rounded border border-white/5">
                {member.injuries?.length
                  ? member.injuries.join(', ')
                  : 'None reported. Full operational clearance.'}
              </p>
            </div>

            {/* Sanctuary Attendance History */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-neutral-300 font-bold text-[11px] tracking-wider uppercase">
                <div className="flex items-center gap-2 text-[#c5a880]">
                  <Clock className="w-4 h-4" />
                  <span>Sanctuary Check-Ins ({attendanceHistory.length})</span>
                </div>
              </div>
              {attendanceHistory.length === 0 ? (
                <p className="text-neutral-500 text-[11px] italic bg-black/40 p-2.5 rounded border border-white/5">No physical check-ins recorded yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {attendanceHistory.slice(0, 5).map((att) => (
                    <div key={att._id} className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-neutral-300">{att.clubName || 'Sanctuary'}</span>
                      <span className="text-neutral-500 font-mono">
                        {att.checkIn ? new Date(att.checkIn).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (7 Cols): Assigned Workouts, Diets, and Coach Notes */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Assigned Workout Routines */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                <div className="flex items-center gap-2 text-[#c5a880]">
                  <Dumbbell className="w-4 h-4" />
                  <span>Assigned Workouts ({workoutPlans.length})</span>
                </div>
              </div>
              {workoutPlans.length === 0 ? (
                <div className="p-3 bg-black/40 rounded border border-white/5 text-neutral-500 text-[11px]">
                  No custom routines assigned to this athlete yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {workoutPlans.map((wp) => (
                    <div key={wp._id} className="p-3 bg-black/50 border border-white/5 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#c5a880] font-mono uppercase px-1.5 py-0.2 bg-[#c5a880]/10 border border-[#c5a880]/20 rounded">
                            {wp.category || 'Routine'}
                          </span>
                          <span className="text-xs font-semibold text-white">{wp.title}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          {wp.durationWeeks || 4} Weeks • {wp.difficulty || wp.level || 'Intermediate'} • {wp.goal || 'General'}
                        </p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {wp.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Diet & Nutrition Regimen */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Utensils className="w-4 h-4" />
                  <span>Assigned Nutrition Plans ({dietPlans.length})</span>
                </div>
              </div>
              {dietPlans.length === 0 ? (
                <p className="p-3 bg-black/40 rounded border border-white/5 text-neutral-500 text-[11px]">
                  No nutritional regimen assigned yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {dietPlans.map((dp) => (
                    <div key={dp._id} className="p-3 bg-black/50 border border-white/5 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-white">{dp.title}</span>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          <span>Target: {dp.dailyCalorieTarget || dp.targetCalories || 2400} kcal</span> •{' '}
                          <span className="text-[#c5a880]">{dp.dietaryPreference || 'Custom'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Coach Note & Observations */}
            <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2.5">
              <div className="flex items-center gap-2 text-[#c5a880] font-bold text-[11px] tracking-wider uppercase">
                <FileText className="w-4 h-4" />
                <span>Coach Observation Notes</span>
              </div>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={2}
                placeholder="Record observation on squat depth, kinetic chain alignment, fatigue, or mindset..."
                className="w-full bg-black/60 border border-neutral-800 p-2.5 rounded text-neutral-200 focus:outline-none focus:border-[#c5a880] text-xs"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving || !noteContent.trim()}
                  className="trainer-btn-primary text-xs flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Appending...' : 'Save Coach Note'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
