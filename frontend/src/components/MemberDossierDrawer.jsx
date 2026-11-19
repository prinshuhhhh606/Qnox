import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  Calendar,
  CreditCard,
  Activity,
  Clock,
  FileText,
  ShieldAlert,
  Pause,
  Play,
  RefreshCw,
  Plus,
  Check,
  CheckCircle2,
  Archive,
  RotateCcw,
  Camera,
  Printer,
  AlertCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Save,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import AssignResidencyModal from './AssignResidencyModal';
import {
  fetchMemberDossier,
  updateMemberProfile,
  renewMemberMembership,
  freezeMemberMembership,
  unfreezeMemberMembership,
  fetchMemberPayments,
  recordOfflinePayment,
  fetchMemberAttendance,
  recordMemberAttendance,
  fetchMemberFitness,
  recordMemberFitness,
  addAdminNote,
  updateAdminNote,
  archiveMember,
  restoreMember,
  fetchMemberAuditLogs,
} from '../services/api';
import './MemberDossierDrawer.css';

const TABS = [
  { id: 'overview', label: '360° Profile', icon: User },
  { id: 'membership', label: 'Residency & History', icon: Calendar },
  { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
  { id: 'attendance', label: 'Attendance & Visits', icon: Clock },
  { id: 'fitness', label: 'Fitness Biometrics', icon: Activity },
  { id: 'notes', label: 'Notes & Follow-ups', icon: FileText },
  { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
];

export default function MemberDossierDrawer({ memberId, initialMember, onClose, onUpdated, trainers = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Main dossier state - initialized with initialMember for instantaneous zero-delay opening
  const [dossierData, setDossierData] = useState(() => {
    if (initialMember) {
      return {
        member: initialMember,
        stats: {
          paymentsCount: 0,
          attendanceTotal: 0,
          attendanceThisMonth: 0,
          fitnessCount: 0,
        },
      };
    }
    return null;
  });
  const [payments, setPayments] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ totalVisits: 0, monthlyVisits: 0, attendances: [] });
  const [fitnessEntries, setFitnessEntries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Submodal toggles
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewForm, setRenewForm] = useState({ durationMonths: 1, planName: '', billingCycle: 'monthly', notes: '' });
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeForm, setFreezeForm] = useState({ reason: 'Personal Leave', freezeDays: 30 });
  const [isOfflinePayModalOpen, setIsOfflinePayModalOpen] = useState(false);
  const [offlinePayForm, setOfflinePayForm] = useState({
    amount: 28000,
    paymentMethod: 'Cash',
    referenceNumber: '',
    notes: '',
    planName: 'THE METROPOLITAN',
    duration: 'monthly',
    durationMonths: 1,
    activateMembership: true,
  });
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    clubName: 'Mayfair Sanctuary',
    activityType: 'Workout',
    durationMinutes: 60,
  });
  const [isFitnessModalOpen, setIsFitnessModalOpen] = useState(false);
  const [fitnessForm, setFitnessForm] = useState({
    weightKg: '',
    heightCm: '',
    bodyFatPercentage: '',
    chestCm: '',
    waistCm: '',
    hipsCm: '',
    armsCm: '',
    notes: '',
    photos: [],
  });
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isFollowUpNote, setIsFollowUpNote] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  // Load Dossier Overview
  const loadDossier = useCallback(async () => {
    if (!memberId) return;
    try {
      if (!initialMember) setLoading(true);
      setError('');
      const data = await fetchMemberDossier(memberId, initialMember);
      if (data && data.member) {
        setDossierData(data);
        const m = data.member;
        setEditForm({
          name: m.name || '',
          phone: m.phone || '',
          dateOfBirth: m.dateOfBirth ? m.dateOfBirth.split('T')[0] : '',
          gender: m.gender || 'Not Specified',
          address: m.address || { street: '', city: '', postalCode: '' },
          emergencyContact: m.emergencyContact || { name: '', phone: '', relationship: '' },
          assignedTrainer: m.assignedTrainer?._id || m.assignedTrainer || '',
          avatar: m.avatar || '',
        });
        setRenewForm({
          durationMonths: 1,
          planName: m.membership?.planName || 'THE METROPOLITAN',
          billingCycle: m.membership?.billingCycle || 'monthly',
          notes: '',
        });
      }
    } catch (err) {
      if (!initialMember) {
        setError(err.message || 'Failed to load member dossier');
      }
    } finally {
      setLoading(false);
    }
  }, [memberId, initialMember]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  // Tab data fetching on demand
  useEffect(() => {
    if (!memberId) return;
    if (activeTab === 'payments') {
      fetchMemberPayments(memberId).then(setPayments).catch(console.error);
    } else if (activeTab === 'attendance') {
      fetchMemberAttendance(memberId).then(setAttendanceData).catch(console.error);
    } else if (activeTab === 'fitness') {
      fetchMemberFitness(memberId).then(setFitnessEntries).catch(console.error);
    } else if (activeTab === 'audit') {
      fetchMemberAuditLogs(memberId).then(setAuditLogs).catch(console.error);
    }
  }, [activeTab, memberId]);

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Actions
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateMemberProfile(memberId, editForm);
      notify('Member profile updated successfully.');
      setIsEditingProfile(false);
      loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    try {
      await renewMemberMembership(memberId, renewForm);
      notify('Membership renewed successfully.');
      setIsRenewModalOpen(false);
      loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFreeze = async (e) => {
    e.preventDefault();
    try {
      await freezeMemberMembership(memberId, freezeForm);
      notify('Membership paused.');
      setIsFreezeModalOpen(false);
      loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnfreeze = async () => {
    if (!window.confirm('Resume membership now? Retained days will be restored to expiry.')) return;
    try {
      await unfreezeMemberMembership(memberId);
      notify('Membership resumed and validity extended.');
      loadDossier();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleArchiveToggle = async () => {
    const isArchived = dossierData?.member?.isArchived;
    if (isArchived) {
      if (window.confirm('Restore this member to active ledger?')) {
        await restoreMember(memberId);
        notify('Member restored to active ledger.');
        loadDossier();
        if (onUpdated) onUpdated();
      }
    } else {
      const reason = prompt('Reason for archiving member dossier:', 'Member requested deactivation');
      if (reason) {
        await archiveMember(memberId, reason);
        notify('Member archived safely.');
        loadDossier();
        if (onUpdated) onUpdated();
      }
    }
  };

  const handleRecordOfflinePay = async (e) => {
    e.preventDefault();
    try {
      await recordOfflinePayment(memberId, offlinePayForm);
      notify('Offline payment recorded and receipt created.');
      setIsOfflinePayModalOpen(false);
      loadDossier();
      fetchMemberPayments(memberId).then(setPayments);
      if (onUpdated) onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await recordMemberAttendance(memberId, checkInForm);
      notify('Check-in registered.');
      setIsCheckInModalOpen(false);
      fetchMemberAttendance(memberId).then(setAttendanceData);
      loadDossier();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveFitness = async (e) => {
    e.preventDefault();
    try {
      await recordMemberFitness(memberId, fitnessForm);
      notify('Fitness biometrics recorded.');
      setIsFitnessModalOpen(false);
      fetchMemberFitness(memberId).then(setFitnessEntries);
      setFitnessForm({
        weightKg: '',
        heightCm: '',
        bodyFatPercentage: '',
        chestCm: '',
        waistCm: '',
        hipsCm: '',
        armsCm: '',
        notes: '',
        photos: [],
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      await addAdminNote(memberId, {
        content: newNoteContent,
        isFollowUp: isFollowUpNote,
        followUpDate: isFollowUpNote && followUpDate ? followUpDate : null,
      });
      notify('Note saved.');
      setNewNoteContent('');
      setIsFollowUpNote(false);
      setFollowUpDate('');
      loadDossier();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleNoteStatus = async (noteId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
      await updateAdminNote(memberId, noteId, nextStatus);
      loadDossier();
    } catch (err) {
      alert(err.message);
    }
  };

  const member = dossierData?.member;
  const stats = dossierData?.stats;

  // Calculate days remaining
  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="qnox-dossier-overlay" onClick={onClose}>
      <div className="qnox-dossier-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qnox-dossier-header">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full bg-neutral-900 border border-[#c5a880]/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {member?.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-lg text-[#c5a880]">
                  {member?.name?.charAt(0) || 'M'}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif text-white">{member?.name || 'Loading Dossier...'}</h2>
                {member?.memberId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-400">
                    {member.memberId}
                  </span>
                )}
                {member?.isArchived && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 qnox-badge-archived">
                    ARCHIVED
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>{member?.email}</span>
                {member?.phone && <span>• {member.phone}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleArchiveToggle}
              title={member?.isArchived ? 'Restore Member' : 'Archive Member'}
              className="px-3 py-1.5 border border-white/20 hover:border-white/40 text-neutral-300 text-xs flex items-center gap-1.5 transition"
            >
              {member?.isArchived ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RESTORE</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-neutral-400" />
                  <span>ARCHIVE</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 border border-white/10 hover:border-[#c5a880] flex items-center justify-center text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="px-6 py-2 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="px-6 py-2 bg-rose-950/60 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="qnox-dossier-tabs-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`qnox-dossier-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="qnox-dossier-body">
          {loading ? (
            <div className="py-20 text-center text-neutral-500 text-xs uppercase tracking-widest">
              Decrypting Confidential Dossier...
            </div>
          ) : !member ? (
            <div className="py-20 text-center text-rose-400 text-xs">Dossier record not found.</div>
          ) : (
            <>
              {/* ================= TAB 1: 360° PROFILE OVERVIEW ================= */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="qnox-metric-card">
                      <div className="qnox-metric-label">Residency Tier</div>
                      <div className="qnox-metric-val text-[#c5a880] text-lg sm:text-xl">
                        {member.membership?.planName || 'None'}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 uppercase">
                        {member.membership?.status || 'No Plan'}
                      </div>
                    </div>

                    <div className="qnox-metric-card">
                      <div className="qnox-metric-label">Days Remaining</div>
                      <div className="qnox-metric-val">
                        {member.membership?.status === 'Active'
                          ? calculateDaysRemaining(member.membership?.endDate)
                          : member.membership?.status === 'Frozen'
                          ? `${member.membership?.freezeDetails?.remainingDaysAtFreeze || 0} (Frozen)`
                          : 0}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        {member.membership?.endDate
                          ? new Date(member.membership.endDate).toLocaleDateString('en-GB')
                          : 'No Expiry'}
                      </div>
                    </div>

                    <div className="qnox-metric-card">
                      <div className="qnox-metric-label">Sanctuary Visits</div>
                      <div className="qnox-metric-val">{stats?.attendanceTotal || 0}</div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        {stats?.attendanceThisMonth || 0} this month
                      </div>
                    </div>

                    <div className="qnox-metric-card">
                      <div className="qnox-metric-label">Ledger Payments</div>
                      <div className="qnox-metric-val">{stats?.paymentsCount || 0}</div>
                      <div className="text-[11px] text-neutral-500 mt-1">Confirmed transactions</div>
                    </div>
                  </div>

                  {/* Personal Profile Details Card */}
                  <div className="p-6 bg-[#0a0a0a] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-serif text-lg text-white">Member Credentials & Contact</h3>
                      <button
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="px-3 py-1 border border-white/20 text-neutral-300 text-xs flex items-center gap-1.5 hover:border-[#c5a880] hover:text-[#c5a880] transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                      </button>
                    </div>

                    {isEditingProfile ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              required
                              className="qnox-modal-form-input"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Direct Phone
                            </label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="qnox-modal-form-input"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              value={editForm.dateOfBirth}
                              onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                              className="qnox-modal-form-input"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Gender
                            </label>
                            <select
                              value={editForm.gender}
                              onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                              className="qnox-modal-form-input"
                            >
                              <option value="Not Specified">Not Specified</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Non-Binary">Non-Binary</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Assigned Master Trainer
                            </label>
                            <select
                              value={editForm.assignedTrainer}
                              onChange={(e) => setEditForm({ ...editForm, assignedTrainer: e.target.value })}
                              className="qnox-modal-form-input"
                            >
                              <option value="">No Trainer Assigned</option>
                              {trainers.map((t) => (
                                <option key={t._id} value={t._id}>
                                  {t.name} — {t.specialty}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Emergency Contact (Name / Phone / Relation)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Contact Name"
                                value={editForm.emergencyContact?.name || ''}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    emergencyContact: { ...editForm.emergencyContact, name: e.target.value },
                                  })
                                }
                                className="qnox-modal-form-input text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Phone"
                                value={editForm.emergencyContact?.phone || ''}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    emergencyContact: { ...editForm.emergencyContact, phone: e.target.value },
                                  })
                                }
                                className="qnox-modal-form-input text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Relationship (e.g. Spouse)"
                                value={editForm.emergencyContact?.relationship || ''}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    emergencyContact: { ...editForm.emergencyContact, relationship: e.target.value },
                                  })
                                }
                                className="qnox-modal-form-input text-xs"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                              Profile Photo (Upload from Computer or URL)
                            </label>
                            <ImageUploadField
                              value={editForm.avatar}
                              onChange={(url) => setEditForm({ ...editForm, avatar: url })}
                              label="Upload Member Portrait"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2 border border-white/20 text-neutral-400 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Profile</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Email Address</div>
                          <div className="text-white mt-0.5">{member.email}</div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Phone Number</div>
                          <div className="text-white mt-0.5">{member.phone || 'Not Registered'}</div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Date of Birth</div>
                          <div className="text-white mt-0.5">
                            {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-GB') : 'Not Provided'}
                          </div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Gender</div>
                          <div className="text-white mt-0.5">{member.gender || 'Not Specified'}</div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Assigned Master Coach</div>
                          <div className="text-[#c5a880] mt-0.5 font-medium">
                            {member.assignedTrainer ? `${member.assignedTrainer.name} (${member.assignedTrainer.specialty})` : 'None Assigned'}
                          </div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Emergency Contact</div>
                          <div className="text-white mt-0.5">
                            {member.emergencyContact?.name ? (
                              <span>
                                {member.emergencyContact.name} ({member.emergencyContact.relationship || 'Emergency'}):{' '}
                                {member.emergencyContact.phone}
                              </span>
                            ) : (
                              'None'
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Joining Date</div>
                          <div className="text-white mt-0.5">
                            {new Date(member.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </div>

                        <div>
                          <div className="text-neutral-500 uppercase tracking-wider text-[10px]">Residential Address</div>
                          <div className="text-white mt-0.5">
                            {member.address?.street
                              ? `${member.address.street}, ${member.address.city} ${member.address.postalCode}`
                              : 'Not on file'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Commands Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsRenewModalOpen(true)}
                      className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew Residency</span>
                    </button>

                    {member.membership?.status === 'Frozen' ? (
                      <button
                        onClick={handleUnfreeze}
                        className="px-4 py-2 bg-sky-900 border border-sky-400 text-sky-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume Residency</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsFreezeModalOpen(true)}
                        disabled={member.membership?.status !== 'Active'}
                        className="px-4 py-2 border border-sky-500/40 text-sky-400 hover:bg-sky-950/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Freeze / Pause</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsOfflinePayModalOpen(true)}
                      className="px-4 py-2 border border-white/20 hover:border-[#c5a880] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>Record Offline Payment</span>
                    </button>

                    <button
                      onClick={() => setIsCheckInModalOpen(true)}
                      className="px-4 py-2 border border-white/20 hover:border-white/50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Register Check-in</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: RESIDENCY & HISTORY ================= */}
              {activeTab === 'membership' && (
                <div className="space-y-6">
                  {/* Current Active Plan Overview */}
                  <div className="p-6 bg-[#0a0a0a] border border-[#c5a880]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#c5a880] font-bold">
                          Active Tier Residency
                        </div>
                        <h3 className="font-serif text-2xl text-white mt-1">
                          {member.membership?.planName || 'NO ACTIVE PLAN'}
                        </h3>
                      </div>
                      <div>
                        <span
                          className={`text-xs uppercase font-bold px-3 py-1 ${
                            member.membership?.status === 'Active'
                              ? 'qnox-badge-active'
                              : member.membership?.status === 'Frozen'
                              ? 'qnox-badge-frozen'
                              : 'qnox-badge-expired'
                          }`}
                        >
                          {member.membership?.status || 'NONE'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-neutral-500 uppercase text-[10px]">Billing Cycle</div>
                        <div className="text-white font-medium capitalize mt-0.5">
                          {member.membership?.billingCycle || 'None'}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 uppercase text-[10px]">Start Date</div>
                        <div className="text-white font-medium mt-0.5">
                          {member.membership?.startDate
                            ? new Date(member.membership.startDate).toLocaleDateString('en-GB')
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 uppercase text-[10px]">Expiry Date</div>
                        <div className="text-white font-medium mt-0.5">
                          {member.membership?.endDate
                            ? new Date(member.membership.endDate).toLocaleDateString('en-GB')
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 uppercase text-[10px]">Days Remaining</div>
                        <div className="text-[#c5a880] font-medium mt-0.5">
                          {calculateDaysRemaining(member.membership?.endDate)} Days
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chronological Membership History */}
                  <div className="space-y-3">
                    <h3 className="font-serif text-lg text-white">Chronological Residency History</h3>
                    <div className="border border-white/10 bg-[#090909] overflow-x-auto">
                      <table className="qnox-dossier-table">
                        <thead>
                          <tr>
                            <th>Action Type</th>
                            <th>Residency Tier</th>
                            <th>Duration / Period</th>
                            <th>Amount</th>
                            <th>Executed By</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {member.membershipHistory && member.membershipHistory.length > 0 ? (
                            member.membershipHistory
                              .slice()
                              .reverse()
                              .map((h, i) => (
                                <tr key={i}>
                                  <td className="font-semibold text-white">
                                    <span className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/10">
                                      {h.actionType || 'Modification'}
                                    </span>
                                  </td>
                                  <td className="text-[#c5a880]">{h.planName}</td>
                                  <td>
                                    <div className="text-xs">
                                      {h.startDate ? new Date(h.startDate).toLocaleDateString('en-GB') : '—'} →{' '}
                                      {h.endDate ? new Date(h.endDate).toLocaleDateString('en-GB') : '—'}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 capitalize">{h.billingCycle}</div>
                                  </td>
                                  <td>{h.amount ? `₹${h.amount.toLocaleString('en-IN')}` : '—'}</td>
                                  <td className="text-xs text-neutral-400">{h.performedByName || 'Executive Admin'}</td>
                                  <td className="text-xs text-neutral-400">{h.notes || '—'}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center py-6 text-neutral-500">
                                No previous residency records. Current plan is initial assignment.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Freeze History */}
                  {member.freezeHistory && member.freezeHistory.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <h3 className="font-serif text-lg text-white">Pause / Freeze Ledger</h3>
                      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
                        <table className="qnox-dossier-table">
                          <thead>
                            <tr>
                              <th>Pause Start</th>
                              <th>Resumed At</th>
                              <th>Reason</th>
                              <th>Days Paused</th>
                              <th>Authorized By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {member.freezeHistory.map((f, i) => (
                              <tr key={i}>
                                <td>{new Date(f.startDate).toLocaleDateString('en-GB')}</td>
                                <td>{f.resumedAt ? new Date(f.resumedAt).toLocaleDateString('en-GB') : 'Currently Paused'}</td>
                                <td className="text-neutral-300">{f.reason}</td>
                                <td>{f.daysFrozen || 'Active Freeze'}</td>
                                <td className="text-neutral-400">{f.performedByName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 3: PAYMENTS & BILLING LEDGER ================= */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg text-white">Payment Ledger & Receipts</h3>
                      <p className="text-xs text-neutral-400">
                        Total {payments.length} transaction records on file.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsOfflinePayModalOpen(true)}
                      className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Offline Payment</span>
                    </button>
                  </div>

                  <div className="border border-white/10 bg-[#090909] overflow-x-auto">
                    <table className="qnox-dossier-table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Date</th>
                          <th>Residency Plan</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length > 0 ? (
                          payments.map((p) => (
                            <tr key={p._id}>
                              <td className="font-mono text-xs text-neutral-300">
                                {p.invoiceNumber || p._id.slice(-6).toUpperCase()}
                              </td>
                              <td>{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
                              <td className="text-[#c5a880]">{p.planName}</td>
                              <td>
                                <span className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-300">
                                  {p.paymentMethod || 'Razorpay'}
                                </span>
                              </td>
                              <td className="font-mono font-medium text-white">
                                ₹{p.amount?.toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span className="text-[10px] uppercase font-bold text-emerald-400">
                                  {p.status || 'Paid'}
                                </span>
                              </td>
                              <td className="text-right">
                                <button
                                  onClick={() => window.print()}
                                  className="px-2.5 py-1 text-xs border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white flex items-center gap-1 ml-auto"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Print</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-8 text-neutral-500">
                              No payment transactions recorded for this member.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: SANCTUARY ATTENDANCE ================= */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg text-white">Sanctuary Attendance & Check-ins</h3>
                      <p className="text-xs text-neutral-400">
                        {attendanceData.totalVisits} Lifetime visits • {attendanceData.monthlyVisits} this month
                      </p>
                    </div>

                    <button
                      onClick={() => setIsCheckInModalOpen(true)}
                      className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Check-in</span>
                    </button>
                  </div>

                  <div className="border border-white/10 bg-[#090909] overflow-x-auto">
                    <table className="qnox-dossier-table">
                      <thead>
                        <tr>
                          <th>Check-in Date & Time</th>
                          <th>Sanctuary Location</th>
                          <th>Activity Type</th>
                          <th>Duration</th>
                          <th>Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.attendances && attendanceData.attendances.length > 0 ? (
                          attendanceData.attendances.map((a) => (
                            <tr key={a._id}>
                              <td className="font-mono text-xs text-white">
                                {new Date(a.checkIn).toLocaleString('en-GB')}
                              </td>
                              <td className="text-[#c5a880]">{a.clubName || 'Mayfair Sanctuary'}</td>
                              <td>
                                <span className="text-[11px] px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-300">
                                  {a.activityType || 'Workout'}
                                </span>
                              </td>
                              <td>{a.durationMinutes || 60} mins</td>
                              <td className="text-xs text-neutral-400">{a.recordedByName || 'Concierge'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-8 text-neutral-500">
                              No check-in visits registered yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= TAB 5: FITNESS BIOMETRICS ================= */}
              {activeTab === 'fitness' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg text-white">Body Composition & Biometrics</h3>
                      <p className="text-xs text-neutral-400">
                        Confidential physical transformation & measurement logs.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsFitnessModalOpen(true)}
                      className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Biometrics</span>
                    </button>
                  </div>

                  {fitnessEntries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fitnessEntries.map((fit) => (
                        <div key={fit._id} className="p-5 bg-[#0a0a0a] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <span className="font-mono text-xs text-[#c5a880]">
                              {new Date(fit.date).toLocaleDateString('en-GB')}
                            </span>
                            <span className="text-[10px] text-neutral-500 uppercase">
                              By {fit.recordedByName || 'Master Coach'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="p-2 bg-black/40 border border-white/5">
                              <div className="text-[10px] text-neutral-500 uppercase">Weight</div>
                              <div className="text-white font-serif text-base">{fit.weightKg ? `${fit.weightKg} kg` : '—'}</div>
                            </div>
                            <div className="p-2 bg-black/40 border border-white/5">
                              <div className="text-[10px] text-neutral-500 uppercase">Body Fat</div>
                              <div className="text-[#c5a880] font-serif text-base">{fit.bodyFatPercentage ? `${fit.bodyFatPercentage}%` : '—'}</div>
                            </div>
                            <div className="p-2 bg-black/40 border border-white/5">
                              <div className="text-[10px] text-neutral-500 uppercase">Height</div>
                              <div className="text-white font-serif text-base">{fit.heightCm ? `${fit.heightCm} cm` : '—'}</div>
                            </div>
                          </div>

                          {(fit.chestCm || fit.waistCm || fit.armsCm) && (
                            <div className="text-[11px] text-neutral-400 flex flex-wrap gap-3 pt-1">
                              {fit.chestCm && <span>Chest: {fit.chestCm}cm</span>}
                              {fit.waistCm && <span>Waist: {fit.waistCm}cm</span>}
                              {fit.armsCm && <span>Arms: {fit.armsCm}cm</span>}
                            </div>
                          )}

                          {fit.notes && (
                            <p className="text-xs text-neutral-300 italic pt-1 border-t border-white/5">
                              "{fit.notes}"
                            </p>
                          )}

                          {fit.photos && fit.photos.length > 0 && (
                            <div className="flex gap-2 pt-2">
                              {fit.photos.map((p, idx) => (
                                <img
                                  key={idx}
                                  src={p}
                                  alt="progress"
                                  className="w-16 h-16 object-cover border border-white/20"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 border border-white/10 bg-[#090909] text-center text-neutral-500 text-xs">
                      No biometric entries recorded. Click 'Log Biometrics' to begin tracking.
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 6: NOTES & FOLLOW-UPS ================= */}
              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="p-5 bg-[#0a0a0a] border border-white/10 space-y-3">
                    <h3 className="font-serif text-base text-white">Add Dossier Note / Concierge Reminder</h3>
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Enter confidential notes, renewal preferences, or custom requirements..."
                      className="qnox-modal-form-input w-full"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isFollowUpNote}
                            onChange={(e) => setIsFollowUpNote(e.target.checked)}
                            className="rounded bg-black border-white/20 text-[#c5a880]"
                          />
                          <span>Set Follow-up Reminder</span>
                        </label>

                        {isFollowUpNote && (
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="qnox-modal-form-input py-1 text-xs"
                          />
                        )}
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-end"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes Stream */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-neutral-500">Historical Dossier Notes</h4>
                    {member.adminNotes && member.adminNotes.length > 0 ? (
                      member.adminNotes.map((note) => (
                        <div
                          key={note._id}
                          className="p-4 bg-[#090909] border border-white/10 space-y-2 transition hover:border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#c5a880] font-medium">{note.authorName}</span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(note.createdAt).toLocaleString('en-GB')}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>

                          {note.isFollowUp && (
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="text-[11px] text-neutral-400">
                                Follow-up: {note.followUpDate ? new Date(note.followUpDate).toLocaleDateString('en-GB') : 'Immediate'}
                              </span>

                              <button
                                onClick={() => handleToggleNoteStatus(note._id, note.followUpStatus)}
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 border flex items-center gap-1 ${
                                  note.followUpStatus === 'Completed'
                                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                                    : 'border-amber-500/40 text-amber-400 bg-amber-950/30'
                                }`}
                              >
                                {note.followUpStatus === 'Completed' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Completed</span>
                                  </>
                                ) : (
                                  <span>Pending</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-neutral-500 text-xs">No notes recorded yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 7: AUDIT LOG ================= */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <h3 className="font-serif text-lg text-white">Administrative Audit Trail</h3>
                  <p className="text-xs text-neutral-400">
                    Tamper-evident record of all administrative modifications performed on this member dossier.
                  </p>

                  <div className="border border-white/10 bg-[#090909] overflow-x-auto">
                    <table className="qnox-dossier-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Administrator</th>
                          <th>Modification Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <tr key={log._id}>
                              <td className="font-mono text-xs text-neutral-400">
                                {new Date(log.createdAt).toLocaleString('en-GB')}
                              </td>
                              <td>
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/5 border border-white/10 text-[#c5a880]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="text-white text-xs">{log.adminName}</td>
                              <td className="text-xs text-neutral-300">{log.details || '—'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-neutral-500">
                              No administrative audit events found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= SUB-MODAL: ULTRA-LUXURY RESIDENCY ASSIGNMENT & RENEWAL ================= */}
      {isRenewModalOpen && (
        <AssignResidencyModal
          isOpen={isRenewModalOpen}
          member={member}
          onClose={() => setIsRenewModalOpen(false)}
          onSuccess={() => {
            loadDossier();
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {/* ================= SUB-MODAL: FREEZE MEMBERSHIP ================= */}
      {isFreezeModalOpen && (
        <div className="qnox-submodal-overlay" onClick={() => setIsFreezeModalOpen(false)}>
          <div className="qnox-submodal-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg text-white">Pause / Freeze Membership</h3>
              <button onClick={() => setIsFreezeModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFreeze} className="space-y-4 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                Freezing will halt the membership and lock the remaining active days in the dossier. When resumed, the expiry date will be automatically extended.
              </p>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">Pause Reason</label>
                <input
                  type="text"
                  value={freezeForm.reason}
                  onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })}
                  required
                  placeholder="e.g. Overseas Travel, Medical, Relocation"
                  className="qnox-modal-form-input"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">Expected Days</label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={freezeForm.freezeDays}
                  onChange={(e) => setFreezeForm({ ...freezeForm, freezeDays: Number(e.target.value) })}
                  className="qnox-modal-form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFreezeModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 text-black font-bold uppercase tracking-wider"
                >
                  Confirm Freeze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL: RECORD OFFLINE PAYMENT ================= */}
      {isOfflinePayModalOpen && (
        <div className="qnox-submodal-overlay" onClick={() => setIsOfflinePayModalOpen(false)}>
          <div className="qnox-submodal-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg text-white">Record Offline Payment Entry</h3>
              <button onClick={() => setIsOfflinePayModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordOfflinePay} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={offlinePayForm.amount}
                    onChange={(e) => setOfflinePayForm({ ...offlinePayForm, amount: e.target.value })}
                    required
                    className="qnox-modal-form-input font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={offlinePayForm.paymentMethod}
                    onChange={(e) => setOfflinePayForm({ ...offlinePayForm, paymentMethod: e.target.value })}
                    className="qnox-modal-form-input"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Transfer</option>
                    <option value="Card">Card (POS Terminal)</option>
                    <option value="Bank Transfer">Bank Wire / IMPS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  Reference / Transaction / UTR No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-2026-981290"
                  value={offlinePayForm.referenceNumber}
                  onChange={(e) => setOfflinePayForm({ ...offlinePayForm, referenceNumber: e.target.value })}
                  className="qnox-modal-form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Residency Plan</label>
                  <select
                    value={offlinePayForm.planName}
                    onChange={(e) => setOfflinePayForm({ ...offlinePayForm, planName: e.target.value })}
                    className="qnox-modal-form-input"
                  >
                    <option value="THE METROPOLITAN">THE METROPOLITAN</option>
                    <option value="GROUP RESIDENCY">GROUP RESIDENCY</option>
                    <option value="ICON ALL-ACCESS">ICON ALL-ACCESS</option>
                    <option value="THE OBSIDIAN BLACK">THE OBSIDIAN BLACK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Duration</label>
                  <select
                    value={offlinePayForm.durationMonths}
                    onChange={(e) => setOfflinePayForm({ ...offlinePayForm, durationMonths: Number(e.target.value) })}
                    className="qnox-modal-form-input"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-black/40 border border-white/10 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activateMembership"
                  checked={offlinePayForm.activateMembership}
                  onChange={(e) =>
                    setOfflinePayForm({ ...offlinePayForm, activateMembership: e.target.checked })
                  }
                  className="rounded bg-black border-white/20 text-[#c5a880]"
                />
                <label htmlFor="activateMembership" className="text-neutral-300 cursor-pointer">
                  Activate / Extend membership validity immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOfflinePayModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5a880] text-black font-bold uppercase tracking-wider"
                >
                  Record & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL: CHECK-IN ================= */}
      {isCheckInModalOpen && (
        <div className="qnox-submodal-overlay" onClick={() => setIsCheckInModalOpen(false)}>
          <div className="qnox-submodal-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg text-white">Register Sanctuary Check-in</h3>
              <button onClick={() => setIsCheckInModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">Sanctuary Location</label>
                <select
                  value={checkInForm.clubName}
                  onChange={(e) => setCheckInForm({ ...checkInForm, clubName: e.target.value })}
                  className="qnox-modal-form-input"
                >
                  <option value="Mayfair Sanctuary">Mayfair Sanctuary</option>
                  <option value="Chelsea Club">Chelsea Club</option>
                  <option value="City of London">City of London</option>
                  <option value="St John's Wood">St John's Wood</option>
                  <option value="Marylebone House">Marylebone House</option>
                  <option value="Soho Residence">Soho Residence</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">Activity Type</label>
                <select
                  value={checkInForm.activityType}
                  onChange={(e) => setCheckInForm({ ...checkInForm, activityType: e.target.value })}
                  className="qnox-modal-form-input"
                >
                  <option value="Workout">Workout / Open Gym</option>
                  <option value="Class">Group Masterclass</option>
                  <option value="Spa">Hydrotherapy & Spa</option>
                  <option value="Private Training">1-on-1 Master Coaching</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5a880] text-black font-bold uppercase tracking-wider"
                >
                  Confirm Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SUB-MODAL: LOG FITNESS BIOMETRICS ================= */}
      {isFitnessModalOpen && (
        <div className="qnox-submodal-overlay" onClick={() => setIsFitnessModalOpen(false)}>
          <div className="qnox-submodal-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg text-white">Log Fitness Biometrics</h3>
              <button onClick={() => setIsFitnessModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFitness} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={fitnessForm.weightKg}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, weightKg: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="180"
                    value={fitnessForm.heightCm}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, heightCm: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="14.2"
                    value={fitnessForm.bodyFatPercentage}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, bodyFatPercentage: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={fitnessForm.chestCm}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, chestCm: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={fitnessForm.waistCm}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, waistCm: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase tracking-wider mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    value={fitnessForm.armsCm}
                    onChange={(e) => setFitnessForm({ ...fitnessForm, armsCm: e.target.value })}
                    className="qnox-modal-form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">Progress Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Lean muscle gain phase, improved vo2 max"
                  value={fitnessForm.notes}
                  onChange={(e) => setFitnessForm({ ...fitnessForm, notes: e.target.value })}
                  className="qnox-modal-form-input"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase tracking-wider mb-1">
                  Progress Photo (Upload from Computer)
                </label>
                <ImageUploadField
                  value={fitnessForm.photos[0] || ''}
                  onChange={(url) => setFitnessForm({ ...fitnessForm, photos: url ? [url] : [] })}
                  label="Upload Biometrics Photo"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFitnessModalOpen(false)}
                  className="px-4 py-2 border border-white/20 text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5a880] text-black font-bold uppercase tracking-wider"
                >
                  Save Biometrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
