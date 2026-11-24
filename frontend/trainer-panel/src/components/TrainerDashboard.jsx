import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Calendar, CheckSquare, Dumbbell, Sparkles, Utensils, Ruler,
  Award, TrendingUp, UserCheck, BookOpen, MessageSquare,
  BarChart3, Bell, User, Settings, LogOut, ArrowUpRight, Shield
} from 'lucide-react';
import {
  getTrainerDashboardStats,
  getTrainerMembers,
  getTrainerMemberDetail,
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
} from '../services/api';

// Tabs
import OverviewTab from './tabs/OverviewTab';
import MembersTab from './tabs/MembersTab';
import AttendanceTab from './tabs/AttendanceTab';
import WorkoutsTab from './tabs/WorkoutsTab';
import AiWorkoutsTab from './tabs/AiWorkoutsTab';
import DietsTab from './tabs/DietsTab';
import AssessmentsTab from './tabs/AssessmentsTab';
import SessionsTab from './tabs/SessionsTab';
import ExercisesTab from './tabs/ExercisesTab';
import MessagesTab from './tabs/MessagesTab';
import ReportsTab from './tabs/ReportsTab';
import NotificationsTab from './tabs/NotificationsTab';
import ProfileTab from './tabs/ProfileTab';

// Modals
import CheckInModal from './modals/CheckInModal';
import MemberDetailDrawer from './modals/MemberDetailDrawer';
import NewAssessmentModal from './modals/NewAssessmentModal';
import NewSessionModal from './modals/NewSessionModal';
import NewWorkoutModal from './modals/NewWorkoutModal';
import NewExerciseModal from './modals/NewExerciseModal';

import './TrainerDashboard.css';

