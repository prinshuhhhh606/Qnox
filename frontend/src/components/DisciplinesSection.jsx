import React, { useState, useEffect, useRef } from 'react';
import { Shield, Waves, Wind, Activity, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import './DisciplinesSection.css';

const disciplinesData = [
  {
    id: 'aquatics',
    name: 'THE AQUATICS & HYDROTHERAPY',
    shortName: 'Aquatics',
    icon: Waves,
    tagline: 'Ozone-Purified 25m Natural Slate Pool & Thermal Suites',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1470&auto=format&fit=crop',
    description: 'Immerse your body in 25-meter swimming pools sculpted from dark slate and illuminated by ambient architectural light. Our multi-stage UV water filtration leaves zero chemical scent, replicating pure natural springs for athletic laps and hydro-recovery.',
    amenities: [
      '25-meter heated slate lap pool (28°C constant)',
      'High-pressure hydrotherapy water cannons',
      'Nordic Finnish sauna & eucalyptus steam cavern',
      'Sub-zero cold plunge plunge tub (4°C)'
    ],
    highlightStat: '100% UV-C PURIFIED'
  },
  {
    id: 'combat',
    name: 'THE COMBAT ARENA',
    shortName: 'Combat & Rig',
    icon: Shield,
    tagline: 'Regulation Elevated Boxing Ring & Heavy Leather Rig',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1470&auto=format&fit=crop',
    description: 'Designed in collaboration with world champion striking coaches. Master kinetic force transfer, footwork geometry, and elite fight conditioning with bespoke custom-stitched leather bags and Eleiko functional rigs.',
    amenities: [
      'Custom championship elevated boxing ring',
      'Water-filled teardrop bags and heavy leather cylinders',
      'Specialist striking & counter-offensive masterclasses',
      'Dedicated private sparring consultation'
    ],
    highlightStat: 'PRO LEVEL RING'
  },
  {
    id: 'hypoxic',
    name: 'HYPOXIC 3000 ALTITUDE SUITE',
    shortName: 'Hypoxic Altitude',
    icon: Wind,
    tagline: 'High-Altitude Atmosphere Engineered to 3,000m Above Sea Level',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
    description: 'Train in reduced oxygen conditions to trigger intense cellular adaptation, enhance red blood cell count, and accelerate VO2 max endurance. Experience athletic conditioning once reserved solely for elite mountain training camps.',
    amenities: [
      'Precision oxygen-reduced climate control',
      'Woodway high-performance curved treadmills',
      'Wattbike Atom Pro interactive resistance cycles',
      'Continuous real-time SpO2 biometric monitoring'
    ],
    highlightStat: '3,000M ELEVATION'
  },
  {
    id: 'reformer',
    name: 'MIND, REFORMER & MOVEMENT',
    shortName: 'Reformer Pilates',
    icon: Activity,
    tagline: 'Precision Allegro 2 Reformers & Calming Cedar Sanctum',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
    description: 'Sculpt core stability, joint decompression, and spinal symmetry in our custom cedar-wood studio. Guided by master Pilates practitioners combining classical precision with dynamic athletic resistance.',
    amenities: [
      'Custom matte black Allegro 2 Reformer carriages with towers',
      'Infrared heating panels for deep myofascial release',
      'Sound bath frequencies tuned to 432Hz',
      'Small group sessions capped strictly at 8 members'
    ],
    highlightStat: 'MAX 8 MEMBERS'
  },
  {
    id: 'recovery',
    name: 'CRYO & BIOHACKING RECOVERY',
    shortName: 'Cryo & Longevity',
    icon: Zap,
    tagline: 'Whole-Body -110°C Cryotherapy & Hyperbaric Oxygen Pods',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
    description: 'The science of physical longevity. Accelerate tissue repair, flush metabolic waste, and reduce systemic inflammation through medical-grade cryotherapy, hyperbaric chambers, and targeted compression boots.',
    amenities: [
      'Dual-chamber whole body dry electric cryotherapy (-110°C)',
      '1.5 ATA mild hyperbaric oxygen chambers',
      'Normatec 3 pneumatic compression boots and sleeves',
      'Full spectrum medical red light therapy (photobiomodulation)'
    ],
    highlightStat: '-110°C CRYO SUITE'
  }
];

export default function DisciplinesSection({ onOpenTourModal }) {
  const [activeTab, setActiveTab] = useState(disciplinesData[0].id);
  const [isInView, setIsInView] = useState(false);
  const showcaseRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const activeData = disciplinesData.find((d) => d.id === activeTab) || disciplinesData[0];

  return (
    <section id="disciplines" className="py-28 bg-[#070707] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
              THE SPACES & DISCIPLINES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Bespoke Sanctuaries of Human Power
            </h2>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-light">
            Every studio at QNOX is acoustically and architecturally designed as an independent world, isolated from external noise and distractions.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-4 mb-12 scrollbar-none">
          {disciplinesData.map((d) => {
            const Icon = d.icon;
            const isActive = d.id === activeTab;
            return (
              <button
                key={d.id}
                onClick={() => setActiveTab(d.id)}
                className={`px-5 py-3 text-xs tracking-[0.2em] uppercase font-medium whitespace-nowrap transition-all duration-300 flex items-center space-x-2 border ${
                  isActive
                    ? 'bg-[#c5a880] text-black border-[#c5a880] font-semibold'
                    : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-[#c5a880]'}`} />
                <span>{d.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Active Discipline Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Visual Showcase (7 cols) - Slide up from below animation */}
          <div 
            ref={showcaseRef}
            className={`lg:col-span-7 relative qnox-showcase-container ${isInView ? 'in-view' : ''}`}
          >
            <div 
              key={activeData.id}
              className="qnox-showcase-card group relative border border-white/10 overflow-hidden bg-black"
            >
              <div className="aspect-[16/10] w-full relative overflow-hidden">
                <img
                  src={activeData.image}
                  alt={activeData.name}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Highlight Badge - Animated entrance */}
                <div className="qnox-showcase-badge absolute top-6 left-6 px-4 py-1.5 bg-black/85 backdrop-blur-md border border-[#c5a880]/50 text-[#c5a880] text-[10px] tracking-[0.25em] uppercase font-semibold shadow-lg shadow-black/80">
                  {activeData.highlightStat}
                </div>

                {/* Sanctuary Architecture & Discipline Name - Animated entrance */}
                <div className="qnox-showcase-caption absolute bottom-6 left-6 right-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#c5a880] font-sans font-medium mb-1 drop-shadow-md">
                    SANCTUARY ARCHITECTURE
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white tracking-wide drop-shadow-lg">
                    {activeData.name}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h4 className="text-xl sm:text-2xl font-serif text-white mb-3">
                {activeData.tagline}
              </h4>
              <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed">
                {activeData.description}
              </p>
            </div>

            {/* Curated Amenities List */}
            <div className="space-y-3 pt-2">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#c5a880] font-semibold">
                CURATED AMENITIES & PROTOCOLS
              </p>
              <ul className="space-y-2.5">
                {activeData.amenities.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-[#c5a880] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action */}
            <div className="pt-4">
              <button
                onClick={() => onOpenTourModal()}
                className="px-6 py-3.5 bg-white text-black hover:bg-[#c5a880] text-xs font-semibold tracking-[0.2em] uppercase transition-colors flex items-center space-x-2 group"
              >
                <span>EXPERIENCE IN PERSON</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
