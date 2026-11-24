const sampleClubs = [
  {
    name: "QNOX Mayfair Sanctuary",
    slug: "mayfair-sanctuary",
    location: "Mayfair, London W1K",
    address: "18 Grosvenor Street, Mayfair, London W1K 4QQ",
    mapsLink: "https://maps.google.com/?q=18+Grosvenor+Street+London",
    status: "OPEN",
    tagline: "The Pinnacle of Private Performance & Architectural Solitude",
    description: "Spanning four subterranean and above-ground levels of dark basalt stone, hand-finished bronze, and bespoke acoustic engineering. Features a UV-filtered natural slate pool and altitude chamber.",
    heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop"
    ],
    amenities: [
      "25m Natural Slate Ozone Swimming Pool",
      "Hypoxic Chamber (Simulating up to 3,500m)",
      "Sub-Zero Cryotherapy (-110°C)",
      "Bespoke Hyperbaric Oxygen Therapy Pods",
      "Private Valet & Concierge Laundry Service",
      "Artisanal Protein Lab & Organic Superfood Bar"
    ],
    openingHours: {
      weekdays: "05:30 - 23:00",
      weekends: "07:00 - 21:00"
    },
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: true
    }
  },
  {
    name: "QNOX Soho Foundry",
    slug: "soho-foundry",
    location: "Soho, London W1D",
    address: "42 Dean Street, Soho, London W1D 4PY",
    mapsLink: "https://maps.google.com/?q=42+Dean+Street+London",
    status: "OPEN",
    tagline: "High-Caliber Combat, Precision Rig & Industrial Luxury",
    description: "Carved from raw concrete and smoked mirrored glass, Soho Foundry is our high-tempo combat and functional sanctuary. Master your striking in our regulation boxing ring.",
    heroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1475&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1469&auto=format&fit=crop"
    ],
    amenities: [
      "Full-Sized Elevated Combat Ring & Heavy Bag Armory",
      "Eleiko Olympic Lifting Platforms & Power Cages",
      "Infrared Detoxification Saunas",
      "Contrast Hot/Cold Plunge Pools (3°C / 40°C)",
      "Custom DJ Acoustics & Lighting Rhythm System"
    ],
    openingHours: {
      weekdays: "06:00 - 22:30",
      weekends: "07:30 - 20:00"
    },
    features: {
      pool: false,
      altitudeChamber: false,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: false
    }
  },
  {
    name: "QNOX Canary Wharf Horizon",
    slug: "canary-wharf-horizon",
    location: "Canary Wharf, London E14",
    address: "Level 14-16, 25 Bank Street, London E14 5JP",
    mapsLink: "https://maps.google.com/?q=25+Bank+Street+London",
    status: "OPEN",
    tagline: "Panoramic Skyline Athleisure & Hydrothermal Sanctuary",
    description: "Suspended 16 floors above the Thames with floor-to-ceiling panoramic glass. Features our premier medical-grade recovery lab, multi-tiered thermal suites, and panoramic sprint track.",
    heroImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=1632&auto=format&fit=crop"
    ],
    amenities: [
      "Skyline Lap Pool with Heated Terrace",
      "Medical Biohacking & Biomarker Testing Suite",
      "Dynamic Reformer Pilates Glasshouse",
      "Hydro-Jet Massage Lounges",
      "Private Executive Workspace & Meeting Suites"
    ],
    openingHours: {
      weekdays: "05:30 - 22:30",
      weekends: "08:00 - 19:30"
    },
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: true
    }
  },
  {
    name: "QNOX Marylebone Mews",
    slug: "marylebone-mews",
    location: "Marylebone, London W1U",
    address: "31 Bingham Mews, Marylebone, London W1U 2BA",
    mapsLink: "https://maps.google.com/?q=31+Bingham+Mews+London",
    status: "OPEN",
    tagline: "Mind, Reformer & Intimate Restorative Sanctuary",
    description: "An intimate, members-only mews house dedicated to movement precision, dynamic reformer Pilates, breathwork, and sensory deprivation tanks.",
    heroImage: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop"
    ],
    amenities: [
      "Custom Allegro 2 Reformer Studio",
      "Zero-Gravity Floatation Suites",
      "Aromatherapy Herbal Steam Cavern",
      "Naturopathic Consultation Rooms"
    ],
    openingHours: {
      weekdays: "06:30 - 21:30",
      weekends: "08:00 - 18:00"
    },
    features: {
      pool: false,
      altitudeChamber: false,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: true
    }
  },
  {
    name: "QNOX Chelsea Waterfront",
    slug: "chelsea-waterfront",
    location: "Chelsea, London SW10",
    address: "Harbour Way, Chelsea Creek, London SW10 0XD",
    mapsLink: "https://maps.google.com/?q=Chelsea+Creek+London",
    status: "OPEN",
    tagline: "Equestrian Conditioning, Pure Water Athletics & Outdoor Rig",
    description: "Overlooking the water, Chelsea Waterfront combines an open-air rooftop sprint and calisthenics rig with a 30m illuminated lap pool and full physio facility.",
    heroImage: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
    ],
    amenities: [
      "30m Architectural Lap Pool",
      "Rooftop Turf Conditioning Track",
      "Physical Therapy & Osteopathy Wing",
      "Cold Hydro Waterfall Showers"
    ],
    openingHours: {
      weekdays: "06:00 - 22:00",
      weekends: "07:30 - 20:00"
    },
    features: {
      pool: true,
      altitudeChamber: false,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: true
    }
  },
  {
    name: "QNOX Obsidian Tower (Global Flagship)",
    slug: "obsidian-tower",
    location: "Bishopsgate, City of London EC2N",
    address: "Tower 42 Penthouse Suite, Bishopsgate, London EC2N 1HQ",
    mapsLink: "https://maps.google.com/?q=Tower+42+Bishopsgate+London",
    status: "PRIVATE ACCESS ONLY",
    tagline: "Ultra-Private Tier 1 Athletic Sanctuary & Founder Suite",
    description: "Capped strictly at 150 global members worldwide. Unrivalled biometric personalization, private biometric elevator access, private chef recovery dining, and 24/7 dedicated trainer pods.",
    heroImage: "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=1632&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop"
    ],
    amenities: [
      "24/7 Biometric Access & Private Chauffeur Service",
      "Full Body DEXA & Molecular Blood Lab",
      "Private Penthouse Recovery Suites with Cryo & Hyperbaric",
      "Bespoke Chef-Prepared Post-Workout Fueling"
    ],
    openingHours: {
      weekdays: "24 Hours / 7 Days",
      weekends: "24 Hours / 7 Days"
    },
    features: {
      pool: true,
      altitudeChamber: true,
      cryotherapy: true,
      spaAndRecovery: true,
      valet: true
    }
  }
];

