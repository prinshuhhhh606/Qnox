import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Award, Trophy, ChevronLeft, ChevronRight, Play, Pause, Star, Sparkles, MapPin } from 'lucide-react';
import { fetchTrainers } from '../services/api';
import './MasterTrainers.css';

const defaultTrainers = [
  {
    _id: 'tr_1',
    name: 'Marcus Vance',
    role: 'HEAD OF HUMAN PERFORMANCE',
    badge: 'EX-OLYMPIC S&C COACH',
    specialties: ['Hypoxic Conditioning', 'VO2 Max Protocol', 'Olympic Lifting'],
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    bio: 'Over 14 years preparing podium athletes and private executives. Specialises in high-altitude metabolic endurance, velocity-based training, and central nervous system potentiation.',
    rating: 4.98,
    experience: '14+ Years',
    availableClubs: ['Mayfair Sanctuary', 'Soho Foundry'],
  },
  {
    _id: 'tr_2',
    name: 'Elena Rostova',
    role: 'DIRECTOR OF MOVEMENT & REFORMER',
    badge: 'ROYAL BALLET FELLOW',
    specialties: ['Classical Allegro 2', 'Spinal Decompression', 'Myofascial Slings'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    bio: 'Former principal soloist bringing surgical alignment and athletic power to reformer Pilates. Redefines posture through deliberate neuromuscular control.',
    rating: 4.99,
    experience: '11+ Years',
    availableClubs: ['Marylebone Mews', 'Mayfair Sanctuary'],
  },
  {
    _id: 'tr_3',
    name: 'Sasha Romanov',
    role: 'HEAD OF COMBAT & STRIKING',
    badge: 'FORMER WBA CONTINENTAL CHAMPION',
    specialties: ['Precision Counter-Striking', 'Footwork Mechanics', 'Fight Stamina'],
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    bio: 'World-renowned boxing trainer with over 32 professional bouts. Directs the QNOX Combat Ring armory with ruthless discipline and technical elegance.',
    rating: 5.0,
    experience: '16+ Years',
    availableClubs: ['Soho Foundry', 'Obsidian Tower'],
  },
  {
    _id: 'tr_4',
    name: 'Aria Sterling',
    role: 'DIRECTOR OF BIOMEDICAL RECOVERY',
    badge: 'PHD NEURO-PHYSIOLOGY',
    specialties: ['Sub-Zero Cryo Protocol', 'Heart Rate Variability', 'Hyperbaric Medicine'],
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop',
    bio: 'Oversees the QNOX longevity suites. Designs individualized thermal contrast therapies, hyperbaric oxygen protocols, and mitochondrial revitalization regimens.',
    rating: 4.97,
    experience: '10+ Years',
    availableClubs: ['Canary Wharf Horizon', 'Chelsea Waterfront'],
  },
  {
    _id: 'tr_5',
    name: 'Julian Thorne',
    role: 'DIRECTOR OF AQUATICS & ENDURANCE',
    badge: 'COMMONWEALTH GAMES MEDALIST',
    specialties: ['Elite Stroke Mechanics', 'Hypoxic Lap Pacing', 'Hydro-Rehab'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop',
    bio: 'Former national swim champion directing all 25m slate pool hydro-athletic programs. Combines fluid dynamics with altitude breathing mastery.',
    rating: 4.96,
    experience: '12+ Years',
    availableClubs: ['Mayfair Sanctuary', 'Chelsea Waterfront'],
  },
  {
    _id: 'tr_6',
    name: 'Kallum Drake',
    role: 'SENIOR FUNCTIONAL RIG SPECIALIST',
    badge: 'ROYAL MARINES INSTRUCTOR (RETD)',
    specialties: ['Tactical Rig Conditioning', 'Load Carriage', 'Mental Grit'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop',
    bio: 'Decorated physical training instructor translating military conditioning into bulletproof human resilience and rotational power.',
    rating: 4.98,
    experience: '13+ Years',
    availableClubs: ['Soho Foundry', 'Canary Wharf Horizon'],
  },
  {
    _id: 'tr_7',
    name: 'Sophia Laurent',
    role: 'MASTER MOBILITY & FASCIA SPECIALIST',
    badge: 'PARIS OPERA CONSULTANT',
    specialties: ['Myofascial Release', 'Dynamic Hip Mobility', 'Athletic Longevity'],
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop',
    bio: 'International consultant integrating fascial release with athletic conditioning to unlock maximal range of motion and joint resilience.',
    rating: 4.95,
    experience: '9+ Years',
    availableClubs: ['Marylebone Mews', 'Chelsea Waterfront'],
  },
  {
    _id: 'tr_8',
    name: 'David Chen',
    role: 'HEAD OF WEIGHTLIFTING & VELOCITY',
    badge: 'ASIAN WEIGHTLIFTING GOLD COACH',
    specialties: ['Kinetic Acceleration', 'Barbell Velocity (VBT)', 'Triple Extension'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop',
    bio: 'Master weightlifting coach specializing in force plate analysis, barbell velocity metrics, and explosive central nervous system recruitment.',
    rating: 5.0,
    experience: '15+ Years',
    availableClubs: ['Mayfair Sanctuary', 'Obsidian Tower'],
  },
];

export default function MasterTrainers({ onOpenTourModal }) {
  const [trainersList, setTrainersList] = useState(defaultTrainers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Dragging states
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const sliderRef = useRef(null);

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const data = await fetchTrainers();
        if (data && data.length > 0) {
          // Merge API data with default details
          setTrainersList(data);
        }
      } catch (err) {
        console.warn('Using default luxury trainers roster');
      }
    };
    loadTrainers();
  }, []);

  // Update scroll metrics on scroll
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);

    // Estimate current index based on card width
    const cardWidth = 368; // 340px width + 28px gap
    const idx = Math.min(
      trainersList.length - 1,
      Math.max(0, Math.round(scrollLeft / cardWidth))
    );
    setCurrentIndex(idx);
  };

  // Smooth slide functions
  const slidePrev = () => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.clientWidth > 640 ? 368 : 318;
    sliderRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const slideNext = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const cardWidth = clientWidth > 640 ? 368 : 318;

    // Loop back to start if at end
    if (scrollLeft + clientWidth >= scrollWidth - 20) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      sliderRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  const slideToIndex = (index) => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.clientWidth > 640 ? 368 : 318;
    sliderRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
  };

  // Mouse Drag to scroll
  const handleMouseDown = (e) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.6; // Scroll speed multiplier
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlaying || isHovered || isDragging) return;
    const timer = setInterval(() => {
      slideNext();
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, isDragging, trainersList.length]);

  return (
    <section id="trainers" className="qnox-trainers-section relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header with Title and Sliding Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/10 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#c5a880] animate-pulse" />
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-bold">
                THE MASTER PRACTITIONERS &bull; ROSTER
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Guided by Industry Pioneers
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xl mt-3 font-light leading-relaxed">
              Our faculty comprises former Olympic conditioning directors, world champion striking coaches, Royal Ballet movement fellows, and clinical neuro-physiologists.
            </p>
          </div>

          {/* Interactive Navigation Controls */}
          <div className="flex items-center space-x-4 self-start md:self-end flex-wrap gap-y-3">
            {/* Slide Index Display */}
            <div className="font-mono text-xs tracking-widest text-[#c5a880] px-3.5 py-2 border border-white/10 bg-[#0a0a0a] flex items-center space-x-2">
              <span className="text-white font-bold">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-neutral-600">/</span>
              <span className="text-neutral-400">
                {String(trainersList.length).padStart(2, '0')}
              </span>
            </div>

            {/* Autoplay Toggle Button */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2.5 border transition-all text-xs font-mono flex items-center space-x-1.5 ${
                isAutoPlaying
                  ? 'border-[#c5a880]/40 text-[#c5a880] bg-[#c5a880]/5'
                  : 'border-white/10 text-neutral-400 hover:text-white'
              }`}
              title={isAutoPlaying ? 'Pause horizontal autoscroll' : 'Resume autoscroll'}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] uppercase tracking-wider hidden sm:inline">
                {isAutoPlaying ? 'AUTO' : 'PAUSED'}
              </span>
            </button>

            {/* Left Prev Arrow Button */}
            <button
              onClick={slidePrev}
              disabled={!canScrollLeft}
              className="qnox-slider-nav-btn"
              title="Previous Trainer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Next Arrow Button */}
            <button
              onClick={slideNext}
              className="qnox-slider-nav-btn"
              title="Next Trainer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider Area */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            stopDragging();
          }}
        >
          {/* Edge gradient fade masks */}
          <div className="qnox-slider-fade-left hidden md:block" />
          <div className="qnox-slider-fade-right hidden md:block" />

          {/* Draggable Horizontal Track */}
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            className={`qnox-trainers-slider ${isDragging ? 'is-dragging' : ''}`}
          >
            {trainersList.map((t, index) => {
              const imageSrc = t.photo || t.avatar || t.image || defaultTrainers[index % defaultTrainers.length].image;
              const badgeLabel = t.badge || defaultTrainers[index % defaultTrainers.length].badge || 'MASTER COACH';
              const ratingVal = t.rating || '5.0';
              const specialtiesArr = Array.isArray(t.specialties) ? t.specialties : (t.specialties ? t.specialties.split(',') : defaultTrainers[index % defaultTrainers.length].specialties);
              const clubsArr = t.availableClubs || ['London Sanctuary Network'];

              return (
                <div
                  key={t._id || t.name || index}
                  className="qnox-trainer-slide group"
                >
                  <div>
                    {/* Portrait Photo Container */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 select-none">
                      <img
                        src={imageSrc}
                        alt={t.name}
                        draggable="false"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className="qnox-trainer-badge">
                          {badgeLabel}
                        </span>
                        
                        <div className="bg-black/85 backdrop-blur-md px-2 py-1 border border-white/10 text-[10px] font-mono text-[#c5a880] flex items-center space-x-1 shadow-lg">
                          <Star className="w-3 h-3 fill-[#c5a880]" />
                          <span>{ratingVal}</span>
                        </div>
                      </div>

                      {/* Floating club availability tag at bottom of image */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <div className="flex items-center space-x-1.5 text-[9px] font-mono uppercase tracking-wider text-neutral-300">
                          <MapPin className="w-3 h-3 text-[#c5a880]" />
                          <span className="truncate">{Array.isArray(clubsArr) ? clubsArr.join(' &bull; ') : clubsArr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Information Body */}
                    <div className="p-6">
                      <p className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-semibold mb-1 truncate">
                        {t.role || 'SANCTUARY MASTER COACH'}
                      </p>
                      <h3 className="font-serif text-2xl text-white mb-2.5 tracking-wide group-hover:text-[#c5a880] transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-neutral-400 text-xs font-light leading-relaxed mb-6 line-clamp-3">
                        {t.bio || 'World-class performance coach dedicated to high-performance conditioning, biomechanics, and physiological longevity.'}
                      </p>

                      {/* Specialties Pill Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                        {specialtiesArr.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-[9px] uppercase tracking-wider text-neutral-300 px-2 py-0.5 bg-white/[0.04] border border-white/5 font-mono"
                          >
                            {typeof s === 'string' ? s.trim() : s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Consultation / Assessment Trigger Button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => onOpenTourModal && onOpenTourModal(`Private Assessment with ${t.name}`)}
                      className="w-full py-3 border border-white/10 group-hover:border-[#c5a880] group-hover:bg-[#c5a880] group-hover:text-black text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center space-x-2 text-white bg-transparent"
                    >
                      <span>REQUEST 1-ON-1</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Pagination & Progress Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center space-x-2 text-xs text-neutral-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
            <span className="tracking-wider uppercase text-[10px]">
              DRAG OR USE CONTROLS TO EXPLORE FACULTY
            </span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {trainersList.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => slideToIndex(dotIdx)}
                className={`transition-all duration-300 ${
                  currentIndex === dotIdx
                    ? 'w-7 h-1.5 bg-[#c5a880]'
                    : 'w-2 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
                title={`Jump to Trainer ${dotIdx + 1}`}
              />
            ))}
          </div>

          {/* Smooth Scroll Progress Rail */}
          <div className="w-full sm:w-36">
            <div className="qnox-progress-rail">
              <div
                className="qnox-progress-fill"
                style={{ width: `${Math.max(12, scrollProgress)}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
