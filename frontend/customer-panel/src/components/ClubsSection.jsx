import React, { useState } from 'react';
import { MapPin, Clock, ArrowUpRight, Check, Sparkles } from 'lucide-react';
import './ClubsSection.css';

export default function ClubsSection({ clubs = [], onOpenTourModal }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

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

  return (
    <section id="clubs" className="py-28 bg-[#050505] relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
              THE LONDON PORTFOLIO
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Our Private Club Sanctuaries
            </h2>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-light">
            Distinct architectural sanctuaries strategically situated in London’s most prominent districts. Crafted with unyielding materials and tailored acoustic isolation.
          </p>
        </div>

        {/* Feature Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-12">
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

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClubs.map((club) => (
            <div
              key={club.slug}
              className="group bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Image Container with Luxury Zoom */}
                <div className="relative aspect-[16/11] overflow-hidden bg-neutral-900">
                  <img
                    src={club.heroImage}
                    alt={club.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/30 to-transparent" />
                  
                  {/* Status Pill */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 text-[9px] font-sans tracking-[0.25em] uppercase font-bold border backdrop-blur-md ${
                      club.status === 'OPEN' 
                        ? 'bg-black/70 text-emerald-400 border-emerald-500/40'
                        : 'bg-black/70 text-[#c5a880] border-[#c5a880]/50'
                    }`}>
                      {club.status}
                    </span>
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
                    <span>Mon-Fri: {club.openingHours?.weekdays} &bull; Sat-Sun: {club.openingHours?.weekends}</span>
                  </div>

                  {/* Key Amenities Pills */}
                  <div className="space-y-1.5 mb-6">
                    {club.amenities?.slice(0, 3).map((amenity, idx) => (
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
                  onClick={() => onOpenTourModal(club.name)}
                  className="w-full py-3 border border-white/15 group-hover:border-[#c5a880] group-hover:bg-[#c5a880] group-hover:text-black text-white text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>REQUEST PRIVATE TOUR</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