const sampleTrainers = [
  {
    name: "Marcus Vance",
    role: "HEAD OF HUMAN PERFORMANCE",
    title: "Senior Olympic S&C Lead",
    badge: "EX-OLYMPIC S&C COACH",
    email: "marcus.vance@qnoxgym.com",
    phone: "+44 20 7946 0991",
    bio: "Over 14 years preparing podium athletes and private executives. Specialises in high-altitude metabolic endurance and central nervous system potentiation.",
    photo: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop",
    specialties: ["Hypoxic Conditioning", "VO2 Max Protocol", "Olympic Lifting"],
    certifications: ["CSCS Master Level", "EXOS Performance Specialist", "UKSCA Accredited Coach"],
    experienceYears: 14,
    rating: 4.98,
    clubs: ["QNOX Mayfair Sanctuary", "QNOX Canary Wharf Horizon"],
    isActive: true
  },
  {
    name: "Elena Rostova",
    role: "DIRECTOR OF MOVEMENT & REFORMER",
    title: "Master Classical Pilates & Posture Specialist",
    badge: "ROYAL BALLET FELLOW",
    email: "elena.rostova@qnoxgym.com",
    phone: "+44 20 7946 0992",
    bio: "Former principal soloist bringing surgical alignment and athletic power to reformer Pilates. Redefines posture through deliberate neuromuscular control.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop",
    specialties: ["Classical Allegro 2", "Spinal Decompression", "Myofascial Slings"],
    certifications: ["PMA Master Instructor", "BASI Pilates Comprehensive", "Postural Restoration Certified"],
    experienceYears: 11,
    rating: 4.96,
    clubs: ["QNOX Marylebone Mews", "QNOX Mayfair Sanctuary"],
    isActive: true
  },
  {
    name: "Sasha Romanov",
    role: "HEAD OF COMBAT & STRIKING",
    title: "Championship Boxing Director",
    badge: "FORMER WBA CONTINENTAL CHAMPION",
    email: "sasha.romanov@qnoxgym.com",
    phone: "+44 20 7946 0993",
    bio: "World-renowned boxing trainer with over 32 professional bouts. Directs the QNOX Combat Ring armory with ruthless discipline and technical elegance.",
    photo: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop",
    specialties: ["Precision Counter-Striking", "Footwork Mechanics", "Fight Stamina"],
    certifications: ["BBBofC Certified Corner Coach", "AIBA Certified", "Force-Vector Kinetic Specialist"],
    experienceYears: 16,
    rating: 4.99,
    clubs: ["QNOX Soho Foundry"],
    isActive: true
  },
  {
    name: "Aria Sterling",
    role: "DIRECTOR OF BIOMEDICAL RECOVERY",
    title: "Neuro-Physiology & Longevity Curator",
    badge: "PHD NEURO-PHYSIOLOGY",
    email: "aria.sterling@qnoxgym.com",
    phone: "+44 20 7946 0994",
    bio: "Oversees the QNOX longevity suites. Designs individualized thermal contrast therapies, hyperbaric medicine and mitochondrial revitalization protocols.",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop",
    specialties: ["Sub-Zero Cryo Protocol", "Heart Rate Variability", "Hyperbaric Medicine"],
    certifications: ["PhD Sports Neuro-Physiology", "Wim Hof Instructor", "Cryotherapy Clinical Director"],
    experienceYears: 9,
    rating: 4.95,
    clubs: ["QNOX Mayfair Sanctuary", "QNOX Canary Wharf Horizon", "QNOX Obsidian Tower (Global Flagship)"],
    isActive: true
  }
];

