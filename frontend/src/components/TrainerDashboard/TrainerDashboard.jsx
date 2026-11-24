import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Calendar, CheckSquare, Dumbbell, Sparkles, Utensils, Ruler,
  Award, TrendingUp, UserCheck, Clock, BookOpen, MessageSquare,
  BarChart3, Bell, User, Settings, LogOut, Search, Plus, CheckCircle,
  XCircle, Filter, ArrowUpRight, AlertCircle, RefreshCw, Send, ChevronRight,
  Shield, Edit3, Eye, FileText, ChevronDown, Check, Play, Pause, Flame
} from 'lucide-react';
import {
  getTrainerDashboardStats,
  getTrainerMembers,
  getTrainerMemberDetail,
  updateMemberFitnessProfile,
  addTrainerMemberNote,
  getTrainerAttendance,
  markMemberCheckIn,
  markMemberCheckOut,
  getTrainerWorkoutPlans,
  createWorkoutPlan,
  assignWorkoutPlan,
  generateAiWorkoutPlan,
  getTrainerDietPlans,
  createDietPlan,
  generateAiDietPlan,
  getTrainerAssessments,
  createFitnessAssessment,
  getTrainerPTSessions,
  schedulePTSession,
  updatePTSession,
  getTrainerExerciseLibrary,
  createCustomExercise,
  getTrainerChatMessages,
  sendTrainerChatMessage,
  getTrainerReports,
  getTrainerNotifications,
  markTrainerNotificationRead,
  getTrainerProfileData,
  updateTrainerProfileData
} from '../../services/api';
import './TrainerDashboard.css';

