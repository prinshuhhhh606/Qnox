import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Dumbbell, Shield, Award, CreditCard,
  Plus, Trash2, Edit3, CheckCircle, AlertTriangle, ArrowUpRight,
  TrendingUp, Calendar, FileText, RefreshCw, MapPin, ExternalLink,
  ChevronRight, Sparkles, Check, Zap, DollarSign, Search, Filter,
  Eye, Lock, Phone, Mail, UserCheck, X, ChevronDown, LogOut,
  Sliders, Settings, Clock, AlertCircle, Menu
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import {
  fetchMyOrganization,
  updateMyOrganization,
  fetchMyTenantBranches,
  createTenantBranch,
  updateTenantBranch,
  toggleTenantBranchStatus,
  deleteTenantBranch,
  fetchMyTenantTrainers,
  createTenantTrainer,
  updateTenantTrainer,
  toggleTenantTrainerStatus,
  deleteTenantTrainer,
  fetchMyTenantMembers,
  createTenantMember,
  updateTenantMember,
  toggleTenantMemberStatus,
  fetchTenantMemberDossier,
  fetchMyTenantInvoices,
  upgradeSaaSSubscription,
  verifySaaSPayment,
  fetchSaaSPlans,
  changeOwnerPassword,
  updateOwnerProfile,
} from '../services/api';
import InvoiceModal from '../components/InvoiceModal';

