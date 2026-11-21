import React, { useState, useEffect } from 'react';
import {
  Users, Crown, DollarSign, Calendar, MessageSquare, ArrowLeft, LogOut, Search,
  Plus, Edit, Trash2, CheckCircle, XCircle, X, Download, Send, RefreshCw, Eye, Shield, MapPin,
  Bell, Clock, AlertTriangle, Phone, Mail, ExternalLink, Check, Sparkles, Pause, Play, Power, ShieldAlert,
  LayoutDashboard, Menu, ChevronRight, Activity, TrendingUp, Layers, CreditCard
} from 'lucide-react';
import {
  fetchAdminOverview, fetchRevenueAnalytics, fetchAdminMembers, exportMembersCsv, updateMemberResidency, deleteMemberRecord,
  fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan, togglePlanStatus,
  fetchAllBookings, updateBookingAttendance, cancelClassBooking,
  fetchTrainers, createTrainerRecord, updateTrainerRecord, deleteTrainerRecord,
  fetchClubs, createClubRecord, updateClubRecord, deleteClubRecord,
  fetchAllPayments, refundPaymentRecord,
  fetchAllSubscribers, exportSubscribersCsv, dispatchNewsletterCampaign,
  fetchAllInquiries,
  fetchAdminNotifications, markNotificationRead, markAllNotificationsRead, deleteNotificationRecord, triggerAdminExpiryCheck, fetchNotificationUnreadCount,
  fetchMembershipRequests, approveMembershipRequest, rejectMembershipRequest, fetchMembershipStats,
  extendMembershipAdmin, suspendMembershipAdmin, reactivateMembershipAdmin, sendRenewalReminderAdmin
} from '../services/api';
import ReceiptModal from './ReceiptModal';
import ImageUploadField from './ImageUploadField';
import MemberDossierDrawer from './MemberDossierDrawer';
import AssignResidencyModal from './AssignResidencyModal';
import './AdminDashboard.css';

