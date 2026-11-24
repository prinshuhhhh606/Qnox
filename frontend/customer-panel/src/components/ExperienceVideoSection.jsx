import React, { useState, useRef, useEffect } from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import './ExperienceVideoSection.css';

const WORKOUT_SCENES = [
  {
    id: 'red-room',
    name: '01 / RED INTERVALS',
    subtitle: 'Heart-rate synced HIIT, explosive battle ropes & metabolic surge',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athletic-man-training-with-battle-ropes-at-the-gym-40103-large.mp4',
    poster: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop'
  },
  {
    id: 'kinetic-power',
    name: '02 / COMBAT & RIG',
    subtitle: 'Championship punching bags, plyometric power & anaerobic thresholds',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-with-heavy-ropes-in-the-gym-40099-large.mp4',
    poster: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1470&auto=format&fit=crop'
  },
  {
    id: 'olympic-conditioning',
    name: '03 / ATHLETIC CONDITIONING',
    subtitle: 'Eleiko barbell complexes, Woodway sprints & VO2 max conditioning',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-doing-a-crossfit-workout-40106-large.mp4',
    poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop'
  }
];

export default function ExperienceVideoSection({ onOpenTourModal }) {
  const [activeScene, setActiveScene] = useState(WORKOUT_SCENES[0]);
  const [isInView, setIsInView] = useState(false);

  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  // Scroll Entrance Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Update video src and start 2-3 sec loop automatically on tab switch
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [activeScene]);

  // Seamless 2.8-second GIF-like loop handler
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= 2.8) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="qnox-experience-section"
    >
      {/* Luxury Champagne Gold Ambient Flare */}
      <div className="qnox-gold-ambient" />

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        
        {/* Eyebrow Tag */}
        <div className="inline-block">
          <div className="qnox-video-eyebrow">
            <Flame className="w-3.5 h-3.5 text-[#c5a880] animate-pulse" />
            <span>THE RED ROOM &bull; THE SANCTUARY EXPERIENCE</span>
          </div>
        </div>

        {/* Headline */}
        <h2 className="qnox-video-heading">
          What to Expect in <br className="hidden sm:inline" />
          <span className="text-[#c5a880]">Your First Workout</span>
        </h2>

        {/* Subtitle */}
        <p className="qnox-video-subtitle">
          The lights, the music, the people — the entire experience is unparalleled.
        </p>

        {/* The Cinematic Video Showcase Player (GIF-Style 2-3s Auto-Loop) */}
        <div 
          className={`qnox-video-stage transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
            
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={handleTimeUpdate}
              poster={activeScene.poster}
              className="qnox-workout-video"
            >
              <source src={activeScene.videoUrl} type="video/mp4" />
            </video>

            {/* Dark Cinematic Vignette Overlay */}
            <div className="qnox-video-vignette" />

            {/* Top Live Scene Tag */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5a880] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5a880]"></span>
              </span>
              <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-white bg-black/75 px-3 py-1 border border-white/10 backdrop-blur-sm">
                LIVE {activeScene.name}
              </span>
            </div>

            {/* Bottom Subtle GIF-Loop Indicator Badge */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
              <span className="text-[9px] tracking-[0.25em] uppercase font-semibold text-[#c5a880] bg-black/80 px-2.5 py-1 border border-[#c5a880]/30 backdrop-blur-sm">
                DYNAMIC LOOP
              </span>
            </div>

          </div>
        </div>

        {/* Scene Selection Pills */}
        <div className="qnox-scene-tabs">
          {WORKOUT_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setActiveScene(scene)}
              className={`qnox-scene-tab ${activeScene.id === scene.id ? 'active' : ''}`}
            >
              {scene.name}
            </button>
          ))}
        </div>

        {/* Three Pillars: Lights, Music, People */}
        <div className="qnox-video-pillars">
          <div className="qnox-pillar-card">
            <div className="qnox-pillar-num">
              01 &bull; THE LIGHTS
            </div>
            <h3 className="qnox-pillar-title">Custom Bio-Spectrum Illumination</h3>
            <p className="qnox-pillar-desc">
              Low-wavelength amber and champagne hues suppress self-consciousness, optimize focus, and sync with high-intensity interval intervals.
            </p>
          </div>

          <div className="qnox-pillar-card">
            <div className="qnox-pillar-num">
              02 &bull; THE MUSIC
            </div>
            <h3 className="qnox-pillar-title">Concert-Grade Acoustic Engineering</h3>
            <p className="qnox-pillar-desc">
              Custom-calibrated soundscapes engineered to trigger dopaminergic flow state, pushing past mental barriers with relentless rhythm.
            </p>
          </div>

          <div className="qnox-pillar-card">
            <div className="qnox-pillar-num">
              03 &bull; THE PEOPLE
            </div>
            <h3 className="qnox-pillar-title">Uncompromising Collective Energy</h3>
            <p className="qnox-pillar-desc">
              Runners, fighters, and athletes moving in synchronicity. Guided by London's most demanding master coaches who elevate everyone in the room.
            </p>
          </div>
        </div>

        {/* Commission CTA Button */}
        <div className="mt-12">
          <button
            onClick={() => onOpenTourModal && onOpenTourModal('The Red Room - Obsidian Sanctuary')}
            className="px-8 py-4 bg-[#c5a880] hover:bg-white text-black font-semibold text-xs tracking-[0.25em] uppercase transition-all duration-300 shadow-xl shadow-[#c5a880]/15 inline-flex items-center gap-2 group cursor-pointer"
          >
            <span>BOOK YOUR FIRST WORKOUT</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </section>
  );
}