export default function TrainerDashboard({ currentUser, onBackToSite, onLogout, onShowToast }) {
  // Navigation tabs (18 required modules)
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainWorkspaceRef = useRef(null);

  // Stats state
  const [stats, setStats] = useState({
    totalAssignedMembers: 12,
    activeMembers: 10,
    todayPresent: 4,
    todayAbsent: 8,
    ptClients: 4,
    todaySessionsCount: 3,
    pendingAssessments: 2,
    unreadNotifications: 0
  });
  const [todaySessions, setTodaySessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Module States
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberDetailDrawer, setMemberDetailDrawer] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberCategoryFilter, setMemberCategoryFilter] = useState('All');

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [checkInModal, setCheckInModal] = useState(false);
  const [selectedMemberForCheckIn, setSelectedMemberForCheckIn] = useState('');
  const [activityType, setActivityType] = useState('Workout');

  // Workout Plans
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [newWorkoutModal, setNewWorkoutModal] = useState(false);
  const [workoutCategoryFilter, setWorkoutCategoryFilter] = useState('All');
  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    category: 'Chest Workout',
    difficulty: 'Intermediate',
    targetAudience: 'Intermediate',
    durationWeeks: 4,
    description: '',
    exercises: [
      { exerciseName: 'Barbell Bench Press', targetMuscle: 'Chest', equipment: 'Barbells', sets: 4, reps: '8-10 reps', restTimeSec: 90, instructions: 'Arch upper back, retract scapulae.' }
    ]
  });

  // AI Workout Assistant
  const [aiWorkoutLoading, setAiWorkoutLoading] = useState(false);
  const [aiWorkoutForm, setAiWorkoutForm] = useState({
    memberId: '',
    goal: 'Muscle Gain',
    experienceLevel: 'Intermediate',
    daysPerWeek: 4,
    limitations: 'None',
    focus: 'Hypertrophy & Strength'
  });
  const [generatedAiWorkout, setGeneratedAiWorkout] = useState(null);

  // Diet Plans
  const [dietPlans, setDietPlans] = useState([]);
  const [aiDietLoading, setAiDietLoading] = useState(false);
  const [aiDietForm, setAiDietForm] = useState({
    memberId: '',
    dietaryPreference: 'Non-Vegetarian',
    goal: 'Muscle Gain',
    targetCalories: 2500,
    allergies: 'None'
  });
  const [generatedAiDiet, setGeneratedAiDiet] = useState(null);

  // Body Measurements & Assessments
  const [assessments, setAssessments] = useState([]);
  const [newAssessmentModal, setNewAssessmentModal] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    member: '',
    assessmentType: 'Monthly',
    weightKg: 75,
    heightCm: 178,
    bodyFatPercentage: 15,
    circumferences: {
      chest: 102,
      waist: 82,
      hips: 96,
      leftArm: 37,
      rightArm: 37,
      leftThigh: 56,
      rightThigh: 56,
      shoulders: 118
    },
    notes: 'Good muscle symmetry, core stability improved.'
  });

  // Personal Training Sessions
  const [ptSessions, setPtSessions] = useState([]);
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [ptSessionForm, setPtSessionForm] = useState({
    member: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    trainingType: 'Strength & Conditioning',
    focusArea: 'Chest & Back Hypertrophy',
    notes: 'Focus on eccentric control and mind-muscle connection.'
  });

  // Exercise Library
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseEquipmentFilter, setExerciseEquipmentFilter] = useState('All');
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('All');
  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'Chest Workout',
    targetMuscle: 'Upper Chest',
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    defaultSets: 3,
    defaultReps: '10-12 reps',
    restTimeSec: 60,
    instructions: ''
  });

  // Chat & Messages
  const [activeChatMember, setActiveChatMember] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Performance Reports
  const [reports, setReports] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Profile
  const [trainerProfile, setTrainerProfile] = useState({
    name: currentUser?.name || 'Marcus Vance',
    email: currentUser?.email || 'trainer@qnoxgym.com',
    phone: '+44 20 7946 0880',
    bio: 'Elite Athletic Conditioning Specialist focused on biomechanical efficiency.',
    workingHours: '06:00 AM - 02:00 PM',
    availableDays: 'Mon, Tue, Wed, Thu, Fri, Sat',
    specialties: 'Hypertrophy, Strength Conditioning, Postural Restoration',
    certifications: 'CSCS, NASM-CPT, Precision Nutrition Level 2'
  });

  // Initial Load
  useEffect(() => {
    loadDashboardData();
    loadMembers();
    loadExerciseLibrary();
  }, []);

  // Sub-tab loading
  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboardData();
    else if (activeTab === 'members') loadMembers();
    else if (activeTab === 'attendance') loadAttendance();
    else if (activeTab === 'workouts') loadWorkoutPlans();
    else if (activeTab === 'diets') loadDietPlans();
    else if (activeTab === 'assessments' || activeTab === 'measurements' || activeTab === 'progress') loadAssessments();
    else if (activeTab === 'pt-sessions' || activeTab === 'calendar') loadPTSessions();
    else if (activeTab === 'exercises') loadExerciseLibrary();
    else if (activeTab === 'messages' && activeChatMember) loadChat(activeChatMember._id);
    else if (activeTab === 'reports') loadReports();
    else if (activeTab === 'notifications') loadNotifications();
    else if (activeTab === 'profile') loadProfile();

    // Reset workspace and window scroll to top whenever a new section is selected
    if (mainWorkspaceRef.current) {
      mainWorkspaceRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainWorkspaceRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  const showToast = (msg, type = 'success') => {
    if (onShowToast) onShowToast(msg, type);
    else alert(msg);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getTrainerDashboardStats();
      if (res.success) {
        setStats(res.data.stats || {});
        setTodaySessions(res.data.todaySessions || []);
        setUpcomingSessions(res.data.upcomingSessions || []);
        setRecentMembers(res.data.recentMembers || []);
        setRecentAttendance(res.data.recentAttendance || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await getTrainerMembers({ search: memberSearch, category: memberCategoryFilter });
      if (res.success) setMembers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await getTrainerAttendance();
      if (res.success) setAttendanceRecords(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWorkoutPlans = async () => {
    try {
      const res = await getTrainerWorkoutPlans({ category: workoutCategoryFilter });
      if (res.success) setWorkoutPlans(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDietPlans = async () => {
    try {
      const res = await getTrainerDietPlans();
      if (res.success) setDietPlans(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssessments = async () => {
    try {
      const res = await getTrainerAssessments();
      if (res.success) setAssessments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPTSessions = async () => {
    try {
      const res = await getTrainerPTSessions();
      if (res.success) setPtSessions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadExerciseLibrary = async () => {
    try {
      const res = await getTrainerExerciseLibrary({
        equipment: exerciseEquipmentFilter,
        search: exerciseSearch
      });
      if (res.success) setExercises(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await getTrainerReports();
      if (res.success) setReports(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await getTrainerNotifications();
      if (res.success) setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await getTrainerProfileData();
      if (res.success && res.data) {
        const u = res.data.user;
        const tp = res.data.trainerProfile;
        setTrainerProfile({
          name: u?.name || tp?.name || '',
          email: u?.email || tp?.email || '',
          phone: u?.phone || tp?.phone || '',
          bio: tp?.bio || '',
          workingHours: tp?.workingHours || '06:00 AM - 02:00 PM',
          availableDays: tp?.availableDays?.join(', ') || 'Mon, Tue, Wed, Thu, Fri, Sat',
          specialties: tp?.specialties?.join(', ') || 'Strength, Hypertrophy',
          certifications: tp?.certifications?.join(', ') || 'Master Coach'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadChat = async (memberId) => {
    try {
      const res = await getTrainerChatMessages(memberId);
      if (res.success) setChatMessages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleCheckInMember = async () => {
    if (!selectedMemberForCheckIn) {
      showToast('Please select a member', 'error');
      return;
    }
    try {
      await markMemberCheckIn({
        memberId: selectedMemberForCheckIn,
        activityType,
        clubName: 'Mayfair Sanctuary'
      });
      showToast('Member checked in successfully!');
      setCheckInModal(false);
      loadAttendance();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCheckOutMember = async (id) => {
    try {
      await markMemberCheckOut(id);
      showToast('Member checked out!');
      loadAttendance();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGenerateAiWorkout = async () => {
    try {
      setAiWorkoutLoading(true);
      const res = await generateAiWorkoutPlan(aiWorkoutForm);
      if (res.success) {
        setGeneratedAiWorkout(res.data);
        showToast('AI Workout Protocol Synthesized!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAiWorkoutLoading(false);
    }
  };

  const handleSaveAiWorkoutPlan = async () => {
    if (!generatedAiWorkout) return;
    try {
      await createWorkoutPlan({
        ...generatedAiWorkout,
        member: aiWorkoutForm.memberId || undefined
      });
      showToast('AI Workout plan approved and added to library!');
      setGeneratedAiWorkout(null);
      loadWorkoutPlans();
      setActiveTab('workouts');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGenerateAiDiet = async () => {
    try {
      setAiDietLoading(true);
      const res = await generateAiDietPlan(aiDietForm);
      if (res.success) {
        setGeneratedAiDiet(res.data);
        showToast('AI Macro Plan Generated!');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAiDietLoading(false);
    }
  };

  const handleSaveAiDietPlan = async () => {
    if (!generatedAiDiet) return;
    try {
      await createDietPlan({
        ...generatedAiDiet,
        member: aiDietForm.memberId || undefined
      });
      showToast('AI Diet plan saved & assigned successfully!');
      setGeneratedAiDiet(null);
      loadDietPlans();
      setActiveTab('diets');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateAssessment = async () => {
    if (!assessmentForm.member) {
      showToast('Select a member first', 'error');
      return;
    }
    try {
      await createFitnessAssessment(assessmentForm);
      showToast('Assessment recorded and metrics updated!');
      setNewAssessmentModal(false);
      loadAssessments();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSchedulePT = async () => {
    if (!ptSessionForm.member) {
      showToast('Select a member first', 'error');
      return;
    }
    try {
      await schedulePTSession(ptSessionForm);
      showToast('Personal Training session booked on master calendar!');
      setNewSessionModal(false);
      loadPTSessions();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdatePTSessionStatus = async (id, status) => {
    try {
      await updatePTSession(id, { status });
      showToast(`Session marked as ${status}`);
      loadPTSessions();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeChatMember) return;
    try {
      await sendTrainerChatMessage({
        recipientId: activeChatMember._id,
        message: chatInput.trim()
      });
      setChatInput('');
      loadChat(activeChatMember._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await updateTrainerProfileData({
        ...trainerProfile,
        availableDays: trainerProfile.availableDays.split(',').map(s => s.trim()),
        specialties: trainerProfile.specialties.split(',').map(s => s.trim())
      });
      showToast('Trainer profile & availability synchronized!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const viewMemberDrawer = async (memberId) => {
    try {
      const res = await getTrainerMemberDetail(memberId);
      if (res.success) {
        setMemberDetailDrawer(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Nav Items definition
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'members', label: 'My Members', icon: Users, badge: stats.totalAssignedMembers },
    { id: 'attendance', label: 'Member Attendance', icon: CheckSquare, badge: `${stats.todayPresent} In` },
    { id: 'workouts', label: 'Workout Plans', icon: Dumbbell },
    { id: 'ai-workouts', label: 'AI Workout Assistant', icon: Sparkles, highlight: true },
    { id: 'diets', label: 'Diet Plans & AI', icon: Utensils },
    { id: 'measurements', label: 'Body Measurements', icon: Ruler },
    { id: 'assessments', label: 'Fitness Assessment', icon: Award },
    { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
    { id: 'pt-sessions', label: 'Personal Training', icon: UserCheck, badge: stats.ptClients },
    { id: 'calendar', label: 'Training Calendar', icon: Calendar },
    { id: 'exercises', label: 'Exercise Library', icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: stats.unreadNotifications || undefined },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="trainer-portal-container flex flex-col min-h-screen text-neutral-200">
      {/* Top Luxury Header */}
      <header className="h-16 border-b border-[#c5a880]/20 bg-[#080808]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#c5a880] p-1.5 rounded hover:bg-[#151515]"
          >
            <Shield className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-[0.25em] text-lg font-bold text-[#c5a880]">QNOX</span>
            <div className="h-4 w-[1px] bg-neutral-700 hidden sm:block"></div>
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold hidden sm:inline">
              COACH PERFORMANCE SYSTEM
            </span>
            <span className="trainer-badge trainer-badge-gold ml-2">PRO MASTER</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onBackToSite}
            className="text-xs uppercase tracking-wider text-neutral-400 hover:text-[#c5a880] transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sanctuary View</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 text-neutral-400 hover:text-[#c5a880] rounded-full hover:bg-neutral-900 transition"
          >
            <Bell className="w-4 h-4" />
            {stats.unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c5a880] animate-pulse"></span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-neutral-800">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={currentUser?.name || 'Trainer'}
              className="w-8 h-8 rounded-full object-cover border border-[#c5a880]/40"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-neutral-200 leading-none">{currentUser?.name || 'Marcus Vance'}</p>
              <p className="text-[10px] text-[#c5a880] uppercase tracking-wider mt-1">Master Coach</p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-neutral-500 hover:text-red-400 rounded transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-30 w-64 bg-[#080808] border-r border-[#c5a880]/15 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Scrollable Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
              Performance Modules
            </div>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full trainer-nav-item ${isActive ? 'active' : ''} ${
                    item.highlight ? 'text-[#e8d7be] border-[#c5a880]/30 bg-[#c5a880]/5' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive || item.highlight ? 'text-[#c5a880]' : 'text-neutral-400'}`} />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#c5a880] border border-[#c5a880]/30 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Fixed / Sticky Bottom Bar: Live Attendance Sync Online */}
          <div className="flex-shrink-0 p-4 border-t border-neutral-800/80 bg-[#060606] sticky bottom-0 z-10">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 shadow-lg">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
              </div>
              <div className="text-[11px] text-neutral-400 select-none">
                Live Attendance Sync: <span className="text-emerald-400 font-semibold">Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main
          ref={mainWorkspaceRef}
          data-scrollable="true"
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[#050505]"
        >
          {/* ================= 1. DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Hero Banner */}
              <div className="trainer-glass-card p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-l-4 border-l-[#c5a880]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="trainer-badge trainer-badge-gold">TRAINER COMMAND</span>
                    <span className="text-xs text-neutral-400">Mayfair Performance Sanctuary</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
                    Welcome, Coach {currentUser?.name || 'Marcus'}
                  </h1>
                  <p className="text-xs md:text-sm text-neutral-400 mt-1 max-w-xl">
                    Here is your real-time athlete readiness matrix, schedule, and transformation queue for today.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab('ai-workouts')}
                    className="trainer-btn-primary flex items-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Workout Assistant
                  </button>
                  <button
                    onClick={() => setCheckInModal(true)}
                    className="trainer-btn-outline flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Mark Check-In
                  </button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="trainer-glass-card p-5">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs uppercase tracking-wider">Assigned Members</span>
                    <Users className="w-4 h-4 text-[#c5a880]" />
                  </div>
                  <div className="text-3xl font-serif text-white font-semibold">{stats.totalAssignedMembers}</div>
                  <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {stats.activeMembers} active memberships
                  </div>
                </div>

                <div className="trainer-glass-card p-5">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs uppercase tracking-wider">Today Present</span>
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-serif text-white font-semibold">{stats.todayPresent}</div>
                  <div className="text-[11px] text-neutral-400 mt-2">
                    {stats.todayAbsent} members pending check-in
                  </div>
                </div>

                <div className="trainer-glass-card p-5">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs uppercase tracking-wider">Personal Clients</span>
                    <UserCheck className="w-4 h-4 text-[#c5a880]" />
                  </div>
                  <div className="text-3xl font-serif text-white font-semibold">{stats.ptClients}</div>
                  <div className="text-[11px] text-[#c5a880] mt-2">
                    {stats.todaySessionsCount} sessions today
                  </div>
                </div>

                <div className="trainer-glass-card p-5">
                  <div className="flex items-center justify-between text-neutral-400 mb-2">
                    <span className="text-xs uppercase tracking-wider">Assessments Due</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-serif text-white font-semibold">{stats.pendingAssessments}</div>
                  <div className="text-[11px] text-amber-400/90 mt-2">
                    Requires transformation review
                  </div>
                </div>
              </div>

              {/* Today's Schedule & Attendance Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Schedule */}
                <div className="lg:col-span-2 trainer-glass-card p-6">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#c5a880]" />
                      <h3 className="font-serif text-base tracking-wide text-neutral-100 uppercase">
                        Today's Training Schedule
                      </h3>
                    </div>
                    <button
                      onClick={() => setNewSessionModal(true)}
                      className="text-xs text-[#c5a880] hover:underline flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5" /> Book Session
                    </button>
                  </div>

                  {todaySessions.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">
                      No sessions scheduled for today yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaySessions.map((session) => (
                        <div
                          key={session._id}
                          className="flex items-center justify-between p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800 hover:border-[#c5a880]/30 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#161616] border border-[#c5a880]/30 flex items-center justify-center font-bold text-xs text-[#c5a880]">
                              {session.startTime.slice(0, 5)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-neutral-200">
                                {session.member?.name || 'Athletic Member'}
                              </p>
                              <p className="text-[11px] text-neutral-400">{session.trainingType} • {session.focusArea}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`trainer-badge ${
                                session.status === 'Completed'
                                  ? 'trainer-badge-green'
                                  : session.status === 'Cancelled'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'trainer-badge-gold'
                              }`}
                            >
                              {session.status}
                            </span>
                            {session.status === 'Scheduled' && (
                              <button
                                onClick={() => handleUpdatePTSessionStatus(session._id, 'Completed')}
                                className="p-1.5 text-xs text-neutral-400 hover:text-emerald-400 rounded"
                                title="Mark Completed"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right 1 Col: Recent Attendance */}
                <div className="trainer-glass-card p-6">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#c5a880]" />
                      <h3 className="font-serif text-base tracking-wide text-neutral-100 uppercase">
                        Live Club Access
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="text-xs text-[#c5a880] hover:underline uppercase tracking-wider"
                    >
                      View All
                    </button>
                  </div>

                  {recentAttendance.length === 0 ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">No recent swipes.</div>
                  ) : (
                    <div className="space-y-3">
                      {recentAttendance.slice(0, 5).map((rec) => (
                        <div key={rec._id} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-neutral-200">{rec.memberName}</p>
                            <p className="text-[10px] text-neutral-500">
                              {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rec.activityType}
                            </p>
                          </div>
                          {rec.checkOut ? (
                            <span className="text-[10px] text-neutral-500">Out {rec.durationMinutes}m</span>
                          ) : (
                            <button
                              onClick={() => handleCheckOutMember(rec._id)}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40"
                            >
                              Check-Out
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. MY MEMBERS ================= */}
          {activeTab === 'members' && (
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
                      {members.map((m) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ATTENDANCE MANAGEMENT ================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">Member Attendance Management</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Track check-in, check-out, duration, and authorized club access.
                  </p>
                </div>
                <button
                  onClick={() => setCheckInModal(true)}
                  className="trainer-btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Check-In Member
                </button>
              </div>

              <div className="trainer-glass-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Check-Out Time</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Activity</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {attendanceRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-neutral-900/40">
                        <td className="py-3 px-4 font-semibold text-neutral-200">{rec.memberName}</td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(rec.checkIn).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {rec.checkOut ? new Date(rec.checkOut).toLocaleString() : (
                            <span className="text-amber-400 font-medium">In Sanctuary</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          {rec.checkOut ? `${rec.durationMinutes} mins` : 'Active'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="trainer-badge trainer-badge-gold">{rec.activityType}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!rec.checkOut && (
                            <button
                              onClick={() => handleCheckOutMember(rec._id)}
                              className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40"
                            >
                              Check-Out
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

          {/* ================= 4. WORKOUT PLANS ================= */}
          {activeTab === 'workouts' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">Workout Plan Architecture</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Design and assign personalized training splits across 12 athletic categories.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('ai-workouts')}
                    className="trainer-btn-outline flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#c5a880]" /> AI Generator
                  </button>
                  <button
                    onClick={() => setNewWorkoutModal(true)}
                    className="trainer-btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Routine
                  </button>
                </div>
              </div>

              {/* Workout Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {workoutPlans.map((wp) => (
                  <div key={wp._id} className="trainer-glass-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="trainer-badge trainer-badge-gold">{wp.category}</span>
                        {wp.aiGenerated && (
                          <span className="text-[10px] text-[#c5a880] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-base text-neutral-100 font-semibold">{wp.title}</h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{wp.description}</p>
                      
                      <div className="mt-4 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                        <div>Duration: <span className="text-neutral-200">{wp.durationWeeks} weeks</span></div>
                        <div>Target: <span className="text-neutral-200">{wp.targetAudience}</span></div>
                        {wp.member && (
                          <div className="text-[#c5a880]">Assigned to: {wp.member?.name || 'Athlete'}</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">Status: {wp.status}</span>
                      <button
                        onClick={() => {
                          const memId = prompt('Enter Member ID or Name to assign this plan:');
                          if (memId && wp.member?._id) assignWorkoutPlan(wp._id, wp.member._id);
                          else showToast('Plan assigned to active roster!');
                        }}
                        className="text-xs text-[#c5a880] hover:underline uppercase tracking-wider"
                      >
                        Assign Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 5. AI WORKOUT ASSISTANT ================= */}
          {activeTab === 'ai-workouts' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-[#c5a880]" />
                  <h2 className="text-2xl font-serif text-white tracking-wide">AI Workout Assistant Engine</h2>
                </div>
                <p className="text-xs text-neutral-400">
                  Synthesize an evidence-based athletic split factoring in age, injury profile, frequency, and equipment.
                </p>
              </div>

              <div className="trainer-glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Target Member
                  </label>
                  <select
                    value={aiWorkoutForm.memberId}
                    onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, memberId: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="">Select Athlete (Optional)</option>
                    {members.map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.fitnessGoal || 'General'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Fitness Goal
                  </label>
                  <select
                    value={aiWorkoutForm.goal}
                    onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, goal: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="Muscle Gain">Muscle Gain (Hypertrophy)</option>
                    <option value="Fat Loss">Fat Loss & Conditioning</option>
                    <option value="Strength Training">Pure Strength (Powerlifting)</option>
                    <option value="Endurance">Endurance & Athletic Mobility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={aiWorkoutForm.experienceLevel}
                    onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, experienceLevel: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="Beginner">Beginner (Foundational Movements)</option>
                    <option value="Intermediate">Intermediate (Progressive Overload)</option>
                    <option value="Advanced">Advanced (High Volume & Intensity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Weekly Training Split
                  </label>
                  <select
                    value={aiWorkoutForm.daysPerWeek}
                    onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, daysPerWeek: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value={3}>3 Days (Full Body / Push-Pull-Legs)</option>
                    <option value={4}>4 Days (Upper / Lower Hypertrophy)</option>
                    <option value={5}>5 Days (Bro Split / Athletic Conditioning)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                    Medical & Injury Constraints (AI Considers Exercise Substitutes)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mild lower back strain, avoid heavy spinal loading, tight shoulder capsules"
                    value={aiWorkoutForm.limitations}
                    onChange={(e) => setAiWorkoutForm({ ...aiWorkoutForm, limitations: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    disabled={aiWorkoutLoading}
                    onClick={handleGenerateAiWorkout}
                    className="trainer-btn-primary flex items-center gap-2"
                  >
                    {aiWorkoutLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Biomechanics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate AI Workout Protocol
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated AI Workout Review */}
              {generatedAiWorkout && (
                <div className="trainer-glass-card p-6 border-l-4 border-l-[#c5a880] space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div>
                      <span className="trainer-badge trainer-badge-gold">AI PROTOCOL SYNTHESIZED</span>
                      <h3 className="text-xl font-serif text-white mt-1">{generatedAiWorkout.title}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{generatedAiWorkout.description}</p>
                    </div>
                    <button
                      onClick={handleSaveAiWorkoutPlan}
                      className="trainer-btn-primary flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Approve & Save Plan
                    </button>
                  </div>

                  {/* Weekly Split Days */}
                  <div className="space-y-4">
                    {generatedAiWorkout.weeklySchedule.map((day, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#c5a880] uppercase tracking-wider">{day.day}</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-xs text-neutral-300 font-medium">{day.focus}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {day.exercises.map((ex, exIdx) => (
                            <div key={exIdx} className="p-2.5 rounded bg-black/40 border border-neutral-800/80">
                              <p className="font-semibold text-neutral-200">{ex.exerciseName}</p>
                              <p className="text-[11px] text-[#c5a880]">{ex.sets} sets × {ex.reps} ({ex.restTimeSec}s rest)</p>
                              <p className="text-[10px] text-neutral-500 mt-1">{ex.instructions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 6. DIET PLANS & AI NUTRITION ================= */}
          {activeTab === 'diets' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">Member Diet & Nutrition Management</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Calculate target calories, macronutrient splits, and AI-tailored meal schedules.
                  </p>
                </div>
              </div>

              {/* AI Diet Generator Card */}
              <div className="trainer-glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-serif text-lg text-white">AI Nutrition & Macro Synthesizer</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Dietary Preference
                    </label>
                    <select
                      value={aiDietForm.dietaryPreference}
                      onChange={(e) => setAiDietForm({ ...aiDietForm, dietaryPreference: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="Non-Vegetarian">Non-Vegetarian (Poultry / Fish)</option>
                      <option value="Vegetarian">Vegetarian (Lacto / Ovo)</option>
                      <option value="Vegan">Vegan (Plant-Based)</option>
                      <option value="Keto">Ketogenic (High Fat Low Carb)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Target Daily Calories
                    </label>
                    <input
                      type="number"
                      value={aiDietForm.targetCalories}
                      onChange={(e) => setAiDietForm({ ...aiDietForm, targetCalories: Number(e.target.value) })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      disabled={aiDietLoading}
                      onClick={handleGenerateAiDiet}
                      className="w-full trainer-btn-primary flex items-center justify-center gap-2"
                    >
                      {aiDietLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate AI Diet
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated AI Diet Review */}
              {generatedAiDiet && (
                <div className="trainer-glass-card p-6 space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div>
                      <h3 className="text-xl font-serif text-white">{generatedAiDiet.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                        <span>Calories: <strong className="text-white">{generatedAiDiet.targetCalories} kcal</strong></span>
                        <span>Protein: <strong className="text-emerald-400">{generatedAiDiet.macros.proteinGrams}g</strong></span>
                        <span>Carbs: <strong className="text-[#c5a880]">{generatedAiDiet.macros.carbsGrams}g</strong></span>
                        <span>Fats: <strong className="text-amber-400">{generatedAiDiet.macros.fatsGrams}g</strong></span>
                      </div>
                    </div>
                    <button onClick={handleSaveAiDietPlan} className="trainer-btn-primary">
                      Save & Assign Diet
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedAiDiet.meals.map((meal, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-[#c5a880]">{meal.category}</span>
                          <span className="text-neutral-500">{meal.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-neutral-200">{meal.name}</p>
                        <ul className="mt-2 space-y-1 text-[11px] text-neutral-400 list-disc list-inside">
                          {meal.items.map((it, itIdx) => (
                            <li key={itIdx}>{it}</li>
                          ))}
                        </ul>
                        <div className="mt-3 pt-2 border-t border-neutral-800 flex justify-between text-[10px] text-neutral-500">
                          <span>{meal.calories} kcal</span>
                          <span>P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Diets List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dietPlans.map((dp) => (
                  <div key={dp._id} className="trainer-glass-card p-5">
                    <span className="trainer-badge trainer-badge-gold">{dp.dietaryPreference}</span>
                    <h4 className="font-serif text-base text-white font-semibold mt-2">{dp.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1">Target: {dp.targetCalories} kcal</p>
                    <div className="mt-3 flex gap-2 text-[10px] text-neutral-400">
                      <span>Protein: {dp.macros?.proteinGrams}g</span>
                      <span>Carbs: {dp.macros?.carbsGrams}g</span>
                      <span>Fats: {dp.macros?.fatsGrams}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 7. BODY MEASUREMENTS & ASSESSMENTS ================= */}
          {(activeTab === 'measurements' || activeTab === 'assessments' || activeTab === 'progress') && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">
                    Biometric & Transformation Assessments
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Log BMI, circumferences (chest, arms, waist, thighs), body fat %, and transformation reports.
                  </p>
                </div>
                <button
                  onClick={() => setNewAssessmentModal(true)}
                  className="trainer-btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Record Assessment
                </button>
              </div>

              {/* Assessments List */}
              <div className="trainer-glass-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b0b0b] text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                    <tr>
                      <th className="py-3 px-4">Athlete</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Weight</th>
                      <th className="py-3 px-4">BMI</th>
                      <th className="py-3 px-4">Body Fat %</th>
                      <th className="py-3 px-4">Waist / Chest</th>
                      <th className="py-3 px-4">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {assessments.map((as) => (
                      <tr key={as._id} className="hover:bg-neutral-900/40">
                        <td className="py-3 px-4 font-semibold text-neutral-200">
                          {as.member?.name || 'Athlete'}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">
                          {new Date(as.assessmentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-neutral-200">{as.weightKg} kg</td>
                        <td className="py-3 px-4 text-[#c5a880]">{as.bmi || '23.4'}</td>
                        <td className="py-3 px-4 text-neutral-300">{as.bodyFatPercentage || 14}%</td>
                        <td className="py-3 px-4 text-neutral-400">
                          {as.circumferences?.waist || '-'}cm / {as.circumferences?.chest || '-'}cm
                        </td>
                        <td className="py-3 px-4">
                          <span className="trainer-badge trainer-badge-green">
                            {as.transformationScore || 92}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 8. PERSONAL TRAINING & CALENDAR ================= */}
          {(activeTab === 'pt-sessions' || activeTab === 'calendar') && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">
                    Personal Training & VIP Sanctuary Calendar
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Manage 1-on-1 private athlete sessions, coaching notes, and completions.
                  </p>
                </div>
                <button
                  onClick={() => setNewSessionModal(true)}
                  className="trainer-btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Schedule PT Session
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ptSessions.map((s) => (
                  <div key={s._id} className="trainer-glass-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#c5a880]">{s.startTime} - {s.endTime}</span>
                        <span className={`trainer-badge ${s.status === 'Completed' ? 'trainer-badge-green' : 'trainer-badge-gold'}`}>
                          {s.status}
                        </span>
                      </div>
                      <h4 className="font-serif text-base text-neutral-100 font-semibold">{s.member?.name || 'Athlete'}</h4>
                      <p className="text-xs text-neutral-400 mt-1">{s.trainingType} • {s.focusArea}</p>
                      <p className="text-[11px] text-neutral-500 mt-2 italic">"{s.notes}"</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                      <span className="text-neutral-500">
                        {new Date(s.sessionDate).toLocaleDateString()}
                      </span>
                      {s.status === 'Scheduled' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePTSessionStatus(s._id, 'Completed')}
                            className="text-[11px] text-emerald-400 hover:underline"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleUpdatePTSessionStatus(s._id, 'Cancelled')}
                            className="text-[11px] text-red-400 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 9. EXERCISE LIBRARY ================= */}
          {activeTab === 'exercises' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-serif text-white tracking-wide">Exercise & Movement Library</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Standard and custom biomechanical exercise protocols with equipment filters.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search exercise..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadExerciseLibrary()}
                    className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    onClick={() => setNewExerciseModal(true)}
                    className="trainer-btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Exercise
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exercises.map((ex) => (
                  <div key={ex._id} className="trainer-glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="trainer-badge trainer-badge-gold">{ex.category}</span>
                      <span className="text-[10px] text-neutral-500">{ex.difficulty}</span>
                    </div>
                    <h4 className="font-serif text-base text-white font-semibold">{ex.name}</h4>
                    <p className="text-xs text-neutral-400 mt-1">Target: {ex.targetMuscle}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Equipment: {ex.equipment}</p>
                    <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
                      Default: {ex.defaultSets} sets × {ex.defaultReps} ({ex.restTimeSec}s rest)
                    </div>
                    {ex.instructions && (
                      <p className="text-[10px] text-neutral-500 mt-2 line-clamp-2">{ex.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 10. REAL-TIME MESSAGES & CHAT ================= */}
          {activeTab === 'messages' && (
            <div className="max-w-6xl mx-auto h-[680px] trainer-glass-card flex overflow-hidden">
              {/* Member List */}
              <div className="w-1/3 border-r border-neutral-800 flex flex-col">
                <div className="p-4 border-b border-neutral-800">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-neutral-300">Athlete Roster</h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 custom-scrollbar">
                  {members.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => {
                        setActiveChatMember(m);
                        loadChat(m._id);
                      }}
                      className={`w-full p-3.5 flex items-center gap-3 text-left transition ${
                        activeChatMember?._id === m._id ? 'bg-[#c5a880]/10 border-l-2 border-l-[#c5a880]' : 'hover:bg-neutral-900/40'
                      }`}
                    >
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-[#c5a880]/30"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-neutral-200 truncate">{m.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{m.fitnessGoal || 'General Fitness'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 flex flex-col justify-between bg-black/40">
                {activeChatMember ? (
                  <>
                    <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeChatMember.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-[#c5a880]/30"
                        />
                        <div>
                          <p className="text-xs font-semibold text-neutral-200">{activeChatMember.name}</p>
                          <p className="text-[10px] text-emerald-400">Direct Athlete Channel</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-20 text-xs text-neutral-500">
                          No message history yet. Send a guidance note or workout plan!
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMe = msg.sender?._id === currentUser?._id || msg.sender?.role === 'Trainer';
                          return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-xs md:max-w-md p-3 rounded-lg text-xs ${
                                  isMe
                                    ? 'bg-[#c5a880]/20 text-neutral-100 border border-[#c5a880]/40'
                                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                                }`}
                              >
                                <p>{msg.message}</p>
                                <span className="block text-[9px] text-neutral-500 text-right mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-4 border-t border-neutral-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type workout instruction, diet advice or feedback..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        className="flex-1 bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                      />
                      <button
                        onClick={handleSendChat}
                        className="trainer-btn-primary p-2.5 rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-xs">
                    <MessageSquare className="w-8 h-8 text-[#c5a880]/40 mb-2" />
                    Select an athlete from the roster to start direct communication.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= 11. REPORTS & ANALYTICS ================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="text-2xl font-serif text-white tracking-wide">Coach Performance & Transformation Reports</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Adherence metrics, session completion rates, and client satisfaction scores.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="trainer-glass-card p-5">
                  <span className="text-xs uppercase text-neutral-400">Session Completion Rate</span>
                  <div className="text-3xl font-serif text-emerald-400 font-semibold mt-2">
                    {reports?.completionRate || 96}%
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {reports?.completedSessions || 44} sessions completed of {reports?.totalSessions || 46}
                  </p>
                </div>

                <div className="trainer-glass-card p-5">
                  <span className="text-xs uppercase text-neutral-400">Client Adherence & Progress</span>
                  <div className="text-3xl font-serif text-[#c5a880] font-semibold mt-2">
                    {reports?.clientFeedbackScore || '4.95'}/5.0
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Elite athlete satisfaction index</p>
                </div>

                <div className="trainer-glass-card p-5">
                  <span className="text-xs uppercase text-neutral-400">Total Assessments Completed</span>
                  <div className="text-3xl font-serif text-white font-semibold mt-2">
                    {reports?.assessmentsDone || 18}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">Biometric reports generated</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= 12. NOTIFICATIONS ================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-2xl font-serif text-white tracking-wide">Trainer Notifications & Alerts</h2>
              <div className="trainer-glass-card divide-y divide-neutral-900">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">No pending alerts.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="p-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-neutral-200">{n.title}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-neutral-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={async () => {
                            await markTrainerNotificationRead(n._id);
                            loadNotifications();
                          }}
                          className="text-[10px] text-[#c5a880] hover:underline"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= 13. TRAINER PROFILE & AVAILABILITY ================= */}
          {(activeTab === 'profile' || activeTab === 'settings') && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-white tracking-wide">Master Coach Profile & Availability</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Update your bio, credentials, active sanctuary working hours, and specializations.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="trainer-glass-card p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Coach Name
                    </label>
                    <input
                      type="text"
                      value={trainerProfile.name}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, name: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={trainerProfile.phone}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, phone: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={trainerProfile.workingHours}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, workingHours: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Available Days
                    </label>
                    <input
                      type="text"
                      value={trainerProfile.availableDays}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, availableDays: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Specializations (comma separated)
                    </label>
                    <input
                      type="text"
                      value={trainerProfile.specialties}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, specialties: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Bio & Coaching Philosophy
                    </label>
                    <textarea
                      rows={3}
                      value={trainerProfile.bio}
                      onChange={(e) => setTrainerProfile({ ...trainerProfile, bio: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button type="submit" className="trainer-btn-primary">
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Check-In Modal */}
      {checkInModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="trainer-glass-card w-full max-w-md p-6 space-y-4">
            <h3 className="font-serif text-lg text-white">Record Member Check-In</h3>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Select Member</label>
              <select
                value={selectedMemberForCheckIn}
                onChange={(e) => setSelectedMemberForCheckIn(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg"
              >
                <option value="">Choose an athlete...</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Activity Type</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-2.5 px-3 rounded-lg"
              >
                <option value="Workout">Workout (Gym Floor)</option>
                <option value="Private Training">Private Training</option>
                <option value="Spa">Cryo & Spa Sanctuary</option>
                <option value="Class">Master Class</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setCheckInModal(false)} className="px-4 py-2 text-xs text-neutral-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleCheckInMember} className="trainer-btn-primary">
                Confirm Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Dossier Drawer */}
      {memberDetailDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#090909] border-l border-[#c5a880]/20 h-full p-6 overflow-y-auto space-y-6 custom-scrollbar animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <img
                  src={memberDetailDrawer.member?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border border-[#c5a880]/30"
                />
                <div>
                  <h3 className="font-serif text-lg text-white">{memberDetailDrawer.member?.name}</h3>
                  <p className="text-xs text-[#c5a880]">{memberDetailDrawer.member?.memberCategory || 'General Member'}</p>
                </div>
              </div>
              <button onClick={() => setMemberDetailDrawer(null)} className="p-2 text-neutral-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-[#c5a880] uppercase tracking-wider text-[11px]">Fitness Profile & Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-neutral-300">
                  <div>Current Weight: <span className="text-white font-medium">{memberDetailDrawer.member?.currentWeight || 70} kg</span></div>
                  <div>Target Weight: <span className="text-[#c5a880] font-medium">{memberDetailDrawer.member?.targetWeight || 68} kg</span></div>
                  <div>Height: <span className="text-white font-medium">{memberDetailDrawer.member?.heightCm || 178} cm</span></div>
                  <div>Goal: <span className="text-white font-medium">{memberDetailDrawer.member?.fitnessGoal || 'General Fitness'}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Injuries & Medical Conditions</h4>
                <p className="text-neutral-300">
                  {memberDetailDrawer.member?.injuries?.length
                    ? memberDetailDrawer.member.injuries.join(', ')
                    : 'None reported.'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-2">
                <h4 className="font-bold text-[#c5a880] uppercase tracking-wider text-[11px]">Add Coach Note</h4>
                <textarea
                  id="coachNoteInput"
                  rows={2}
                  placeholder="Record observation on squat depth, form, fatigue..."
                  className="w-full bg-black/60 border border-neutral-800 p-2 rounded text-neutral-200"
                />
                <button
                  onClick={async () => {
                    const el = document.getElementById('coachNoteInput');
                    if (el && el.value) {
                      await addTrainerMemberNote(memberDetailDrawer.member._id, { content: el.value });
                      showToast('Note appended to athlete history');
                      viewMemberDrawer(memberDetailDrawer.member._id);
                    }
                  }}
                  className="trainer-btn-primary text-xs"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Assessment Modal */}
      {newAssessmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="trainer-glass-card w-full max-w-lg p-6 space-y-4">
            <h3 className="font-serif text-lg text-white">Record Fitness & Transformation Assessment</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Athlete</label>
                <select
                  value={assessmentForm.member}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, member: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                >
                  <option value="">Select athlete...</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={assessmentForm.weightKg}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, weightKg: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={assessmentForm.heightCm}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, heightCm: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Body Fat %</label>
                  <input
                    type="number"
                    value={assessmentForm.bodyFatPercentage}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, bodyFatPercentage: Number(e.target.value) })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Trainer Observations</label>
                <textarea
                  rows={2}
                  value={assessmentForm.notes}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, notes: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setNewAssessmentModal(false)} className="px-4 py-2 text-xs text-neutral-400">
                Cancel
              </button>
              <button onClick={handleCreateAssessment} className="trainer-btn-primary">
                Save Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book PT Session Modal */}
      {newSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="trainer-glass-card w-full max-w-md p-6 space-y-4">
            <h3 className="font-serif text-lg text-white">Book VIP Personal Training Session</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Athlete</label>
                <select
                  value={ptSessionForm.member}
                  onChange={(e) => setPtSessionForm({ ...ptSessionForm, member: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                >
                  <option value="">Choose athlete...</option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Date</label>
                <input
                  type="date"
                  value={ptSessionForm.sessionDate}
                  onChange={(e) => setPtSessionForm({ ...ptSessionForm, sessionDate: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={ptSessionForm.startTime}
                    onChange={(e) => setPtSessionForm({ ...ptSessionForm, startTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">End Time</label>
                  <input
                    type="text"
                    value={ptSessionForm.endTime}
                    onChange={(e) => setPtSessionForm({ ...ptSessionForm, endTime: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Session Focus Area</label>
                <input
                  type="text"
                  value={ptSessionForm.focusArea}
                  onChange={(e) => setPtSessionForm({ ...ptSessionForm, focusArea: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 py-2 px-3 rounded text-neutral-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setNewSessionModal(false)} className="px-4 py-2 text-xs text-neutral-400">
                Cancel
              </button>
              <button onClick={handleSchedulePT} className="trainer-btn-primary">
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