const sampleMembershipPlans = [
  {
    name: "THE RESIDENT",
    code: "RESIDENT",
    subtitle: "Dedicated Single Sanctuary Access",
    description: "Designed for high performers seeking absolute proximity and dedicated sanctuary access to their primary London neighbourhood.",
    pricing: {
      monthly: 1200,
      quarterly: 4000,
      halfYearly: 7000,
      yearly: 12000
    },
    benefits: [
      "Unlimited access to your chosen primary club sanctuary",
      "Full access to 25m Natural Slate Pool & Thermal Spa suites",
      "Hypoxic altitude training suite privileges",
      "Quarterly physiological health & biomarker audit",
      "4 guest sanctuary passes per quarter",
      "Complimentary private locker & bespoke organic amenities"
    ],
    features: {
      accessType: "Single Club Sanctuary",
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: false,
      valetParking: false,
      guestPassesPerQuarter: 4,
      priorityBookingDays: 7
    },
    isActive: true,
    isPopular: false,
    tag: "RESIDENT"
  },
  {
    name: "THE METROPOLITAN",
    code: "METROPOLITAN",
    subtitle: "London Multi-Sanctuary Pass",
    description: "Seamless athletic mobility. Unrestricted entry across Mayfair, Soho, Canary Wharf, Marylebone, and Chelsea clubs.",
    pricing: {
      monthly: 1800,
      quarterly: 4500,
      halfYearly: 7500,
      yearly: 12500
    },
    benefits: [
      "Universal access to all 5 London QNOX sanctuaries",
      "Advance 10-day priority booking window for all masterclasses",
      "Full combat ring, reformer Pilates, and aquatics inclusion",
      "Bi-monthly 1-on-1 performance coaching review",
      "8 guest passes per quarter with full club privileges",
      "Exclusive executive member lounge & private meeting suite access",
      "Complimentary overnight workout kit laundry & pressing service"
    ],
    features: {
      accessType: "All London Clubs",
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: true,
      guestPassesPerQuarter: 8,
      priorityBookingDays: 10
    },
    isActive: true,
    isPopular: true,
    tag: "MOST REQUESTED TIER"
  },
  {
    name: "THE OBSIDIAN BLACK",
    code: "OBSIDIAN",
    subtitle: "Global Private Founder Tier (Strictly 150 Members)",
    description: "Strictly capped at 150 members globally. Unrivalled biometric personalization, private biometric elevator access, and 24/7 dedicated concierge.",
    pricing: {
      monthly: 2500,
      quarterly: 5000,
      halfYearly: 8000,
      yearly: 13000
    },
    benefits: [
      "Global all-access including upcoming New York & Dubai sanctuaries",
      "24/7 biometric private suite & penthouse training access",
      "Dedicated Senior Master Coach (4 private 1-on-1s / month included)",
      "Unlimited Sub-Zero Cryotherapy & Hyperbaric oxygen pods",
      "Private valet parking & chauffeured transit within Mayfair",
      "Unlimited complimentary guest privileges with concierge host",
      "Direct WhatsApp hotline to Executive Concierge Desk"
    ],
    features: {
      accessType: "Global Unlimited Flagship",
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: true,
      guestPassesPerQuarter: 99,
      priorityBookingDays: 30
    },
    isActive: true,
    isPopular: false,
    tag: "BY APPLICATION ONLY"
  }
];

