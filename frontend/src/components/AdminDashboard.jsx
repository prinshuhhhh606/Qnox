import React, { useState, useEffect } from 'react';
import {
  Users, Crown, DollarSign, Calendar, MessageSquare, ArrowLeft, LogOut, Search,
  Plus, Edit, Trash2, CheckCircle, XCircle, X, Download, Send, RefreshCw, Eye, Shield, MapPin
} from 'lucide-react';
import {
  fetchAdminOverview, fetchRevenueAnalytics, fetchAdminMembers, exportMembersCsv, updateMemberResidency, deleteMemberRecord,
  fetchMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan, togglePlanStatus,
  fetchAllBookings, updateBookingAttendance, cancelClassBooking,
  fetchTrainers, createTrainerRecord, updateTrainerRecord, deleteTrainerRecord,
  fetchClubs, createClubRecord, updateClubRecord, deleteClubRecord,
  fetchAllPayments, refundPaymentRecord,
  fetchAllSubscribers, exportSubscribersCsv, dispatchNewsletterCampaign,
  fetchAllInquiries
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
    pricing: { monthly: 25000, quarterly: 70000, halfYearly: 135000, yearly: 255000 },
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

  useEffect(() => {
    loadOverview();
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
  }, [activeTab]);

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

  return (
    <div className="qnox-admin-container">
      {/* Admin Sticky Header */}
      <header className="qnox-admin-header">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToSite}
            className="p-2 border border-white/10 hover:border-[#c5a880] text-neutral-400 hover:text-white transition-colors"
            title="Return to Public Website"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-xl font-bold tracking-[0.25em] text-white">Q N O X</span>
              <span className="text-[9px] px-2 py-0.5 bg-[#c5a880] text-black font-bold uppercase tracking-widest">
                EXECUTIVE SUITE
              </span>
            </div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
              Signed in as {currentUser?.name} &bull; {currentUser?.role}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToSite}
            className="hidden sm:inline-flex px-4 py-2 border border-white/10 hover:border-white/30 text-neutral-300 text-xs tracking-wider uppercase"
          >
            LIVE WEBSITE
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs tracking-wider uppercase transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="bg-[#080808] border-b border-white/10 px-8 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <button onClick={() => setActiveTab('overview')} className={`qnox-admin-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}>
          OVERVIEW & REVENUE
        </button>
        <button onClick={() => setActiveTab('members')} className={`qnox-admin-nav-btn ${activeTab === 'members' ? 'active' : ''}`}>
          MEMBERS DOSSIER
        </button>
        <button onClick={() => setActiveTab('plans')} className={`qnox-admin-nav-btn ${activeTab === 'plans' ? 'active' : ''}`}>
          MEMBERSHIP TIERS
        </button>
        <button onClick={() => setActiveTab('bookings')} className={`qnox-admin-nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}>
          CLASS SESSIONS
        </button>
        <button onClick={() => setActiveTab('trainers')} className={`qnox-admin-nav-btn ${activeTab === 'trainers' ? 'active' : ''}`}>
          MASTER COACHES
        </button>
        <button onClick={() => setActiveTab('clubs')} className={`qnox-admin-nav-btn ${activeTab === 'clubs' ? 'active' : ''}`}>
          CLUBS PORTFOLIO
        </button>
        <button onClick={() => setActiveTab('payments')} className={`qnox-admin-nav-btn ${activeTab === 'payments' ? 'active' : ''}`}>
          FINANCIAL AUDIT
        </button>
        <button onClick={() => setActiveTab('newsletter')} className={`qnox-admin-nav-btn ${activeTab === 'newsletter' ? 'active' : ''}`}>
          INNER CIRCLE NEWSLETTER
        </button>
        <button onClick={() => setActiveTab('inquiries')} className={`qnox-admin-nav-btn ${activeTab === 'inquiries' ? 'active' : ''}`}>
          TOUR INQUIRIES
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-10">
        
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
                          <td className="text-right space-x-2">
                            <button
                              onClick={() => setSelectedDossierMemberId(m._id)}
                              className="px-3 py-1 text-xs bg-[#c5a880] text-black font-bold uppercase tracking-wider hover:bg-white transition"
                            >
                              360° DOSSIER
                            </button>
                            <button
                              onClick={() => setEditingPlanMember(m)}
                              className="px-2.5 py-1 text-xs border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white transition"
                            >
                              EDIT PLAN
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Permanently remove dossier for ${m.name}?`)) {
                                  await deleteMemberRecord(m._id);
                                  loadMembers(memberPage);
                                }
                              }}
                              className="px-2 py-1 text-xs text-rose-400 hover:text-rose-200"
                            >
                              DELETE
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
                    pricing: { monthly: 25000, quarterly: 70000, halfYearly: 135000, yearly: 255000 },
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

                    <div className="bg-[#121212] p-3 mb-4 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-neutral-400"><span>1 Mo:</span> <span className="text-white">₹{p.pricing?.monthly?.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-neutral-400"><span>3 Mo:</span> <span className="text-white">₹{p.pricing?.quarterly?.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-neutral-400"><span>12 Mo:</span> <span className="text-[#c5a880] font-bold">₹{p.pricing?.yearly?.toLocaleString('en-IN')}</span></div>
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
            if (onShowToast) onShowToast('Residency tier successfully commissioned', 'success');
          }}
        />
      )}

    </div>
  );
}
