import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Crown, Calendar, MessageSquare, LogOut,
  MapPin, Bell, Clock, Shield, Sparkles, LayoutDashboard,
  Menu, CreditCard, Mail, Globe
} from 'lucide-react';
import {
  fetchAdminOverview, fetchRevenueAnalytics, fetchAdminMembers, exportMembersCsv, deleteMemberRecord,
  fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan, togglePlanStatus,
  fetchAllBookings, updateBookingAttendance,
  fetchTrainers, createTrainerRecord, updateTrainerRecord, deleteTrainerRecord,
  fetchClubs, createClubRecord, updateClubRecord, deleteClubRecord,
  fetchAllPayments,
  fetchAllSubscribers, dispatchNewsletterCampaign,
  fetchAllInquiries,
  fetchAdminNotifications, markNotificationRead, markAllNotificationsRead, deleteNotificationRecord, triggerAdminExpiryCheck, fetchNotificationUnreadCount,
  fetchMembershipRequests, approveMembershipRequest, rejectMembershipRequest, unfreezeActiveRequestAdmin,
  extendMembershipAdmin, suspendMembershipAdmin, reactivateMembershipAdmin, sendRenewalReminderAdmin,
  fetchAdminTrainerApplications, approveAdminTrainerApplication, rejectAdminTrainerApplication
} from '../services/api';

// Tabs
import {
  OverviewTab,
  MembersTab,
  PlansTab,
  BookingsTab,
  TrainersTab,
  TrainerApplicationsTab,
  ClubsTab,
  PaymentsTab,
  NewsletterTab,
  InquiriesTab,
  NotificationsTab,
  RequestsTab,
  NetworkTab,
} from './tabs';

// Modals
import {
  PlanModal,
  TrainerModal,
  ClubModal,
  TrainerAppDetailDrawer,
  RequestActionModal,
  ExtendMembershipModal,
} from './modals';

import ReceiptModal from './ReceiptModal';
import MemberDossierDrawer from './MemberDossierDrawer';
import AssignResidencyModal from './AssignResidencyModal';
import './AdminDashboard.css';