export default function AdminDashboard({ currentUser, onBackToSite, onLogout, onShowToast }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, members, plans, bookings, trainers, clubs, payments, newsletter, inquiries
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly'); // 'monthly' | 'weekly'
  
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
  const [requestsFilter, setRequestsFilter] = useState('All'); // All, Freeze, Cancellation
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('All'); // All, Pending, Approved, Rejected
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestAction, setSelectedRequestAction] = useState(null); // { request, action: 'approve' | 'reject' }
  const [approvalNotes, setApprovalNotes] = useState('');
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
    const interval = setInterval(loadAdminUnreadBadge, 30000);
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
  }, [activeTab]);

  const loadAdminUnreadBadge = async () => {
    try {
      const count = await fetchNotificationUnreadCount();
      setAdminUnreadCount(count);
      const reqs = await fetchMembershipRequests({ status: 'Pending' });
      if (reqs) setPendingRequestsCount(reqs.length);
    } catch (err) {
      console.warn(err);
    }
  };

  const loadNotifications = async (status = notifStatusFilter, filterType = notifTypeFilter, search = notifSearch) => {
    setNotifLoading(true);
    try {
      const res = await fetchAdminNotifications({ status, filterType, search });
      if (res && res.data) {
        setAdminNotifications(res.data);
        if (res.metrics) {
          setNotifMetrics(res.metrics);
          setAdminUnreadCount(res.metrics.unread || 0);
        }
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
          message: `Engine Complete: ${res.data?.processedMembers || 0} members evaluated, ${res.data?.markedExpired || 0} marked expired, ${res.data?.notificationsCreated || 0} alerts dispatched.`,
        });
      }
      await loadNotifications();
      await loadAdminUnreadBadge();
      loadMembers(memberPage);
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
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await markAllNotificationsRead('admin');
      if (onShowToast) onShowToast({ type: 'success', message: 'All expiry alerts marked as read.' });
      loadNotifications();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await deleteNotificationRecord(id);
      loadNotifications();
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
      const data = await fetchMembershipRequests(params);
      if (data) {
        setMembershipRequests(data);
        const pendingCount = data.filter((r) => r.status === 'Pending').length;
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
      await approveMembershipRequest(selectedRequestAction.request._id, {
        adminNotes: approvalNotes,
        refundAmount: Number(refundAmount) || 0,
      });
      if (onShowToast) onShowToast({ type: 'success', message: 'Membership request successfully approved.' });
      setSelectedRequestAction(null);
      setApprovalNotes('');
      setRefundAmount(0);
      loadMembershipRequests();
      loadMembers();
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
      if (onShowToast) onShowToast({ type: 'success', message: 'Membership request has been rejected.' });
      setSelectedRequestAction(null);
      setRejectionReason('');
      loadMembershipRequests();
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
        days: extendDays,
        reason: extendReason,
      });
      if (onShowToast) onShowToast({ type: 'success', message: res.message });
      setShowExtendModal(false);
      setExtendTargetUser(null);
      loadMembers();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setProcessingExtend(false);
    }
  };

  const handleSendReminder = async (userId, memberName) => {
    try {
      const res = await sendRenewalReminderAdmin(userId);
      if (onShowToast) onShowToast({ type: 'success', message: `Personalized renewal reminder sent to ${memberName}.` });
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

  // Plan Handlers
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planForm,
        benefits: typeof planForm.benefits === 'string'
          ? planForm.benefits.split(',').map(s => s.trim())
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

  // Trainer Handlers
  const handleSaveTrainer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...trainerForm,
        specialties: typeof trainerForm.specialties === 'string'
          ? trainerForm.specialties.split(',').map(s => s.trim())
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

  // Club Handlers
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

  // Booking Attendance
  const handleSetAttendance = async (id, status) => {
    try {
      await updateBookingAttendance(id, status);
      if (onShowToast) onShowToast({ type: 'success', message: `Attendance marked ${status}.` });
      loadBookings();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  // Newsletter Campaign
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

  const maxChartVal = chartData.reduce((acc, cur) => Math.max(acc, cur.revenue || 0), 1);

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
      title: 'SANCTUARY RESIDENCY',
      items: [
        { id: 'members', label: 'Members Dossier', icon: Users, badge: memberMetrics.total ? String(memberMetrics.total) : null, badgeColor: 'bg-white/10 text-neutral-300 font-mono' },
        { id: 'plans', label: 'Membership Tiers', icon: Crown },
        { id: 'bookings', label: 'Class Sessions', icon: Calendar },
        { id: 'trainers', label: 'Master Coaches', icon: Sparkles },
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
  ];

  const currentNav = navSections.flatMap(s => s.items).find(i => i.id === activeTab);

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
            <X className="w-4 h-4" />
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
                      <div className="flex items-center space-x-3 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#c5a880]' : 'text-neutral-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 ml-2 flex-shrink-0 ${item.badgeColor || 'bg-white/10 text-neutral-300'}`}>
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

        {/* Sidebar Footer: Admin Profile & Actions */}
        <div className="p-4 border-t border-white/10 bg-[#080808]">
          <div className="flex items-center space-x-3 mb-3 p-2 bg-white/[0.02] border border-white/5">
            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-[#c5a880]/50 flex items-center justify-center text-xs font-serif text-[#c5a880] font-bold">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Sanctuary Admin'}</div>
              <div className="text-[10px] text-neutral-500 font-mono tracking-wider truncate">
                {currentUser?.role || 'Super Admin'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onBackToSite}
              className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-white/10 hover:border-[#c5a880] text-neutral-300 hover:text-white transition flex items-center justify-center space-x-1"
              title="Return to Public Website"
            >
              <ExternalLink className="w-3 h-3" />
              <span>LIVE SITE</span>
            </button>
            <button
              onClick={onLogout}
              className="px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 transition flex items-center justify-center space-x-1"
              title="End Executive Session"
            >
              <LogOut className="w-3 h-3" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden bg-[#050505]">
        {/* Sticky Dashboard Topbar */}
        <header className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur-md border-b border-white/10 px-6 lg:px-10 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white border border-white/10"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
                <span className="hidden sm:inline">QNOX SANCTUARY</span>
                <span className="hidden sm:inline text-neutral-600">/</span>
                <span className="text-[#c5a880] uppercase tracking-wider font-semibold">
                  {currentNav?.label || 'DASHBOARD'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Run Expiry Engine Fast Shortcut */}
            <button
              onClick={handleRunExpiryEngine}
              disabled={runningExpiryEngine}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 border border-white/15 hover:border-[#c5a880] text-[10px] tracking-wider uppercase font-mono text-neutral-300 hover:text-white transition disabled:opacity-50"
              title="Trigger background membership expiration audit"
            >
              <RefreshCw className={`w-3 h-3 text-[#c5a880] ${runningExpiryEngine ? 'animate-spin' : ''}`} />
              <span>{runningExpiryEngine ? 'AUDITING...' : 'RUN EXPIRY ENGINE'}</span>
            </button>

            {/* Quick Notifications Button */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2 border transition flex items-center ${
                activeTab === 'notifications'
                  ? 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10'
                  : 'border-white/10 text-neutral-300 hover:border-white/30'
              }`}
              title="View Expiry Alerts"
            >
              <Bell className="w-4 h-4 text-[#c5a880]" />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 text-[8px] font-bold bg-rose-600 text-white rounded-full animate-pulse shadow-md">
                  {adminUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={onBackToSite}
              className="hidden sm:inline-flex px-3.5 py-1.5 border border-white/10 hover:border-white/30 text-neutral-300 text-xs tracking-wider uppercase"
            >
              WEBSITE
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs tracking-wider uppercase transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Content Body */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
        
        {/* ================= TAB 1: OVERVIEW & ANALYTICS ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="qnox-stat-card">
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold">TOTAL MEMBERS</span>
                  <Users className="w-4 h-4 text-[#c5a880]" />
                </div>
                <div className="font-serif text-3xl text-white font-bold">{stats.totalMembers}</div>
                <p className="text-[10px] text-emerald-400 mt-1">&uarr; +18% this month</p>
              </div>

              <div className="qnox-stat-card">
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold">ACTIVE PLANS</span>
                  <Crown className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-serif text-3xl text-white font-bold">{stats.activeMemberships}</div>
                <p className="text-[10px] text-neutral-500 mt-1">High retention rate (92%)</p>
              </div>

              <div className="qnox-stat-card">
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold">TOTAL REVENUE</span>
                  <DollarSign className="w-4 h-4 text-[#c5a880]" />
                </div>
                <div className="font-serif text-3xl text-white font-bold">
                  ₹{stats.totalRevenue >= 100000 ? `${(stats.totalRevenue / 100000).toFixed(1)}L` : stats.totalRevenue}
                </div>
                <p className="text-[10px] text-emerald-400 mt-1">Via Razorpay Gateway</p>
              </div>

              <div className="qnox-stat-card">
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold">CLASS BOOKINGS</span>
                  <Calendar className="w-4 h-4 text-sky-400" />
                </div>
                <div className="font-serif text-3xl text-white font-bold">{stats.totalBookings}</div>
                <p className="text-[10px] text-neutral-500 mt-1">Across 6 Sanctuaries</p>
              </div>

              <div className="qnox-stat-card col-span-2 md:col-span-1">
                <div className="flex items-center justify-between text-neutral-500 mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold">TOUR REQUESTS</span>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-serif text-3xl text-white font-bold">{stats.pendingInquiries}</div>
                <p className="text-[10px] text-amber-400 mt-1">Awaiting concierge call</p>
              </div>
            </div>

            {/* Revenue Analytics Interactive Chart */}
            <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-semibold block mb-1">
                    EXECUTIVE FINANCIAL PERFORMANCE
                  </span>
                  <h3 className="font-serif text-2xl text-white">Revenue & Membership Trajectory</h3>
                </div>

                <div className="flex items-center space-x-2 bg-[#121212] p-1 border border-white/10">
                  <button
                    onClick={() => setAnalyticsPeriod('monthly')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                      analyticsPeriod === 'monthly' ? 'bg-[#c5a880] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    MONTHLY
                  </button>
                  <button
                    onClick={() => setAnalyticsPeriod('weekly')}
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                      analyticsPeriod === 'weekly' ? 'bg-[#c5a880] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    THIS WEEK
                  </button>
                </div>
              </div>

              {/* Bar Graph Visual */}
              <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4 border-b border-white/10">
                {chartData.map((item, idx) => {
                  const label = item.month || item.day;
                  const rev = item.revenue || 0;
                  const heightPercent = Math.max(12, Math.round((rev / maxChartVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] text-[#c5a880] font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                        ₹{(rev / 1000).toFixed(0)}k
                      </span>
                      <div
                        className="w-full max-w-[42px] bg-[#c5a880] rounded-none qnox-chart-bar"
                        style={{ height: `${heightPercent}%`, backgroundColor: '#c5a880' }}
                      />
                      <span className="text-xs text-neutral-400 font-mono mt-3 uppercase">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activities Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0a0a0a] border border-white/10 p-6">
                <h4 className="font-serif text-lg text-white mb-4">Latest Razorpay Payments</h4>
                <div className="space-y-3">
                  {recentActivities.payments?.map(p => (
                    <div key={p._id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                      <div>
                        <div className="text-white font-medium">{p.userName}</div>
                        <div className="text-neutral-500 font-mono text-[11px]">{p.planName} &bull; {p.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#c5a880] font-mono font-bold">₹{p.amount?.toLocaleString('en-IN')}</div>
                        <div className="text-emerald-400 text-[10px] uppercase font-bold">{p.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/10 p-6">
                <h4 className="font-serif text-lg text-white mb-4">Recent Tour Inquiries</h4>
                <div className="space-y-3">
                  {recentActivities.inquiries?.map(inq => (
                    <div key={inq._id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                      <div>
                        <div className="text-white font-medium">{inq.fullName}</div>
                        <div className="text-neutral-500 text-[11px]">{inq.preferredClub} &bull; {inq.phone}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-950/60 text-amber-400 uppercase font-bold">
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MEMBERS DOSSIER 360° ================= */}
        {activeTab === 'members' && (
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
                    className="px-4 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
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
                    className="px-3 py-2 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs uppercase"
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
                  className="px-4 py-2 border border-[#c5a880]/40 text-[#c5a880] hover:bg-[#c5a880]/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
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
                              className="px-2 py-1 text-xs border border-sky-500/40 text-sky-400 hover:bg-sky-950/40 font-mono"
                            >
                              +EXTEND
                            </button>
                            {m.membership?.status === 'Suspended' ? (
                              <button
                                onClick={() => handleReactivateMember(m._id, m.name)}
                                title="Reactivate Suspended Residency"
                                className="px-2 py-1 text-xs border border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40 font-mono"
                              >
                                RESTORE
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendMember(m._id, m.name)}
                                title="Suspend Residency Privileges"
                                className="px-2 py-1 text-xs border border-rose-500/40 text-rose-400 hover:bg-rose-950/40 font-mono"
                              >
                                SUSPEND
                              </button>
                            )}
                            <button
                              onClick={() => handleSendReminder(m._id, m.name)}
                              title="Dispatch Instant Renewal Reminder"
                              className="px-2 py-1 text-xs border border-amber-500/40 text-amber-400 hover:bg-amber-950/40 font-mono"
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
                              className="px-1.5 py-1 text-xs text-rose-400 hover:text-rose-200"
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
                    className="px-3 py-1 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
                  >
                    Previous
                  </button>
                  <button
                    disabled={memberPage >= memberTotalPages}
                    onClick={() => loadMembers(memberPage + 1)}
                    className="px-3 py-1 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: MEMBERSHIP PLANS ================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl text-white">Membership Residency Tiers</h3>
                <p className="text-xs text-neutral-400 font-light">Configure multi-month pricing, benefits and visibility.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({
                    name: '', code: '', subtitle: '', description: '',
                    pricing: { monthly: 1200, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
                    benefits: 'Unlimited access, Slate pool, Altitude suite',
                  });
                  setShowPlanModal(true);
                }}
                className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>NEW TIER</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div key={p._id} className="bg-[#090909] border border-white/10 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-[#c5a880] font-bold">{p.code}</span>
                      <button
                        onClick={() => handleTogglePlan(p._id)}
                        className={`text-[9px] px-2 py-0.5 uppercase font-bold tracking-widest ${
                          p.isActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-neutral-900 text-neutral-500'
                        }`}
                      >
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>
                    <h4 className="font-serif text-2xl text-white mb-1">{p.name}</h4>
                    <p className="text-xs text-neutral-400 font-light mb-4">{p.subtitle}</p>

                    <div className="text-sm font-serif text-[#c5a880] mb-4">
                      ₹{p.pricing?.monthly?.toLocaleString('en-IN')} <span className="text-xs text-neutral-400 font-mono uppercase font-light">/ month</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-neutral-300">
                      {p.benefits?.slice(0, 3).map((b, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]" />
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-6">
                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setPlanForm({
                          name: p.name,
                          code: p.code,
                          subtitle: p.subtitle,
                          description: p.description,
                          pricing: p.pricing,
                          benefits: Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits,
                        });
                        setShowPlanModal(true);
                      }}
                      className="flex-1 py-2 border border-white/20 text-neutral-300 hover:text-white text-xs uppercase"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete plan ${p.name}?`)) {
                          await deleteMembershipPlan(p._id);
                          loadPlans();
                        }
                      }}
                      className="px-3 py-2 text-rose-400 hover:text-rose-200 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CLASS BOOKINGS ================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl text-white">Daily Masterclass Reservations</h3>
                <p className="text-xs text-neutral-400 font-light">Audit bookings, mark attendance and manage waitlist slots.</p>
              </div>
              <button onClick={loadBookings} className="px-4 py-2 border border-white/10 text-xs uppercase text-neutral-300 flex items-center space-x-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REFRESH</span>
              </button>
            </div>

            <div className="border border-white/10 bg-[#090909] overflow-x-auto">
              <table className="qnox-admin-table">
                <thead>
                  <tr>
                    <th>PASS CODE</th>
                    <th>SESSION</th>
                    <th>SANCTUARY</th>
                    <th>MEMBER GUEST</th>
                    <th>SCHEDULE</th>
                    <th>STATUS</th>
                    <th className="text-right">ATTENDANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td className="font-mono text-[#c5a880] font-bold">{b.reservationCode}</td>
                      <td>
                        <div className="font-medium text-white">{b.classTitle}</div>
                        <div className="text-[11px] text-neutral-500">{b.category} &bull; {b.trainerName}</div>
                      </td>
                      <td>{b.clubName}</td>
                      <td>
                        <div className="text-white">{b.userName}</div>
                        <div className="text-[11px] text-neutral-500">{b.userEmail}</div>
                      </td>
                      <td className="font-mono text-xs">{b.day} ({b.startTime})</td>
                      <td>
                        <span className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                          b.status === 'Confirmed' ? 'bg-emerald-950/60 text-emerald-400' :
                          b.status === 'Attended' ? 'bg-sky-950/60 text-sky-400' : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="text-right space-x-1.5">
                        <button
                          onClick={() => handleSetAttendance(b._id, 'Attended')}
                          className="px-2 py-1 text-[11px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                        >
                          ATTENDED
                        </button>
                        <button
                          onClick={() => handleSetAttendance(b._id, 'No-Show')}
                          className="px-2 py-1 text-[11px] bg-neutral-900 text-neutral-400"
                        >
                          NO-SHOW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 5: MASTER COACHES ================= */}
        {activeTab === 'trainers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl text-white">Master Practitioners Roster</h3>
                <p className="text-xs text-neutral-400 font-light">Olympic strength coaches, biomechanists and striking specialists.</p>
              </div>
              <button
                onClick={() => {
                  setEditingTrainer(null);
                  setTrainerForm({
                    name: '', role: '', title: '', badge: 'MASTER COACH', email: '', phone: '',
                    bio: '', photo: '', specialties: 'Olympic Lifting, VO2 Max',
                  });
                  setShowTrainerModal(true);
                }}
                className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>NEW COACH</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trainers.map((t) => (
                <div key={t._id} className="bg-[#090909] border border-white/10 p-5 flex flex-col justify-between">
                  <div>
                    <img src={t.photo} alt={t.name} className="w-full aspect-[4/5] object-cover mb-4" />
                    <span className="text-[9px] text-[#c5a880] tracking-widest uppercase font-bold block mb-1">{t.badge}</span>
                    <h4 className="font-serif text-xl text-white">{t.name}</h4>
                    <p className="text-xs text-neutral-400 font-light mt-1 mb-3">{t.role}</p>
                    <p className="text-xs text-neutral-500 line-clamp-2">{t.bio}</p>
                  </div>

                  <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-4">
                    <button
                      onClick={() => {
                        setEditingTrainer(t);
                        setTrainerForm({
                          name: t.name, role: t.role, title: t.title, badge: t.badge,
                          email: t.email, phone: t.phone, bio: t.bio, photo: t.photo,
                          specialties: Array.isArray(t.specialties) ? t.specialties.join(', ') : t.specialties,
                        });
                        setShowTrainerModal(true);
                      }}
                      className="flex-1 py-1.5 border border-white/20 text-xs uppercase"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteTrainer(t._id)}
                      className="px-3 py-1.5 text-rose-400 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: CLUBS & SANCTUARIES ================= */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl text-white">Sanctuary Portfolio Locations</h3>
                <p className="text-xs text-neutral-400 font-light">Mayfair, Soho, Canary Wharf, Marylebone & Obsidian Tower Flagship.</p>
              </div>
              <button
                onClick={() => {
                  setEditingClub(null);
                  setClubForm({
                    name: '', slug: '', location: '', address: '', tagline: '', description: '',
                    heroImage: '', status: 'OPEN',
                  });
                  setShowClubModal(true);
                }}
                className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>NEW SANCTUARY</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {clubs.map((c) => (
                <div key={c._id || c.slug} className="bg-[#090909] border border-white/10 p-5 flex flex-col justify-between">
                  <div>
                    <img src={c.heroImage} alt={c.name} className="w-full aspect-[16/10] object-cover mb-4" />
                    <span className="text-[9px] px-2 py-0.5 bg-black border border-[#c5a880]/40 text-[#c5a880] uppercase font-bold mb-2 inline-block">
                      {c.status}
                    </span>
                    <h4 className="font-serif text-xl text-white mb-1">{c.name}</h4>
                    <p className="text-xs text-neutral-400 font-light mb-3">{c.location}</p>
                    <p className="text-xs text-neutral-500 line-clamp-3">{c.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 border-t border-white/10 pt-4 mt-6">
                    <button
                      onClick={() => {
                        setEditingClub(c);
                        setClubForm(c);
                        setShowClubModal(true);
                      }}
                      className="flex-1 py-1.5 border border-white/20 text-xs uppercase"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDeleteClub(c._id)}
                      className="px-3 py-1.5 text-rose-400 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: FINANCIAL AUDIT ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-2xl text-white">Financial Audit & Tax Invoices</h3>
                <p className="text-xs text-neutral-400 font-light">All verified Razorpay transactions with instant receipt print & refund dispatch.</p>
              </div>
            </div>

            <div className="border border-white/10 bg-[#090909] overflow-x-auto">
              <table className="qnox-admin-table">
                <thead>
                  <tr>
                    <th>INVOICE #</th>
                    <th>MEMBER</th>
                    <th>PLAN & TERM</th>
                    <th>AMOUNT (INR)</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th className="text-right">COMMAND</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="font-mono text-[#c5a880] font-bold">{p.invoiceNumber}</td>
                      <td>
                        <div className="text-white font-medium">{p.userName}</div>
                        <div className="text-neutral-500 text-[11px]">{p.userEmail}</div>
                      </td>
                      <td>{p.planName} ({p.duration})</td>
                      <td className="font-mono text-white font-semibold">₹{p.amount?.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                          p.status === 'Completed' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="text-right space-x-2">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-3 py-1 text-xs border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black uppercase"
                        >
                          INVOICE
                        </button>
                        {p.status === 'Completed' && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Initiate full refund of ₹${p.amount} for ${p.userName}?`)) {
                                await refundPaymentRecord(p._id, { reason: 'Admin approved refund' });
                                loadPayments();
                              }
                            }}
                            className="px-2 py-1 text-xs text-rose-400 hover:text-rose-200"
                          >
                            REFUND
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 8: NEWSLETTER & CAMPAIGNS ================= */}
        {activeTab === 'newsletter' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-serif text-2xl text-white">The Inner Circle Subscribers ({subscribers.length})</h3>
                <p className="text-xs text-neutral-400 font-light">Discreet luxury editorial subscribers.</p>
              </div>
              <a
                href="/api/newsletter/export-csv"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT SUBSCRIBERS CSV</span>
              </a>
            </div>

            {/* Campaign Sender */}
            <div className="bg-[#090909] border border-white/10 p-6 sm:p-8">
              <h4 className="font-serif text-xl text-white mb-2">Dispatch New Editorial Campaign</h4>
              <p className="text-xs text-neutral-400 mb-6">Transmits branded luxury email to all verified Inner Circle subscribers.</p>

              <form onSubmit={handleSendCampaign} className="space-y-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    SUBJECT LINE
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder="e.g. The Longevity Protocol: Oxygen & Sub-Zero Therapy"
                    className="qnox-modal-form-input"
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    CONTENT HTML BODY
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={campaignForm.contentHtml}
                    onChange={(e) => setCampaignForm({ ...campaignForm, contentHtml: e.target.value })}
                    placeholder="<p>Dear Member, we are pleased to announce...</p>"
                    className="qnox-modal-form-input font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingCampaign}
                  className="px-6 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingCampaign ? 'TRANSMITTING CAMPAIGN...' : 'SEND EDITORIAL DISPATCH'}</span>
                </button>
              </form>
            </div>

            {/* Subscriber List Table */}
            <div className="border border-white/10 bg-[#090909] overflow-x-auto">
              <table className="qnox-admin-table">
                <thead>
                  <tr>
                    <th>SUBSCRIBER EMAIL</th>
                    <th>TIER INTEREST</th>
                    <th>STATUS</th>
                    <th>JOINED DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s._id}>
                      <td className="font-mono text-white">{s.email}</td>
                      <td>{s.tierInterest}</td>
                      <td>
                        <span className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                          s.isActive ? 'bg-emerald-950/60 text-emerald-400' : 'bg-neutral-900 text-neutral-500'
                        }`}>
                          {s.isActive ? 'ACTIVE' : 'UNSUBSCRIBED'}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : 'Recent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 9: INQUIRIES ================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-white">Private Sanctuary Tour Walkthrough Requests</h3>
            <div className="border border-white/10 bg-[#090909] overflow-x-auto">
              <table className="qnox-admin-table">
                <thead>
                  <tr>
                    <th>GUEST NAME</th>
                    <th>EMAIL & CONTACT</th>
                    <th>SANCTUARY</th>
                    <th>TIER INTEREST</th>
                    <th>PRIMARY GOAL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => (
                    <tr key={inq._id}>
                      <td className="font-semibold text-white">{inq.fullName}</td>
                      <td>
                        <div>{inq.email}</div>
                        <div className="text-[11px] text-neutral-500">{inq.phone}</div>
                      </td>
                      <td className="text-[#c5a880]">{inq.preferredClub}</td>
                      <td>{inq.membershipTier}</td>
                      <td className="text-neutral-400 text-xs">{inq.primaryGoal || 'Performance'}</td>
                      <td>
                        <span className="text-[9px] px-2 py-0.5 bg-amber-950/60 text-amber-400 uppercase font-bold">
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 10: EXPIRY NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Header & Main Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase font-bold block mb-1">
                  AUTOMATED SURVEILLANCE & RENEWAL SYSTEM
                </span>
                <h3 className="font-serif text-2xl text-white">Membership Expiry & Renewal Alerts</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Monitoring customer memberships against live calendar dates. Advance alerts at 7d, 3d, 1d, expiry date, and +3d follow-ups.
                </p>
              </div>

              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <button
                  onClick={handleRunExpiryEngine}
                  disabled={runningExpiryEngine}
                  className="px-4 py-2.5 bg-[#c5a880] text-black hover:bg-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-2 disabled:opacity-50"
                  title="Run background expiry detection engine immediately"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningExpiryEngine ? 'animate-spin' : ''}`} />
                  <span>{runningExpiryEngine ? 'RUNNING ENGINE...' : 'RUN EXPIRY ENGINE NOW'}</span>
                </button>

                <button
                  onClick={handleMarkAllNotifsAsRead}
                  className="px-4 py-2.5 border border-white/20 hover:border-white text-white text-xs tracking-wider uppercase transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>MARK ALL AS READ</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setNotifTypeFilter('all');
                  setNotifStatusFilter('all');
                  loadNotifications('all', 'all', notifSearch);
                }}
                className={`px-3 py-1.5 text-xs font-mono border transition ${
                  notifTypeFilter === 'all' && notifStatusFilter === 'all'
                    ? 'border-[#c5a880] text-white bg-[#c5a880]/10'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                ALL ALERTS ({notifMetrics.total})
              </button>
              <button
                onClick={() => {
                  setNotifStatusFilter('unread');
                  setNotifTypeFilter('all');
                  loadNotifications('unread', 'all', notifSearch);
                }}
                className={`px-3 py-1.5 text-xs font-mono border transition ${
                  notifStatusFilter === 'unread'
                    ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                UNREAD ALERTS ({notifMetrics.unread})
              </button>
              <button
                onClick={() => {
                  setNotifTypeFilter('expired');
                  loadNotifications(notifStatusFilter, 'expired', notifSearch);
                }}
                className={`px-3 py-1.5 text-xs font-mono border transition ${
                  notifTypeFilter === 'expired'
                    ? 'border-rose-500 text-rose-300 bg-rose-950/40'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                EXPIRED ({notifMetrics.expired})
              </button>
              <button
                onClick={() => {
                  setNotifTypeFilter('expiringSoon');
                  loadNotifications(notifStatusFilter, 'expiringSoon', notifSearch);
                }}
                className={`px-3 py-1.5 text-xs font-mono border transition ${
                  notifTypeFilter === 'expiringSoon'
                    ? 'border-amber-500 text-amber-300 bg-amber-950/40'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                EXPIRING SOON ({notifMetrics.expiringSoon})
              </button>
              <button
                onClick={() => {
                  setNotifTypeFilter('renewed');
                  loadNotifications(notifStatusFilter, 'renewed', notifSearch);
                }}
                className={`px-3 py-1.5 text-xs font-mono border transition ${
                  notifTypeFilter === 'renewed'
                    ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                RENEWED ({notifMetrics.renewed})
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-white/10 px-4 py-2.5">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => {
                  setNotifSearch(e.target.value);
                  loadNotifications(notifStatusFilter, notifTypeFilter, e.target.value);
                }}
                placeholder="Search by customer name, email, phone number, tier, or keyword..."
                className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 font-mono"
              />
              {notifSearch && (
                <button
                  onClick={() => {
                    setNotifSearch('');
                    loadNotifications(notifStatusFilter, notifTypeFilter, '');
                  }}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Notifications Feed */}
            {notifLoading ? (
              <div className="py-20 text-center text-neutral-500 font-mono text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#c5a880]" />
                Scanning membership database...
              </div>
            ) : adminNotifications.length === 0 ? (
              <div className="border border-white/10 bg-[#090909] p-12 text-center">
                <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                <h4 className="font-serif text-lg text-neutral-300 mb-1">No Notifications Located</h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  No membership expiry or renewal alerts match your current filter settings. Click &quot;Run Expiry Engine Now&quot; to scan for pending events.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminNotifications.map((notif) => {
                  const isExpiredType = ['EXPIRY_TODAY', 'EXPIRY_EXPIRED', 'EXPIRY_FOLLOWUP_3D'].includes(notif.type);
                  const isExpiringSoonType = ['EXPIRY_REMINDER_7D', 'EXPIRY_REMINDER_3D', 'EXPIRY_REMINDER_1D'].includes(notif.type);
                  const isRenewedType = notif.type === 'MEMBERSHIP_RENEWED';

                  let badgeColor = 'border-neutral-500 text-neutral-400';
                  let stageLabel = 'NOTICE';
                  if (isExpiredType) {
                    badgeColor = 'border-rose-500/60 bg-rose-950/40 text-rose-300';
                    stageLabel = notif.type === 'EXPIRY_FOLLOWUP_3D' ? 'EXPIRED (+3D FOLLOW-UP)' : 'EXPIRED';
                  } else if (isExpiringSoonType) {
                    badgeColor = 'border-amber-500/60 bg-amber-950/40 text-amber-300';
                    stageLabel = notif.stage ? notif.stage.replace(/_/g, ' ') : 'EXPIRING SOON';
                  } else if (isRenewedType) {
                    badgeColor = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300';
                    stageLabel = 'RENEWED';
                  }

                  return (
                    <div
                      key={notif._id}
                      className={`border p-6 bg-[#0a0a0a] transition-all relative ${
                        !notif.isRead
                          ? 'border-white/30 shadow-[0_0_15px_rgba(197,168,128,0.05)]'
                          : 'border-white/10 opacity-90'
                      }`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: isExpiredType ? '#f43f5e' : isExpiringSoonType ? '#f59e0b' : isRenewedType ? '#10b981' : '#c5a880',
                      }}
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-2.5">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" title="Unread Alert" />
                          )}
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border uppercase ${badgeColor}`}>
                            {stageLabel}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono">
                            {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!notif.isRead && (
                            <button
                              onClick={() => handleMarkNotifAsRead(notif._id)}
                              className="px-2.5 py-1 text-[10px] text-neutral-400 hover:text-white border border-white/10 hover:border-white/30 uppercase tracking-wider transition"
                              title="Mark this alert as read"
                            >
                              MARK READ
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotif(notif._id)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 border border-transparent hover:border-rose-900 transition"
                            title="Dismiss notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Message */}
                      <div className="mb-4">
                        <h4 className="font-serif text-lg text-white font-medium mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Customer Dossier Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#111111] border border-white/5 text-xs font-mono mb-4">
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">CUSTOMER</span>
                          <span className="text-white font-semibold truncate block">{notif.customerName || 'N/A'}</span>
                          <span className="text-[10px] text-neutral-400 truncate block">{notif.customerEmail || ''}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">PHONE / CONTACT</span>
                          <span className="text-neutral-300 block">{notif.customerPhone || 'Not provided'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">MEMBERSHIP PLAN</span>
                          <span className="text-[#c5a880] font-semibold block">{notif.membershipPlan || 'None'}</span>
                          <span className="text-[10px] text-neutral-400 block">Status: {notif.membershipStatus || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">EXPIRY DATE</span>
                          <span className="text-white block">
                            {notif.membershipEndDate
                              ? new Date(notif.membershipEndDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'None'}
                          </span>
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                        {notif.customerId && (
                          <button
                            onClick={() => setSelectedDossierMemberId(notif.customerId)}
                            className="px-3.5 py-1.5 bg-[#181818] border border-white/20 hover:border-[#c5a880] text-neutral-200 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#c5a880]" />
                            <span>VIEW CUSTOMER PROFILE</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingPlanMember({
                              _id: notif.customerId,
                              name: notif.customerName,
                              membership: {
                                planName: notif.membershipPlan || 'THE METROPOLITAN',
                                status: notif.membershipStatus || 'Active',
                                endDate: notif.membershipEndDate,
                              },
                            });
                          }}
                          className="px-3.5 py-1.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold tracking-wider uppercase transition flex items-center space-x-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>RENEW MEMBERSHIP</span>
                        </button>

                        {notif.customerPhone && (
                          <a
                            href={`tel:${notif.customerPhone}`}
                            className="px-3 py-1.5 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3 text-[#c5a880]" />
                            <span>CALL</span>
                          </a>
                        )}

                        {notif.customerEmail && (
                          <a
                            href={`mailto:${notif.customerEmail}?subject=QNOX GYM Membership Renewal Notice`}
                            className="px-3 py-1.5 border border-white/10 hover:border-white/30 text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition flex items-center space-x-1"
                          >
                            <Mail className="w-3 h-3 text-[#c5a880]" />
                            <span>EMAIL FOLLOW-UP</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 11: MEMBERSHIP REQUESTS (FREEZE & CANCELLATION) ================= */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-sky-400 uppercase font-bold block mb-1">
                  EXECUTIVE MEMBERSHIP SURVEILLANCE
                </span>
                <h3 className="font-serif text-2xl text-white">Membership Requests Console</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                  Review and process customer freeze and cancellation requests with automatic date adjustments and notification dispatches.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => loadMembershipRequests()}
                  className="px-4 py-2 border border-white/10 hover:border-white/30 text-neutral-300 text-xs tracking-wider uppercase transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin text-[#c5a880]' : ''}`} />
                  <span>REFRESH</span>
                </button>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-white/10 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] mr-2">TYPE:</span>
                {['All', 'Freeze', 'Cancellation'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setRequestsFilter(t);
                    }}
                    className={`px-3 py-1 text-xs uppercase tracking-wider font-mono border transition ${
                      requestsFilter === t
                        ? 'border-[#c5a880] text-white bg-[#c5a880]/10 font-bold'
                        : 'border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] mr-2">STATUS:</span>
                {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setRequestsStatusFilter(s);
                    }}
                    className={`px-3 py-1 text-xs uppercase tracking-wider font-mono border transition ${
                      requestsStatusFilter === s
                        ? s === 'Pending'
                          ? 'border-sky-500 text-sky-300 bg-sky-950/30 font-bold'
                          : s === 'Approved'
                          ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30 font-bold'
                          : s === 'Rejected'
                          ? 'border-rose-500 text-rose-300 bg-rose-950/30 font-bold'
                          : 'border-[#c5a880] text-white bg-[#c5a880]/10 font-bold'
                        : 'border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table */}
            {loadingRequests ? (
              <div className="py-20 text-center text-xs text-neutral-500 font-mono tracking-widest uppercase">
                LOADING MEMBERSHIP REQUESTS...
              </div>
            ) : membershipRequests.length === 0 ? (
              <div className="p-12 text-center border border-white/10 bg-[#0a0a0a]">
                <Clock className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                <h4 className="font-serif text-lg text-white mb-1">No Membership Requests Found</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  There are currently no customer freeze or cancellation requests matching the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/10 bg-[#0a0a0a]">
                <table className="w-full text-left text-xs text-neutral-300 font-mono">
                  <thead className="bg-[#121212] text-[#c5a880] uppercase tracking-wider text-[10px] border-b border-white/10">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Duration / Specifics</th>
                      <th className="p-4">Reason</th>
                      <th className="p-4">Submitted</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {membershipRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-white/[0.02] transition">
                        <td className="p-4">
                          <div className="font-sans font-semibold text-white">{req.userName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{req.userEmail}</div>
                          {req.memberId && (
                            <span className="text-[9px] px-1 bg-white/5 text-[#c5a880] border border-white/10 inline-block mt-0.5">
                              {req.memberId}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              req.type === 'Freeze'
                                ? 'bg-sky-950/60 text-sky-400 border border-sky-500/40'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {req.type}
                          </span>
                        </td>
                        <td className="p-4 text-neutral-300">
                          {req.type === 'Freeze' ? (
                            <div>
                              <span>{req.freezeDays || 30} Days Pause</span>
                              {req.freezeStartDate && (
                                <div className="text-[10px] text-neutral-500">
                                  From {new Date(req.freezeStartDate).toLocaleDateString('en-GB')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span>Voluntary Departure</span>
                              {req.refundAmount > 0 && (
                                <div className="text-[10px] text-emerald-400">
                                  Refund: ₹{req.refundAmount.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 max-w-xs font-sans text-neutral-300 font-light truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'Pending'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                : req.status === 'Approved'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {req.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => setSelectedRequestAction({ request: req, action: 'approve' })}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider transition"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => setSelectedRequestAction({ request: req, action: 'reject' })}
                                className="px-3 py-1 border border-rose-500/50 text-rose-400 hover:bg-rose-950/40 text-xs font-bold uppercase tracking-wider transition"
                              >
                                REJECT
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-neutral-500">
                              Reviewed by {req.reviewedByName || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        </main>
      </div>

      {/* Modal: Add/Edit Plan */}
      {showPlanModal && (
        <div className="qnox-checkout-backdrop">
          <div className="qnox-checkout-dialog max-w-lg">
            <button onClick={() => setShowPlanModal(false)} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl text-white mb-4">{editingPlan ? 'Edit Membership Tier' : 'Commission New Tier'}</h3>
            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Plan Name</label>
                <input required type="text" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className="qnox-modal-form-input" placeholder="e.g. THE METROPOLITAN" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Code</label>
                <input required type="text" value={planForm.code} onChange={e => setPlanForm({ ...planForm, code: e.target.value })} className="qnox-modal-form-input" placeholder="METRO" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Subtitle</label>
                <input required type="text" value={planForm.subtitle} onChange={e => setPlanForm({ ...planForm, subtitle: e.target.value })} className="qnox-modal-form-input" placeholder="London Multi-Sanctuary Access" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Monthly Price (₹)</label>
                  <input required type="number" value={planForm.pricing?.monthly} onChange={e => setPlanForm({ ...planForm, pricing: { ...planForm.pricing, monthly: Number(e.target.value) } })} className="qnox-modal-form-input" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-neutral-400 block mb-1">Yearly Price (₹)</label>
                  <input required type="number" value={planForm.pricing?.yearly} onChange={e => setPlanForm({ ...planForm, pricing: { ...planForm.pricing, yearly: Number(e.target.value) } })} className="qnox-modal-form-input" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Description</label>
                <textarea required rows={2} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Benefits (Comma-separated)</label>
                <input type="text" value={planForm.benefits} onChange={e => setPlanForm({ ...planForm, benefits: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4">
                SAVE MEMBERSHIP TIER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Trainer */}
      {showTrainerModal && (
        <div className="qnox-checkout-backdrop">
          <div className="qnox-checkout-dialog max-w-lg">
            <button onClick={() => setShowTrainerModal(false)} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl text-white mb-4">{editingTrainer ? 'Edit Master Coach' : 'Add Master Coach'}</h3>
            <form onSubmit={handleSaveTrainer} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Coach Name</label>
                <input required type="text" value={trainerForm.name} onChange={e => setTrainerForm({ ...trainerForm, name: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Role & Specialization</label>
                <input required type="text" value={trainerForm.role} onChange={e => setTrainerForm({ ...trainerForm, role: e.target.value })} className="qnox-modal-form-input" placeholder="HEAD OF STRENGTH" />
              </div>
              <ImageUploadField
                label="Coach Photo (Upload or URL)"
                value={trainerForm.photo}
                onChange={(url) => setTrainerForm({ ...trainerForm, photo: url })}
                placeholder="https://images.unsplash.com/..."
              />
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Biography</label>
                <textarea required rows={3} value={trainerForm.bio} onChange={e => setTrainerForm({ ...trainerForm, bio: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4">
                SAVE MASTER COACH
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Club */}
      {showClubModal && (
        <div className="qnox-checkout-backdrop">
          <div className="qnox-checkout-dialog max-w-lg">
            <button onClick={() => setShowClubModal(false)} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl text-white mb-4">{editingClub ? 'Edit Sanctuary' : 'Commission New Sanctuary'}</h3>
            <form onSubmit={handleSaveClub} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Sanctuary Name</label>
                <input required type="text" value={clubForm.name} onChange={e => setClubForm({ ...clubForm, name: e.target.value })} className="qnox-modal-form-input" placeholder="QNOX Mayfair Sanctuary" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Location / District</label>
                <input required type="text" value={clubForm.location} onChange={e => setClubForm({ ...clubForm, location: e.target.value })} className="qnox-modal-form-input" placeholder="Mayfair, London W1K" />
              </div>
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Address</label>
                <input required type="text" value={clubForm.address} onChange={e => setClubForm({ ...clubForm, address: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <ImageUploadField
                label="Sanctuary Hero Image (Upload or URL)"
                value={clubForm.heroImage}
                onChange={(url) => setClubForm({ ...clubForm, heroImage: url })}
                placeholder="https://images.unsplash.com/..."
              />
              <div>
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Description</label>
                <textarea required rows={2} value={clubForm.description} onChange={e => setClubForm({ ...clubForm, description: e.target.value })} className="qnox-modal-form-input" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#c5a880] text-black font-bold uppercase tracking-widest mt-4">
                SAVE SANCTUARY
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}

      {/* 360° Member Dossier Drawer */}
      {selectedDossierMemberId && (
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

      {/* Ultra-Luxury Residency Assignment / Plan Edit Modal */}
      {editingPlanMember && (
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
      )}

      {/* Membership Request Approval / Rejection Modal */}
      {selectedRequestAction && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/20 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-[#c5a880] font-bold uppercase block">
                  {selectedRequestAction.action === 'approve' ? 'APPROVE REQUEST' : 'REJECT REQUEST'}
                </span>
                <h4 className="font-serif text-lg text-white font-semibold">
                  {selectedRequestAction.request.userName} &bull; {selectedRequestAction.request.type}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRequestAction(null)}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRequestAction.action === 'approve' ? (
              <form onSubmit={handleApproveRequest} className="space-y-4">
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  {selectedRequestAction.request.type === 'Freeze'
                    ? `Approving will pause this member's residency for ${selectedRequestAction.request.freezeDays || 30} days. Their active remaining days will be safeguarded and restored upon unfreezing.`
                    : 'Approving will terminate active residency privileges immediately.'}
                </p>

                {selectedRequestAction.request.type === 'Cancellation' && (
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                      REFUND AMOUNT (₹, IF AUTHORIZED)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      min="0"
                      className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                    ADMINISTRATIVE CONCIERGE NOTES
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    placeholder="Internal reference notes..."
                    className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none resize-none font-light"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestAction(null)}
                    className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>CONFIRM APPROVAL</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRejectRequest} className="space-y-4">
                <p className="text-xs text-rose-300 font-light leading-relaxed">
                  Provide an official reason for rejection. This reason will be dispatched to the member via personalized notification.
                </p>

                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                    REJECTION REASON
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    rows={3}
                    placeholder="e.g. Minimum commitment tenure not completed, freeze allowance exceeded..."
                    className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-rose-400 outline-none resize-none font-light"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestAction(null)}
                    className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>CONFIRM REJECTION</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Courtesy Validity Extension Modal */}
      {showExtendModal && extendTargetUser && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/20 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.25em] text-sky-400 font-bold uppercase block">MEMBERSHIP VALIDITY</span>
                <h4 className="font-serif text-lg text-white font-semibold">Extend Residency Validity</h4>
              </div>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendTargetUser(null);
                }}
                className="text-neutral-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#141414] border border-white/5 space-y-1 text-xs font-mono">
              <div className="text-white font-bold">{extendTargetUser.name}</div>
              <div className="text-neutral-400 text-[11px]">{extendTargetUser.email}</div>
              <div className="text-[#c5a880] text-[11px]">
                Current Expiry: {extendTargetUser.membership?.endDate ? new Date(extendTargetUser.membership.endDate).toLocaleDateString('en-GB') : 'No active end date'}
              </div>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  DAYS TO EXTEND
                </label>
                <select
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                >
                  <option value={7}>+7 Days (1 Week Extension)</option>
                  <option value={15}>+15 Days (Half-Month)</option>
                  <option value={30}>+30 Days (Standard 1 Month)</option>
                  <option value={60}>+60 Days (2 Months Courtesy)</option>
                  <option value={90}>+90 Days (Quarterly Extension)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  EXTENSION REASON / AUDIT NOTE
                </label>
                <textarea
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none resize-none font-light"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtendModal(false);
                    setExtendTargetUser(null);
                  }}
                  className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={processingExtend}
                  className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {processingExtend ? (
                    <span>EXTENDING...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>APPLY EXTENSION</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
