import React from 'react';
import { ArrowUpRight, Award, Trophy } from 'lucide-react';
import './MasterTrainers.css';

const trainers = [
  {
    name: 'Marcus Vance',
    role: 'HEAD OF HUMAN PERFORMANCE',
    badge: 'EX-OLYMPIC S&C COACH',
    specialties: ['Hypoxic Conditioning', 'VO2 Max Protocol', 'Olympic Lifting'],
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    bio: 'Over 14 years preparing podium athletes and private executives. Specialises in high-altitude metabolic endurance and central nervous system potentiation.'
  },
  {
    name: 'Elena Rostova',
    role: 'DIRECTOR OF MOVEMENT & REFORMER',
    badge: 'ROYAL BALLET FELLOW',
    specialties: ['Classical Allegro 2', 'Spinal Decompression', 'Myofascial Slings'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    bio: 'Former principal soloist bringing surgical alignment and athletic power to reformer Pilates. Redefines posture through deliberate neuromuscular control.'
  },
  {
    name: 'Sasha Romanov',
    role: 'HEAD OF COMBAT & STRIKING',
    badge: 'FORMER WBA CONTINENTAL CHAMPION',
    specialties: ['Precision Counter-Striking', 'Footwork Mechanics', 'Fight Stamina'],
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    bio: 'World-renowned boxing trainer with over 32 professional bouts. Directs the QNOX Combat Ring armory with ruthless discipline and technical elegance.'
  },
  {
    name: 'Aria Sterling',
    role: 'DIRECTOR OF BIOMEDICAL RECOVERY',
    badge: 'PHD NEURO-PHYSIOLOGY',
    specialties: ['Sub-Zero Cryo Protocol', 'Heart Rate Variability', 'Hyperbaric Medicine'],
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop',
    bio: 'Oversees the QNOX longevity suites. Designs individualized thermal contrast therapies and mitochondrial revitalization protocols.'
  }
];

export default function MasterTrainers({ onOpenTourModal }) {
  return (
    <section id="trainers" className="py-28 bg-[#070707] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-white/10">
          <div>
            <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
              THE MASTER PRACTITIONERS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white">
              Guided by Industry Pioneers
            </h2>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-light">
            Our master practitioners are chosen from global Olympic programs, classical dance academies, and sports science institutes.
          </p>
        </div>

        {/* Trainers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trainers.map((t) => (
            <div
              key={t.name}
              className="group bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Photo container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 text-[9px] font-sans tracking-[0.2em] uppercase font-semibold bg-black/80 text-[#c5a880] border border-[#c5a880]/30 backdrop-blur-md">
                      {t.badge}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-medium mb-1">
                    {t.role}
                  </p>
                  <h3 className="font-serif text-xl text-white mb-3">
                    {t.name}
                  </h3>
                  <p className="text-neutral-400 text-xs font-light leading-relaxed mb-6">
                    {t.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                    {t.specialties.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase tracking-wider text-neutral-300 px-2 py-0.5 bg-white/5 border border-white/5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consultation trigger */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => onOpenTourModal(`Private Assessment with ${t.name}`)}
                  className="w-full py-2.5 border border-white/10 group-hover:border-[#c5a880] group-hover:text-[#c5a880] text-xs font-medium tracking-[0.2em] uppercase transition-colors flex items-center justify-center space-x-2"
                >
                  <span>REQUEST 1-ON-1</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
