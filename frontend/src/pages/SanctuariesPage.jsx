import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Waves, Wind, Shield, Activity, Zap, CheckCircle2, ArrowRight, ArrowUpRight, Flame, Droplets, Sparkles } from 'lucide-react';

const sanctuarySpaces = [
  {
    id: 'aquatics',
    category: 'HYDROTHERAPY',
    title: 'The Natural Slate Aquatics',
    subtitle: '25m Natural Slate Pool & Multi-Stage Hydro Caverns',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1600&auto=format&fit=crop',
    icon: Waves,
    stat: '100% UV-C & OZONE PURIFIED',
    statDetail: 'Zero Chemical Odor & Natural Mineral Balance',
    lead: 'Carved from deep charcoal slate and illuminated with warm architectural shadows, our 25-meter lap pools create a subterranean sanctuary of complete stillness.',
    description: 'Every drop passes through dual-spectrum UV-C sterilization and natural ozone infusion, removing chemical irritants while matching the natural mineral balance of Alpine springs. Complete with high-velocity hydro-massage cannons, deep tissue water jets, and adjacent hot/cold contrast plunge tubs.',
    amenities: [
      '25-meter heated slate lap pool (28°C constant temperature)',
      'High-velocity cervical hydrotherapy massage cannons',
      'Handcrafted Finnish cedarwood dry sauna (85°C)',
      'Eucalyptus herbal steam cavern with cold mist showers',
      'Sub-zero ice plunge pool (4°C) for systemic vagal tone activation',
    ],
  },
  {
    id: 'hypoxic',
    category: 'HIGH ELEVATION',
    title: 'Hypoxic 3000 Altitude Suite',
    subtitle: 'Climate-Engineered Atmosphere to 3,000m Above Sea Level',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
    icon: Wind,
    stat: '3,000M ELEVATION',
    statDetail: '14.5% O2 Concentration for Extreme Cellular Adaptation',
    lead: 'Train in reduced-oxygen conditions to stimulate erythropoietin production, boost mitochondrial efficiency, and dramatically enhance VO2 max output.',
    description: 'Our proprietary climate-controlled chambers regulate oxygen concentration from sea level up to 3,000 meters altitude. Equipped with curved Woodway slat-belt treadmills, Wattbike Atom Pro interactive trainers, and live fingertip SpO2 pulse oximetry tracking.',
    amenities: [
      'Precision oxygen-reduced climate atmospheric control',
      'Woodway 4Front manual & curved sprint treadmills',
      'Wattbike Atom Pro interactive electromagnetic cycles',
      'Continuous real-time arterial oxygen saturation (SpO2) monitors',
      'Specialized hypoxic threshold testing by Senior Exercise Physiologists',
    ],
  },
  {
    id: 'combat',
    category: 'COMBAT & STRIKING',
    title: 'The Championship Combat Arena',
    subtitle: 'Elevated Regulation Boxing Ring & Heavy Leather Rig',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1600&auto=format&fit=crop',
    icon: Shield,
    stat: 'PRO LEVEL RING',
    statDetail: 'Engineered with WBA Master Champions',
    lead: 'An authentic combat studio designed with world champion striking coaches. Master kinetic force transfer, explosive hip torque, and defensive geometry.',
    description: 'Centering on an elevated 18-foot championship boxing ring with custom hand-stitched leather heavy cylinders, water-filled teardrop bags, and speedball rigs. Guided by former continental champions and Olympic boxing trainers.',
    amenities: [
      'Full regulation elevated 18-foot championship boxing ring',
      'Custom bespoke leather heavy cylinders and angled wall bags',
      'Hydro-core water teardrop bags for joint-friendly concussive force',
      'Private 1-on-1 technical padwork & counter-strike masterclasses',
      'Complimentary custom wraps and Cleto Reyes fight gloves provided',
    ],
  },
  {
    id: 'reformer',
    category: 'MIND & MOVEMENT',
    title: 'Allegro 2 Reformer Studio',
    subtitle: 'Classical Reformer Alignments & Cedar Sanctum',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1600&auto=format&fit=crop',
    icon: Activity,
    stat: 'STRICTLY 8 CARRIAGES',
    statDetail: 'Individualized Form Precision & Zero Crowding',
    lead: 'Sculpt deep core stability, spinal decompression, and athletic posture on custom matte black Balanced Body Allegro 2 reformer carriages.',
    description: 'Set within an acoustically isolated cedar-paneled sanctum with infrared radiant ceiling panels that promote myofascial release. Our master teachers merge classical Joseph Pilates precision with contemporary athletic power.',
    amenities: [
      'Custom matte black Allegro 2 Reformers with full tower attachments',
      'Overhead far-infrared heating panels for deep muscle pliability',
      'Acoustic soundscape tuned to 432Hz harmonic relaxation frequencies',
      'Sessions strictly capped at 8 members for personal hands-on adjustments',
      'Complimentary organic grip socks and lavender-infused face towels',
    ],
  },
  {
    id: 'strength',
    category: 'ATHLETIC POWER',
    title: 'Olympic Strength & Conditioning Rig',
    subtitle: 'Eleiko Competition Plates & Biomechanical Free Weights',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1600&auto=format&fit=crop',
    icon: Zap,
    stat: 'ELEIKO IWF CERTIFIED',
    statDetail: 'Calibrated Competition Bars & Shock-Absorbing Oak Platforms',
    lead: 'Engineered for serious athletic output. Uncompromised free weight suites featuring calibrated Olympic lifting platforms, custom dumbbell suites up to 60kg, and pneumatic resistance.',
    description: 'Designed in consultation with British Olympic strength coaches. Complete with solid Swedish steel barbells, magnetic plate micro-loaders, and custom bronze-accented power racks with integrated velocity-based training sensors.',
    amenities: [
      'Eleiko IWF-certified competition barbells & calibrated bumper plates',
      'Multi-station heavy power cages with band pegs and dip horns',
      'Custom hand-poured matte urethane dumbbells (2kg to 60kg)',
      'GymAware velocity-based linear position transducers for peak power tracking',
      'Shock-absorbing acoustic oak lifting platforms with rubber drop-zones',
    ],
  },
  {
    id: 'recovery',
    category: 'BIOMEDICAL RECOVERY',
    title: 'Sub-Zero Cryotherapy & Longevity Suite',
    subtitle: '-110°C Whole-Body Cryo & Hyperbaric Oxygen Therapy',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1600&auto=format&fit=crop',
    icon: Sparkles,
    stat: '-110°C ELECTRIC CRYO',
    statDetail: 'Nitrogen-Free True Whole-Body Cryotherapy Chamber',
    lead: 'Accelerate systemic recovery, trigger massive endorphin release, and extinguish deep muscular inflammation inside our walk-in electric cryo chambers.',
    description: 'The pinnacle of sports science longevity. Step into our state-of-the-art walk-in cold chambers at -110°C, followed by pressurized hyperbaric oxygen chambers (1.5 ATA) to flood depleted tissue with restorative oxygen.',
    amenities: [
      'Walk-in dual-chamber whole-body electric cryotherapy (-110°C)',
      'Hyperbaric oxygen chambers (HBOT) for cellular mitochondrial repair',
      'Normatec 3 full-leg, arm & hip pneumatic dynamic compression boots',
      'Theragun PRO percussion therapy with localized infrared heating',
      'Comprehensive Heart Rate Variability (HRV) neurological recovery audits',
    ],
  },
];

