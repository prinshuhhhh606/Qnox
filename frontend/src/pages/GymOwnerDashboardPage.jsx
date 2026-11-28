import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  completeBranchSetup,
  publishTenantBranch,
  unpublishTenantBranch,
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
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (showToast) showToast({ type: 'info', message: 'Signed out of Gym Owner Command Suite.' });
    navigate('/');
  };

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
  const [showSetupWizardModal, setShowSetupWizardModal] = useState(false);
  const [setupWizardBranch, setSetupWizardBranch] = useState(null);
  const [showPublishPreviewModal, setShowPublishPreviewModal] = useState(false);
  const [publishPreviewBranch, setPublishPreviewBranch] = useState(null);
  const [activeBranchFormSection, setActiveBranchFormSection] = useState('basic');
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMemberDossier, setViewingMemberDossier] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Forms
  const defaultBranchForm = {
    name: '',
    branchCode: '',
    branchType: 'Standard',
    assignedManagerName: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    latitude: 19.0760,
    longitude: 72.8777,
    propertyLeaseDeedUrl: '',
    businessRegistrationUrl: '',
    operatingLicenseUrl: '',
    emergencyContact: { name: '', phone: '', relation: 'General Manager' },
    facilitiesBreakdown: {
      cardioEquipment: true,
      weightTraining: true,
      personalTraining: true,
      swimmingPool: false,
      steamAndSauna: false,
      lockerRoom: true,
      showerFacilities: true,
      parking: true,
    },
    openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    capacity: 150,
    description: '',
    heroImage: '',
    interiorGallery: '',
    equipmentImages: '',
    exteriorImages: '',
  };

  const [branchForm, setBranchForm] = useState(defaultBranchForm);

  const [wizardForm, setWizardForm] = useState({
    assignedManagerName: '',
    assignedManagerEmail: '',
    assignedTrainerIds: [],
    openingHours: { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
    operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    facilitiesBreakdown: {
      cardioEquipment: true,
      weightTraining: true,
      personalTraining: true,
      swimmingPool: false,
      steamAndSauna: false,
      lockerRoom: true,
      showerFacilities: true,
      parking: true,
    },
    capacity: 150,
    settlementRatePerVisit: 250,
    heroImage: '',
    interiorGallery: '',
    emergencyContact: { name: '', phone: '', relation: 'Branch Manager' },
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
  const handleSaveBranch = async (actionType = 'SUBMIT') => {
    setActionLoading(true);
    try {
      const payload = {
        name: branchForm.name,
        branchCode: branchForm.branchCode || undefined,
        branchType: branchForm.branchType || 'Standard',
        assignedManagerName: branchForm.assignedManagerName,
        phone: branchForm.phone,
        email: branchForm.email,
        location: `${branchForm.address}, ${branchForm.city}`,
        address: branchForm.address,
        landmark: branchForm.landmark,
        city: branchForm.city,
        state: branchForm.state,
        country: branchForm.country || 'India',
        postalCode: branchForm.postalCode,
        latitude: Number(branchForm.latitude) || 19.0760,
        longitude: Number(branchForm.longitude) || 72.8777,
        capacity: Number(branchForm.capacity) || 150,
        description: branchForm.description || `${branchForm.name} luxury wellness facilities.`,
        openingHours: branchForm.openingHours,
        operatingDays: branchForm.operatingDays,
        facilitiesBreakdown: branchForm.facilitiesBreakdown,
        documents: {
          propertyLeaseDeed: { url: branchForm.propertyLeaseDeedUrl || 'https://qnox.luxury/docs/sample-lease.pdf' },
          businessRegistration: { url: branchForm.businessRegistrationUrl || 'https://qnox.luxury/docs/sample-reg.pdf' },
          operatingLicense: { url: branchForm.operatingLicenseUrl || 'https://qnox.luxury/docs/sample-license.pdf' },
          emergencyContact: branchForm.emergencyContact,
        },
        locationDocuments: [
          {
            title: 'Property Lease Agreement',
            url: branchForm.propertyLeaseDeedUrl || 'https://qnox.luxury/docs/sample-lease.pdf',
            type: 'LEASE_OR_OWNERSHIP',
          },
        ],
        heroImage: branchForm.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
        media: {
          heroImage: branchForm.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
          interiorGallery: branchForm.interiorGallery ? branchForm.interiorGallery.split(',').map((s) => s.trim()).filter(Boolean) : [],
          equipmentImages: branchForm.equipmentImages ? branchForm.equipmentImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
          exteriorImages: branchForm.exteriorImages ? branchForm.exteriorImages.split(',').map((s) => s.trim()).filter(Boolean) : [],
        },
        action: actionType,
        isDraft: actionType === 'DRAFT',
      };

      await createTenantBranch(payload);
      showToast({
        type: 'success',
        message: actionType === 'DRAFT'
          ? 'Branch saved as draft! You can submit for verification anytime.'
          : 'Branch application submitted for verification. Super Admin will audit compliance.',
      });
      setShowAddBranchModal(false);
      setBranchForm(defaultBranchForm);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSetupWizard = (branch) => {
    setSetupWizardBranch(branch);
    setWizardForm({
      assignedManagerName: branch.assignedManagerName || '',
      assignedManagerEmail: branch.assignedManagerEmail || '',
      assignedTrainerIds: trainers
        .filter((t) => String(t.branch?._id || t.branch) === String(branch._id))
        .map((t) => t._id),
      openingHours: branch.openingHours || { weekdays: '06:00 - 22:30', weekends: '07:30 - 20:00' },
      operatingDays: branch.operatingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      facilitiesBreakdown: branch.facilitiesBreakdown || {
        cardioEquipment: true,
        weightTraining: true,
        personalTraining: true,
        swimmingPool: false,
        steamAndSauna: false,
        lockerRoom: true,
        showerFacilities: true,
        parking: true,
      },
      capacity: branch.capacity || 150,
      settlementRatePerVisit: branch.settlementRatePerVisit || 250,
      heroImage: branch.heroImage || '',
      interiorGallery: branch.gallery ? branch.gallery.join(', ') : '',
      emergencyContact: branch.documents?.emergencyContact || { name: '', phone: '', relation: 'Branch Manager' },
    });
    setShowSetupWizardModal(true);
  };

  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    if (!setupWizardBranch) return;
    setActionLoading(true);
    try {
      const payload = {
        ...wizardForm,
        interiorGallery: wizardForm.interiorGallery ? wizardForm.interiorGallery.split(',').map((s) => s.trim()).filter(Boolean) : [],
        gallery: wizardForm.interiorGallery ? wizardForm.interiorGallery.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      await completeBranchSetup(setupWizardBranch._id, payload);
      showToast({ type: 'success', message: 'Operational setup completed! Branch is now Ready to Publish.' });
      setShowSetupWizardModal(false);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPublishPreview = (branch) => {
    setPublishPreviewBranch(branch);
    setShowPublishPreviewModal(true);
  };

  const handlePublishBranch = async (id) => {
    setActionLoading(true);
    try {
      await publishTenantBranch(id);
      showToast({ type: 'success', message: 'Branch published! It is now live on the public website.' });
      setShowPublishPreviewModal(false);
      loadAllTenantData();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublishBranch = async (id) => {
    if (!window.confirm('Are you sure you want to unpublish this branch? It will be hidden from the public website, but members and staff remain active.')) return;
    setActionLoading(true);
    try {
      await unpublishTenantBranch(id);
      showToast({ type: 'info', message: 'Branch unpublished from public listing.' });
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
              onClick={handleLogout}
              className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
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
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-rose-500/40 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 hover:text-white text-[11px] font-mono uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
              title="Sign Out of Gym Owner Portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
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
                {branches.map((b) => {
                  const isVerified = b.verificationStatus === 'APPROVED' || b.verificationStatus === 'ACTIVE';
                  const isPendingVerif = b.verificationStatus === 'PENDING_VERIFICATION' || b.verificationStatus === 'TERRITORY_REVIEW';
                  const isChangesRequested = b.verificationStatus === 'CHANGES_REQUESTED';
                  const isRejected = b.verificationStatus === 'REJECTED';
                  const isSetupComplete = b.setupChecklist?.completed;
                  const isReadyToPublish = b.publicationStatus === 'READY_TO_PUBLISH';
                  const isPublished = b.publicationStatus === 'PUBLISHED';
                  const isSuspended = b.operationalStatus === 'SUSPENDED';
                  const isLiveOpen = b.liveStatus === 'OPEN';

                  return (
                    <div key={b._id} className="bg-[#0b0b0b] border border-neutral-800 overflow-hidden flex flex-col justify-between group relative">
                      <div>
                        <div className="h-44 bg-neutral-900 relative overflow-hidden">
                          <img
                            src={b.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80'}
                            alt={b.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] font-mono text-[#c5a880] font-bold">
                            {b.branchCode || 'BR-MAIN'}
                          </div>
                          <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                            {/* Live Dynamic Status Badge */}
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold flex items-center space-x-1 ${
                              isLiveOpen && !isSuspended
                                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                                : 'bg-neutral-950/90 text-neutral-400 border border-neutral-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLiveOpen && !isSuspended ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                              <span>{isLiveOpen && !isSuspended ? 'LIVE: OPEN' : 'LIVE: CLOSED'}</span>
                            </span>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[9px] font-mono text-neutral-300 uppercase">
                            Type: {b.branchType || 'Standard'}
                          </div>
                        </div>

                        <div className="p-5 space-y-3 font-mono">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-serif text-lg text-white font-bold">{b.name}</h4>
                              <p className="text-[11px] text-neutral-400 flex items-center space-x-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                                <span className="truncate max-w-[200px]">{b.address || b.location}</span>
                              </p>
                            </div>
                          </div>

                          {/* 3 Strictly Independent Lifecycle Statuses */}
                          <div className="p-2.5 bg-[#121212] border border-neutral-800 space-y-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500 uppercase">Verification:</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                isVerified
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : isPendingVerif
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                                  : isChangesRequested
                                  ? 'bg-orange-950 text-orange-400 border border-orange-800/60'
                                  : isRejected
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {b.verificationStatus || 'DRAFT'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500 uppercase">Operational:</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                isSuspended
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                                  : b.operationalStatus === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {b.operationalStatus || 'INACTIVE'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-neutral-500 uppercase">Public Website:</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                                isPublished
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                                  : isReadyToPublish
                                  ? 'bg-sky-950 text-sky-300 border border-sky-500/50'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {b.publicationStatus || 'DRAFT'}
                              </span>
                            </div>
                          </div>

                          {/* Changes Requested Warning Box */}
                          {isChangesRequested && b.changeRequestNotes && (
                            <div className="p-2.5 bg-orange-950/40 border border-orange-500/40 text-orange-200 text-[10px] space-y-1">
                              <span className="font-bold flex items-center space-x-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                <span>Super Admin Requested Corrections:</span>
                              </span>
                              <p className="leading-relaxed">{b.changeRequestNotes}</p>
                              <button
                                onClick={() => setEditingBranch({ ...b })}
                                className="mt-1 text-orange-300 underline font-bold"
                              >
                                Revise Branch Details &rarr;
                              </button>
                            </div>
                          )}

                          {/* Suspension Alert Box */}
                          {isSuspended && (
                            <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[10px] space-y-1">
                              <span className="font-bold flex items-center space-x-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Branch Suspended by Platform Admin</span>
                              </span>
                              <p className="leading-relaxed">{b.suspensionReason || 'Compliance review pending.'}</p>
                            </div>
                          )}

                          {/* Key Statistics Bar */}
                          <div className="grid grid-cols-2 gap-2 text-xs p-2 bg-[#101010] border border-neutral-800/60 rounded">
                            <div>
                              <span className="text-[10px] text-neutral-500 block">COACHES</span>
                              <span className="text-white font-bold">{b.trainersCount ?? 0}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 block">CLIENTELE</span>
                              <span className="text-white font-bold">{b.membersCount ?? 0}</span>
                            </div>
                          </div>

                          {/* Workflow Action Bar */}
                          <div className="pt-1">
                            {isVerified && !isSetupComplete && (
                              <button
                                onClick={() => handleOpenSetupWizard(b)}
                                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold uppercase text-[10px] tracking-wider rounded flex items-center justify-center space-x-1.5 shadow"
                              >
                                <span>CONFIGURE SETUP (STEP 5)</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isSetupComplete && isReadyToPublish && (
                              <button
                                onClick={() => handleOpenPublishPreview(b)}
                                className="w-full py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold uppercase text-[10px] tracking-wider rounded flex items-center justify-center space-x-1.5 shadow"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>PREVIEW & PUBLISH TO WEBSITE</span>
                              </button>
                            )}

                            {isPublished && (
                              <div className="flex items-center space-x-2">
                                <a
                                  href={`/clubs/${b.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold uppercase text-[10px] tracking-wider rounded text-center flex items-center justify-center space-x-1"
                                >
                                  <span>VIEW LIVE</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  onClick={() => handleUnpublishBranch(b._id)}
                                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] uppercase rounded border border-neutral-700"
                                  title="Hide from public listing"
                                >
                                  UNPUBLISH
                                </button>
                              </div>
                            )}

                            {b.publicationStatus === 'UNPUBLISHED' && (
                              <button
                                onClick={() => handlePublishBranch(b._id)}
                                className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-wider rounded"
                              >
                                REPUBLISH TO WEBSITE
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0e0e0e] border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                        <button
                          onClick={() => handleToggleBranchStatus(b._id)}
                          className="text-neutral-400 hover:text-white transition-colors text-[11px]"
                        >
                          {b.isActive !== false ? 'Deactivate Ops' : 'Activate Ops'}
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingBranch({ ...b })}
                            className="p-1.5 text-[#c5a880] hover:text-white transition-colors"
                            title="Edit Branch Information"
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
                  );
                })}
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

      {/* MODAL 1: ADD NEW BRANCH (ENTERPRISE MULTI-SECTION WORKFLOW) */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0b0b0b] border border-[#c5a880]/30 p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-bold block">
                  MULTI-BRANCH EXPANSION PROTOCOL
                </span>
                <h3 className="text-xl font-serif text-white font-bold">Commission New Branch Facility</h3>
              </div>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs for 6 Form Sections */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-800/80 pb-3">
              {[
                { id: 'basic', label: '1. Basic Info' },
                { id: 'location', label: '2. Location' },
                { id: 'docs', label: '3. Documents' },
                { id: 'facilities', label: '4. Facilities' },
                { id: 'operating', label: '5. Operating' },
                { id: 'media', label: '6. Media' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveBranchFormSection(s.id)}
                  className={`px-3 py-1.5 uppercase font-bold text-[10px] tracking-wider rounded transition ${
                    activeBranchFormSection === s.id
                      ? 'bg-[#c5a880] text-black shadow'
                      : 'bg-[#141414] text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* SECTION 1: BASIC INFORMATION */}
              {activeBranchFormSection === 'basic' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Branch Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bandra Luxury Sanctuary"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Branch Code (Auto / Custom)</label>
                      <input
                        type="text"
                        placeholder="e.g. BR-BANDRA"
                        value={branchForm.branchCode}
                        onChange={(e) => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Branch Type</label>
                      <select
                        value={branchForm.branchType}
                        onChange={(e) => setBranchForm({ ...branchForm, branchType: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Flagship">Flagship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Branch Manager Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rohan Mehra"
                        value={branchForm.assignedManagerName}
                        onChange={(e) => setBranchForm({ ...branchForm, assignedManagerName: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Branch Official Email</label>
                    <input
                      type="email"
                      placeholder="bandra@qnoxfit.com"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 2: LOCATION INFORMATION */}
              {activeBranchFormSection === 'location' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Plot 42, Turner Road, Bandra West"
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Landmark</label>
                      <input
                        type="text"
                        placeholder="Near Linking Road Junction"
                        value={branchForm.landmark}
                        onChange={(e) => setBranchForm({ ...branchForm, landmark: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="Mumbai"
                        value={branchForm.city}
                        onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">State / Region</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={branchForm.state}
                        onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">PIN / Postal Code</label>
                      <input
                        type="text"
                        placeholder="400050"
                        value={branchForm.postalCode}
                        onChange={(e) => setBranchForm({ ...branchForm, postalCode: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">GPS Latitude (Territory Geofence)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={branchForm.latitude}
                        onChange={(e) => setBranchForm({ ...branchForm, latitude: Number(e.target.value) })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">GPS Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={branchForm.longitude}
                        onChange={(e) => setBranchForm({ ...branchForm, longitude: Number(e.target.value) })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: BUSINESS VERIFICATION DOCUMENTS */}
              {activeBranchFormSection === 'docs' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                    Super Admin verifies property lease deeds and operating licenses before granting approval. Provide public or cloud URLs for your verification dossiers.
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Property Ownership / Lease Agreement URL</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/lease-agreement.pdf"
                      value={branchForm.propertyLeaseDeedUrl}
                      onChange={(e) => setBranchForm({ ...branchForm, propertyLeaseDeedUrl: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Business Registration Certificate URL</label>
                      <input
                        type="url"
                        placeholder="https://cloud.qnox.com/business-reg.pdf"
                        value={branchForm.businessRegistrationUrl}
                        onChange={(e) => setBranchForm({ ...branchForm, businessRegistrationUrl: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Gym Operating License URL</label>
                      <input
                        type="url"
                        placeholder="https://cloud.qnox.com/operating-license.pdf"
                        value={branchForm.operatingLicenseUrl}
                        onChange={(e) => setBranchForm({ ...branchForm, operatingLicenseUrl: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#111] border border-neutral-800">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        placeholder="Anil Gupta"
                        value={branchForm.emergencyContact.name}
                        onChange={(e) => setBranchForm({
                          ...branchForm,
                          emergencyContact: { ...branchForm.emergencyContact, name: e.target.value }
                        })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98200 11223"
                        value={branchForm.emergencyContact.phone}
                        onChange={(e) => setBranchForm({
                          ...branchForm,
                          emergencyContact: { ...branchForm.emergencyContact, phone: e.target.value }
                        })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Relation / Role</label>
                      <input
                        type="text"
                        placeholder="General Manager"
                        value={branchForm.emergencyContact.relation}
                        onChange={(e) => setBranchForm({
                          ...branchForm,
                          emergencyContact: { ...branchForm.emergencyContact, relation: e.target.value }
                        })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: FACILITIES & INFRASTRUCTURE */}
              {activeBranchFormSection === 'facilities' && (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-neutral-400 block uppercase tracking-wider text-[10px]">
                    Select All Amenities Available at this Physical Branch:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'cardioEquipment', label: 'Cardio Equipment' },
                      { key: 'weightTraining', label: 'Weight Training' },
                      { key: 'personalTraining', label: 'Personal Training' },
                      { key: 'swimmingPool', label: 'Swimming Pool' },
                      { key: 'steamAndSauna', label: 'Steam & Sauna' },
                      { key: 'lockerRoom', label: 'Locker Room' },
                      { key: 'showerFacilities', label: 'Shower Facilities' },
                      { key: 'parking', label: 'Dedicated Parking' },
                    ].map((amenity) => (
                      <label
                        key={amenity.key}
                        className={`p-3 border flex items-center space-x-2.5 cursor-pointer rounded transition ${
                          branchForm.facilitiesBreakdown[amenity.key]
                            ? 'bg-[#c5a880]/15 border-[#c5a880] text-white'
                            : 'bg-[#121212] border-neutral-800 text-neutral-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={branchForm.facilitiesBreakdown[amenity.key]}
                          onChange={(e) => setBranchForm({
                            ...branchForm,
                            facilitiesBreakdown: {
                              ...branchForm.facilitiesBreakdown,
                              [amenity.key]: e.target.checked,
                            },
                          })}
                          className="accent-[#c5a880]"
                        />
                        <span className="text-[11px] font-semibold">{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: OPERATING INFO */}
              {activeBranchFormSection === 'operating' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Weekday Operating Hours</label>
                      <input
                        type="text"
                        placeholder="06:00 - 22:30"
                        value={branchForm.openingHours.weekdays}
                        onChange={(e) => setBranchForm({
                          ...branchForm,
                          openingHours: { ...branchForm.openingHours, weekdays: e.target.value }
                        })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Weekend Operating Hours</label>
                      <input
                        type="text"
                        placeholder="07:30 - 20:00"
                        value={branchForm.openingHours.weekends}
                        onChange={(e) => setBranchForm({
                          ...branchForm,
                          openingHours: { ...branchForm.openingHours, weekends: e.target.value }
                        })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Maximum Member Capacity *</label>
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      value={branchForm.capacity}
                      onChange={(e) => setBranchForm({ ...branchForm, capacity: Number(e.target.value) })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Branch Description</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the aesthetic, elite facilities, and services available..."
                      value={branchForm.description}
                      onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 6: MEDIA */}
              {activeBranchFormSection === 'media' && (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Hero Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-1540497077202-7c8a3999166f..."
                      value={branchForm.heroImage}
                      onChange={(e) => setBranchForm({ ...branchForm, heroImage: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Interior Gallery URLs (Comma-separated)</label>
                    <textarea
                      rows={2}
                      placeholder="https://example.com/interior1.jpg, https://example.com/interior2.jpg"
                      value={branchForm.interiorGallery}
                      onChange={(e) => setBranchForm({ ...branchForm, interiorGallery: e.target.value })}
                      className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Equipment Images URLs</label>
                      <input
                        type="text"
                        placeholder="Comma-separated image URLs"
                        value={branchForm.equipmentImages}
                        onChange={(e) => setBranchForm({ ...branchForm, equipmentImages: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase text-neutral-400 mb-1">Exterior Facade Image URLs</label>
                      <input
                        type="text"
                        placeholder="Comma-separated image URLs"
                        value={branchForm.exteriorImages}
                        onChange={(e) => setBranchForm({ ...branchForm, exteriorImages: e.target.value })}
                        className="w-full bg-[#141414] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions: Save as Draft vs Submit for Verification */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              <span className="text-[10px] text-neutral-500">
                * Submitted applications undergo Super Admin geofence & compliance verification.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleSaveBranch('DRAFT')}
                  className="px-4 py-2 border border-neutral-700 hover:border-neutral-500 text-neutral-300 uppercase font-bold text-[10px] tracking-wider rounded transition"
                >
                  SAVE AS DRAFT
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !branchForm.name || !branchForm.address || !branchForm.city}
                  onClick={() => handleSaveBranch('SUBMIT')}
                  className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider rounded transition disabled:opacity-40"
                >
                  {actionLoading ? 'SUBMITTING...' : 'SUBMIT FOR VERIFICATION'}
                </button>
              </div>
            </div>
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

      {/* MODAL 2B: BRANCH OPERATIONAL SETUP WIZARD (STEP 5) */}
      {showSetupWizardModal && setupWizardBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0b0b0b] border border-[#c5a880]/40 p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-bold block flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>SUPER ADMIN VERIFIED &bull; SETUP WIZARD (STEP 5)</span>
                </span>
                <h3 className="text-xl font-serif text-white font-bold">Configure Operations: {setupWizardBranch.name}</h3>
              </div>
              <button onClick={() => setShowSetupWizardModal(false)} className="text-neutral-400 hover:text-white p-1">✕</button>
            </div>

            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed">
              Complete the operational setup checklist below to transition your branch from <strong>INACTIVE</strong> to <strong>ACTIVE</strong> and unlock public website publication.
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              {/* 1. Branch Manager Assignment */}
              <div className="p-3.5 bg-[#121212] border border-neutral-800 space-y-2.5">
                <span className="text-[#c5a880] font-bold uppercase text-[10px] block">1. ASSIGN BRANCH MANAGER</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Manager Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={wizardForm.assignedManagerName}
                      onChange={(e) => setWizardForm({ ...wizardForm, assignedManagerName: e.target.value })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Manager Direct Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="vikram@sanctuary.in"
                      value={wizardForm.assignedManagerEmail}
                      onChange={(e) => setWizardForm({ ...wizardForm, assignedManagerEmail: e.target.value })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Assign Coaches / Trainers */}
              <div className="p-3.5 bg-[#121212] border border-neutral-800 space-y-2.5">
                <span className="text-[#c5a880] font-bold uppercase text-[10px] block">2. ASSIGN SANCTUARY COACHES / TRAINERS</span>
                {trainers.length === 0 ? (
                  <p className="text-neutral-500 text-[11px]">No coaches on roster yet. You can onboard coaches anytime in Coaches tab.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trainers.map((t) => {
                      const isAssigned = wizardForm.assignedTrainerIds.includes(t._id);
                      return (
                        <label
                          key={t._id}
                          className={`p-2.5 border rounded flex items-center space-x-2.5 cursor-pointer transition ${
                            isAssigned ? 'bg-[#c5a880]/15 border-[#c5a880] text-white' : 'bg-[#181818] border-neutral-800 text-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWizardForm({
                                ...wizardForm,
                                assignedTrainerIds: checked
                                  ? [...wizardForm.assignedTrainerIds, t._id]
                                  : wizardForm.assignedTrainerIds.filter((id) => id !== t._id),
                              });
                            }}
                            className="accent-[#c5a880]"
                          />
                          <div>
                            <span className="font-bold text-white block">{t.name}</span>
                            <span className="text-[10px] text-neutral-400">{t.title}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Confirm Operating Hours */}
              <div className="p-3.5 bg-[#121212] border border-neutral-800 space-y-2.5">
                <span className="text-[#c5a880] font-bold uppercase text-[10px] block">3. CONFIRM OPERATING SCHEDULE</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Weekdays Hours</label>
                    <input
                      type="text"
                      value={wizardForm.openingHours.weekdays}
                      onChange={(e) => setWizardForm({
                        ...wizardForm,
                        openingHours: { ...wizardForm.openingHours, weekdays: e.target.value }
                      })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Weekends Hours</label>
                    <input
                      type="text"
                      value={wizardForm.openingHours.weekends}
                      onChange={(e) => setWizardForm({
                        ...wizardForm,
                        openingHours: { ...wizardForm.openingHours, weekends: e.target.value }
                      })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Pricing & Settlement Rate */}
              <div className="p-3.5 bg-[#121212] border border-neutral-800 space-y-2.5">
                <span className="text-[#c5a880] font-bold uppercase text-[10px] block">4. CAPACITY & CROSS-SANCTUARY REVENUE SETTLEMENT</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Member Capacity</label>
                    <input
                      type="number"
                      value={wizardForm.capacity}
                      onChange={(e) => setWizardForm({ ...wizardForm, capacity: Number(e.target.value) })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block uppercase text-neutral-400 mb-1">Settlement Rate per Visit (₹)</label>
                    <input
                      type="number"
                      value={wizardForm.settlementRatePerVisit}
                      onChange={(e) => setWizardForm({ ...wizardForm, settlementRatePerVisit: Number(e.target.value) })}
                      className="w-full bg-[#181818] border border-neutral-800 px-3 py-2 text-white focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowSetupWizardModal(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase font-bold text-[10px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black font-bold uppercase text-[10px] tracking-wider rounded transition"
                >
                  {actionLoading ? 'SAVING CONFIGURATION...' : 'COMPLETE SETUP & UNLOCK PUBLICATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2C: PREVIEW & PUBLISH TO PUBLIC WEBSITE (STEP 7) */}
      {showPublishPreviewModal && publishPreviewBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0b0b0b] border border-sky-500/40 p-6 space-y-5 my-8 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-sky-400 font-bold block flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>STEP 7 &bull; PUBLIC LISTING PREVIEW</span>
                </span>
                <h3 className="text-xl font-serif text-white font-bold">Publish {publishPreviewBranch.name} to Website</h3>
              </div>
              <button onClick={() => setShowPublishPreviewModal(false)} className="text-neutral-400 hover:text-white p-1">✕</button>
            </div>

            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Below is an exact preview of how your verified branch will be presented to prospective luxury members on the QNOX public website discovery portal:
            </p>

            {/* Public Card Mockup */}
            <div className="bg-[#121212] border border-neutral-800 rounded overflow-hidden shadow-2xl">
              <div className="h-44 bg-neutral-900 relative">
                <img
                  src={publishPreviewBranch.heroImage || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80'}
                  alt={publishPreviewBranch.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 border border-neutral-700 text-[10px] font-bold text-[#c5a880]">
                  {publishPreviewBranch.branchCode || 'BR-MAIN'}
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE: OPEN</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif text-lg text-white font-bold">{publishPreviewBranch.name}</h4>
                    <p className="text-[11px] text-neutral-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>{publishPreviewBranch.address || publishPreviewBranch.location}</span>
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30 font-bold uppercase rounded">
                    {publishPreviewBranch.branchType || 'Standard'}
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 pt-1">
                  Hours: {publishPreviewBranch.openingHours?.weekdays || '06:00 - 22:30'} &bull; Max Cap: {publishPreviewBranch.capacity || 150} Members
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowPublishPreviewModal(false)}
                className="px-4 py-2 border border-neutral-800 text-neutral-400 uppercase font-bold text-[10px]"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handlePublishBranch(publishPreviewBranch._id)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10px] tracking-wider rounded transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>CONFIRM & PUBLISH TO WEBSITE</span>
              </button>
            </div>
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