export default function TrainerDashboard({ currentUser, onBackToSite, onLogout, onShowToast }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard');
  const [, setLoading] = useState(false);
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
  const [, setUpcomingSessions] = useState([]);
  const [, setRecentMembers] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Members & Dossier
  const [members, setMembers] = useState([]);
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
  const [workoutCategoryFilter] = useState('All');
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
  const [exerciseEquipmentFilter] = useState('All');
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
    else if (activeTab === 'profile' || activeTab === 'settings') loadProfile();

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

  const handleCreateWorkout = async () => {
    if (!workoutForm.title) {
      showToast('Please enter workout title', 'error');
      return;
    }
    try {
      await createWorkoutPlan(workoutForm);
      showToast('Workout plan created successfully!');
      setNewWorkoutModal(false);
      loadWorkoutPlans();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateExercise = async () => {
    if (!exerciseForm.name) {
      showToast('Please enter exercise name', 'error');
      return;
    }
    try {
      await createCustomExercise(exerciseForm);
      showToast('Exercise movement created successfully!');
      setNewExerciseModal(false);
      loadExerciseLibrary();
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
          {activeTab === 'dashboard' && (
            <OverviewTab
              currentUser={currentUser}
              stats={stats}
              todaySessions={todaySessions}
              recentAttendance={recentAttendance}
              setActiveTab={setActiveTab}
              setCheckInModal={setCheckInModal}
              setNewSessionModal={setNewSessionModal}
              handleUpdatePTSessionStatus={handleUpdatePTSessionStatus}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              members={members}
              memberSearch={memberSearch}
              setMemberSearch={setMemberSearch}
              memberCategoryFilter={memberCategoryFilter}
              setMemberCategoryFilter={setMemberCategoryFilter}
              loadMembers={loadMembers}
              viewMemberDrawer={viewMemberDrawer}
              setActiveChatMember={setActiveChatMember}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              attendanceRecords={attendanceRecords}
              setCheckInModal={setCheckInModal}
              handleCheckOutMember={handleCheckOutMember}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutsTab
              workoutPlans={workoutPlans}
              setActiveTab={setActiveTab}
              setNewWorkoutModal={setNewWorkoutModal}
              assignWorkoutPlan={assignWorkoutPlan}
              showToast={showToast}
            />
          )}

          {activeTab === 'ai-workouts' && (
            <AiWorkoutsTab
              aiWorkoutForm={aiWorkoutForm}
              setAiWorkoutForm={setAiWorkoutForm}
              members={members}
              aiWorkoutLoading={aiWorkoutLoading}
              handleGenerateAiWorkout={handleGenerateAiWorkout}
              generatedAiWorkout={generatedAiWorkout}
              handleSaveAiWorkoutPlan={handleSaveAiWorkoutPlan}
            />
          )}

          {activeTab === 'diets' && (
            <DietsTab
              aiDietForm={aiDietForm}
              setAiDietForm={setAiDietForm}
              aiDietLoading={aiDietLoading}
              handleGenerateAiDiet={handleGenerateAiDiet}
              generatedAiDiet={generatedAiDiet}
              handleSaveAiDietPlan={handleSaveAiDietPlan}
              dietPlans={dietPlans}
            />
          )}

          {(activeTab === 'assessments' || activeTab === 'measurements' || activeTab === 'progress') && (
            <AssessmentsTab
              assessments={assessments}
              setNewAssessmentModal={setNewAssessmentModal}
            />
          )}

          {(activeTab === 'pt-sessions' || activeTab === 'calendar') && (
            <SessionsTab
              ptSessions={ptSessions}
              setNewSessionModal={setNewSessionModal}
              handleUpdatePTSessionStatus={handleUpdatePTSessionStatus}
            />
          )}

          {activeTab === 'exercises' && (
            <ExercisesTab
              exercises={exercises}
              exerciseSearch={exerciseSearch}
              setExerciseSearch={setExerciseSearch}
              loadExerciseLibrary={loadExerciseLibrary}
              setNewExerciseModal={setNewExerciseModal}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              members={members}
              activeChatMember={activeChatMember}
              setActiveChatMember={setActiveChatMember}
              loadChat={loadChat}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChat={handleSendChat}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab reports={reports} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications}
              markTrainerNotificationRead={markTrainerNotificationRead}
              loadNotifications={loadNotifications}
            />
          )}

          {(activeTab === 'profile' || activeTab === 'settings') && (
            <ProfileTab
              trainerProfile={trainerProfile}
              setTrainerProfile={setTrainerProfile}
              handleSaveProfile={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <CheckInModal
        isOpen={checkInModal}
        onClose={() => setCheckInModal(false)}
        members={members}
        selectedMemberForCheckIn={selectedMemberForCheckIn}
        setSelectedMemberForCheckIn={setSelectedMemberForCheckIn}
        activityType={activityType}
        setActivityType={setActivityType}
        handleCheckInMember={handleCheckInMember}
      />

      <MemberDetailDrawer
        memberDetailDrawer={memberDetailDrawer}
        onClose={() => setMemberDetailDrawer(null)}
        addTrainerMemberNote={addTrainerMemberNote}
        showToast={showToast}
        viewMemberDrawer={viewMemberDrawer}
      />

      <NewAssessmentModal
        isOpen={newAssessmentModal}
        onClose={() => setNewAssessmentModal(false)}
        members={members}
        assessmentForm={assessmentForm}
        setAssessmentForm={setAssessmentForm}
        handleCreateAssessment={handleCreateAssessment}
      />

      <NewSessionModal
        isOpen={newSessionModal}
        onClose={() => setNewSessionModal(false)}
        members={members}
        ptSessionForm={ptSessionForm}
        setPtSessionForm={setPtSessionForm}
        handleSchedulePT={handleSchedulePT}
      />

      <NewWorkoutModal
        isOpen={newWorkoutModal}
        onClose={() => setNewWorkoutModal(false)}
        workoutForm={workoutForm}
        setWorkoutForm={setWorkoutForm}
        handleCreateWorkout={handleCreateWorkout}
      />

      <NewExerciseModal
        isOpen={newExerciseModal}
        onClose={() => setNewExerciseModal(false)}
        exerciseForm={exerciseForm}
        setExerciseForm={setExerciseForm}
        handleCreateExercise={handleCreateExercise}
      />
    </div>
  );
}
