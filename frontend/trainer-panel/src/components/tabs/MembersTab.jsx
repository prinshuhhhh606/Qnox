import React from 'react';
import { Search, MessageSquare } from 'lucide-react';

export default function MembersTab({
  members,
  memberSearch,
  setMemberSearch,
  memberCategoryFilter,
  setMemberCategoryFilter,
  loadMembers,
  viewMemberDrawer,
  setActiveChatMember,
  setActiveTab,
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Assigned Athletes & Members</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage member profiles, medical assessments, workout goals, and progress notes.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search member name or email..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMembers()}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-[#c5a880]"
            />
          </div>
          <select
            value={memberCategoryFilter}
            onChange={(e) => {
              setMemberCategoryFilter(e.target.value);
              setTimeout(loadMembers, 50);
            }}
            className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
          >
            <option value="All">All Categories</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Personal Training">Personal Training</option>
            <option value="General Gym Member">General Member</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="trainer-glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Fitness Goal</th>
                <th className="py-3 px-4">Weight / Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-neutral-500">
                    No athletes found matching the current search.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-neutral-900/40 transition">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-[#c5a880]/30"
                      />
                      <div>
                        <p className="font-semibold text-neutral-200">{m.name}</p>
                        <p className="text-[10px] text-neutral-500">{m.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="trainer-badge trainer-badge-gold">
                        {m.memberCategory || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{m.fitnessGoal || 'General Fitness'}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      {m.currentWeight || 70} kg → <span className="text-[#c5a880]">{m.targetWeight || 68} kg</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="trainer-badge trainer-badge-green">
                        {m.membership?.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewMemberDrawer(m._id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-neutral-800 hover:bg-[#c5a880] hover:text-black transition"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => {
                            setActiveChatMember(m);
                            setActiveTab('messages');
                          }}
                          className="p-1 text-neutral-400 hover:text-[#c5a880]"
                          title="Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
