import React, { useState } from 'react';
import { Calendar, Clock, User, Filter, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { reserveClassBooking } from '../services/api';
import './ScheduleSection.css';

const defaultClasses = [
  {
    _id: 'cls_1',
    title: 'METCON HYPOXIC 3000',
    category: 'Hypoxic Athletic',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Marcus Vance',
      title: 'Head of Human Performance (Ex-Olympic S&C)',
      image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop'
    },
    day: 'Monday',
    startTime: '07:00',
    durationMinutes: 50,
    intensity: 'High Athletic',
    capacity: 12,
    bookedSpots: 10
  },
  {
    _id: 'cls_2',
    title: 'CHRONO COMBAT & STRIKE',
    category: 'Combat',
    clubName: 'QNOX Soho Foundry',
    trainer: {
      name: 'Sasha Romanov',
      title: 'Former WBA Champion Coach',
      image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop'
    },
    day: 'Monday',
    startTime: '12:15',
    durationMinutes: 55,
    intensity: 'High Athletic',
    capacity: 16,
    bookedSpots: 14
  },
  {
    _id: 'cls_3',
    title: 'REFORMER PRECISION ALIGN',
    category: 'Reformer & Mat',
    clubName: 'QNOX Marylebone Mews',
    trainer: {
      name: 'Elena Rostova',
      title: 'Classical Pilates & Posture Specialist',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop'
    },
    day: 'Monday',
    startTime: '18:00',
    durationMinutes: 50,
    intensity: 'Precision & Core',
    capacity: 10,
    bookedSpots: 8
  },
  {
    _id: 'cls_4',
    title: 'HYDRO ENDURANCE & OXYGEN',
    category: 'Hydro / Swim',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Julian Thorne',
      title: 'Elite Aquatics Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop'
    },
    day: 'Tuesday',
    startTime: '07:30',
    durationMinutes: 45,
    intensity: 'Endurance & Breath',
    capacity: 8,
    bookedSpots: 5
  },
  {
    _id: 'cls_5',
    title: 'FORGED: ELEIKO STRENGTH LAB',
    category: 'Strength & Rig',
    clubName: 'QNOX Canary Wharf Horizon',
    trainer: {
      name: 'David Kim',
      title: 'Senior Power & Biomechanics Lead',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop'
    },
    day: 'Wednesday',
    startTime: '06:45',
    durationMinutes: 60,
    intensity: 'High Athletic',
    capacity: 14,
    bookedSpots: 12
  },
  {
    _id: 'cls_6',
    title: 'COLD PLUNGE & BREATH ARCHITECTURE',
    category: 'Cryo Recovery',
    clubName: 'QNOX Mayfair Sanctuary',
    trainer: {
      name: 'Aria Sterling',
      title: 'Neuro-Recovery & Wim Hof Protocol Coach',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop'
    },
    day: 'Thursday',
    startTime: '17:30',
    durationMinutes: 45,
    intensity: 'Restorative',
    capacity: 12,
    bookedSpots: 9
  }
];

