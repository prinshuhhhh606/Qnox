import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock, User, Filter, CheckCircle, AlertCircle, ArrowUpRight, Search, MapPin, Zap } from 'lucide-react';
import { fetchSchedule, reserveClassBooking } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const defaultClasses = [
  {
    _id: 'cls_1',
    title: 'METCON HYPOXIC 3000',
    category: 'Hypoxic Athletic',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Marcus Vance',
      title: 'Head of Human Performance (Ex-Olympic S&C)',
      avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Monday',
    startTime: '07:00',
    durationMinutes: 50,
    intensity: 'High Athletic',
    capacity: 12,
    bookedSpots: 10,
    status: 'Available',
  },
  {
    _id: 'cls_2',
    title: 'CHRONO COMBAT & STRIKE',
    category: 'Combat & Striking',
    clubName: 'QNOX Soho Foundry',
    trainer: {
      name: 'Sasha Romanov',
      title: 'Former WBA Continental Champion Coach',
      avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Monday',
    startTime: '12:15',
    durationMinutes: 55,
    intensity: 'High Athletic',
    capacity: 16,
    bookedSpots: 16,
    status: 'Full',
  },
  {
    _id: 'cls_3',
    title: 'REFORMER PRECISION ALIGN',
    category: 'Reformer Pilates',
    clubName: 'QNOX Marylebone Mews',
    trainer: {
      name: 'Elena Rostova',
      title: 'Royal Ballet Fellow & Movement Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    },
    day: 'Monday',
    startTime: '18:00',
    durationMinutes: 50,
    intensity: 'Precision & Core',
    capacity: 8,
    bookedSpots: 6,
    status: 'Available',
  },
  {
    _id: 'cls_4',
    title: 'HYDRO ENDURANCE & OXYGEN',
    category: 'Aquatics & Hydro',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Julian Thorne',
      title: 'Aquatics Director & Swim Coach',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Tuesday',
    startTime: '07:30',
    durationMinutes: 45,
    intensity: 'Cardio & Laps',
    capacity: 10,
    bookedSpots: 4,
    status: 'Available',
  },
  {
    _id: 'cls_5',
    title: 'OLYMPIC KINETIC POWER',
    category: 'Strength & Power',
    clubName: 'QNOX Soho Foundry',
    trainer: {
      name: 'Marcus Vance',
      title: 'Head of Human Performance',
      avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Tuesday',
    startTime: '18:30',
    durationMinutes: 60,
    intensity: 'Heavy Olympic',
    capacity: 10,
    bookedSpots: 9,
    status: 'Available',
  },
  {
    _id: 'cls_6',
    title: 'SUB-ZERO CRYO RECOVERY LAB',
    category: 'Longevity & Cryo',
    clubName: 'QNOX Canary Wharf Horizon',
    trainer: {
      name: 'Aria Sterling',
      title: 'Biomedical Recovery Director',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop',
    },
    day: 'Wednesday',
    startTime: '08:00',
    durationMinutes: 45,
    intensity: 'Contrast & Recovery',
    capacity: 8,
    bookedSpots: 8,
    status: 'Full',
  },
  {
    _id: 'cls_7',
    title: 'METCON HYPOXIC 3000',
    category: 'Hypoxic Athletic',
    clubName: 'QNOX Canary Wharf Horizon',
    trainer: {
      name: 'Marcus Vance',
      title: 'Head of Human Performance',
      avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Wednesday',
    startTime: '17:30',
    durationMinutes: 50,
    intensity: 'High Athletic',
    capacity: 12,
    bookedSpots: 7,
    status: 'Available',
  },
  {
    _id: 'cls_8',
    title: 'CHAMPIONSHIP HEAVY BAG RIG',
    category: 'Combat & Striking',
    clubName: 'QNOX Soho Foundry',
    trainer: {
      name: 'Sasha Romanov',
      title: 'Head of Combat',
      avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Thursday',
    startTime: '12:00',
    durationMinutes: 50,
    intensity: 'High Athletic',
    capacity: 14,
    bookedSpots: 5,
    status: 'Available',
  },
  {
    _id: 'cls_9',
    title: 'FASCIA INFRARED REFORMER',
    category: 'Reformer Pilates',
    clubName: 'QNOX Marylebone Mews',
    trainer: {
      name: 'Elena Rostova',
      title: 'Movement Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    },
    day: 'Thursday',
    startTime: '18:15',
    durationMinutes: 50,
    intensity: 'Precision & Core',
    capacity: 8,
    bookedSpots: 3,
    status: 'Available',
  },
  {
    _id: 'cls_10',
    title: 'THE SATURDAY COMBAT SMOKER',
    category: 'Combat & Striking',
    clubName: 'QNOX Soho Foundry',
    trainer: {
      name: 'Sasha Romanov',
      title: 'Head of Combat',
      avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Saturday',
    startTime: '10:00',
    durationMinutes: 75,
    intensity: 'Extreme Conditioning',
    capacity: 16,
    bookedSpots: 12,
    status: 'Available',
  },
  {
    _id: 'cls_11',
    title: 'SUNDAY SLATE AQUATICS & BRUNCH',
    category: 'Aquatics & Hydro',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Julian Thorne',
      title: 'Aquatics Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop',
    },
    day: 'Sunday',
    startTime: '10:30',
    durationMinutes: 60,
    intensity: 'Recovery & Laps',
    capacity: 12,
    bookedSpots: 9,
    status: 'Available',
  },
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetablePage(props) {
  const outletCtx = useOutletContext() || {};
  const { currentUser: authUser } = useAuth();
  const { showToast: notifToast } = useNotifications();
  const currentUser = props.currentUser || authUser;
  const onOpenAuth = props.onOpenAuth || outletCtx.onOpenAuth;
  const onShowToast = props.onShowToast || notifToast;
  const [classes, setClasses] = useState(defaultClasses);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingLoadingId, setBookingLoadingId] = useState(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await fetchSchedule();
        if (data && data.length > 0) {
          setClasses(data);
        }
      } catch (err) {
        console.warn('Using default luxury timetable');
      }
    };
    loadSchedule();
  }, []);

  const categories = [
    'ALL',
    'Hypoxic Athletic',
    'Combat & Striking',
    'Reformer Pilates',
    'Strength & Power',
    'Aquatics & Hydro',
    'Longevity & Cryo',
  ];

  const filteredClasses = classes.filter((cls) => {
    const matchesDay = selectedDay === 'ALL' || cls.day === selectedDay;
    const matchesCat =
      selectedCategory === 'ALL' ||
      cls.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.clubName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.trainer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDay && matchesCat && matchesSearch;
  });

  const handleBookClass = async (cls) => {
    if (!currentUser) {
      if (onShowToast) onShowToast({ type: 'info', message: 'Please sign in to reserve masterclasses.' });
      onOpenAuth();
      return;
    }

    if (cls.bookedSpots >= cls.capacity) {
      if (onShowToast) onShowToast({ type: 'error', message: 'This masterclass is at maximum capacity.' });
      return;
    }

    setBookingLoadingId(cls._id);
    try {
      const res = await reserveClassBooking({
        classId: cls._id,
        classTitle: cls.title,
        clubName: cls.clubName,
        trainerName: cls.trainer?.name,
        day: cls.day,
        startTime: cls.startTime,
        durationMinutes: cls.durationMinutes,
        category: cls.category,
        classDate: new Date().toISOString().split('T')[0],
      });

      // Update local state capacity
      setClasses((prev) =>
        prev.map((c) =>
          c._id === cls._id ? { ...c, bookedSpots: (c.bookedSpots || 0) + 1 } : c
        )
      );

      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Masterclass Reserved',
          message: `Slot confirmed for ${cls.title} on ${cls.day} at ${cls.startTime}. Concierge pass sent to your email.`,
        });
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Reservation Failed',
          message: err.message || 'Unable to secure slot.',
        });
      }
    } finally {
      setBookingLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Hero Header */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Timetable Schedule"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block mb-4">
              DAILY MASTERCLASSES &bull; CONCIERGE ACCESS PASSES
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-[1.1] mb-6">
              Your Training Schedule.
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed">
              Every masterclass is capped to ensure unyielding biometric feedback and personal coach guidance. Select your day, reserve your station, and experience athletic conditioning in its purest form.
            </p>
          </div>
        </div>
      </section>

      {/* Timetable Controls & Day Selector */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {/* Weekly Day Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 border-b border-white/10 scrollbar-none mb-8">
          <button
            onClick={() => setSelectedDay('ALL')}
            className={`px-5 py-3 text-xs font-mono uppercase tracking-wider transition whitespace-nowrap border ${
              selectedDay === 'ALL'
                ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880] font-bold'
                : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
            }`}
          >
            FULL WEEK
          </button>
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-5 py-3 text-xs font-mono uppercase tracking-wider transition whitespace-nowrap border ${
                selectedDay === day
                  ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880] font-bold shadow-md'
                  : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Filter Controls: Discipline & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-8 border-b border-white/5 mb-8">
          {/* Discipline Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition border ${
                  selectedCategory === cat
                    ? 'border-[#c5a880] text-white bg-[#c5a880]/10'
                    : 'border-white/5 text-neutral-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Live Search */}
          <div className="flex items-center space-x-2 bg-[#0a0a0a] border border-white/10 px-4 py-2 w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search class or coach..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-500 hover:text-white text-xs">
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Schedule Cards Listing */}
        {filteredClasses.length === 0 ? (
          <div className="border border-white/10 bg-[#090909] p-16 text-center">
            <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <h4 className="font-serif text-lg text-neutral-300 mb-1">No Masterclasses Scheduled</h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              No sessions match your selected filter criteria for {selectedDay}. Try clearing your discipline filter or selecting another day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClasses.map((cls) => {
              const booked = cls.bookedSpots || 0;
              const cap = cls.capacity || 12;
              const slotsLeft = Math.max(0, cap - booked);
              const isFull = slotsLeft === 0;

              return (
                <div
                  key={cls._id}
                  className="bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  {/* Left: Time and Title */}
                  <div className="flex items-start space-x-6">
                    <div className="text-center font-mono shrink-0 pt-1">
                      <span className="text-xl sm:text-2xl font-bold text-white block">
                        {cls.startTime}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest block">
                        {cls.durationMinutes} MINS
                      </span>
                      <span className="text-[9px] text-[#c5a880] font-bold uppercase tracking-widest block mt-1">
                        {cls.day}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880]">
                          {cls.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Intensity: <strong className="text-neutral-200">{cls.intensity || 'High Athletic'}</strong>
                        </span>
                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
                        {cls.title}
                      </h3>

                      <div className="flex items-center space-x-4 text-xs text-neutral-400 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
                          <span>{cls.clubName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Coach Info */}
                  <div className="flex items-center space-x-3 lg:border-x lg:border-white/10 lg:px-8 py-2">
                    {(cls.trainer?.photo || cls.trainer?.avatar || cls.trainer?.image) ? (
                      <img
                        src={cls.trainer.photo || cls.trainer.avatar || cls.trainer.image}
                        alt={cls.trainer.name}
                        className="w-11 h-11 rounded-full object-cover border border-[#c5a880]/40 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-white font-bold shrink-0">
                        {cls.trainer?.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase block">MASTER COACH</span>
                      <span className="text-xs font-serif font-bold text-white block">
                        {cls.trainer?.name || 'Senior Instructor'}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-light truncate max-w-[180px] block">
                        {cls.trainer?.title || 'Performance Specialist'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Capacity & Booking Action */}
                  <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="text-left lg:text-right font-mono">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-bold ${
                            isFull ? 'text-rose-400' : slotsLeft <= 3 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isFull ? 'CAPACITY REACHED' : `${slotsLeft} SLOTS REMAINING`}
                        </span>
                      </div>
                      <div className="w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full ${
                            isFull ? 'bg-rose-500' : slotsLeft <= 3 ? 'bg-amber-400' : 'bg-[#c5a880]'
                          }`}
                          style={{ width: `${Math.min(100, (booked / cap) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookClass(cls)}
                      disabled={isFull || bookingLoadingId === cls._id}
                      className={`w-full sm:w-auto px-6 py-3 text-xs font-bold uppercase tracking-wider transition ${
                        isFull
                          ? 'border border-neutral-700 text-neutral-600 cursor-not-allowed'
                          : 'bg-[#c5a880] hover:bg-white text-black shadow-md'
                      }`}
                    >
                      {bookingLoadingId === cls._id
                        ? 'SECURING SLOT...'
                        : isFull
                        ? 'CLASS FULL'
                        : 'BOOK MASTERCLASS'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
