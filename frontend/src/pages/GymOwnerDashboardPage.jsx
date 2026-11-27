import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Dumbbell, Shield, Award, CreditCard,
  Plus, Trash2, Edit3, CheckCircle, AlertTriangle, ArrowUpRight,
  TrendingUp, Calendar, FileText, RefreshCw, MapPin, ExternalLink,
  ChevronRight, Sparkles, Check, Zap, DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import {
  fetchMyOrganization,
  updateMyOrganization,
  fetchMyTenantBranches,
  createTenantBranch,
  deleteTenantBranch,
  fetchMyTenantTrainers,
  createTenantTrainer,
  deleteTenantTrainer,
  fetchMyTenantMembers,
  createTenantMember,
  fetchMyTenantInvoices,
  upgradeSaaSSubscription,
  verifySaaSPayment,
  fetchSaaSPlans,
} from '../services/api';
import InvoiceModal from '../components/InvoiceModal';

export default function GymOwnerDashboardPage() {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  // Active Tab: 'overview' | 'branches' | 'trainers' | 'members' | 'billing' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({ name: '', location: '', address: '', capacity: 150 });
  const [trainerForm, setTrainerForm] = useState({ name: '', title: 'Performance Coach', role: 'Coach', email: '', phone: '', branchId: '' });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', phone: '', branchId: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', phone: '', address: '', city: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllTenantData = async () => {
    setLoading(true);
    try {
      const [orgRes, branchesRes, trainersRes, membersRes, invoicesRes, plansRes] = await Promise.allSettled([
        fetchMyOrganization(),
        fetchMyTenantBranches(),
        fetchMyTenantTrainers(),
        fetchMyTenantMembers(),
        fetchMyTenantInvoices(),
        fetchSaaSPlans(),
      ]);

      if (orgRes.status === 'fulfilled' && orgRes.value) {
        setOrgData(orgRes.value);
        const o = orgRes.value.organization || {};
        setSettingsForm({
          name: o.name || '',
          phone: o.phone || '',
          address: o.address || '',
          city: o.city || '',
        });
      }
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value || []);
      if (trainersRes.status === 'fulfilled') setTrainers(trainersRes.value || []);
      if (membersRes.status === 'fulfilled') setMembers(membersRes.value || []);
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value || []);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value || []);
    } catch (e) {
      console.warn('Tenant data load error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTenantData();
  }, []);

  const org = orgData?.organization || {};
  const subscription = orgData?.subscription || {};
  const quotas = orgData?.quotas || {
    branches: { current: branches.length, max: org.branchesLimit || 1 },
    trainers: { current: trainers.length, max: org.trainersLimit || 5 },
    members: { current: members.length, max: org.membersLimit || 100 },
  };

  // Branch Handlers
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createTenantBranch(branchForm);
      showToast({ type: 'success', message: 'New branch commissioned successfully!' });
      setShowAddBranchModal(false);
      setBranchForm({ name: '', location: '', address: '', capacity: 150 });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this branch?')) return;
    try {
      await deleteTenantBranch(id);
      showToast({ type: 'info', message: 'Branch decommissioned.' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Trainer Handlers
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createTenantTrainer(trainerForm);
      showToast({ type: 'success', message: 'Coach added to sanctuary roster!' });
      setShowAddTrainerModal(false);
      setTrainerForm({ name: '', title: 'Performance Coach', role: 'Coach', email: '', phone: '', branchId: '' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrainer = async (id) => {
    if (!window.confirm('Remove this coach from your roster?')) return;
    try {
      await deleteTenantTrainer(id);
      showToast({ type: 'info', message: 'Coach removed.' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Member Handlers
  const handleCreateMember = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await createTenantMember(memberForm);
      showToast({ type: 'success', message: `Member registered! ID: ${res.data?.memberId || 'Created'}` });
      setShowAddMemberModal(false);
      setMemberForm({ name: '', email: '', phone: '', branchId: '' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Settings Handler
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateMyOrganization(settingsForm);
      showToast({ type: 'success', message: 'Gym brand details updated!' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Plan Upgrade Handler
  const handleUpgradePlan = async (planCode, billingCycle = 'monthly') => {
    setActionLoading(true);
    try {
      const upgradeRes = await upgradeSaaSSubscription({ planCode, billingCycle });
      const order = upgradeRes?.razorpayOrder;

      // Handle Razorpay checkout
      if (window.Razorpay && order) {
        const options = {
          key: 'rzp_test_qnox_luxury_key',
          amount: order.amount,
          currency: 'INR',
          name: 'QNOX SANCTUARY NETWORKS',
          description: `SaaS Plan Upgrade: ${planCode.toUpperCase()}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              await verifySaaSPayment({
                organizationId: org._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planCode,
                billingCycle,
              });
              showToast({ type: 'success', message: 'Plan upgraded successfully!' });
              setShowUpgradeModal(false);
              loadAllTenantData();
            } catch (vErr) {
              showToast({ type: 'error', message: 'Payment verification failed: ' + vErr.message });
            }
          },
          prefill: {
            name: org.ownerName || currentUser?.name,
            email: org.contactEmail || currentUser?.email,
          },
          theme: { color: '#c5a880' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Direct simulation fallback
        await verifySaaSPayment({
          organizationId: org._id,
          planCode,
          billingCycle,
          adminBypass: true,
        });
        showToast({ type: 'success', message: `Upgraded to ${planCode.toUpperCase()} plan!` });
        setShowUpgradeModal(false);
        loadAllTenantData();
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center space-y-4 text-[#c5a880]">
        <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          LOADING GYM COMMAND SUITE...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] text-[#f5f5f5] pt-20 pb-16 px-4 sm:px-6 lg:px-8 selection:bg-[#c5a880] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Subscription Banner */}
        <div className="bg-[#0b0b0b] border border-neutral-800 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-2.5 py-0.5 bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880] text-[10px] font-mono uppercase tracking-widest">
                  SAAS PARTNER
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest border ${
                  org.status === 'Active'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                }`}>
                  STATUS: {org.status || 'ACTIVE'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#f5f5f5] tracking-wide">
                {org.name || 'Private Sanctuary'}
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Owner: {org.ownerName || currentUser?.name} • Contact: {org.contactEmail || currentUser?.email}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-[#c5a880]/10"
              >
                <Zap className="w-4 h-4" />
                <span>UPGRADE PLAN</span>
              </button>
              <button
                onClick={loadAllTenantData}
                className="p-2.5 bg-[#141414] hover:bg-[#1a1a1a] border border-neutral-800 text-neutral-300 transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Quota Pill Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-900">
            <div className="bg-[#101010] p-4 border border-neutral-800/80">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>BRANCHES</span>
                </span>
                <span>{quotas.branches.current} / {quotas.branches.max}</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${quotas.branches.current >= quotas.branches.max ? 'bg-amber-500' : 'bg-[#c5a880]'}`}
                  style={{ width: `${Math.min(100, (quotas.branches.current / quotas.branches.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#101010] p-4 border border-neutral-800/80">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>COACHES</span>
                </span>
                <span>{quotas.trainers.current} / {quotas.trainers.max}</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${quotas.trainers.current >= quotas.trainers.max ? 'bg-amber-500' : 'bg-[#c5a880]'}`}
                  style={{ width: `${Math.min(100, (quotas.trainers.current / quotas.trainers.max) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-[#101010] p-4 border border-neutral-800/80">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>MEMBERS</span>
                </span>
                <span>{quotas.members.current} / {quotas.members.max}</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${quotas.members.current >= quotas.members.max ? 'bg-amber-500' : 'bg-[#c5a880]'}`}
                  style={{ width: `${Math.min(100, (quotas.members.current / quotas.members.max) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 overflow-x-auto space-x-1 sm:space-x-4">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: TrendingUp },
            { id: 'branches', label: `BRANCHES (${branches.length})`, icon: Building2 },
            { id: 'trainers', label: `COACHES (${trainers.length})`, icon: Dumbbell },
            { id: 'members', label: `MEMBERS (${members.length})`, icon: Users },
            { id: 'billing', label: `BILLING & INVOICES (${invoices.length})`, icon: FileText },
            { id: 'settings', label: 'GYM PROFILE', icon: Edit3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 font-mono text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/5'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0c0c0c] border border-neutral-800 p-5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                  CURRENT PLAN
                </span>
                <p className="text-xl font-serif text-[#c5a880] uppercase">
                  {subscription?.planName || 'STARTER'}
                </p>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Cycle: {subscription?.billingCycle || 'Monthly'}
                </p>
              </div>

              <div className="bg-[#0c0c0c] border border-neutral-800 p-5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                  TOTAL REVENUE
                </span>
                <p className="text-xl font-serif text-[#f5f5f5]">
                  ₹{members.length * 2500}
                </p>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  Estimated Active Flow
                </p>
              </div>

              <div className="bg-[#0c0c0c] border border-neutral-800 p-5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                  TOTAL CLIENTELE
                </span>
                <p className="text-xl font-serif text-[#f5f5f5]">
                  {members.length} / {quotas.members.max}
                </p>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Roster occupancy
                </p>
              </div>

              <div className="bg-[#0c0c0c] border border-neutral-800 p-5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                  ALL-ACCESS PARTNER
                </span>
                <p className="text-xl font-serif text-[#f5f5f5]">
                  {org.allAccessPartnerStatus === 'Approved' ? 'ENROLLED' : 'NOT LINKED'}
                </p>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  {org.allAccessPartnerStatus === 'Approved' ? 'Settlement active' : 'Independent tenant'}
                </p>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
              <h3 className="font-serif text-lg text-[#f5f5f5]">Quick Sanctuary Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  disabled={quotas.branches.current >= quotas.branches.max}
                  className="p-4 bg-[#111111] hover:bg-[#161616] border border-neutral-800 text-left transition-colors disabled:opacity-40"
                >
                  <Building2 className="w-5 h-5 text-[#c5a880] mb-2" />
                  <p className="text-sm font-semibold">Commission Branch</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {quotas.branches.current >= quotas.branches.max ? 'Quota limit reached' : 'Add new physical location'}
                  </p>
                </button>

                <button
                  onClick={() => setShowAddTrainerModal(true)}
                  disabled={quotas.trainers.current >= quotas.trainers.max}
                  className="p-4 bg-[#111111] hover:bg-[#161616] border border-neutral-800 text-left transition-colors disabled:opacity-40"
                >
                  <Dumbbell className="w-5 h-5 text-[#c5a880] mb-2" />
                  <p className="text-sm font-semibold">Onboard Coach</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {quotas.trainers.current >= quotas.trainers.max ? 'Coach limit reached' : 'Add instructor to branch'}
                  </p>
                </button>

                <button
                  onClick={() => setShowAddMemberModal(true)}
                  disabled={quotas.members.current >= quotas.members.max}
                  className="p-4 bg-[#111111] hover:bg-[#161616] border border-neutral-800 text-left transition-colors disabled:opacity-40"
                >
                  <Users className="w-5 h-5 text-[#c5a880] mb-2" />
                  <p className="text-sm font-semibold">Register Member</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {quotas.members.current >= quotas.members.max ? 'Member limit reached' : 'Issue digital pass'}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. BRANCHES TAB */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif text-[#f5f5f5]">Commissioned Branches</h3>
                <p className="text-xs font-mono text-neutral-400">
                  Using {quotas.branches.current} of {quotas.branches.max} permitted branches.
                </p>
              </div>
              <button
                onClick={() => setShowAddBranchModal(true)}
                disabled={quotas.branches.current >= quotas.branches.max}
                className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>NEW BRANCH</span>
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="bg-[#0b0b0b] border border-neutral-800 p-12 text-center space-y-4">
                <Building2 className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-sm text-neutral-400">No branches commissioned under this gym profile yet.</p>
                <button
                  onClick={() => setShowAddBranchModal(true)}
                  className="px-4 py-2 bg-[#c5a880] text-black font-mono text-xs uppercase tracking-wider font-semibold inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>COMMISSION FIRST BRANCH</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((b) => (
                  <div key={b._id} className="bg-[#0c0c0c] border border-neutral-800 overflow-hidden group">
                    <div className="h-40 bg-neutral-900 relative overflow-hidden">
                      <img
                        src={b.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'}
                        alt={b.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/70 border border-neutral-700 text-[10px] font-mono uppercase text-[#c5a880]">
                        CAP: {b.capacity || 150}
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <h4 className="text-lg font-serif text-[#f5f5f5]">{b.name}</h4>
                      <p className="text-xs text-neutral-400 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                        <span className="truncate">{b.address || b.location}</span>
                      </p>
                      <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-xs font-mono">
                        <span className="text-neutral-500">Occupancy: {b.currentOccupancy || 0} active</span>
                        <button
                          onClick={() => handleDeleteBranch(b._id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Decommission Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. COACHES TAB */}
        {activeTab === 'trainers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif text-[#f5f5f5]">Sanctuary Coaches</h3>
                <p className="text-xs font-mono text-neutral-400">
                  Using {quotas.trainers.current} of {quotas.trainers.max} permitted trainers.
                </p>
              </div>
              <button
                onClick={() => setShowAddTrainerModal(true)}
                disabled={quotas.trainers.current >= quotas.trainers.max}
                className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>ONBOARD COACH</span>
              </button>
            </div>

            {trainers.length === 0 ? (
              <div className="bg-[#0b0b0b] border border-neutral-800 p-12 text-center space-y-4">
                <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto" />
                <p className="text-sm text-neutral-400">No coaches onboarded under your gym profile yet.</p>
                <button
                  onClick={() => setShowAddTrainerModal(true)}
                  className="px-4 py-2 bg-[#c5a880] text-black font-mono text-xs uppercase tracking-wider font-semibold inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ONBOARD FIRST COACH</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((t) => (
                  <div key={t._id} className="bg-[#0c0c0c] border border-neutral-800 p-5 space-y-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={t.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                        alt={t.name}
                        className="w-14 h-14 rounded-full object-cover border border-[#c5a880]/30"
                      />
                      <div>
                        <h4 className="font-serif text-base text-[#f5f5f5]">{t.name}</h4>
                        <p className="text-xs text-[#c5a880] font-mono">{t.title || 'Master Coach'}</p>
                        <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{t.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-xs font-mono">
                      <span className="text-neutral-500">Branch: {t.branch?.name || 'All Locations'}</span>
                      <button
                        onClick={() => handleDeleteTrainer(t._id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Remove Coach"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif text-[#f5f5f5]">Registered Members</h3>
                <p className="text-xs font-mono text-neutral-400">
                  Using {quotas.members.current} of {quotas.members.max} permitted member records.
                </p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(true)}
                disabled={quotas.members.current >= quotas.members.max}
                className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                <span>REGISTER MEMBER</span>
              </button>
            </div>

            <div className="bg-[#0c0c0c] border border-neutral-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121212] font-mono uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Pass ID</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 font-mono">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-neutral-500">
                        No members registered under your gym yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m._id} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-3 px-4 text-[#f5f5f5] font-sans font-semibold">
                          {m.name}
                        </td>
                        <td className="py-3 px-4 text-[#c5a880] font-mono">
                          {m.memberId || 'QNX-MEM'}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {m.email}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {m.assignedBranch?.name || 'Main Sanctuary'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[10px]">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. BILLING & INVOICES TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-[#0c0c0c] border border-neutral-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">
                  CURRENT SAAS SUBSCRIPTION
                </span>
                <h3 className="text-2xl font-serif text-[#c5a880] uppercase">
                  {subscription?.planName || 'STARTER'} PLAN
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Cycle: {subscription?.billingCycle || 'Monthly'} • Valid Until: {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Active'}
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-5 py-2.5 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-2 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>UPGRADE / CHANGE PLAN</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div>
              <h4 className="text-lg font-serif text-[#f5f5f5] mb-3">Official Tax Invoices</h4>
              <div className="bg-[#0c0c0c] border border-neutral-800 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121212] uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Plan / Cycle</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-neutral-500">
                          No invoices generated yet.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-3 px-4 text-[#c5a880] font-bold">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 text-neutral-400">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-neutral-300 uppercase">
                            {inv.subscriptionDetails?.planName} ({inv.subscriptionDetails?.billingCycle})
                          </td>
                          <td className="py-3 px-4 text-right text-[#f5f5f5] font-bold">
                            ₹{inv.pricing?.totalPayable?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 text-[10px] uppercase ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-3 py-1 bg-neutral-900 hover:bg-[#c5a880]/10 border border-neutral-800 hover:border-[#c5a880]/40 text-[#c5a880] text-[11px] uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>VIEW TAX INVOICE</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-[#0c0c0c] border border-neutral-800 p-6 max-w-2xl space-y-6">
            <h3 className="text-xl font-serif text-[#f5f5f5]">Gym Profile & Contact Configuration</h3>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                  Gym / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full bg-[#111111] border border-neutral-800 px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    className="w-full bg-[#111111] border border-neutral-800 px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={settingsForm.city}
                    onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    className="w-full bg-[#111111] border border-neutral-800 px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                  Full Business Address
                </label>
                <textarea
                  rows="3"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-[#111111] border border-neutral-800 px-4 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* MODAL: ADD BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <h3 className="text-xl font-serif text-[#f5f5f5]">Commission New Branch</h3>
            <p className="text-xs font-mono text-neutral-400">
              Subscription limit: {quotas.branches.current} / {quotas.branches.max} branches used.
            </p>
            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Sanctuary"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore"
                  value={branchForm.location}
                  onChange={(e) => setBranchForm({ ...branchForm, location: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="100ft Road, Indiranagar"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Capacity</label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  value={branchForm.capacity}
                  onChange={(e) => setBranchForm({ ...branchForm, capacity: Number(e.target.value) })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-xs font-mono uppercase text-neutral-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black text-xs font-mono uppercase font-semibold"
                >
                  {actionLoading ? 'COMMISSIONING...' : 'COMMISSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRAINER */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <h3 className="text-xl font-serif text-[#f5f5f5]">Onboard Sanctuary Coach</h3>
            <p className="text-xs font-mono text-neutral-400">
              Subscription limit: {quotas.trainers.current} / {quotas.trainers.max} coaches used.
            </p>
            <form onSubmit={handleCreateTrainer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Coach Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={trainerForm.name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Title / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Strength & Conditioning"
                  value={trainerForm.title}
                  onChange={(e) => setTrainerForm({ ...trainerForm, title: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="coach@gym.com"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              {branches.length > 0 && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Assigned Branch</label>
                  <select
                    value={trainerForm.branchId}
                    onChange={(e) => setTrainerForm({ ...trainerForm, branchId: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-xs font-mono uppercase text-neutral-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black text-xs font-mono uppercase font-semibold"
                >
                  {actionLoading ? 'ONBOARDING...' : 'ONBOARD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <h3 className="text-xl font-serif text-[#f5f5f5]">Register Sanctuary Member</h3>
            <p className="text-xs font-mono text-neutral-400">
              Subscription limit: {quotas.members.current} / {quotas.members.max} members used.
            </p>
            <form onSubmit={handleCreateMember} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sophia Sterling"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="member@client.com"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
              {branches.length > 0 && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">Primary Branch</label>
                  <select
                    value={memberForm.branchId}
                    onChange={(e) => setMemberForm({ ...memberForm, branchId: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="">Primary Location</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-xs font-mono uppercase text-neutral-400 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black text-xs font-mono uppercase font-semibold"
                >
                  {actionLoading ? 'REGISTERING...' : 'REGISTER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPGRADE SAAS PLAN */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0c0c0c] border border-[#c5a880]/40 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-2xl font-serif text-[#f5f5f5]">Upgrade Platform Capacity</h3>
                <p className="text-xs font-mono text-neutral-400">Scale your branches, trainers, and clientele limits</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter */}
              <div className="bg-[#101010] border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">BOUTIQUE</span>
                  <h4 className="text-xl font-serif text-white">Starter</h4>
                  <p className="text-2xl font-mono font-bold text-white mt-2">₹4,999<span className="text-xs text-neutral-400">/mo</span></p>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4 font-mono">
                    <li>✓ 1 Branch</li>
                    <li>✓ 5 Coaches</li>
                    <li>✓ 100 Members</li>
                    <li>✓ Invoices & Attendance</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleUpgradePlan('starter')}
                  disabled={actionLoading || subscription?.planCode === 'starter'}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-mono uppercase font-semibold transition-colors"
                >
                  {subscription?.planCode === 'starter' ? 'CURRENT PLAN' : 'SELECT'}
                </button>
              </div>

              {/* Professional */}
              <div className="bg-[#121212] border-2 border-[#c5a880] p-5 space-y-4 flex flex-col justify-between relative shadow-xl shadow-[#c5a880]/5">
                <div className="absolute -top-3 right-4 px-2 py-0.5 bg-[#c5a880] text-black text-[9px] font-mono uppercase font-bold tracking-widest">
                  POPULAR
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">PREMIER</span>
                  <h4 className="text-xl font-serif text-white">Professional</h4>
                  <p className="text-2xl font-mono font-bold text-white mt-2">₹11,999<span className="text-xs text-neutral-400">/mo</span></p>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4 font-mono">
                    <li>✓ 3 Branches</li>
                    <li>✓ 15 Coaches</li>
                    <li>✓ 500 Members</li>
                    <li>✓ AI Workout Telemetry</li>
                    <li>✓ Multi-Branch Reports</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleUpgradePlan('professional')}
                  disabled={actionLoading || subscription?.planCode === 'professional'}
                  className="w-full py-2 bg-[#c5a880] hover:bg-[#d8be98] disabled:opacity-40 text-black text-xs font-mono uppercase font-semibold transition-colors"
                >
                  {subscription?.planCode === 'professional' ? 'CURRENT PLAN' : 'UPGRADE NOW'}
                </button>
              </div>

              {/* Enterprise */}
              <div className="bg-[#101010] border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">SANCTUARY ELITE</span>
                  <h4 className="text-xl font-serif text-white">Enterprise</h4>
                  <p className="text-2xl font-mono font-bold text-white mt-2">₹24,999<span className="text-xs text-neutral-400">/mo</span></p>
                  <ul className="text-xs text-neutral-300 space-y-2 mt-4 font-mono">
                    <li>✓ Unlimited Branches</li>
                    <li>✓ Unlimited Coaches</li>
                    <li>✓ Unlimited Members</li>
                    <li>✓ All-Access Gym Network</li>
                    <li>✓ Dedicated Concierge</li>
                  </ul>
                </div>
                <button
                  onClick={() => handleUpgradePlan('enterprise')}
                  disabled={actionLoading || subscription?.planCode === 'enterprise'}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-mono uppercase font-semibold transition-colors"
                >
                  {subscription?.planCode === 'enterprise' ? 'CURRENT PLAN' : 'SELECT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW TAX INVOICE */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

    </div>
  );
}