const sampleClasses = [
  {
    title: "METCON HYPOXIC 3000",
    category: "Hypoxic Athletic",
    clubName: "QNOX Mayfair Sanctuary",
    trainer: {
      name: "Marcus Vance",
      title: "Head of Human Performance (Ex-Olympic S&C)",
      image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop"
    },
    day: "Monday",
    startTime: "07:00",
    durationMinutes: 50,
    intensity: "High Athletic",
    capacity: 12,
    bookedSpots: 10
  },
  {
    title: "CHRONO COMBAT & STRIKE",
    category: "Combat",
    clubName: "QNOX Soho Foundry",
    trainer: {
      name: "Sasha Romanov",
      title: "Former WBA Champion Coach",
      image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=687&auto=format&fit=crop"
    },
    day: "Monday",
    startTime: "12:15",
    durationMinutes: 55,
    intensity: "High Athletic",
    capacity: 16,
    bookedSpots: 14
  },
  {
    title: "REFORMER PRECISION ALIGN",
    category: "Reformer & Mat",
    clubName: "QNOX Marylebone Mews",
    trainer: {
      name: "Elena Rostova",
      title: "Classical Pilates & Posture Specialist",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=688&auto=format&fit=crop"
    },
    day: "Monday",
    startTime: "18:00",
    durationMinutes: 50,
    intensity: "Precision & Core",
    capacity: 10,
    bookedSpots: 8
  },
  {
    title: "HYDRO ENDURANCE & OXYGEN",
    category: "Hydro / Swim",
    clubName: "QNOX Mayfair Sanctuary",
    trainer: {
      name: "Julian Thorne",
      title: "Elite Aquatics Director",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop"
    },
    day: "Tuesday",
    startTime: "07:30",
    durationMinutes: 45,
    intensity: "Endurance & Breath",
    capacity: 8,
    bookedSpots: 5
  },
  {
    title: "FORGED: ELEIKO STRENGTH LAB",
    category: "Strength & Rig",
    clubName: "QNOX Canary Wharf Horizon",
    trainer: {
      name: "Marcus Vance",
      title: "Senior Power & Biomechanics Lead",
      image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=687&auto=format&fit=crop"
    },
    day: "Wednesday",
    startTime: "06:45",
    durationMinutes: 60,
    intensity: "High Athletic",
    capacity: 14,
    bookedSpots: 12
  },
  {
    title: "COLD PLUNGE & BREATH ARCHITECTURE",
    category: "Cryo Recovery",
    clubName: "QNOX Mayfair Sanctuary",
    trainer: {
      name: "Aria Sterling",
      title: "Neuro-Recovery & Wim Hof Protocol Coach",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop"
    },
    day: "Thursday",
    startTime: "17:30",
    durationMinutes: 45,
    intensity: "Restorative",
    capacity: 12,
    bookedSpots: 9
  }
];