export default function SanctuariesPage(props) {
  const outletCtx = useOutletContext() || {};
  const onOpenTourModal = props.onOpenTourModal || outletCtx.onOpenTourModal || (() => {});
  const [activeSpaceId, setActiveSpaceId] = useState('aquatics');
  const activeSpace = sanctuarySpaces.find((s) => s.id === activeSpaceId) || sanctuarySpaces[0];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Sanctuary Pool"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block mb-4">
              ARCHITECTURAL MASTERY &bull; THE DISCIPLINES
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1] mb-6">
              More Than A Gym.<br />Your Sanctuary.
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed mb-8">
              Every square meter of QNOX GYM is engineered as a sacred space for the body and mind. No synthetic distractions. No commercial clutter. Just raw monolithic materials, natural light, acoustic silence, and world-class athletic apparatus.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onOpenTourModal()}
                className="px-8 py-4 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center space-x-2"
              >
                <span>REQUEST PRIVATE SANCTUARY TOUR</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Spaces Showcase */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        {/* Navigation Selector Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-6 border-b border-white/10 scrollbar-none mb-12">
          {sanctuarySpaces.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSpaceId(s.id)}
              className={`px-5 py-3 text-xs font-mono uppercase tracking-wider transition whitespace-nowrap border ${
                activeSpaceId === s.id
                  ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880] font-bold'
                  : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Featured Space Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#090909] border border-white/10 p-8 sm:p-12 mb-20">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#c5a880] font-bold px-2 py-0.5 border border-[#c5a880]/40 bg-[#c5a880]/10">
                {activeSpace.category}
              </span>
              <span className="text-xs text-neutral-400 font-mono">{activeSpace.stat}</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal leading-tight">
              {activeSpace.title}
            </h2>

            <p className="text-sm text-[#c5a880] font-mono">
              {activeSpace.subtitle}
            </p>

            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              {activeSpace.lead}
            </p>

            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              {activeSpace.description}
            </p>

            {/* Amenities Checklist */}
            <div className="space-y-2.5 pt-4 border-t border-white/10">
              <h5 className="text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">
                KEY SPECIFICATIONS
              </h5>
              {activeSpace.amenities.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => onOpenTourModal()}
                className="px-6 py-3 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition"
              >
                EXPERIENCE THIS SPACE
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-neutral-900 group shadow-2xl">
              <img
                src={activeSpace.image}
                alt={activeSpace.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute bottom-4 right-4 bg-black/80 px-4 py-2 border border-white/10 text-right backdrop-blur-md">
                <span className="text-[9px] font-mono uppercase text-neutral-400 block">STANDARD</span>
                <span className="text-xs font-mono font-bold text-[#c5a880]">{activeSpace.statDetail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of All Spaces */}
        <div className="mb-20">
          <div className="border-b border-white/10 pb-6 mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
                ALL 6 PILLARS
              </span>
              <h3 className="font-serif text-3xl text-white">The Six Elemental Sanctuaries</h3>
            </div>
            <p className="text-xs text-neutral-400 max-w-md font-light">
              Combined under single luxury memberships across Mayfair, Soho, Canary Wharf, Marylebone and Chelsea.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sanctuarySpaces.map((space) => {
              const IconComp = space.icon;
              return (
                <div
                  key={space.id}
                  onClick={() => {
                    setActiveSpaceId(space.id);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="group bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all p-6 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden mb-6 bg-neutral-900">
                      <img
                        src={space.image}
                        alt={space.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-black/80 p-2 border border-white/10">
                        <IconComp className="w-4 h-4 text-[#c5a880]" />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block mb-1">
                      {space.category}
                    </span>
                    <h4 className="font-serif text-xl text-white group-hover:text-[#c5a880] transition-colors mb-2">
                      {space.title}
                    </h4>
                    <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3 mb-4">
                      {space.lead}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#c5a880] font-mono">
                    <span>EXPLORE ARCHITECTURE</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sanctuary Manifesto Callout */}
        <div className="border border-[#c5a880]/30 bg-gradient-to-r from-[#0c0c0c] to-[#121212] p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <span className="text-[10px] font-mono tracking-[0.35em] text-[#c5a880] uppercase block">
              TRAINING FOR LIFE &bull; LONDON
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-white font-light">
              &quot;The body achieves what the mind can conceive in quiet solitude.&quot;
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              Experience the pinnacle of British architectural fitness. Schedule a personal walkthrough with our Senior Membership Concierge today.
            </p>
            <div className="pt-4">
              <button
                onClick={() => onOpenTourModal()}
                className="px-8 py-4 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition"
              >
                SCHEDULE PRIVATE WALKTHROUGH
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