export default function AdminDashboard({ currentUser, onBackToSite, onLogout, onShowToast }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');

  // State for data
  const [stats, setStats] = useState({ totalMembers: 0, activeMemberships: 0, totalRevenue: 0, totalBookings: 0, pendingInquiries: 0 });
  const [recentActivities, setRecentActivities] = useState({});
  const [chartData, setChartData] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // Trainer Applications state
  const [trainerApplications, setTrainerApplications] = useState([]);
  const [pendingTrainerAppsCount, setPendingTrainerAppsCount] = useState(0);
  const [trainerAppFilter, setTrainerAppFilter] = useState('All');
  const trainerAppFilterRef = useRef(trainerAppFilter);
  useEffect(() => {
    trainerAppFilterRef.current = trainerAppFilter;
  }, [trainerAppFilter]);
  const [selectedTrainerApp, setSelectedTrainerApp] = useState(null);
  const [trainerAppRemarks, setTrainerAppRemarks] = useState('');
  const [approvingAppId, setApprovingAppId] = useState(null);

  // Notification Feed states
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const [notifStatusFilter, setNotifStatusFilter] = useState('all');
  const [notifTypeFilter, setNotifTypeFilter] = useState('all');
  const [notifSearch, setNotifSearch] = useState('');
  const [notifMetrics, setNotifMetrics] = useState({ total: 0, unread: 0, expired: 0, expiringSoon: 0, renewed: 0 });
  const [notifLoading, setNotifLoading] = useState(false);
  const [runningExpiryEngine, setRunningExpiryEngine] = useState(false);

  // Filter & Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('All');
  const [memberExpiringFilter, setMemberExpiringFilter] = useState('All');
  const [memberPlanFilter, setMemberPlanFilter] = useState('All');
  const [memberSortBy, setMemberSortBy] = useState('newest');
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberMetrics, setMemberMetrics] = useState({ total: 0, active: 0, expired: 0, frozen: 0, expiringSoon: 0, archived: 0 });
  const [selectedDossierMemberId, setSelectedDossierMemberId] = useState(null);
  const [editingPlanMember, setEditingPlanMember] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Modals for CRUD
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '', code: '', subtitle: '', description: '',
    pricing: { monthly: 1200, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
    benefits: 'Unlimited access, Slate pool, Altitude suite',
  });

  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerForm, setTrainerForm] = useState({
    name: '', role: '', title: '', badge: 'MASTER COACH', email: '', phone: '',
    bio: '', photo: '', specialties: 'Olympic Lifting, VO2 Max',
  });

  const [showClubModal, setShowClubModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({
    name: '', slug: '', location: '', address: '', tagline: '', description: '',
    heroImage: '', status: 'OPEN',
  });

  const [campaignForm, setCampaignForm] = useState({ subject: '', contentHtml: '' });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Membership Requests state
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requestsFilter, setRequestsFilter] = useState('All');
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('All');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestAction, setSelectedRequestAction] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvedDuration, setApprovedDuration] = useState(14);
  const [refundAmount, setRefundAmount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');

  // Quick Action Modals for Members
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTargetUser, setExtendTargetUser] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState('Executive courtesy extension');
  const [processingExtend, setProcessingExtend] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadOverview();
    loadAdminUnreadBadge();
    loadTrainerApplications();

    // Fast 10-second polling so newly submitted trainer applications pop up in real-time
    const interval = setInterval(() => {
      loadAdminUnreadBadge();
      loadTrainerApplications(trainerAppFilterRef.current);
    }, 10000);
    return () => clearInterval(interval);
  }, [analyticsPeriod]);

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'plans') loadPlans();
    if (activeTab === 'bookings') loadBookings();
    if (activeTab === 'trainers') loadTrainers();
    if (activeTab === 'clubs') loadClubs();
    if (activeTab === 'payments') loadPayments();
    if (activeTab === 'newsletter') loadNewsletter();
    if (activeTab === 'inquiries') loadInquiries();
    if (activeTab === 'notifications') loadNotifications();
    if (activeTab === 'requests') loadMembershipRequests();
    if (activeTab === 'trainer-applications') loadTrainerApplications();
  }, [activeTab]);

  const loadAdminUnreadBadge = async () => {
    try {
      const data = await fetchNotificationUnreadCount();
      if (data && data.unreadCount !== undefined) {
        setAdminUnreadCount(data.unreadCount);
      }
      const reqs = await fetchMembershipRequests({ status: 'Pending' });
      if (reqs) setPendingRequestsCount(reqs.length);
      const pendingAppsRes = await fetchAdminTrainerApplications({ status: 'Pending' });
      if (pendingAppsRes && pendingAppsRes.data) {
        setPendingTrainerAppsCount(pendingAppsRes.data.length);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const loadNotifications = async (status = notifStatusFilter, filterType = notifTypeFilter, search = notifSearch) => {
    setNotifLoading(true);
    try {
      const res = await fetchAdminNotifications({
        status: status === 'all' ? undefined : status,
        type: filterType === 'all' ? undefined : filterType,
        search: search || undefined,
      });
      if (res && res.data) {
        setAdminNotifications(res.data);
        if (res.metrics) setNotifMetrics(res.metrics);
        if (res.unreadCount !== undefined) setAdminUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.warn(err.message);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleRunExpiryEngine = async () => {
    setRunningExpiryEngine(true);
    try {
      const res = await triggerAdminExpiryCheck();
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: `Expiry engine finished. ${res.data?.processedCount || 0} alerts processed across membership rosters.`,
        });
      }
      loadNotifications();
      loadAdminUnreadBadge();
      loadOverview();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setRunningExpiryEngine(false);
    }
  };

  const handleMarkNotifAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      loadNotifications();
      loadAdminUnreadBadge();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await markAllNotificationsRead();
      if (onShowToast) onShowToast({ type: 'success', message: 'All surveillance notifications marked as acknowledged.' });
      loadNotifications();
      loadAdminUnreadBadge();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await deleteNotificationRecord(id);
      loadNotifications();
      loadAdminUnreadBadge();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const loadMembershipRequests = async () => {
    setLoadingRequests(true);
    try {
      const params = {};
      if (requestsFilter !== 'All') params.type = requestsFilter;
      if (requestsStatusFilter !== 'All') params.status = requestsStatusFilter;
      const res = await fetchMembershipRequests(params);
      if (res) {
        setMembershipRequests(res);
        const pendingCount = res.filter((r) => r.status === 'Pending').length;
        setPendingRequestsCount(pendingCount);
      }
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequestAction?.request) return;
    try {
      if (selectedRequestAction.action === 'unfreeze') {
        await unfreezeActiveRequestAdmin(selectedRequestAction.request._id, {
          adminRemarks: approvalNotes || 'Unfrozen early by admin concierge.',
        });
        if (onShowToast) onShowToast({ type: 'success', message: 'Membership unfrozen and privileges restored.' });
      } else {
        await approveMembershipRequest(selectedRequestAction.request._id, {
          adminNotes: approvalNotes,
          approvedDuration: Number(approvedDuration) || undefined,
          refundAmount: Number(refundAmount) || 0,
        });
        if (onShowToast) onShowToast({ type: 'success', message: 'Membership request approved.' });
      }
      setSelectedRequestAction(null);
      setApprovalNotes('');
      setRefundAmount(0);
      loadMembershipRequests();
      loadAdminUnreadBadge();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleRejectRequest = async (e) => {
    e.preventDefault();
    if (!selectedRequestAction?.request) return;
    try {
      await rejectMembershipRequest(selectedRequestAction.request._id, {
        rejectionReason: rejectionReason || 'Policy non-compliance',
      });
      if (onShowToast) onShowToast({ type: 'info', message: 'Membership request rejected.' });
      setSelectedRequestAction(null);
      setRejectionReason('');
      loadMembershipRequests();
      loadAdminUnreadBadge();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendTargetUser) return;
    setProcessingExtend(true);
    try {
      const res = await extendMembershipAdmin(extendTargetUser._id, {
        extensionDays: Number(extendDays),
        reason: extendReason,
      });
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Residency extended.' });
      setShowExtendModal(false);
      setExtendTargetUser(null);
      loadMembers();
      loadOverview();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingExtend(false);
    }
  };

  const handleSendReminder = async (userId, memberName) => {
    try {
      await sendRenewalReminderAdmin(userId);
      if (onShowToast) onShowToast({ type: 'success', message: `Renewal reminder sent to ${memberName}.` });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleSuspendMember = async (userId, memberName) => {
    const reason = window.prompt(`Enter administrative reason to suspend residency for ${memberName}:`, 'Disciplinary review or facility rule breach');
    if (!reason) return;
    try {
      const res = await suspendMembershipAdmin(userId, { reason });
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
      loadMembers();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleReactivateMember = async (userId, memberName) => {
    if (!window.confirm(`Reactivate sanctuary residency privileges for ${memberName}?`)) return;
    try {
      const res = await reactivateMembershipAdmin(userId);
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
      loadMembers();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const loadOverview = async () => {
    try {
      const data = await fetchAdminOverview();
      if (data) {
        setStats(data.stats || {});
        setRecentActivities(data.recentActivities || {});
      }
      const analytics = await fetchRevenueAnalytics(analyticsPeriod);
      if (analytics) setChartData(analytics);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadMembers = async (page = 1) => {
    try {
      const params = {
        search: memberSearch,
        status: memberStatusFilter,
        sortBy: memberSortBy,
        page,
        limit: 10,
      };
      if (memberExpiringFilter !== 'All') params.expiringDays = memberExpiringFilter;
      if (memberPlanFilter !== 'All') params.plan = memberPlanFilter;
      const res = await fetchAdminMembers(params);
      if (res && res.data) {
        setMembers(res.data);
        if (res.metrics) setMemberMetrics(res.metrics);
        if (res.page) setMemberPage(res.page);
        if (res.totalPages) setMemberTotalPages(res.totalPages);
      }
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await fetchMembershipPlans(true);
      if (data) setPlans(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await fetchAllBookings();
      if (data) setBookings(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadTrainers = async () => {
    try {
      const data = await fetchTrainers(true);
      if (data) setTrainers(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadClubs = async () => {
    try {
      const data = await fetchClubs();
      if (data) setClubs(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadPayments = async () => {
    try {
      const data = await fetchAllPayments();
      if (data) setPayments(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadNewsletter = async () => {
    try {
      const data = await fetchAllSubscribers();
      if (data) setSubscribers(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const loadInquiries = async () => {
    try {
      const data = await fetchAllInquiries();
      if (data) setInquiries(data);
    } catch (err) {
      console.warn(err.message);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planForm,
        benefits: typeof planForm.benefits === 'string'
          ? planForm.benefits.split(',').map((s) => s.trim())
          : planForm.benefits,
      };

      if (editingPlan) {
        await updateMembershipPlan(editingPlan._id, payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'Residency plan updated.' });
      } else {
        await createMembershipPlan(payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'New residency tier commissioned.' });
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      loadPlans();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleTogglePlan = async (id) => {
    try {
      await togglePlanStatus(id);
      loadPlans();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`Delete plan ${name}?`)) return;
    try {
      await deleteMembershipPlan(id);
      loadPlans();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleSaveTrainer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...trainerForm,
        specialties: typeof trainerForm.specialties === 'string'
          ? trainerForm.specialties.split(',').map((s) => s.trim())
          : trainerForm.specialties,
      };

      if (editingTrainer) {
        await updateTrainerRecord(editingTrainer._id, payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'Trainer updated.' });
      } else {
        await createTrainerRecord(payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'Master coach added.' });
      }
      setShowTrainerModal(false);
      setEditingTrainer(null);
      loadTrainers();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteTrainer = async (id) => {
    if (!window.confirm('Delete this trainer profile permanently?')) return;
    try {
      await deleteTrainerRecord(id);
      loadTrainers();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const loadTrainerApplications = async (overrideFilter) => {
    const currentFilter = overrideFilter !== undefined ? overrideFilter : trainerAppFilterRef.current;
    try {
      const res = await fetchAdminTrainerApplications({ status: currentFilter !== 'All' ? currentFilter : undefined });
      if (res.success && res.data) {
        setTrainerApplications(res.data);
      }
      const pendingRes = await fetchAdminTrainerApplications({ status: 'Pending' });
      if (pendingRes && pendingRes.data) {
        setPendingTrainerAppsCount(pendingRes.data.length);
      } else if (res.success && res.data) {
        setPendingTrainerAppsCount(res.data.filter((a) => a.status === 'Pending').length);
      }
    } catch (err) {
      console.error('[Admin] loadTrainerApplications error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'trainer-applications') {
      loadTrainerApplications(trainerAppFilter);
    }
  }, [trainerAppFilter]);

  const handleApproveTrainerApp = async (id, customRemarks) => {
    setApprovingAppId(id);
    const remarks = customRemarks !== undefined ? customRemarks : trainerAppRemarks;

    setTrainerApplications((prev) =>
      prev.map((app) => (app._id === id || app.applicationId === id ? { ...app, status: 'Approved' } : app))
    );

    try {
      const res = await approveAdminTrainerApplication(id, remarks);
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Trainer application approved instantly!' });
      setSelectedTrainerApp(null);
      setTrainerAppRemarks('');
      loadTrainerApplications();
      loadTrainers();
    } catch (err) {
      loadTrainerApplications();
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setApprovingAppId(null);
    }
  };

  const handleRejectTrainerApp = async (id) => {
    setTrainerApplications((prev) =>
      prev.map((app) => (app._id === id || app.applicationId === id ? { ...app, status: 'Rejected' } : app))
    );

    try {
      const res = await rejectAdminTrainerApplication(id, trainerAppRemarks || 'Application did not meet compliance standards.');
      if (onShowToast) onShowToast({ type: 'info', message: res.message || 'Application rejected.' });
      setSelectedTrainerApp(null);
      setTrainerAppRemarks('');
      loadTrainerApplications();
    } catch (err) {
      loadTrainerApplications();
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleSaveClub = async (e) => {
    e.preventDefault();
    try {
      if (editingClub) {
        await updateClubRecord(editingClub._id, clubForm);
        if (onShowToast) onShowToast({ type: 'success', message: 'Sanctuary updated.' });
      } else {
        await createClubRecord(clubForm);
        if (onShowToast) onShowToast({ type: 'success', message: 'New sanctuary commissioned.' });
      }
      setShowClubModal(false);
      setEditingClub(null);
      loadClubs();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteClub = async (id) => {
    if (!window.confirm('Decommission this sanctuary from QNOX portfolio?')) return;
    try {
      await deleteClubRecord(id);
      loadClubs();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleSetAttendance = async (id, status) => {
    try {
      await updateBookingAttendance(id, status);
      if (onShowToast) onShowToast({ type: 'success', message: `Attendance marked ${status}.` });
      loadBookings();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    setSendingCampaign(true);
    try {
      const res = await dispatchNewsletterCampaign(campaignForm);
      if (onShowToast) onShowToast({ type: 'success', message: res.message || 'Campaign dispatched.' });
      setCampaignForm({ subject: '', contentHtml: '' });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSendingCampaign(false);
    }
  };

  const navSections = [
    {
      title: 'CORE INTELLIGENCE',
      items: [
        { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
        {
          id: 'notifications',
          label: 'Expiry Alerts',
          icon: Bell,
          badge: adminUnreadCount > 0 ? adminUnreadCount : null,
          badgeColor: 'bg-rose-500 text-white animate-pulse',
        },
        {
          id: 'requests',
          label: 'Residency Requests',
          icon: Clock,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
          badgeColor: 'bg-sky-400 text-black font-bold',
        },
      ],
    },
    {
      title: 'TRAINER MANAGEMENT',
      items: [
        {
          id: 'trainer-applications',
          label: 'Trainer Applications',
          icon: Shield,
          badge: pendingTrainerAppsCount > 0 ? pendingTrainerAppsCount : null,
          badgeColor: 'bg-[#c5a880] text-black font-bold animate-pulse',
        },
        { id: 'trainers', label: 'Master Coaches Roster', icon: Sparkles },
      ],
    },
    {
      title: 'SANCTUARY RESIDENCY',
      items: [
        { id: 'members', label: 'Members Dossier', icon: Users, badge: memberMetrics.total ? String(memberMetrics.total) : null, badgeColor: 'bg-white/10 text-neutral-300 font-mono' },
        { id: 'plans', label: 'Membership Tiers', icon: Crown },
        { id: 'bookings', label: 'Class Sessions', icon: Calendar },
        { id: 'clubs', label: 'Clubs Portfolio', icon: MapPin },
      ],
    },
    {
      title: 'FINANCE & OPERATIONS',
      items: [
        { id: 'payments', label: 'Financial Audit', icon: CreditCard },
        {
          id: 'inquiries',
          label: 'VIP Tour Inquiries',
          icon: MessageSquare,
          badge: stats.pendingInquiries > 0 ? stats.pendingInquiries : null,
          badgeColor: 'bg-amber-400 text-black font-bold',
        },
        { id: 'newsletter', label: 'Inner Circle Letters', icon: Mail },
      ],
    },
    {
      title: 'MULTI-GYM SAAS & NETWORK',
      items: [
        { id: 'network', label: 'Multi-Gym & Network', icon: Globe },
      ],
    },
  ];

  const currentNav = navSections.flatMap((s) => s.items).find((i) => i.id === activeTab);

  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f5] flex font-sans antialiased selection:bg-[#c5a880] selection:text-black">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Modern Dashboard Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#090909] border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#080808]">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-serif text-2xl font-bold tracking-[0.28em] text-white">Q N O X</span>
              <span className="text-[9px] px-2 py-0.5 bg-[#c5a880] text-black font-extrabold uppercase tracking-widest">
                SUITE
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] tracking-[0.2em] text-neutral-400 uppercase font-mono">
                EXECUTIVE COMMAND
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Categorized Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 qnox-sidebar-scroll">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <div className="px-3 pb-1 text-[9px] font-mono tracking-[0.25em] text-neutral-500 uppercase font-bold">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`qnox-sidebar-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#c5a880]' : 'text-neutral-500'}`} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`qnox-sidebar-badge ${item.badgeColor || 'bg-white/10 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Executive Profile Card */}
        <div className="p-4 border-t border-white/10 bg-[#080808]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#181818] border border-white/20 flex items-center justify-center font-serif text-xs text-[#c5a880]">
                {currentUser?.name?.substring(0, 2).toUpperCase() || 'EX'}
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {currentUser?.name || 'Executive Admin'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono uppercase">
                  {currentUser?.role || 'Super Admin'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <button
              onClick={onBackToSite}
              className="py-1.5 px-2 bg-white/5 hover:bg-white/10 text-[10px] uppercase font-bold tracking-wider text-neutral-300 hover:text-white flex items-center justify-center space-x-1"
            >
              <span>LIVE SITE</span>
            </button>
            <button
              onClick={onLogout}
              className="py-1.5 px-2 border border-rose-900/40 text-[10px] uppercase font-bold tracking-wider text-rose-400 hover:bg-rose-950/30 flex items-center justify-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Command Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070707]">
        {/* Top Control Header */}
        <header className="h-16 border-b border-white/10 px-6 sm:px-10 flex items-center justify-between bg-[#080808] sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white border border-white/10"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-neutral-400 font-mono tracking-widest uppercase flex items-center space-x-2">
                <span>COMMAND CENTER</span>
                <span>&bull;</span>
                <span className="text-[#c5a880]">{currentNav?.label || 'DASHBOARD'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {pendingTrainerAppsCount > 0 && (
              <button
                onClick={() => setActiveTab('trainer-applications')}
                className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold rounded flex items-center space-x-2 animate-pulse"
                title="View Pending Trainer Applications"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{pendingTrainerAppsCount} Trainer Application{pendingTrainerAppsCount > 1 ? 's' : ''} Pending</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('notifications')}
              className={`p-2 border relative transition ${
                activeTab === 'notifications'
                  ? 'border-[#c5a880] text-[#c5a880]'
                  : 'border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
              }`}
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </header>

        {/* Dashboard Dynamic Tab Content */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-10">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              chartData={chartData}
              analyticsPeriod={analyticsPeriod}
              setAnalyticsPeriod={setAnalyticsPeriod}
              recentActivities={recentActivities}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              members={members}
              memberMetrics={memberMetrics}
              memberSearch={memberSearch}
              setMemberSearch={setMemberSearch}
              memberStatusFilter={memberStatusFilter}
              setMemberStatusFilter={setMemberStatusFilter}
              memberExpiringFilter={memberExpiringFilter}
              setMemberExpiringFilter={setMemberExpiringFilter}
              setMemberPlanFilter={setMemberPlanFilter}
              memberSortBy={memberSortBy}
              setMemberSortBy={setMemberSortBy}
              memberPage={memberPage}
              memberTotalPages={memberTotalPages}
              loadMembers={loadMembers}
              setSelectedDossierMemberId={setSelectedDossierMemberId}
              setEditingPlanMember={setEditingPlanMember}
              setExtendTargetUser={setExtendTargetUser}
              setExtendDays={setExtendDays}
              setShowExtendModal={setShowExtendModal}
              handleReactivateMember={handleReactivateMember}
              handleSuspendMember={handleSuspendMember}
              handleSendReminder={handleSendReminder}
              deleteMemberRecord={deleteMemberRecord}
              exportMembersCsv={exportMembersCsv}
            />
          )}

          {activeTab === 'plans' && (
            <PlansTab
              plans={plans}
              setShowPlanModal={setShowPlanModal}
              setEditingPlan={setEditingPlan}
              setPlanForm={setPlanForm}
              handleTogglePlan={handleTogglePlan}
              handleDeletePlan={handleDeletePlan}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              loadBookings={loadBookings}
              handleSetAttendance={handleSetAttendance}
            />
          )}

          {activeTab === 'trainers' && (
            <TrainersTab
              trainers={trainers}
              setShowTrainerModal={setShowTrainerModal}
              setEditingTrainer={setEditingTrainer}
              setTrainerForm={setTrainerForm}
              handleDeleteTrainer={handleDeleteTrainer}
            />
          )}

          {activeTab === 'trainer-applications' && (
            <TrainerApplicationsTab
              trainerApplications={trainerApplications}
              pendingTrainerAppsCount={pendingTrainerAppsCount}
              trainerAppFilter={trainerAppFilter}
              setTrainerAppFilter={setTrainerAppFilter}
              setSelectedTrainerApp={setSelectedTrainerApp}
              setTrainerAppRemarks={setTrainerAppRemarks}
              approvingAppId={approvingAppId}
              handleApproveTrainerApp={handleApproveTrainerApp}
              loadTrainerApplications={loadTrainerApplications}
            />
          )}

          {activeTab === 'clubs' && (
            <ClubsTab
              clubs={clubs}
              setShowClubModal={setShowClubModal}
              setEditingClub={setEditingClub}
              setClubForm={setClubForm}
              handleDeleteClub={handleDeleteClub}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsTab
              payments={payments}
              setSelectedReceipt={setSelectedReceipt}
            />
          )}

          {activeTab === 'newsletter' && (
            <NewsletterTab
              subscribers={subscribers}
              campaignForm={campaignForm}
              setCampaignForm={setCampaignForm}
              sendingCampaign={sendingCampaign}
              handleSendCampaign={handleSendCampaign}
            />
          )}

          {activeTab === 'inquiries' && (
            <InquiriesTab inquiries={inquiries} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              adminNotifications={adminNotifications}
              notifStatusFilter={notifStatusFilter}
              setNotifStatusFilter={setNotifStatusFilter}
              notifTypeFilter={notifTypeFilter}
              setNotifTypeFilter={setNotifTypeFilter}
              notifSearch={notifSearch}
              setNotifSearch={setNotifSearch}
              notifMetrics={notifMetrics}
              notifLoading={notifLoading}
              runningExpiryEngine={runningExpiryEngine}
              loadNotifications={loadNotifications}
              handleRunExpiryEngine={handleRunExpiryEngine}
              handleMarkAllNotifsAsRead={handleMarkAllNotifsAsRead}
              handleMarkNotifAsRead={handleMarkNotifAsRead}
              handleDeleteNotif={handleDeleteNotif}
              setSelectedDossierMemberId={setSelectedDossierMemberId}
              setEditingPlanMember={setEditingPlanMember}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsTab
              membershipRequests={membershipRequests}
              requestsFilter={requestsFilter}
              setRequestsFilter={setRequestsFilter}
              requestsStatusFilter={requestsStatusFilter}
              setRequestsStatusFilter={setRequestsStatusFilter}
              loadingRequests={loadingRequests}
              loadMembershipRequests={loadMembershipRequests}
              setSelectedRequestAction={setSelectedRequestAction}
            />
          )}

          {activeTab === 'network' && (
            <NetworkTab onShowToast={onShowToast} />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <PlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        editingPlan={editingPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        handleSavePlan={handleSavePlan}
      />

      <TrainerModal
        isOpen={showTrainerModal}
        onClose={() => setShowTrainerModal(false)}
        editingTrainer={editingTrainer}
        trainerForm={trainerForm}
        setTrainerForm={setTrainerForm}
        handleSaveTrainer={handleSaveTrainer}
      />

      <ClubModal
        isOpen={showClubModal}
        onClose={() => setShowClubModal(false)}
        editingClub={editingClub}
        clubForm={clubForm}
        setClubForm={setClubForm}
        handleSaveClub={handleSaveClub}
      />

      <TrainerAppDetailDrawer
        app={selectedTrainerApp}
        onClose={() => setSelectedTrainerApp(null)}
        trainerAppRemarks={trainerAppRemarks}
        setTrainerAppRemarks={setTrainerAppRemarks}
        approvingAppId={approvingAppId}
        handleApproveTrainerApp={handleApproveTrainerApp}
        handleRejectTrainerApp={handleRejectTrainerApp}
      />

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />

      {Boolean(selectedDossierMemberId) && (
        <MemberDossierDrawer
          memberId={selectedDossierMemberId}
          initialMember={members.find((x) => x._id === selectedDossierMemberId)}
          trainers={trainers}
          onClose={() => setSelectedDossierMemberId(null)}
          onUpdated={() => {
            loadMembers(memberPage);
            loadOverview();
          }}
        />
      )}

      <AssignResidencyModal
        isOpen={Boolean(editingPlanMember)}
        member={editingPlanMember}
        plans={plans}
        onClose={() => setEditingPlanMember(null)}
        onSuccess={() => {
          loadMembers(memberPage);
          loadOverview();
          if (onShowToast) onShowToast({ type: 'success', message: 'Residency tier successfully commissioned' });
        }}
      />

      <RequestActionModal
        selectedRequestAction={selectedRequestAction}
        onClose={() => setSelectedRequestAction(null)}
        approvalNotes={approvalNotes}
        setApprovalNotes={setApprovalNotes}
        approvedDuration={approvedDuration}
        setApprovedDuration={setApprovedDuration}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        handleApproveRequest={handleApproveRequest}
        handleRejectRequest={handleRejectRequest}
      />

      <ExtendMembershipModal
        isOpen={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setExtendTargetUser(null);
        }}
        extendTargetUser={extendTargetUser}
        extendDays={extendDays}
        setExtendDays={setExtendDays}
        extendReason={extendReason}
        setExtendReason={setExtendReason}
        processingExtend={processingExtend}
        handleConfirmExtend={handleExtendSubmit}
      />
    </div>
  );
}