const seedDatabase = async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.log('[QNOX Seed] MongoDB offline; operating on zero-latency memory dataset.');
    return;
  }
  const Club = require('../models/Club');
  const ClassSchedule = require('../models/ClassSchedule');
  const Trainer = require('../models/Trainer');
  const MembershipPlan = require('../models/MembershipPlan');
  const User = require('../models/User');

  try {
    // 1. Seed Super Admin User
    const adminExists = await User.findOne({ email: 'admin@qnoxgym.com' });
    if (!adminExists) {
      await User.create({
        name: 'Executive Concierge Admin',
        email: 'admin@qnoxgym.com',
        password: 'Admin@QNOX2026!',
        phone: '+44 20 7946 0990',
        role: 'Super Admin',
      });
      console.log('[QNOX Seed] Super Admin initialized: admin@qnoxgym.com / Admin@QNOX2026!');
    }

    // 1b. Seed Master Trainer User
    let trainerUser = await User.findOne({ email: 'trainer@qnoxgym.com' });
    if (!trainerUser) {
      trainerUser = await User.create({
        name: 'Marcus Vance',
        email: 'trainer@qnoxgym.com',
        password: 'Trainer@QNOX2026!',
        phone: '+44 20 7946 0880',
        role: 'Trainer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
      });
      console.log('[QNOX Seed] Master Trainer initialized: trainer@qnoxgym.com / Trainer@QNOX2026!');
    }

    const Exercise = require('../models/Exercise');
    const exerciseCount = await Exercise.countDocuments();
    if (exerciseCount === 0) {
      const defaultExercises = [
        { name: 'Barbell Incline Bench Press', category: 'Chest Workout', targetMuscle: 'Upper Chest', equipment: 'Barbells', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10 reps', restTimeSec: 90, instructions: 'Retract scapulae and press upwards focusing on clavicular head.' },
        { name: 'Dumbbell Flat Bench Press', category: 'Chest Workout', targetMuscle: 'Pectoralis Major', equipment: 'Dumbbells', difficulty: 'Beginner', defaultSets: 3, defaultReps: '10-12 reps', restTimeSec: 60, instructions: 'Lower dumbbells with elbows at a 45-degree angle.' },
        { name: 'Cable Standing Flyes', category: 'Chest Workout', targetMuscle: 'Inner & Mid Pecs', equipment: 'Cable Machines', difficulty: 'Intermediate', defaultSets: 3, defaultReps: '12-15 reps', restTimeSec: 45, instructions: 'Squeeze pecs at peak contraction for 1 second.' },
        { name: 'Weighted Pull-Ups', category: 'Back Workout', targetMuscle: 'Latissimus Dorsi', equipment: 'Bodyweight Exercises', difficulty: 'Advanced', defaultSets: 4, defaultReps: '6-8 reps', restTimeSec: 90, instructions: 'Full dead-hang stretch to chin over bar.' },
        { name: 'Barbell Bent-Over Row', category: 'Back Workout', targetMuscle: 'Rhomboids & Mid Back', equipment: 'Barbells', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10 reps', restTimeSec: 75, instructions: 'Keep spine neutral with a 45 degree hip hinge.' },
        { name: 'Seated Cable Row', category: 'Back Workout', targetMuscle: 'Mid Lats & Lower Traps', equipment: 'Cable Machines', difficulty: 'Beginner', defaultSets: 3, defaultReps: '10-12 reps', restTimeSec: 60, instructions: 'Pull towards belly button without torso swinging.' },
        { name: 'Barbell Overhead Press', category: 'Shoulder Workout', targetMuscle: 'Anterior & Lateral Delts', equipment: 'Barbells', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '6-8 reps', restTimeSec: 90, instructions: 'Brace core and glutes firmly before initiating drive.' },
        { name: 'Dumbbell Lateral Raise', category: 'Shoulder Workout', targetMuscle: 'Lateral Deltoid', equipment: 'Dumbbells', difficulty: 'Beginner', defaultSets: 4, defaultReps: '12-15 reps', restTimeSec: 45, instructions: 'Slight forward lean, raise arms in the scapular plane.' },
        { name: 'Barbell Back Squats', category: 'Leg Workout', targetMuscle: 'Quadriceps & Glutes', equipment: 'Barbells', difficulty: 'Advanced', defaultSets: 5, defaultReps: '5-8 reps', restTimeSec: 120, instructions: 'Descend to parallel or below with heels firmly planted.' },
        { name: 'Romanian Deadlifts (RDL)', category: 'Leg Workout', targetMuscle: 'Hamstrings & Posterior Chain', equipment: 'Barbells', difficulty: 'Intermediate', defaultSets: 4, defaultReps: '8-10 reps', restTimeSec: 90, instructions: 'Hinge back pushing hips to wall behind you.' },
        { name: 'Incline Dumbbell Bicep Curls', category: 'Biceps Workout', targetMuscle: 'Biceps Brachii', equipment: 'Dumbbells', difficulty: 'Beginner', defaultSets: 3, defaultReps: '10-12 reps', restTimeSec: 60, instructions: 'Supinate wrists at top for maximal peak contraction.' },
        { name: 'Triceps Rope Pushdown', category: 'Triceps Workout', targetMuscle: 'Triceps Lateral Head', equipment: 'Cable Machines', difficulty: 'Beginner', defaultSets: 4, defaultReps: '12-15 reps', restTimeSec: 45, instructions: 'Flourish rope apart at bottom lockout.' },
        { name: 'Hanging Leg Raises', category: 'Abs Workout', targetMuscle: 'Rectus Abdominis', equipment: 'Bodyweight Exercises', difficulty: 'Intermediate', defaultSets: 3, defaultReps: '15 reps', restTimeSec: 45, instructions: 'Curl pelvis up towards ribs avoiding momentum swing.' },
        { name: 'Sled Push & Battle Ropes', category: 'Cardio Workout', targetMuscle: 'Cardiovascular & Full Body', equipment: 'Other', difficulty: 'Intermediate', defaultSets: 5, defaultReps: '45 sec intervals', restTimeSec: 60, instructions: 'Maximum metabolic output during active intervals.' }
      ];
      await Exercise.insertMany(defaultExercises);
      console.log('[QNOX Seed] Preloaded 14 standard exercise library items.');
    }

    // 2. Seed & Synchronize Membership Plans with current pricing
    for (const plan of sampleMembershipPlans) {
      await MembershipPlan.findOneAndUpdate(
        { code: plan.code },
        {
          $set: {
            name: plan.name,
            subtitle: plan.subtitle,
            pricing: plan.pricing,
            description: plan.description,
            benefits: plan.benefits,
            features: plan.features,
            isActive: plan.isActive,
            isPopular: plan.isPopular,
            tag: plan.tag,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log('[QNOX Seed] Preloaded & Synchronized 3 Luxury Residency Plans with updated pricing.');

    // 3. Seed Master Trainers
    const trainerCount = await Trainer.countDocuments();
    if (trainerCount === 0) {
      await Trainer.insertMany(sampleTrainers);
      console.log('[QNOX Seed] Preloaded 4 Master Coaches & Practitioners.');
    }

    // 4. Seed Clubs
    const clubCount = await Club.countDocuments();
    if (clubCount === 0) {
      await Club.insertMany(sampleClubs);
      console.log('[QNOX Seed] Preloaded 6 Ultra-Luxury QNOX Clubs.');
    }

    // 5. Seed Master Schedule
    const classCount = await ClassSchedule.countDocuments();
    if (classCount === 0) {
      await ClassSchedule.insertMany(sampleClasses);
      console.log('[QNOX Seed] Preloaded Master Schedule.');
    }
  } catch (err) {
    console.warn('[QNOX Seed] MongoDB seeding skipped:', err.message);
  }
};

module.exports = {
  sampleClubs,
  sampleTrainers,
  sampleMembershipPlans,
  sampleClasses,
  seedDatabase
};
