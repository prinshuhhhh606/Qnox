import React from 'react';
import { Search, X, Download, Trash2 } from 'lucide-react';

export default function MembersTab({
  members = [],
  memberMetrics = {},
  memberSearch = '',
  setMemberSearch,
  memberStatusFilter = 'All',
  setMemberStatusFilter,
  memberExpiringFilter = 'All',
  setMemberExpiringFilter,
  setMemberPlanFilter,
  memberSortBy = 'newest',
  setMemberSortBy,
  memberPage = 1,
  memberTotalPages = 1,
  loadMembers,
  setSelectedDossierMemberId,
  setEditingPlanMember,
  setExtendTargetUser,
  setExtendDays,
  setShowExtendModal,
  handleReactivateMember,
  handleSuspendMember,
  handleSendReminder,
  deleteMemberRecord,
  exportMembersCsv,
}) {
  return (
    <div className="space-y-6">
      {/* Metric Counter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setMemberStatusFilter('All');
            setMemberExpiringFilter('All');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberStatusFilter === 'All' && memberExpiringFilter === 'All'
              ? 'border-[#c5a880] text-white bg-[#c5a880]/10'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          ALL ({memberMetrics.total || members.length})
        </button>
        <button
          onClick={() => {
            setMemberStatusFilter('Active');
            setMemberExpiringFilter('All');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberStatusFilter === 'Active' && memberExpiringFilter === 'All'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          ACTIVE ({memberMetrics.active || 0})
        </button>
        <button
          onClick={() => {
            setMemberExpiringFilter('30');
            setMemberStatusFilter('Active');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberExpiringFilter === '30'
              ? 'border-amber-500 text-amber-300 bg-amber-950/30'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          EXPIRING SOON ({memberMetrics.expiringSoon || 0})
        </button>
        <button
          onClick={() => {
            setMemberStatusFilter('Expired');
            setMemberExpiringFilter('All');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberStatusFilter === 'Expired'
              ? 'border-rose-500 text-rose-300 bg-rose-950/30'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          EXPIRED ({memberMetrics.expired || 0})
        </button>
        <button
          onClick={() => {
            setMemberStatusFilter('Frozen');
            setMemberExpiringFilter('All');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberStatusFilter === 'Frozen'
              ? 'border-sky-500 text-sky-300 bg-sky-950/30'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          FROZEN ({memberMetrics.frozen || 0})
        </button>
        <button
          onClick={() => {
            setMemberStatusFilter('Archived');
            setMemberExpiringFilter('All');
            loadMembers(1);
          }}
          className={`px-3 py-1.5 text-xs font-mono border transition ${
            memberStatusFilter === 'Archived'
              ? 'border-neutral-500 text-neutral-300 bg-neutral-900'
              : 'border-white/10 text-neutral-400 hover:text-white'
          }`}
        >
          ARCHIVED ({memberMetrics.archived || 0})
        </button>
      </div>

      {/* Advanced Search & Filter Controls */}
      <div className="p-4 bg-[#0a0a0a] border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search name, email, phone, or Member ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMembers(1)}
              className="qnox-modal-form-input pl-10 pr-8 w-full text-xs"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            {memberSearch && (
              <button
                onClick={() => {
                  setMemberSearch('');
                  loadMembers(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={memberStatusFilter}
              onChange={(e) => setMemberStatusFilter(e.target.value)}
              className="qnox-modal-form-input w-full text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Expired">Expired</option>
              <option value="Frozen">Frozen / Paused</option>
              <option value="None">No Plan (Prospect)</option>
              <option value="Archived">Archived Records</option>
            </select>
          </div>

          {/* Expiring Soon Filter */}
          <div>
            <select
              value={memberExpiringFilter}
              onChange={(e) => setMemberExpiringFilter(e.target.value)}
              className="qnox-modal-form-input w-full text-xs"
            >
              <option value="All">Expiry Window: Any</option>
              <option value="7">Expiring within 7 Days</option>
              <option value="15">Expiring within 15 Days</option>
              <option value="30">Expiring within 30 Days</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={memberSortBy}
              onChange={(e) => setMemberSortBy(e.target.value)}
              className="qnox-modal-form-input w-full text-xs"
            >
              <option value="newest">Sort: Newest Joined</option>
              <option value="oldest">Sort: Oldest Joined</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="expiry">Sort: Expiry Date</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMembers(1)}
              className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#d8bf9b] transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>APPLY FILTERS</span>
            </button>

            <button
              onClick={() => {
                setMemberSearch('');
                setMemberStatusFilter('All');
                setMemberExpiringFilter('All');
                setMemberPlanFilter('All');
                setMemberSortBy('newest');
                loadMembers(1);
              }}
              className="px-3 py-2 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs uppercase transition"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() =>
              exportMembersCsv({
                search: memberSearch,
                status: memberStatusFilter,
                expiringDays: memberExpiringFilter !== 'All' ? memberExpiringFilter : '',
              })
            }
            className="px-4 py-2 border border-[#c5a880]/40 text-[#c5a880] hover:bg-[#c5a880]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
        <table className="qnox-admin-table">
          <thead>
            <tr>
              <th>MEMBER IDENTITY & ID</th>
              <th>EMAIL & CONTACT</th>
              <th>RESIDENCY TIER</th>
              <th>STATUS</th>
              <th>VALIDITY UNTIL</th>
              <th className="text-right">COMMANDS</th>
            </tr>
          </thead>
          <tbody>
            {members.length > 0 ? (
              members.map((m) => {
                const isExpired = m.membership?.status === 'Expired';
                const isFrozen = m.membership?.status === 'Frozen';
                const isActive = m.membership?.status === 'Active';
                const isArchived = m.isArchived;

                return (
                  <tr key={m._id} className={isArchived ? 'opacity-60 bg-white/[0.01]' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif text-xs text-[#c5a880]">
                              {m.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{m.name}</span>
                            {m.memberId && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-neutral-400">
                                {m.memberId}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Joined {new Date(m.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{m.email}</div>
                      <div className="text-[11px] text-neutral-500">{m.phone || 'No phone on record'}</div>
                    </td>
                    <td className="text-[#c5a880] font-medium">
                      <div>{m.membership?.planName || 'None'}</div>
                      {m.membership?.billingCycle && m.membership.billingCycle !== 'none' && (
                        <div className="text-[10px] text-neutral-500 capitalize">
                          {m.membership.billingCycle}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`qnox-status-badge ${
                          isArchived
                            ? 'neutral'
                            : m.membership?.status === 'Suspended'
                            ? 'active text-rose-400 border-rose-500/40 bg-rose-950/30'
                            : m.membership?.status === 'Expiring Soon'
                            ? 'active text-amber-400 border-amber-500/40 bg-amber-950/30'
                            : isActive
                            ? 'active'
                            : isFrozen
                            ? 'active text-sky-400 border-sky-400/30 bg-sky-950/20'
                            : 'neutral'
                        }`}
                      >
                        {isArchived ? 'ARCHIVED' : m.membership?.status || 'NONE'}
                      </span>
                    </td>
                    <td className="font-mono text-xs">
                      <span className={isExpired ? 'text-rose-400' : isFrozen ? 'text-sky-300' : ''}>
                        {m.membership?.endDate
                          ? new Date(m.membership.endDate).toLocaleDateString('en-GB')
                          : '—'}
                      </span>
                    </td>
                    <td className="text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDossierMemberId(m._id)}
                        className="px-2.5 py-1 text-xs bg-[#c5a880] text-black font-bold uppercase tracking-wider hover:bg-white transition"
                      >
                        DOSSIER
                      </button>
                      <button
                        onClick={() => {
                          setExtendTargetUser(m);
                          setExtendDays(30);
                          setShowExtendModal(true);
                        }}
                        title="Extend Membership Validity"
                        className="px-2 py-1 text-xs border border-sky-500/40 text-sky-400 hover:bg-sky-950/40 font-mono transition"
                      >
                        +EXTEND
                      </button>
                      {m.membership?.status === 'Suspended' ? (
                        <button
                          onClick={() => handleReactivateMember(m._id, m.name)}
                          title="Reactivate Suspended Residency"
                          className="px-2 py-1 text-xs border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 font-mono transition"
                        >
                          RESTORE
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspendMember(m._id, m.name)}
                          title="Suspend Residency Privileges"
                          className="px-2 py-1 text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 font-mono transition"
                        >
                          SUSPEND
                        </button>
                      )}
                      <button
                        onClick={() => handleSendReminder(m._id, m.name)}
                        title="Dispatch Instant Renewal Reminder"
                        className="px-2 py-1 text-xs border border-amber-500/40 text-amber-400 hover:bg-amber-950/40 font-mono transition"
                      >
                        REMIND
                      </button>
                      <button
                        onClick={() => setEditingPlanMember(m)}
                        className="px-2 py-1 text-xs border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white transition"
                      >
                        PLAN
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Permanently remove dossier for ${m.name}?`)) {
                            await deleteMemberRecord(m._id);
                            loadMembers(memberPage);
                          }
                        }}
                        className="px-1.5 py-1 text-xs text-rose-400 hover:text-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-neutral-500 text-xs">
                  No members found matching the selected search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {memberTotalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-neutral-400">
          <div>
            Page {memberPage} of {memberTotalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={memberPage <= 1}
              onClick={() => loadMembers(memberPage - 1)}
              className="px-3 py-1 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white transition"
            >
              Previous
            </button>
            <button
              disabled={memberPage >= memberTotalPages}
              onClick={() => loadMembers(memberPage + 1)}
              className="px-3 py-1 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
