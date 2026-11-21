import React, { useState, useEffect } from 'react';
import { Award, Trophy, ArrowUpRight, Search, CheckCircle, Mail, Phone, Calendar, X, Star } from 'lucide-react';
import { fetchTrainers } from '../services/api';

const defaultTrainers = [
  {
    _id: 'tr_1',
    name: 'Marcus Vance',
    role: 'Head of Human Performance',
    badge: 'EX-OLYMPIC S&C COACH',
    specialties: ['Olympic Lifting', 'Hypoxic Conditioning', 'VO2 Max Protocol', 'Kinetic Acceleration'],
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop',
    bio: 'Over 14 years preparing podium athletes and private executives. Specialises in high-altitude metabolic endurance, velocity-based training, and central nervous system potentiation.',
    certifications: [
      'U.K. Strength & Conditioning Association (UKSCA) Accredited',
      'IWF Level 2 International Olympic Weightlifting Coach',
      'BSc (Hons) Sports & Exercise Science - Loughborough',
      'Ex-British Olympic Track & Field Performance Consultant',
    ],
    experience: '14+ Years',
    availableClubs: ['QNOX Mayfair Sanctuary', 'QNOX Soho Foundry'],
    rating: 4.98,
  },
  {
    _id: 'tr_2',
    name: 'Elena Rostova',
    role: 'Director of Movement & Reformer',
    badge: 'ROYAL BALLET FELLOW',
    specialties: ['Classical Allegro 2', 'Spinal Decompression', 'Myofascial Slings', 'Posture Restoration'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop',
    bio: 'Former principal soloist bringing surgical alignment and athletic power to reformer Pilates. Redefines posture through deliberate neuromuscular control and deep fascia release.',
    certifications: [
      'Balanced Body Master Instructor Certification',
      'Fellow of the Royal Ballet Academy London',
      'Advanced Neuromuscular Therapy & Fascial Manipulation',
      'Clinical Pilates for Spinal Rehabilitation Specialist',
    ],
    experience: '11+ Years',
    availableClubs: ['QNOX Marylebone Mews', 'QNOX Mayfair Sanctuary'],
    rating: 4.99,
  },
  {
    _id: 'tr_3',
    name: 'Sasha Romanov',
    role: 'Head of Combat & Striking',
    badge: 'FORMER WBA CONTINENTAL CHAMPION',
    specialties: ['Precision Counter-Striking', 'Footwork Mechanics', 'Fight Stamina', 'Kinetic Force Transfer'],
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop',
    bio: 'World-renowned boxing trainer with over 32 professional bouts. Directs the QNOX Combat Ring armory with ruthless discipline, footwork geometry, and technical elegance.',
    certifications: [
      'British Boxing Board of Control (BBBofC) Licensed Master Trainer',
      'Former WBA Continental European Champion (28-4-0)',
      'Certified Cutman & Cornerman Level 3',
      'High-Performance Combat Biomechanics Director',
    ],
    experience: '16+ Years',
    availableClubs: ['QNOX Soho Foundry', 'QNOX Obsidian Tower'],
    rating: 5.0,
  },
  {
    _id: 'tr_4',
    name: 'Aria Sterling',
    role: 'Director of Biomedical Recovery',
    badge: 'PHD NEURO-PHYSIOLOGY',
    specialties: ['Sub-Zero Cryo Protocol', 'Heart Rate Variability', 'Hyperbaric Medicine', 'Photobiomodulation'],
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop',
    bio: 'Oversees the QNOX longevity suites. Designs individualized thermal contrast therapies, hyperbaric oxygen protocols, and mitochondrial revitalization regimens for executives.',
    certifications: [
      'PhD Neuro-Physiology & Human Bio-Energetics - Oxford',
      'International Board of Undersea Medicine (HBOT Certified)',
      'Certified Clinical Cryotherapy Specialist',
      'Oura Health Recovery & Sleep Architecture Consultant',
    ],
    experience: '10+ Years',
    availableClubs: ['QNOX Canary Wharf Horizon', 'QNOX Chelsea Waterfront'],
    rating: 4.97,
  },
  {
    _id: 'tr_5',
    name: 'Julian Thorne',
    role: 'Director of Aquatics & Endurance',
    badge: 'COMMONWEALTH GAMES MEDALIST',
    specialties: ['Elite Stroke Mechanics', 'Hypoxic Lap Pacing', 'Hydro-Rehab', 'Open Water Prep'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop',
    bio: 'Former national swim champion directing all 25m slate pool hydro-athletic programs. Combines fluid dynamics with altitude breathing mastery for zero-impact endurance.',
    certifications: [
      'ASA Level 3 Senior Performance Swimming Coach',
      'Commonwealth Games 200m Medley Medalist',
      'Aquatic Spinal Decompression & Hydrotherapy Specialist',
      'Oxygen Advantage Master Breathing Coach',
    ],
    experience: '12+ Years',
    availableClubs: ['QNOX Mayfair Sanctuary', 'QNOX Chelsea Waterfront'],
    rating: 4.96,
  },
  {
    _id: 'tr_6',
    name: 'Kallum Drake',
    role: 'Senior Functional Rig Specialist',
    badge: 'ROYAL MARINES INSTRUCTOR (RETD)',
    specialties: ['Kettlebell Complexes', 'Grip Force Athletics', 'Obstacle Conditioning', 'Mental Resilience'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop',
    bio: 'Former Royal Marines physical training instructor. Builds unbreakable mental fortitude, structural tendon density, and functional operational conditioning.',
    certifications: [
      'Royal Navy Physical Training Instructor (RN PTI)',
      'StrongFirst SFG Level II Kettlebell Instructor',
      'CSCS Certified Strength and Conditioning Specialist',
      'Tactical Strength and Conditioning Facilitator (NSCA-TSAC-F)',
    ],
    experience: '15+ Years',
    availableClubs: ['QNOX Soho Foundry', 'QNOX Mayfair Sanctuary'],
    rating: 4.99,
  },
];

export default function TrainersPage({ onOpenTourModal }) {
  const [trainersList, setTrainersList] = useState(defaultTrainers);
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainerModal, setSelectedTrainerModal] = useState(null);
  const [consultationSubmitted, setConsultationSubmitted] = useState(false);

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const data = await fetchTrainers();
        if (data && data.length > 0) {
          // Merge API data with rich credentials
          const merged = data.map((t, i) => ({
            ...defaultTrainers[i % defaultTrainers.length],
            ...t,
          }));
          setTrainersList(merged);
        }
      } catch (err) {
        console.warn('Using default trainer directory');
      }
    };
    loadTrainers();
  }, []);

  const specialties = [
    'ALL',
    'Olympic Lifting',
    'Reformer',
    'Combat',
    'Cryo',
    'Aquatics',
    'Metabolic',
  ];

  const filteredTrainers = trainersList.filter((t) => {
    const matchesSpec =
      selectedSpecialty === 'ALL' ||
      t.specialties?.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase())) ||
      t.role?.toLowerCase().includes(selectedSpecialty.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.badge?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Cinematic Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Master Coaches"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block mb-4">
              THE MASTER PRACTITIONERS &bull; OLYMPIC PIONEERS
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-[1.1] mb-6">
              Meet Your Trainers.
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed">
              Our faculty comprises former Olympic conditioning directors, world champion striking coaches, Royal Ballet movement fellows, and clinical neuro-physiologists. Each coach works with a strictly limited clientele.
            </p>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pb-8 border-b border-white/10 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            {specialties.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(s)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition border ${
                  selectedSpecialty === s
                    ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880] font-bold'
                    : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-[#0a0a0a] border border-white/10 px-4 py-2.5 w-full md:w-80">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coach by name or credential..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-500 hover:text-white text-xs">
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Trainers Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {filteredTrainers.map((t) => (
            <div
              key={t._id || t.name}
              className="group bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <img
                    src={t.image || t.avatar}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-[9px] font-mono tracking-widest uppercase px-2.5 py-1 bg-black/80 backdrop-blur-md border border-[#c5a880]/40 text-[#c5a880] font-bold">
                      {t.badge || 'MASTER COACH'}
                    </span>
                  </div>

                  {/* Rating / Experience */}
                  <div className="absolute top-4 right-4 bg-black/80 px-2 py-1 border border-white/10 text-[10px] font-mono text-neutral-300 flex items-center space-x-1">
                    <Star className="w-3 h-3 text-[#c5a880] fill-[#c5a880]" />
                    <span>{t.rating || '5.0'}</span>
                  </div>

                  {/* Bottom Role overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#c5a880] block mb-1">
                      {t.role}
                    </span>
                    <h3 className="font-serif text-2xl text-white font-medium">
                      {t.name}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-3">
                    {t.bio}
                  </p>

                  {/* Specialties Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {t.specialties?.slice(0, 3).map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 bg-[#121212] border border-white/5 text-neutral-300"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-6 pt-0 border-t border-white/5 flex items-center gap-3">
                <button
                  onClick={() => setSelectedTrainerModal(t)}
                  className="flex-1 py-3 border border-white/10 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition text-center"
                >
                  VIEW DOSSIER
                </button>
                <button
                  onClick={() => setSelectedTrainerModal(t)}
                  className="flex-1 py-3 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition text-center"
                >
                  INQUIRE COACH
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Private Coaching Consultation Callout */}
        <div className="border border-white/10 bg-[#090909] p-10 sm:p-14 text-center max-w-3xl mx-auto space-y-6">
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#c5a880] block">
            1-ON-1 HIGH PERFORMANCE CONSULTATION
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl text-white font-light">
            Match with a Dedicated Master Coach
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
            Our Senior Coaching Director pairs each member with a specialist based on their metabolic profile, movement history, and competitive goals.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenTourModal()}
              className="px-8 py-4 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition"
            >
              BOOK CONSULTATION SCREEN
            </button>
          </div>
        </div>
      </section>

      {/* Trainer Dossier Modal */}
      {selectedTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#090909] border border-white/15 max-w-2xl w-full p-6 sm:p-8 relative my-8 shadow-2xl">
            <button
              onClick={() => {
                setSelectedTrainerModal(null);
                setConsultationSubmitted(false);
              }}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <img
                src={selectedTrainerModal.image || selectedTrainerModal.avatar}
                alt={selectedTrainerModal.name}
                className="w-16 h-16 rounded-full object-cover border border-[#c5a880]"
              />
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#c5a880] uppercase block">
                  {selectedTrainerModal.badge}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white">{selectedTrainerModal.name}</h3>
                <p className="text-xs text-neutral-400 font-mono">{selectedTrainerModal.role}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mb-6">
              {selectedTrainerModal.bio}
            </p>

            <h5 className="text-[11px] font-mono tracking-widest text-[#c5a880] uppercase mb-3">
              ACCREDITATIONS & CERTIFICATIONS
            </h5>
            <div className="space-y-2 mb-6">
              {selectedTrainerModal.certifications?.map((c, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-neutral-300">
                  <CheckCircle className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* Quick Consultation Request Form */}
            <div className="border-t border-white/10 pt-6">
              {consultationSubmitted ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 text-center">
                  <span className="text-emerald-300 text-xs font-mono block">
                    Inquiry logged. Our Senior Coaching Concierge will contact you within 4 hours.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConsultationSubmitted(true);
                  }}
                  className="space-y-3"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                    REQUEST 1-ON-1 COACHING WITH {selectedTrainerModal.name.toUpperCase()}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Your name..."
                      className="flex-1 bg-[#121212] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your email address..."
                      className="flex-1 bg-[#121212] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider hover:bg-white transition"
                    >
                      SEND
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
