import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapPin, Clock, ArrowUpRight, Check, Sparkles, Search, Compass, Phone, Mail, ExternalLink, X, Shield } from 'lucide-react';
import { fetchClubs } from '../services/api';

const defaultClubs = [
  {
    name: 'QNOX Mayfair Sanctuary',
    slug: 'mayfair-sanctuary',
    location: 'Mayfair, London',
    address: '42 Berkeley Square, London W1J 5AW',
    phone: '+44 20 7946 0001',
    email: 'mayfair@qnoxgym.com',
    hours: 'Mon – Fri: 05:30 – 23:00 | Sat – Sun: 07:00 – 21:00',
    tagline: 'Flagship Sanctuary featuring 25m Natural Slate Pool & Altitude Suite',
    description: 'Our foundational sanctuary nestled in historic Berkeley Square. Engineered with monolithic charcoal slate, acoustic solitude baffles, and private underground hydrotherapy caverns.',
    heroImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: '42+Berkeley+Square+London+W1J+5AW',
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: true,
    },
    amenitiesList: [
      '25m Heated Natural Slate Lap Pool (28°C)',
      'Hypoxic 3000 Altitude Training Chamber',
      '-110°C Electric Cryo Recovery Suite',
      'Championship Elevated Combat Ring',
      'Infrared Finnish Cedarwood Saunas',
      'Private Chauffeured Valet & Transit Drop-off',
    ],
    status: 'OPEN',
  },
  {
    name: 'QNOX Soho Foundry',
    slug: 'soho-foundry',
    location: 'Soho, London',
    address: '18 Greek Street, London W1D 4DS',
    phone: '+44 20 7946 0002',
    email: 'soho@qnoxgym.com',
    hours: 'Mon – Fri: 06:00 – 23:00 | Sat – Sun: 07:30 – 21:00',
    tagline: 'High-Impact Combat Arena & Olympic Lifting Sanctum',
    description: 'An architectural tribute to London industrial craftsmanship. Hand-stitched leather heavy bags, Eleiko Olympic lifting platforms, and pulsating atmospheric audio isolation.',
    heroImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: '18+Greek+Street+London+W1D+4DS',
    features: {
      pool: false,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: false,
    },
    amenitiesList: [
      'Olympic Competition Eleiko Lifting Rig',
      'Elevated Striking Ring with Teardrop Bags',
      'Normatec 3 Dynamic Compression Lounge',
      'High-Speed Cold Plunge Pools (3°C)',
      'Executive Concierge Laundry Service',
    ],
    status: 'OPEN',
  },
  {
    name: 'QNOX Canary Wharf Horizon',
    slug: 'canary-wharf-horizon',
    location: 'Canary Wharf, London',
    address: 'Level 28, One Canada Square, London E14 5AA',
    phone: '+44 20 7946 0003',
    email: 'canarywharf@qnoxgym.com',
    hours: 'Mon – Fri: 05:30 – 22:30 | Sat – Sun: 08:00 – 20:00',
    tagline: 'Panoramic Skyline Altitude Lab & Hydro Wellness Spa',
    description: 'Hovering 28 storeys above London financial epicenter. Train in hypoxia with floor-to-ceiling views across the Thames, followed by magnesium contrast hydrotherapy.',
    heroImage: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1470&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1470&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: 'One+Canada+Square+Canary+Wharf+London+E14+5AA',
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: false,
      valetParking: true,
    },
    amenitiesList: [
      'Skyline Infinity Lap Pool Overlooking London',
      'Panoramic 3,000m Hypoxic Altitude Chamber',
      'Executive Private Boardroom Shower Suites',
      'Custom Keiser Pneumatic Resistance Lab',
      'Dedicated Physiological Biomarker Clinic',
    ],
    status: 'OPEN',
  },
  {
    name: 'QNOX Marylebone Mews',
    slug: 'marylebone-mews',
    location: 'Marylebone, London',
    address: '14 Chiltern Street, London W1U 7PW',
    phone: '+44 20 7946 0004',
    email: 'marylebone@qnoxgym.com',
    hours: 'Mon – Fri: 06:00 – 22:00 | Sat – Sun: 08:00 – 20:00',
    tagline: 'Boutique Reformer Pilates Sanctum & Infrared Sauna Retreat',
    description: 'An intimate sanctuary hidden in the cobblestone elegance of Chiltern Street. Dedicated entirely to classical Pilates reformer alignments, cedar infrared therapy, and biomechanical posture restoration.',
    heroImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: '14+Chiltern+Street+Marylebone+London+W1U+7PW',
    features: {
      pool: false,
      altitudeChamber: false,
      cryotherapy: true,
      valetParking: false,
    },
    amenitiesList: [
      'Custom Allegro 2 Matte Black Reformer Carriages',
      '432Hz Ambient Sound-Bath Acoustic Studio',
      'Private Infrared Detoxification Cocoon',
      'Myofascial Alignment & Physiotherapy Suite',
      'Organic Herbal Apothecary & Elixir Bar',
    ],
    status: 'OPEN',
  },
  {
    name: 'QNOX Chelsea Waterfront',
    slug: 'chelsea-waterfront',
    location: 'Chelsea, London',
    address: 'Lots Road, Chelsea Harbour, London SW10 0AB',
    phone: '+44 20 7946 0005',
    email: 'chelsea@qnoxgym.com',
    hours: 'Mon – Fri: 06:00 – 22:30 | Sat – Sun: 07:30 – 21:00',
    tagline: 'Riverside Hydrotherapy Caverns & Outdoor Conditioning Deck',
    description: 'Overlooking Chelsea Harbour marina. Features indoor-outdoor transition training decks, magnesium hot-spring pools, and sub-zero hyperbaric recovery suites.',
    heroImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: 'Chelsea+Harbour+London+SW10+0AB',
    features: {
      pool: true,
      altitudeChamber: false,
      cryotherapy: true,
      valetParking: true,
    },
    amenitiesList: [
      'Open-Air Riverside Performance Rig Deck',
      'Magnesium Contrast Therapy Pools (38°C & 4°C)',
      'Sub-Zero Whole-Body Cryotherapy Chambers',
      'Hyperbaric Oxygen Longevity Pods',
      'Private Yacht Mooring Concierge Access',
    ],
    status: 'OPEN',
  },
  {
    name: 'QNOX Obsidian Tower (Private)',
    slug: 'obsidian-tower',
    location: 'Bishopsgate, London',
    address: 'Private Penthouse, 22 Bishopsgate, London EC2N 4BQ',
    phone: '+44 20 7946 0006',
    email: 'obsidian@qnoxgym.com',
    hours: '24/7 Biometric Access for Founder Members',
    tagline: 'Ultra-Exclusive Private Residence strictly capped at 150 Global Members',
    description: 'Accessible exclusively by invitation and biometric keycard. Ultra-high altitude chambers, private penthouse boxing ring, personal valet, and dedicated 24/7 master coaching staff.',
    heroImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1470&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1470&auto=format&fit=crop',
    ],
    mapQuery: '22+Bishopsgate+London+EC2N+4BQ',
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: true,
    },
    amenitiesList: [
      '24/7 Private Biometric Penthouse Elevator',
      '3,500m Extreme Altitude Athletic Lab',
      'Private Valet Parking & Armored Transit',
      'Direct WhatsApp Hotline to Executive Concierge',
      'Bespoke Locker with Permanent Custom Kit Service',
    ],
    status: 'RESERVING',
  },
];

