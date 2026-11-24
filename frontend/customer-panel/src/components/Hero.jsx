import React from 'react';
import { ArrowDown, Play, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import './Hero.css';

export default function Hero({ onOpenTourModal }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-16 bg-[#050505]">
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main Banner Image with anti-hotlinking referrerPolicy and fallback */}
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSB_dx286WARergdM-IcKRsndvqerBfSXWdddKdEjJzw&s=10"
          alt="QNOX Sanctuary Interior"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // High-resolution dark luxury fitness fallback if Google thumbnail expires or is blocked
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop";
          }}
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
          style={{
            filter: 'contrast(1.05) brightness(0.65) saturate(1.15)',
          }}
        />

        {/* Balanced Luxury Cinematic Overlays - Gym details stay visible while keeping text ultra-sharp */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/75 pointer-events-none" />
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        
        {/* Subtle golden ambient flare */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#c5a880]/15 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center">
        
        {/* Editorial Sub-Header Badge */}
        <div className="inline-flex items-center space-x-3 px-4 py-1.5 border border-[#c5a880]/30 bg-black/40 backdrop-blur-md mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880]"></span>
          <span className="text-[11px] sm:text-xs font-sans tracking-[0.3em] uppercase text-[#c5a880] font-medium">
            TRAINING FOR LIFE &bull; LONDON ARCHITECTURAL SANCTUARY
          </span>
        </div>

        {/* Monolithic Serif Editorial Title (Third Space Inspired) */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-white max-w-5xl leading-[1.08] mb-8 animate-fade-up">
          Where <span className="italic font-light text-[#dfc8a7]">Discipline</span> Meets Pure <span className="font-semibold text-white">Luxury</span>.
        </h1>

        {/* Brand Ethos Description */}
        <p className="max-w-2xl text-neutral-400 text-sm sm:text-base md:text-lg font-light leading-relaxed mb-12 tracking-wide">
          QNOX GYM is not an ordinary club. It is an architectural sanctuary dedicated to elevating human athletic potential, bespoke longevity protocols, and uncompromising privacy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-20 animate-fade-up">
          <button
            onClick={() => onOpenTourModal()}
            className="w-full sm:w-auto px-8 py-4 bg-[#c5a880] hover:bg-white text-black font-semibold text-xs tracking-[0.25em] uppercase transition-all duration-300 shadow-xl shadow-[#c5a880]/10"
          >
            SCHEDULE PRIVATE TOUR
          </button>
          
          <a
            href="#disciplines"
            className="w-full sm:w-auto px-8 py-4 border border-white/20 hover:border-[#c5a880] hover:text-[#c5a880] text-white font-medium text-xs tracking-[0.25em] uppercase transition-all duration-300 backdrop-blur-sm"
          >
            EXPLORE THE SANCTUARIES
          </a>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/10 text-left">
          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase block">PORTFOLIO</span>
            <div className="text-xl sm:text-2xl font-serif text-white">6 Bespoke Clubs</div>
            <p className="text-xs text-neutral-500">Mayfair, Soho & Canary Wharf</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase block">HYDROTHERAPY</span>
            <div className="text-xl sm:text-2xl font-serif text-white">25m Slate Pools</div>
            <p className="text-xs text-neutral-500">UV-filtered pristine ozone water</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase block">ALTITUDE BIOHACK</span>
            <div className="text-xl sm:text-2xl font-serif text-white">3,000m Chamber</div>
            <p className="text-xs text-neutral-500">Controlled hypoxic performance</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-[0.25em] text-[#c5a880] uppercase block">RECOVERY SUITE</span>
            <div className="text-xl sm:text-2xl font-serif text-white">-110°C Cryo Lab</div>
            <p className="text-xs text-neutral-500">Hyperbaric oxygen & cold immersion</p>
          </div>
        </div>

      </div>

      {/* Subtle Scroll Down Indicator */}
      <a
        href="#clubs"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 text-neutral-500 hover:text-[#c5a880] transition-colors"
        aria-label="Scroll down"
      >
        <span className="text-[9px] tracking-[0.3em] uppercase">DISCOVER</span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </a>
    </section>
  );
}