export default function GymOwnerDashboardPage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useNotifications();

  // Active Tab: 'overview' | 'branches' | 'trainers' | 'members' | 'billing' | 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Member Search & Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBranchFilter, setMemberBranchFilter] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMemberDossier, setViewingMemberDossier] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: '',
    branchCode: '',
    location: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
    capacity: 150,
  });

  const [trainerForm, setTrainerForm] = useState({
    name: '',
    title: 'Master Performance Coach',
    role: 'Coach',
    email: '',
    phone: '',
    branchId: '',
    workingHours: '06:00 AM - 02:00 PM',
    specialties: 'Strength & Conditioning, Functional Hypertrophy',
    certifications: 'CSCS, NASM-CPT',
  });

  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    branchId: '',
    gender: 'Not Specified',
    dateOfBirth: '',
    planName: 'Sanctuary Standard Residency',
    durationMonths: 1,
  });

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contactEmail: '',
    logo: '',
  });

  const [ownerProfileForm, setOwnerProfileForm] = useState({
    name: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  const loadAllTenantData = async () => {
    setLoading(true);
    try {
      const [orgRes, branchesRes, trainersRes, membersRes, invoicesRes, plansRes] = await Promise.allSettled([
        fetchMyOrganization(),
        fetchMyTenantBranches(),
        fetchMyTenantTrainers(),
        fetchMyTenantMembers({ search: memberSearch, branchId: memberBranchFilter, status: memberStatusFilter }),
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
          state: o.state || '',
          contactEmail: o.contactEmail || '',
          logo: o.logo || '',
        });
        setOwnerProfileForm({
          name: o.ownerName || currentUser?.name || '',
          phone: currentUser?.phone || o.phone || '',
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

  // Filter members on change
  useEffect(() => {
    fetchMyTenantMembers({ search: memberSearch, branchId: memberBranchFilter, status: memberStatusFilter })
      .then((data) => setMembers(data || []))
      .catch((e) => console.warn('Filter members error:', e.message));
  }, [memberSearch, memberBranchFilter, memberStatusFilter]);

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
      setBranchForm({
        name: '',
        branchCode: '',
        location: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
        capacity: 150,
      });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    setActionLoading(true);
    try {
      await updateTenantBranch(editingBranch._id, editingBranch);
      showToast({ type: 'success', message: 'Branch information updated successfully!' });
      setEditingBranch(null);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBranchStatus = async (id) => {
    try {
      const res = await toggleTenantBranchStatus(id);
      showToast({ type: 'success', message: res.message || 'Branch status toggled.' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this branch? This action cannot be undone.')) return;
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
      setTrainerForm({
        name: '',
        title: 'Master Performance Coach',
        role: 'Coach',
        email: '',
        phone: '',
        branchId: '',
        workingHours: '06:00 AM - 02:00 PM',
        specialties: 'Strength & Conditioning, Functional Hypertrophy',
        certifications: 'CSCS, NASM-CPT',
      });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    if (!editingTrainer) return;
    setActionLoading(true);
    try {
      await updateTenantTrainer(editingTrainer._id, editingTrainer);
      showToast({ type: 'success', message: 'Coach profile updated successfully!' });
      setEditingTrainer(null);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTrainerStatus = async (id) => {
    try {
      const res = await toggleTenantTrainerStatus(id);
      showToast({ type: 'success', message: res.message || 'Coach status toggled.' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteTrainer = async (id) => {
    if (!window.confirm('Remove this coach from your sanctuary roster?')) return;
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
      showToast({ type: 'success', message: `Member registered! Pass ID: ${res.data?.memberId || 'Created'}` });
      setShowAddMemberModal(false);
      setMemberForm({
        name: '',
        email: '',
        phone: '',
        branchId: '',
        gender: 'Not Specified',
        dateOfBirth: '',
        planName: 'Sanctuary Standard Residency',
        durationMonths: 1,
      });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setActionLoading(true);
    try {
      await updateTenantMember(editingMember._id, editingMember);
      showToast({ type: 'success', message: 'Member updated successfully!' });
      setEditingMember(null);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMemberStatus = async (id) => {
    try {
      const res = await toggleTenantMemberStatus(id);
      showToast({ type: 'success', message: res.message || 'Member status updated.' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  const handleViewDossier = async (id) => {
    try {
      const dossier = await fetchTenantMemberDossier(id);
      setViewingMemberDossier(dossier);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    }
  };

  // Settings Handlers
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

  const handleUpdateOwnerProfile = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateOwnerProfile(ownerProfileForm);
      showToast({ type: 'success', message: 'Owner profile updated!' });
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    setActionLoading(true);
    try {
      await changeOwnerPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast({ type: 'success', message: 'Password updated securely!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'branches', label: 'Branch Management', count: branches.length, icon: Building2 },
    { id: 'trainers', label: 'Coaches & Staff', count: trainers.length, icon: Dumbbell },
    { id: 'members', label: 'Member Registry', count: members.length, icon: Users },
    { id: 'billing', label: 'Billing & Invoices', count: invoices.length, icon: FileText },
    { id: 'settings', label: 'Gym Profile & Security', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex selection:bg-[#c5a880] selection:text-black">
      
      {/* 1. PROFESSIONAL FIXED / COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#090909] border-r border-neutral-800/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Emblem */}
          <div className="p-6 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-[#c5a880] text-black font-serif font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(197,168,128,0.3)]">
                Q
              </div>
              <div>
                <span className="font-serif tracking-[0.2em] text-sm text-white font-bold block">
                  QNOX SAAS
                </span>
                <span className="text-[9px] font-mono tracking-widest text-[#c5a880] uppercase block">
                  COMMAND SUITE
                </span>
              </div>
            </div>
            
            {/* Gym Brand Identity Badge */}
            <div className="mt-4 p-2.5 bg-[#111111] border border-neutral-800 rounded text-xs font-mono">
              <span className="text-[9px] text-neutral-500 uppercase tracking-widest block">SANCTUARY TENANT</span>
              <p className="font-semibold text-white truncate mt-0.5">{org.name || 'Your Gym Brand'}</p>
              <div className="flex items-center space-x-1.5 mt-1 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 font-bold uppercase">{org.status || 'Active'}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-[#c5a880] uppercase">{subscription?.planName || 'STARTER'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-mono tracking-wider uppercase transition-all rounded ${
                    isActive
                      ? 'bg-[#c5a880] text-black font-semibold shadow-lg shadow-[#c5a880]/10'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-black text-[#c5a880]' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800/80 space-y-3">
          <div className="p-3 bg-[#111111] border border-neutral-800/60 rounded text-[11px] font-mono">
            <div className="flex justify-between items-center text-neutral-400 mb-1">
              <span>Branch Quota:</span>
              <span className="font-bold text-white">{quotas.branches.current} / {quotas.branches.max}</span>
            </div>
            <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
              <div
                className={`h-full ${quotas.branches.current >= quotas.branches.max ? 'bg-amber-500' : 'bg-[#c5a880]'}`}
                style={{ width: `${Math.min(100, (quotas.branches.current / quotas.branches.max) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-serif text-[#c5a880]">
                {org.ownerName?.[0] || currentUser?.name?.[0] || 'O'}
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-xs font-semibold text-white truncate">{org.ownerName || currentUser?.name}</p>
                <p className="text-[10px] text-neutral-500 font-mono">Gym Owner</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/80 md:hidden backdrop-blur-sm"
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-[#090909]/90 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-neutral-400 hover:text-white md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-serif text-white tracking-wide flex items-center space-x-2">
                <span>{org.name || 'Private Sanctuary'}</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880]">
                  {subscription?.planName || 'STARTER'} TIER
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3.5 py-1.5 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-[11px] uppercase tracking-wider font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-[#c5a880]/10"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>UPGRADE PLAN</span>
            </button>
            <button
              onClick={loadAllTenantData}
              className="p-2 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <a
              href="/"
              className="hidden sm:inline-flex px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[11px] font-mono uppercase tracking-wider transition-colors"
            >
              WEBSITE
            </a>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* High-Level SaaS Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0b0b0b] border border-neutral-800 p-5 space-y-1 relative overflow-hidden">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                    ACTIVE BRANCHES
                  </span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-serif text-white">{branches.filter(b => b.isActive !== false).length}</p>
                    <span className="text-xs font-mono text-neutral-400">Quota: {quotas.branches.max}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono flex items-center space-x-1 pt-1">
                    <Building2 className="w-3 h-3 text-[#c5a880]" />
                    <span>{quotas.branches.max - branches.length} slots available</span>
                  </div>
                </div>

                <div className="bg-[#0b0b0b] border border-neutral-800 p-5 space-y-1 relative overflow-hidden">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                    COACHES & TRAINERS
                  </span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-serif text-[#c5a880]">{trainers.length}</p>
                    <span className="text-xs font-mono text-neutral-400">Limit: {quotas.trainers.max}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono flex items-center space-x-1 pt-1">
                    <Dumbbell className="w-3 h-3 text-[#c5a880]" />
                    <span>{trainers.filter(t => t.isActive).length} active on floor</span>
                  </div>
                </div>

                <div className="bg-[#0b0b0b] border border-neutral-800 p-5 space-y-1 relative overflow-hidden">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                    REGISTERED CLIENTELE
                  </span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-serif text-white">{members.length}</p>
                    <span className="text-xs font-mono text-neutral-400">Cap: {quotas.members.max}</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1 pt-1">
                    <Users className="w-3 h-3" />
                    <span>{members.filter(m => m.membership?.status === 'Active').length} active memberships</span>
                  </div>
                </div>

                <div className="bg-[#0b0b0b] border border-neutral-800 p-5 space-y-1 relative overflow-hidden">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                    MONTHLY ESTIMATED INFLOW
                  </span>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-serif text-emerald-400">₹{(members.length * 2500).toLocaleString('en-IN')}</p>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">RUN-RATE</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono pt-1">
                    Based on ₹2,500 standard client dues
                  </div>
                </div>
              </div>

              {/* Branch Performance Overview Table */}
              <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="font-serif text-lg text-white">Branch-Wise Operational Footprint</h3>
                    <p className="text-xs text-neutral-400 font-mono">Performance across physical facilities</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('branches')}
                    className="text-xs font-mono text-[#c5a880] hover:underline flex items-center space-x-1"
                  >
                    <span>MANAGE ALL</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121212] uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="py-2.5 px-3">Code / Branch Name</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3 text-center">Coaches</th>
                        <th className="py-2.5 px-3 text-center">Members</th>
                        <th className="py-2.5 px-3 text-center">Capacity</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {branches.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-neutral-500">
                            No branches commissioned yet. Commission your first branch in Branch Management.
                          </td>
                        </tr>
                      ) : (
                        branches.map((b) => (
                          <tr key={b._id} className="hover:bg-neutral-900/40">
                            <td className="py-3 px-3">
                              <span className="text-[#c5a880] font-bold block">{b.branchCode || 'BR-MAIN'}</span>
                              <span className="text-white font-sans font-semibold">{b.name}</span>
                            </td>
                            <td className="py-3 px-3 text-neutral-400 truncate max-w-xs">
                              {b.address || b.location}
                            </td>
                            <td className="py-3 px-3 text-center text-neutral-300">
                              {b.trainersCount ?? trainers.filter(t => String(t.branch?._id || t.branch) === String(b._id)).length}
                            </td>
                            <td className="py-3 px-3 text-center text-neutral-300">
                              {b.membersCount ?? members.filter(m => String(m.assignedBranch?._id || m.assignedBranch) === String(b._id)).length}
                            </td>
                            <td className="py-3 px-3 text-center text-neutral-400">
                              {b.capacity || 150}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 text-[9px] uppercase font-bold ${
                                  b.isActive !== false
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                }`}
                              >
                                {b.isActive !== false ? 'ACTIVE' : 'MAINTENANCE'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Member Registrations */}
                <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                    <h4 className="font-serif text-base text-white">Recent Member Admissions</h4>
                    <button onClick={() => setActiveTab('members')} className="text-xs text-[#c5a880] font-mono hover:underline">
                      VIEW ALL
                    </button>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    {members.slice(0, 5).map((m) => (
                      <div key={m._id} className="flex justify-between items-center p-2.5 bg-[#101010] border border-neutral-800/60 rounded">
                        <div>
                          <p className="font-sans font-semibold text-white">{m.name}</p>
                          <p className="text-[10px] text-neutral-400">{m.memberId || 'QNX-MEM'} • {m.email}</p>
                        </div>
                        <span className="px-2 py-0.5 text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          {m.membership?.status || 'Active'}
                        </span>
                      </div>
                    ))}
                    {members.length === 0 && <p className="text-neutral-500 py-4 text-center">No member records yet.</p>}
                  </div>
                </div>

                {/* SaaS Subscription Ledger Summary */}
                <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                    <h4 className="font-serif text-base text-white">SaaS Subscription & Invoices</h4>
                    <button onClick={() => setActiveTab('billing')} className="text-xs text-[#c5a880] font-mono hover:underline">
                      LEDGER
                    </button>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    {invoices.slice(0, 5).map((inv) => (
                      <div key={inv._id} className="flex justify-between items-center p-2.5 bg-[#101010] border border-neutral-800/60 rounded">
                        <div>
                          <p className="font-bold text-[#c5a880]">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-neutral-400">{new Date(inv.createdAt).toLocaleDateString()} • {inv.subscriptionDetails?.planName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">₹{inv.pricing?.totalPayable?.toLocaleString('en-IN')}</p>
                          <span className="text-[9px] text-emerald-400 uppercase font-bold">{inv.status}</span>
                        </div>
                      </div>
                    ))}
                    {invoices.length === 0 && <p className="text-neutral-500 py-4 text-center">No invoices accrued yet.</p>}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BRANCH MANAGEMENT */}
          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-xl font-serif text-white">Sanctuary Branches</h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Using {quotas.branches.current} of {quotas.branches.max} permitted branches.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {quotas.branches.current >= quotas.branches.max && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>UPGRADE TO ADD MORE</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddBranchModal(true)}
                    disabled={quotas.branches.current >= quotas.branches.max}
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>COMMISSION BRANCH</span>
                  </button>
                </div>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((b) => (
                  <div key={b._id} className="bg-[#0b0b0b] border border-neutral-800 overflow-hidden flex flex-col justify-between group">
                    <div>
                      <div className="h-44 bg-neutral-900 relative overflow-hidden">
                        <img
                          src={b.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'}
                          alt={b.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] font-mono text-[#c5a880] font-bold">
                          {b.branchCode || 'BR-01'}
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] font-mono text-white">
                          CAP: {b.capacity || 150}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-lg text-white">{b.name}</h4>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold ${
                              b.isActive !== false
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            }`}
                          >
                            {b.isActive !== false ? 'OPEN' : 'MAINTENANCE'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 flex items-center space-x-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                          <span className="truncate">{b.address || b.location}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 bg-[#101010] border border-neutral-800/60 rounded">
                          <div>
                            <span className="text-[10px] text-neutral-500 block">COACHES</span>
                            <span className="text-white font-bold">{b.trainersCount ?? 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-neutral-500 block">CLIENTELE</span>
                            <span className="text-white font-bold">{b.membersCount ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#0e0e0e] border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => handleToggleBranchStatus(b._id)}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        {b.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingBranch({ ...b })}
                          className="p-1.5 text-[#c5a880] hover:text-white transition-colors"
                          title="Edit Branch"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b._id)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                          title="Decommission Branch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COACH / TRAINER MANAGEMENT */}
          {activeTab === 'trainers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-xl font-serif text-white">Sanctuary Coaches & Instructors</h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Using {quotas.trainers.current} of {quotas.trainers.max} permitted coach accounts.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {quotas.trainers.current >= quotas.trainers.max && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>UPGRADE TO EXPAND ROSTER</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddTrainerModal(true)}
                    disabled={quotas.trainers.current >= quotas.trainers.max}
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ONBOARD COACH</span>
                  </button>
                </div>
              </div>

              {/* Trainers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((t) => (
                  <div key={t._id} className="bg-[#0b0b0b] border border-neutral-800 p-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3.5">
                        <img
                          src={t.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                          alt={t.name}
                          className="w-14 h-14 rounded-full object-cover border border-[#c5a880]/30 shrink-0"
                        />
                        <div className="truncate">
                          <h4 className="font-serif text-base text-white truncate">{t.name}</h4>
                          <p className="text-xs text-[#c5a880] font-mono">{t.title || 'Master Coach'}</p>
                          <span
                            className={`inline-block px-2 py-0.2 mt-1 text-[9px] font-mono uppercase ${
                              t.isActive !== false ? 'bg-emerald-950/60 text-emerald-400' : 'bg-red-950/60 text-red-400'
                            }`}
                          >
                            {t.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-[#101010] border border-neutral-800/60 text-xs font-mono space-y-1.5 rounded">
                        <div className="flex justify-between text-neutral-400">
                          <span>Branch:</span>
                          <span className="text-white font-bold">{t.branch?.name || 'All Locations'}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Contact:</span>
                          <span className="text-white">{t.phone || t.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                          <span>Hours:</span>
                          <span className="text-white">{t.workingHours || '06:00 AM - 02:00 PM'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => handleToggleTrainerStatus(t._id)}
                        className="text-neutral-400 hover:text-white transition-colors"
                      >
                        {t.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTrainer({ ...t })}
                          className="p-1.5 text-[#c5a880] hover:text-white transition-colors"
                          title="Edit Coach"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrainer(t._id)}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                          title="Remove Coach"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MEMBER MANAGEMENT */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <h3 className="text-xl font-serif text-white">Clientele Registry</h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Using {quotas.members.current} of {quotas.members.max} permitted member records.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {quotas.members.current >= quotas.members.max && (
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>UPGRADE TO ADD MORE</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    disabled={quotas.members.current >= quotas.members.max}
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                    <span>REGISTER MEMBER</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search by name, email, pass ID..."
                    className="w-full bg-[#101010] border border-neutral-800 pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <select
                    value={memberBranchFilter}
                    onChange={(e) => setMemberBranchFilter(e.target.value)}
                    className="w-full bg-[#101010] border border-neutral-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                    className="w-full bg-[#101010] border border-neutral-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="">All Membership Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-[#0b0b0b] border border-neutral-800 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#121212] uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Pass ID / Member Name</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Assigned Branch</th>
                      <th className="py-3 px-4">Residency Plan</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-neutral-500">
                          No members matched your search or filter.
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m._id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-[#c5a880] font-bold block">{m.memberId || 'QNX-MEM'}</span>
                            <span className="text-white font-sans font-semibold">{m.name}</span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400">
                            <div>{m.email}</div>
                            <div className="text-[11px] text-neutral-500">{m.phone || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-4 text-neutral-300">
                            {m.assignedBranch?.name || 'Primary Sanctuary'}
                          </td>
                          <td className="py-3 px-4 text-neutral-300">
                            {m.membership?.planName || 'Standard'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 text-[9px] uppercase font-bold ${
                                m.membership?.status === 'Active'
                                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              }`}
                            >
                              {m.membership?.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleViewDossier(m._id)}
                              className="p-1.5 text-neutral-400 hover:text-[#c5a880] transition-colors"
                              title="View Dossier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingMember({ ...m, branchId: m.assignedBranch?._id || '' })}
                              className="p-1.5 text-[#c5a880] hover:text-white transition-colors"
                              title="Edit Member"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleMemberStatus(m._id)}
                              className="text-[10px] text-neutral-400 hover:text-white px-2 py-0.5 border border-neutral-800"
                            >
                              {m.membership?.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              
              {/* Subscription Plan Status Banner */}
              <div className="bg-[#0b0b0b] border border-neutral-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                    CURRENT SAAS PLAN & CONTRACT
                  </span>
                  <h3 className="text-3xl font-serif text-[#c5a880] uppercase tracking-wide">
                    {subscription?.planName || 'STARTER'} PLAN
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono text-neutral-400">
                    <span>Billing: <strong className="text-white uppercase">{subscription?.billingCycle || 'Monthly'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-emerald-400 uppercase">{org.status || 'Active'}</strong></span>
                    <span>•</span>
                    <span>Expires: <strong className="text-white">{subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Active'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-5 py-2.5 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center space-x-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>UPGRADE OR RENEW</span>
                  </button>
                </div>
              </div>

              {/* Official Tax Invoices Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div>
                    <h4 className="font-serif text-lg text-white">Official Tax Invoices & Proformas</h4>
                    <p className="text-xs text-neutral-400 font-mono">Sequential GST billing records</p>
                  </div>
                  <span className="text-xs font-mono text-neutral-400">{invoices.length} Invoices</span>
                </div>

                <div className="bg-[#0b0b0b] border border-neutral-800 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#121212] uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Subscription Plan</th>
                        <th className="py-3 px-4 text-right">Base Amount</th>
                        <th className="py-3 px-4 text-right">18% GST</th>
                        <th className="py-3 px-4 text-right">Total Payable</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Tax Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-neutral-500">
                            No billing invoices generated yet.
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
                            <td className="py-3 px-4 text-right text-neutral-400">
                              ₹{inv.pricing?.baseAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right text-neutral-400">
                              ₹{inv.pricing?.taxAmount?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-right text-white font-bold">
                              ₹{inv.pricing?.totalPayable?.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 text-[9px] uppercase font-bold ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="px-3 py-1 bg-neutral-900 hover:bg-[#c5a880]/10 border border-neutral-800 hover:border-[#c5a880]/40 text-[#c5a880] text-[11px] uppercase tracking-wider transition-colors inline-flex items-center space-x-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>VIEW INVOICE</span>
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

          {/* TAB 6: GYM PROFILE & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Gym Brand Profile Configuration */}
              <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-serif text-white">Gym Brand & Facility Details</h3>
                  <p className="text-xs font-mono text-neutral-400">Tenant brand parameters</p>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Gym / Sanctuary Brand Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Business Phone</label>
                      <input
                        type="text"
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={settingsForm.contactEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">City</label>
                      <input
                        type="text"
                        value={settingsForm.city}
                        onChange={(e) => setSettingsForm({ ...settingsForm, city: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">State / Region</label>
                      <input
                        type="text"
                        value={settingsForm.state}
                        onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Street Address</label>
                    <textarea
                      rows="2"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                      className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'SAVING...' : 'SAVE BRAND PROFILE'}
                  </button>
                </form>
              </div>

              {/* Owner Profile & Security Column */}
              <div className="space-y-8">
                {/* Owner Account Details */}
                <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-4">
                  <h3 className="text-lg font-serif text-white">Owner Administrator Profile</h3>
                  <form onSubmit={handleUpdateOwnerProfile} className="space-y-3 text-xs font-mono">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Owner Full Name</label>
                      <input
                        type="text"
                        required
                        value={ownerProfileForm.name}
                        onChange={(e) => setOwnerProfileForm({ ...ownerProfileForm, name: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Personal Phone</label>
                      <input
                        type="text"
                        value={ownerProfileForm.phone}
                        onChange={(e) => setOwnerProfileForm({ ...ownerProfileForm, phone: e.target.value })}
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      UPDATE OWNER INFO
                    </button>
                  </form>
                </div>

                {/* Secure Password Update */}
                <div className="bg-[#0b0b0b] border border-neutral-800 p-6 space-y-4">
                  <h3 className="text-lg font-serif text-white">Security & Password</h3>
                  <form onSubmit={handleChangePassword} className="space-y-3 text-xs font-mono">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="At least 6 characters"
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-[#111111] border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      CHANGE PASSWORD
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD BRANCH */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-xl font-serif text-white">Commission New Branch</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mayfair Central"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BR-MYF"
                    value={branchForm.branchCode}
                    onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="14 Berkeley Street"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="London"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">State / Region</label>
                  <input
                    type="text"
                    placeholder="Greater London"
                    value={branchForm.state}
                    onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+44 20 7946 0920"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={branchForm.capacity}
                    onChange={(e) => setBranchForm({ ...branchForm, capacity: Number(e.target.value) })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase"
                >
                  {actionLoading ? 'COMMISSIONING...' : 'COMMISSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT BRANCH */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-xl font-serif text-white">Edit Branch Profile</h3>
              <button onClick={() => setEditingBranch(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdateBranch} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block uppercase text-neutral-400 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block uppercase text-neutral-400 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={editingBranch.address || ''}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingBranch.phone || ''}
                    onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={editingBranch.capacity || 150}
                    onChange={(e) => setEditingBranch({ ...editingBranch, capacity: Number(e.target.value) })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase"
                >
                  {actionLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ONBOARD COACH */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-xl font-serif text-white">Onboard Sanctuary Coach</h3>
              <button onClick={() => setShowAddTrainerModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateTrainer} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Coach Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Marcus Vance"
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Title / Designation</label>
                  <input
                    type="text"
                    required
                    value={trainerForm.title}
                    onChange={(e) => setTrainerForm({ ...trainerForm, title: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="coach@gym.com"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Assigned Branch</label>
                  <select
                    value={trainerForm.branchId}
                    onChange={(e) => setTrainerForm({ ...trainerForm, branchId: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={trainerForm.workingHours}
                    onChange={(e) => setTrainerForm({ ...trainerForm, workingHours: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase"
                >
                  {actionLoading ? 'ONBOARDING...' : 'ONBOARD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COACH */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-xl font-serif text-white">Edit Coach Profile</h3>
              <button onClick={() => setEditingTrainer(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdateTrainer} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block uppercase text-neutral-400 mb-1">Coach Name</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.name}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, name: e.target.value })}
                  className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editingTrainer.title || ''}
                    onChange={(e) => setEditingTrainer({ ...editingTrainer, title: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingTrainer.phone || ''}
                    onChange={(e) => setEditingTrainer({ ...editingTrainer, phone: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase"
                >
                  {actionLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REGISTER MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-neutral-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-xl font-serif text-white">Register Sanctuary Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateMember} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sophia Sterling"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="member@client.com"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Primary Branch</label>
                  <select
                    value={memberForm.branchId}
                    onChange={(e) => setMemberForm({ ...memberForm, branchId: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  >
                    <option value="">Primary Location</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Residency Plan</label>
                  <input
                    type="text"
                    value={memberForm.planName}
                    onChange={(e) => setMemberForm({ ...memberForm, planName: e.target.value })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={memberForm.durationMonths}
                    onChange={(e) => setMemberForm({ ...memberForm, durationMonths: Number(e.target.value) })}
                    className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] text-black font-semibold uppercase"
                >
                  {actionLoading ? 'REGISTERING...' : 'REGISTER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: MEMBER DOSSIER */}
      {viewingMemberDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0c] border border-[#c5a880]/40 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#c5a880] uppercase tracking-widest">MEMBER DOSSIER</span>
                <h3 className="text-xl font-serif text-white">{viewingMemberDossier.name}</h3>
              </div>
              <button onClick={() => setViewingMemberDossier(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 bg-[#111111] border border-neutral-800 text-xs font-mono space-y-2 rounded">
              <div className="flex justify-between text-neutral-400">
                <span>Pass ID:</span>
                <span className="text-[#c5a880] font-bold">{viewingMemberDossier.memberId}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Email:</span>
                <span className="text-white">{viewingMemberDossier.email}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Phone:</span>
                <span className="text-white">{viewingMemberDossier.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Branch:</span>
                <span className="text-white">{viewingMemberDossier.assignedBranch?.name || 'Primary Sanctuary'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Plan:</span>
                <span className="text-white">{viewingMemberDossier.membership?.planName || 'Standard'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold uppercase">{viewingMemberDossier.membership?.status || 'Active'}</span>
              </div>
            </div>

            <button
              onClick={() => setViewingMemberDossier(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs uppercase"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: UPGRADE SAAS PLAN */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0c0c0c] border border-[#c5a880]/40 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-2xl font-serif text-white">Upgrade Platform Capacity</h3>
                <p className="text-xs font-mono text-neutral-400">Scale branches, coaches, and clientele quotas</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-neutral-400 hover:text-white">✕</button>
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

      {/* MODAL 8: VIEW TAX INVOICE */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

    </div>
  );
}