export default function ClubsPage(props) {
  const outletCtx = useOutletContext() || {};
  const onOpenTourModal = props.onOpenTourModal || outletCtx.onOpenTourModal || (() => {});
  const [clubs, setClubs] = useState(defaultClubs);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClubModal, setSelectedClubModal] = useState(null);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const data = await fetchClubs();
        if (data && data.length > 0) {
          // Merge API data with rich imagery and addresses
          const merged = data.map((c, i) => ({
            ...defaultClubs[i % defaultClubs.length],
            ...c,
            amenitiesList: defaultClubs[i % defaultClubs.length].amenitiesList,
          }));
          setClubs(merged);
        }
      } catch (err) {
        console.warn('Using luxury default clubs portfolio');
      } finally {
        setLoading(false);
      }
    };
    loadClubs();
  }, []);

  const featureFilters = [
    { label: 'ALL SANCTUARIES', value: 'ALL' },
    { label: 'NATURAL SLATE POOLS', value: 'pool' },
    { label: 'ALTITUDE CHAMBERS', value: 'altitudeChamber' },
    { label: 'CRYO RECOVERY LABS', value: 'cryotherapy' },
    { label: 'VALET PARKING', value: 'valetParking' },
  ];

  const filteredClubs = clubs.filter((club) => {
    const matchesFeature =
      selectedFeature === 'ALL' || (club.features && club.features[selectedFeature]);
    const matchesSearch =
      !searchQuery ||
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFeature && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Cinematic Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="QNOX Sanctuary Interior"
            className="w-full h-full object-cover opacity-60 scale-105 transform transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block mb-4">
              THE LONDON PORTFOLIO &bull; ARCHITECTURAL SOLITUDE
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1] mb-6">
              Find Your Club.
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed mb-8">
              Strategically placed across London’s most prominent architectural enclaves. Each sanctuary is crafted with unyielding granite, natural dark slate, and acoustic isolation—providing an impenetrable refuge for physical mastery.
            </p>

            {/* Quick Action Button */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onOpenTourModal()}
                className="px-8 py-4 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-lg flex items-center space-x-2"
              >
                <span>BOOK A PRIVATE WALKTHROUGH</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
          {/* Feature Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {featureFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFeature(f.value)}
                className={`px-4 py-2.5 text-xs font-mono tracking-wider uppercase transition border ${
                  selectedFeature === f.value
                    ? 'border-[#c5a880] bg-[#c5a880]/15 text-[#c5a880]'
                    : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center space-x-3 bg-[#0a0a0a] border border-white/10 px-4 py-2.5 w-full lg:w-80">
            <Search className="w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by district or club name..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 font-mono"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-500 hover:text-white text-xs">
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="pt-6 pb-8 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>SHOWING {filteredClubs.length} OF {clubs.length} SANCTUARIES</span>
          <span>MAYFAIR &bull; SOHO &bull; CANARY WHARF &bull; MARYLEBONE &bull; CHELSEA</span>
        </div>

        {/* Clubs Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClubs.map((club) => (
            <div
              key={club.slug || club.name}
              className="group bg-[#0a0a0a] border border-white/10 hover:border-[#c5a880]/60 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Photo with zoom & status badge */}
                <div className="relative aspect-[16/11] overflow-hidden bg-neutral-900">
                  <img
                    src={club.heroImage}
                    alt={club.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Status Tag */}
                  <div className="absolute top-4 left-4 flex items-center space-x-1.5">
                    <span className={`text-[9px] px-2.5 py-1 bg-black/85 backdrop-blur-md font-mono tracking-widest uppercase border flex items-center space-x-1.5 ${
                      (club.liveStatus === 'OPEN' || club.status === 'OPEN')
                        ? 'text-emerald-400 border-emerald-500/50'
                        : 'text-neutral-400 border-neutral-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (club.liveStatus === 'OPEN' || club.status === 'OPEN') ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                      }`} />
                      <span>{club.liveStatus || club.status || 'OPEN'}</span>
                    </span>
                    {!club.isCompanyOwned && (
                      <span className="text-[8px] px-2 py-0.5 bg-[#c5a880] text-black font-mono font-bold tracking-widest uppercase">
                        PARTNER
                      </span>
                    )}
                  </div>

                  {/* Location Pin */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 text-white text-xs font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                    <span className="truncate">{club.location}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-7">
                  <h3 className="font-serif text-2xl text-white font-normal group-hover:text-[#c5a880] transition-colors mb-2">
                    {club.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed mb-6 line-clamp-3">
                    {club.description}
                  </p>

                  {/* Address and Hours */}
                  <div className="space-y-2 border-t border-white/5 pt-4 mb-6 text-xs text-neutral-400 font-mono">
                    <div className="flex items-start space-x-2">
                      <Compass className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                      <span className="truncate">{club.address}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{club.hours}</span>
                    </div>
                  </div>

                  {/* Amenities Highlights */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {club.features?.pool && (
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-white/5 text-neutral-300">
                        25m Slate Pool
                      </span>
                    )}
                    {club.features?.altitudeChamber && (
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-white/5 text-neutral-300">
                        Altitude 3000m
                      </span>
                    )}
                    {club.features?.cryotherapy && (
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-white/5 text-neutral-300">
                        -110°C Cryo Lab
                      </span>
                    )}
                    {club.features?.valetParking && (
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-white/5 text-neutral-300">
                        Valet Parking
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 sm:p-7 pt-0 border-t border-white/5 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedClubModal(club)}
                  className="flex-1 py-3 border border-white/10 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition text-center"
                >
                  VIEW DETAILS
                </button>
                <button
                  onClick={() => onOpenTourModal(club.name)}
                  className="flex-1 py-3 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition text-center"
                >
                  REQUEST TOUR
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Club Details Modal */}
      {selectedClubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#090909] border border-white/15 max-w-2xl w-full p-6 sm:p-8 relative my-8 shadow-2xl">
            <button
              onClick={() => setSelectedClubModal(null)}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#c5a880] block mb-2">
              SANCTUARY ARCHITECTURAL DOSSIER
            </span>
            <h3 className="font-serif text-3xl text-white mb-2">{selectedClubModal.name}</h3>
            <p className="text-xs text-neutral-400 mb-6 font-mono">{selectedClubModal.address}</p>

            <div className="relative aspect-[16/9] overflow-hidden mb-6 bg-neutral-900 border border-white/10">
              <img
                src={selectedClubModal.heroImage}
                alt={selectedClubModal.name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mb-6">
              {selectedClubModal.description}
            </p>

            {/* Amenities List */}
            <h5 className="text-[11px] font-mono tracking-widest text-[#c5a880] uppercase mb-3">
              SANCTUARY SPECIFICATIONS & AMENITIES
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300 mb-6">
              {selectedClubModal.amenitiesList?.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Direct Google Maps Link */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(selectedClubModal.address)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 border border-white/20 hover:border-white text-white text-xs uppercase tracking-wider font-mono flex items-center space-x-1.5 transition"
              >
                <span>OPEN IN GOOGLE MAPS</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#c5a880]" />
              </a>

              <button
                onClick={() => {
                  const clubName = selectedClubModal.name;
                  setSelectedClubModal(null);
                  onOpenTourModal(clubName);
                }}
                className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition"
              >
                SCHEDULE PRIVATE WALKTHROUGH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