export default function ScheduleSection({ classes = [], currentUser, onOpenAuth, onShowToast }) {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories = ['All', 'Combat', 'Hypoxic Athletic', 'Reformer & Mat', 'Hydro / Swim', 'Strength & Rig', 'Cryo Recovery'];

  const scheduleList = classes && classes.length > 0 ? classes : defaultClasses;

  const filtered = scheduleList.filter((item) => {
    const matchDay = selectedDay === 'All Days' || item.day.toLowerCase() === selectedDay.toLowerCase();
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchDay && matchCategory;
  });

  const handleBook = async (classItem) => {
    if (!currentUser) {
      if (onShowToast) onShowToast({ type: 'info', message: 'Please sign in to reserve masterclasses.' });
      onOpenAuth();
      return;
    }

    setBookingLoading(true);
    try {
      const res = await reserveClassBooking(classItem._id || 'temp', new Date().toISOString().split('T')[0]);
      setBookingSuccess({
        message: res.message || `Slot booked in ${classItem.title}`,
        code: res.data?.reservationCode || 'QNX-882941',
        title: classItem.title,
      });
      if (onShowToast) onShowToast({ type: 'success', message: `Reserved: ${classItem.title}!` });
      setTimeout(() => setBookingSuccess(null), 8000);
    } catch (e) {
      if (onShowToast) onShowToast({ type: 'error', message: e.message || 'Slot reservation full.' });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <section id="timetable" className="qnox-schedule-section">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
              LIVE MASTERCLASS TIMETABLE
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Curated Daily Disciplines
            </h2>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-light">
            Each session is capped with low coach-to-member ratios to ensure biomechanical feedback and pristine environmental air circulation.
          </p>
        </div>

        {/* Days selector */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`qnox-day-btn ${selectedDay === d ? 'active' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3.5 py-1.5 text-[11px] tracking-widest uppercase transition-all duration-300 border ${
                selectedCategory === c
                  ? 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10'
                  : 'border-white/5 text-neutral-500 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Success Alert Banner */}
        {bookingSuccess && (
          <div className="mb-8 p-4 bg-[#0e1610] border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold">{bookingSuccess.message}</p>
                <p className="text-xs text-emerald-400/80 font-mono">CONCIERGE PASS ID: {bookingSuccess.code}</p>
              </div>
            </div>
            <button onClick={() => setBookingSuccess(null)} className="text-emerald-400 hover:text-white text-xs underline">
              DISMISS
            </button>
          </div>
        )}

        {/* Class Schedule Cards / List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="p-12 text-center border border-white/10 bg-[#0a0a0a]">
              <p className="text-neutral-400 text-sm">No scheduled classes matching your filter on this day.</p>
              <button 
                onClick={() => { setSelectedDay('Monday'); setSelectedCategory('All'); }}
                className="mt-4 text-xs text-[#c5a880] underline tracking-widest uppercase"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filtered.map((item) => {
              const remaining = item.capacity - item.bookedSpots;
              return (
                <div
                  key={item._id || item.title}
                  className="qnox-schedule-card"
                >
                  {/* Time & Title */}
                  <div className="flex items-start sm:items-center space-x-6">
                    <div className="text-center shrink-0 border-r border-white/10 pr-6">
                      <span className="font-serif text-2xl text-white block">{item.startTime}</span>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{item.durationMinutes} MINS</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-[10px] tracking-[0.2em] uppercase px-2 py-0.5 bg-white/5 border border-white/10 text-[#c5a880]">
                          {item.category}
                        </span>
                        <span className="text-xs text-neutral-500">&bull;</span>
                        <span className="text-xs text-neutral-400 font-light">{item.clubName}</span>
                      </div>
                      <h4 className="font-serif text-xl text-white">{item.title}</h4>
                    </div>
                  </div>

                  {/* Trainer Profile */}
                  <div className="flex items-center space-x-4">
                    {(item.trainer?.photo || item.trainer?.avatar || item.trainer?.image) && (
                      <img
                        src={item.trainer.photo || item.trainer.avatar || item.trainer.image}
                        alt={item.trainer.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white tracking-wide">{item.trainer?.name}</p>
                      <p className="text-[11px] text-neutral-400 max-w-[200px] truncate">{item.trainer?.title}</p>
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">AVAILABILITY</span>
                      <span className={`text-xs font-medium ${remaining <= 3 ? 'text-amber-400' : 'text-neutral-300'}`}>
                        {remaining} {remaining === 1 ? 'Slot Left' : 'Slots Left'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleBook(item)}
                      disabled={bookingLoading || remaining <= 0}
                      className="px-5 py-2.5 bg-transparent border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-all text-xs font-semibold tracking-[0.2em] uppercase shrink-0 disabled:opacity-40"
                    >
                      {remaining <= 0 ? 'WAITLIST ONLY' : 'RESERVE SPOT'}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </section>
  );
}
