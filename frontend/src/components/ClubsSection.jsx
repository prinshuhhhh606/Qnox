import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import './ClubsSection.css';

export default function ClubsSection({ clubs = [], onOpenTourModal }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const sliderRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse drag support
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const filterOptions = [
    { label: 'ALL SANCTUARIES', value: 'ALL' },
    { label: 'NATURAL SLATE POOLS', value: 'pool' },
    { label: 'ALTITUDE CHAMBERS', value: 'altitudeChamber' },
    { label: 'CRYO RECOVERY LABS', value: 'cryotherapy' },
  ];

  const filteredClubs = clubs.filter((club) => {
    if (selectedFilter === 'ALL') return true;
    return club.features && club.features[selectedFilter];
  });

  const updateScrollMetrics = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
    const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);
  };

  useEffect(() => {
    updateScrollMetrics();
  }, [filteredClubs]);

  // Smooth slide navigation
  const slidePrev = () => {
    if (!sliderRef.current) return;
    const cardWidth = sliderRef.current.clientWidth > 640 ? 410 : 330;
    sliderRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const slideNext = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const cardWidth = clientWidth > 640 ? 410 : 330;

    if (scrollLeft + clientWidth >= scrollWidth - 20) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      sliderRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  };

  // Mouse Drag Events
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
    const walk = (x - startX) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  const stopDragging = () => {
    setIsDragging(false);
  };

  return (
    <section id="clubs" className="py-28 bg-[#050505] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header Title with Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
              THE LONDON PORTFOLIO
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Our Private Club Sanctuaries
            </h2>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-6 mt-6 md:mt-0">
            <p className="text-neutral-400 text-xs sm:text-sm max-w-sm hidden sm:block font-light">
              Distinct architectural sanctuaries strategically situated across London. Swipe or use controls to explore.
            </p>

            {/* Slider Navigation Arrows */}
            <div className="flex items-center space-x-2">
              <button
                onClick={slidePrev}
                disabled={!canScrollLeft}
                aria-label="Previous Sanctuary"
                className={`w-11 h-11 rounded-none border flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'border-white/20 text-white hover:border-[#c5a880] hover:text-[#c5a880] hover:bg-white/5'
                    : 'border-white/5 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={slideNext}
                disabled={!canScrollRight}
                aria-label="Next Sanctuary"
                className={`w-11 h-11 rounded-none border flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'border-white/20 text-white hover:border-[#c5a880] hover:text-[#c5a880] hover:bg-white/5'
                    : 'border-white/5 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedFilter(opt.value)}
              className={`px-4 py-2 text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300 border ${
                selectedFilter === opt.value
                  ? 'border-[#c5a880] bg-[#c5a880]/10 text-[#c5a880]'
                  : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Horizontal Slider Track */}
        <div
          ref={sliderRef}
          onScroll={updateScrollMetrics}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={`qnox-clubs-slider ${isDragging ? 'is-dragging' : ''}`}
        >
          {filteredClubs.map((club) => (
            <div
              key={club.slug || club.name}
              className="qnox-club-slide-card group"
            >
              <div>
                {/* Image Container with Luxury Zoom */}
                <div className="relative aspect-[16/11] overflow-hidden bg-neutral-900">
                  <img
                    src={club.heroImage}
                    alt={club.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/30 to-transparent" />
                  
                  {/* Status Pill */}
                  <div className="absolute top-4 left-4 flex items-center space-x-1.5">
                    <span className={`px-2.5 py-1 text-[9px] font-sans tracking-[0.2em] uppercase font-bold border backdrop-blur-md flex items-center space-x-1.5 ${
                      (club.liveStatus === 'OPEN' || club.status === 'OPEN') 
                        ? 'bg-black/80 text-emerald-400 border-emerald-500/50'
                        : 'bg-black/80 text-neutral-400 border-neutral-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (club.liveStatus === 'OPEN' || club.status === 'OPEN') ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                      }`} />
                      <span>{club.liveStatus || club.status || 'OPEN'}</span>
                    </span>
                    {!club.isCompanyOwned && (
                      <span className="px-2 py-0.5 text-[8px] font-sans tracking-widest uppercase font-bold bg-[#c5a880] text-black border border-[#c5a880]">
                        NETWORK PARTNER
                      </span>
                    )}
                  </div>

                  {/* Location Tag */}
                  <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 text-xs text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span className="tracking-wider">{club.location}</span>
                  </div>
                </div>

                {/* Club Content */}
                <div className="p-6 sm:p-8">
                  <h3 className="font-serif text-2xl text-white group-hover:text-[#c5a880] transition-colors mb-2">
                    {club.name}
                  </h3>
                  <p className="text-xs text-[#c5a880] tracking-widest uppercase mb-4 font-sans font-medium">
                    {club.tagline}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm font-light leading-relaxed mb-6 line-clamp-3">
                    {club.description}
                  </p>

                  {/* Hours */}
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-400 border-t border-white/5 pt-4 mb-4">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Mon-Fri: {club.openingHours?.weekdays || '06:00 - 22:00'} &bull; Sat-Sun: {club.openingHours?.weekends || '08:00 - 20:00'}</span>
                  </div>

                  {/* Key Amenities Pills */}
                  <div className="space-y-1.5 mb-6">
                    {(club.amenitiesList || club.amenities)?.slice(0, 3).map((amenity, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-neutral-300">
                        <span className="w-1 h-1 rounded-full bg-[#c5a880]" />
                        <span className="truncate">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer Action */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                <button
                  onClick={() => onOpenTourModal && onOpenTourModal(club.name)}
                  className="w-full py-3 border border-white/15 group-hover:border-[#c5a880] group-hover:bg-[#c5a880] group-hover:text-black text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>REQUEST PRIVATE TOUR</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Interactive Progress Bar & Info */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
          <div className="flex items-center space-x-3 w-full sm:w-64">
            <div className="flex-1 h-[2px] bg-white/10 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#c5a880] transition-all duration-150"
                style={{ width: `${Math.max(10, scrollProgress)}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-400">
              {Math.round(scrollProgress)}%
            </span>
          </div>

          <div className="text-[10px] tracking-widest uppercase text-neutral-500">
            SHOWING {filteredClubs.length} OF {clubs.length} SANCTUARIES &bull; DRAG OR SWIPE
          </div>
        </div>

      </div>
    </section>
  );
}
