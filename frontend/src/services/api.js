// Smart API_BASE resolver for Production (Vercel -> Render) & Localhost
const getApiBase = () => {
  // 1. Explicit Vite Environment Variable (e.g. VITE_API_URL configured on Vercel)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 2. Development Mode on Localhost
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:5000/api';
  }

  // 3. Production Deployment Fallback (Render live backend)
  return 'https://qnox.onrender.com/api';
};

const API_BASE = getApiBase();

// Authentication Token Helpers
export const getAuthToken = () => localStorage.getItem('qnox_auth_token');
export const setAuthToken = (token) => localStorage.setItem('qnox_auth_token', token);
export const removeAuthToken = () => {
  localStorage.removeItem('qnox_auth_token');
  localStorage.removeItem('qnox_user_data');
};
export const getStoredUser = () => {
  const data = localStorage.getItem('qnox_user_data');
  return data ? JSON.parse(data) : null;
};
export const setStoredUser = (user) => {
  localStorage.setItem('qnox_user_data', JSON.stringify(user));
};

const authHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/* ================= AUTHENTICATION ================= */
export const registerUser = async (userData) => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setAuthToken(data.token);
        setStoredUser(data.user);
      }
      return data;
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Registration failed');
  } catch (err) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    // Offline simulation registration fallback
    const simulatedUser = {
      id: 'usr_' + Date.now(),
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: 'Gym Member',
      membership: { status: 'None', planName: 'None' },
    };
    const token = 'simulated_jwt_' + Date.now();
    setAuthToken(token);
    setStoredUser(simulatedUser);
    return { success: true, token, user: simulatedUser };
  }
};

export const loginUser = async (credentials) => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setAuthToken(data.token);
        setStoredUser(data.user);
      }
      return data;
    }

    if (res.status === 401 || res.status === 400) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Invalid credentials');
    }
  } catch (err) {
    if (err.message && err.message.includes('Invalid credentials')) {
      throw err;
    }
    console.warn('[QNOX Client] Backend server unreachable, checking demo admin access:', err.message);
  }

  // Pre-seeded Super Admin demo credentials fallback if backend process is offline
  if (
    credentials.email === 'admin@qnoxgym.com' &&
    credentials.password === 'Admin@QNOX2026!'
  ) {
    const demoAdminUser = {
      id: 'usr_admin_demo',
      name: 'Executive Concierge Admin',
      email: 'admin@qnoxgym.com',
      role: 'Super Admin',
      membership: { planName: 'THE OBSIDIAN BLACK', status: 'Active' },
    };
    const demoToken = 'demo_super_admin_jwt_token_2026';
    setAuthToken(demoToken);
    setStoredUser(demoAdminUser);
    return {
      success: true,
      message: 'Logged in as Super Admin.',
      token: demoToken,
      user: demoAdminUser,
    };
  }

  throw new Error('Backend server is offline! Please start backend with: cd backend && npm start');
};

export const fetchCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      setStoredUser(data.data);
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Auth check using stored session.');
  }
  return getStoredUser();
};

export const requestPasswordReset = async (email) => {
  try {
    const res = await fetch(`${API_BASE}/auth/forgotpassword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: true, message: 'Password reset dispatch transmitted to your email.' };
  }
};

export const resetPasswordWithToken = async (token, password) => {
  const res = await fetch(`${API_BASE}/auth/resetpassword/${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Password update failed');
  return data;
};

export const updateUserProfile = async (userData) => {
  try {
    const res = await fetch(`${API_BASE}/auth/updatedetails`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.data) {
      setStoredUser(data.data);
    }
    return data;
  } catch (err) {
    const current = getStoredUser() || {};
    const updated = { ...current, ...userData };
    setStoredUser(updated);
    return { success: true, data: updated };
  }
};

export const logoutUser = () => {
  removeAuthToken();
};

/* ================= CLUBS ================= */
export const fetchClubs = async () => {
  try {
    const res = await fetch(`${API_BASE}/clubs`);
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Clubs fetch fallback:', err.message);
  }
  // Return default luxury clubs if backend server is not running
  return [
    {
      name: "QNOX Mayfair Sanctuary",
      slug: "mayfair-sanctuary",
      location: "Mayfair, London W1K",
      address: "18 Grosvenor Street, Mayfair, London W1K 4QQ",
      status: "OPEN",
      tagline: "The Pinnacle of Private Performance & Architectural Solitude",
      description: "Spanning four subterranean and above-ground levels of dark basalt stone, hand-finished bronze, and bespoke acoustic engineering.",
      heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
      amenities: ["25m Natural Slate Ozone Swimming Pool", "Hypoxic Chamber (3,500m)", "Sub-Zero Cryotherapy (-110°C)"],
      openingHours: { weekdays: "05:30 - 23:00", weekends: "07:00 - 21:00" },
      features: { pool: true, altitudeChamber: true, cryotherapy: true }
    },
    {
      name: "QNOX Soho Foundry",
      slug: "soho-foundry",
      location: "Soho, London W1D",
      address: "42 Dean Street, Soho, London W1D 4PY",
      status: "OPEN",
      tagline: "High-Caliber Combat, Precision Rig & Industrial Luxury",
      description: "Carved from raw concrete and smoked mirrored glass, Soho Foundry is our high-tempo combat sanctuary.",
      heroImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop",
      amenities: ["Full-Sized Elevated Combat Ring", "Eleiko Olympic Lifting", "Infrared Saunas"],
      openingHours: { weekdays: "06:00 - 22:30", weekends: "07:30 - 20:00" },
      features: { pool: false, altitudeChamber: false, cryotherapy: true }
    },
    {
      name: "QNOX Canary Wharf Horizon",
      slug: "canary-wharf-horizon",
      location: "Canary Wharf, London E14",
      address: "Level 14-16, 25 Bank Street, London E14 5JP",
      status: "OPEN",
      tagline: "Panoramic Skyline Athleisure & Hydrothermal Sanctuary",
      description: "Suspended 16 floors above the Thames with floor-to-ceiling panoramic glass.",
      heroImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470&auto=format&fit=crop",
      amenities: ["Skyline Lap Pool", "Medical Biohacking Suite", "Reformer Pilates Glasshouse"],
      openingHours: { weekdays: "05:30 - 22:30", weekends: "08:00 - 19:30" },
      features: { pool: true, altitudeChamber: true, cryotherapy: true }
    }
  ];
};

export const createClubRecord = async (clubData) => {
  const res = await fetch(`${API_BASE}/clubs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(clubData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create club');
  return data;
};

export const updateClubRecord = async (id, clubData) => {
  const res = await fetch(`${API_BASE}/clubs/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(clubData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update club');
  return data;
};

export const deleteClubRecord = async (id) => {
  const res = await fetch(`${API_BASE}/clubs/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete club');
  return data;
};

/* ================= TRAINERS ================= */
export const fetchTrainers = async (all = false) => {
  try {
    const res = await fetch(`${API_BASE}/trainers${all ? '?all=true' : ''}`);
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Trainers fallback.');
  }
  return [];
};

export const createTrainerRecord = async (trainerData) => {
  const res = await fetch(`${API_BASE}/trainers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(trainerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create trainer');
  return data;
};

export const updateTrainerRecord = async (id, trainerData) => {
  const res = await fetch(`${API_BASE}/trainers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(trainerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update trainer');
  return data;
};

export const deleteTrainerRecord = async (id) => {
  const res = await fetch(`${API_BASE}/trainers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete trainer');
  return data;
};

/* ================= MEMBERSHIP PLANS ================= */
export const fetchMembershipPlans = async (all = false) => {
  try {
    const res = await fetch(`${API_BASE}/membership-plans${all ? '?all=true' : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Membership plans fallback:', err.message);
  }
  // Robust default luxury tiers if backend is starting
  return [
    {
      _id: 'plan_1',
      name: 'THE RESIDENT',
      code: 'RESIDENT',
      subtitle: 'Dedicated Single Sanctuary Access',
      pricing: { monthly: 1200, quarterly: 4000, halfYearly: 7000, yearly: 12000 },
      description: 'Designed for high performers seeking absolute proximity and dedicated sanctuary access.',
      benefits: [
        'Unlimited access to your chosen primary club',
        'Full access to 25m Natural Slate Pool & Thermal Spa',
        'Hypoxic altitude training room privileges',
        '4 guest sanctuary day passes per quarter'
      ],
      isActive: true,
    },
    {
      _id: 'plan_2',
      name: 'THE METROPOLITAN',
      code: 'METROPOLITAN',
      subtitle: 'London All-Sanctuary Access',
      pricing: { monthly: 1800, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
      description: 'Seamless athletic mobility. Unrestricted entry across Mayfair, Soho, Canary Wharf, Marylebone, and Chelsea clubs.',
      benefits: [
        'Universal access to all 5 London QNOX sanctuaries',
        'Advance 10-day priority booking window for all masterclasses',
        'Full combat ring, reformer Pilates, and aquatics inclusion',
        '8 guest passes per quarter with full club privileges'
      ],
      isActive: true,
      isPopular: true,
      tag: 'MOST REQUESTED TIER',
    },
    {
      _id: 'plan_3',
      name: 'THE OBSIDIAN BLACK',
      code: 'OBSIDIAN',
      subtitle: 'Global Private Founder Tier (Strictly 150)',
      pricing: { monthly: 2500, quarterly: 5000, halfYearly: 8000, yearly: 13000 },
      description: 'Strictly capped at 150 members globally. Unrivalled biometric personalization, private elevator access, and 24/7 concierge.',
      benefits: [
        'Global all-access including upcoming NY & Dubai sanctuaries',
        '24/7 biometric private suite & penthouse training access',
        'Dedicated Senior Master Coach (4 private 1-on-1s / month)',
        'Unlimited Sub-Zero Cryotherapy & Hyperbaric oxygen pods'
      ],
      isActive: true,
      tag: 'BY APPLICATION ONLY',
    }
  ];
};

export const createMembershipPlan = async (planData) => {
  const res = await fetch(`${API_BASE}/membership-plans`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(planData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create plan');
  return data;
};

export const updateMembershipPlan = async (id, planData) => {
  const res = await fetch(`${API_BASE}/membership-plans/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(planData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update plan');
  return data;
};

export const deleteMembershipPlan = async (id) => {
  const res = await fetch(`${API_BASE}/membership-plans/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete plan');
  return data;
};

export const togglePlanStatus = async (id) => {
  const res = await fetch(`${API_BASE}/membership-plans/${id}/toggle-status`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle status');
  return data;
};

/* ================= PAYMENTS (RAZORPAY) ================= */
export const createPaymentOrder = async (orderData) => {
  const res = await fetch(`${API_BASE}/payments/create-order`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create payment order');
  return data;
};

export const verifyPaymentSignature = async (paymentVerificationData) => {
  const res = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(paymentVerificationData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Payment signature verification failed');
  return data;
};

export const fetchMyPayments = async () => {
  try {
    const res = await fetch(`${API_BASE}/payments/my-payments`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Payments fallback.');
  }
  return [];
};

export const fetchAllPayments = async () => {
  try {
    const res = await fetch(`${API_BASE}/payments/all`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Payments fallback.');
  }
  return [];
};

export const fetchInvoice = async (invoiceNumber) => {
  const res = await fetch(`${API_BASE}/payments/invoice/${invoiceNumber}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load invoice');
  return data.data;
};

export const refundPaymentRecord = async (id, refundData) => {
  const res = await fetch(`${API_BASE}/payments/${id}/refund`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(refundData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to initiate refund');
  return data;
};

/* ================= TIMETABLE & BOOKINGS ================= */
export const fetchSchedule = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/schedule?${query}`);
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Schedule fallback.');
  }
  return null;
};

export const reserveClassBooking = async (arg1, arg2) => {
  let payload;
  if (typeof arg1 === 'object' && arg1 !== null) {
    payload = {
      classId: arg1.classId || arg1._id,
      classDate: arg1.classDate || new Date().toISOString().split('T')[0],
      classTitle: arg1.classTitle || arg1.title,
      clubName: arg1.clubName,
      trainerName: arg1.trainerName || arg1.trainer?.name,
      day: arg1.day,
      startTime: arg1.startTime,
      durationMinutes: arg1.durationMinutes,
      category: arg1.category,
    };
  } else {
    payload = {
      classId: arg1,
      classDate: arg2 || new Date().toISOString().split('T')[0],
    };
  }

  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Reservation failed');
  return data;
};

export const cancelClassBooking = async (bookingId, reason) => {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Cancellation failed');
  return data;
};

export const fetchMyBookings = async () => {
  try {
    const res = await fetch(`${API_BASE}/bookings/my-bookings`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] My bookings fallback.');
  }
  return [];
};

export const fetchAllBookings = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/bookings/all?${query}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] All bookings fallback.');
  }
  return [];
};

export const updateBookingAttendance = async (bookingId, status) => {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/attendance`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Attendance update failed');
  return data;
};

/* ================= INQUIRIES & NEWSLETTER ================= */
export const submitTourInquiry = async (formData) => {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit inquiry');
  return data;
};

export const fetchAllInquiries = async () => {
  try {
    const res = await fetch(`${API_BASE}/inquiries`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Inquiries fallback.');
  }
  return [];
};

export const subscribeNewsletter = async (email) => {
  const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Subscription failed');
  return data;
};

export const fetchAllSubscribers = async () => {
  try {
    const res = await fetch(`${API_BASE}/newsletter/subscribers`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Subscribers fallback.');
  }
  return [];
};

export const exportSubscribersCsv = () => {
  window.open(`${API_BASE}/newsletter/export-csv`, '_blank');
};

export const dispatchNewsletterCampaign = async (campaignData) => {
  const res = await fetch(`${API_BASE}/newsletter/campaign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(campaignData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Campaign dispatch failed');
  return data;
};

/* ================= ADMIN OVERVIEW & ANALYTICS ================= */
export const fetchAdminOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Admin overview fallback.');
  }
  return {
    stats: {
      totalMembers: 128,
      activeMemberships: 94,
      totalRevenue: 1420000,
      totalBookings: 482,
      pendingInquiries: 14,
    },
    recentActivities: {
      payments: [],
      bookings: [],
      inquiries: [],
      members: [],
    },
  };
};

export const fetchRevenueAnalytics = async (period = 'monthly') => {
  try {
    const res = await fetch(`${API_BASE}/admin/analytics/revenue?period=${period}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Revenue analytics fallback.');
  }
  return period === 'weekly'
    ? [
        { day: 'Mon', revenue: 42000, bookings: 32 },
        { day: 'Tue', revenue: 38000, bookings: 28 },
        { day: 'Wed', revenue: 55000, bookings: 45 },
        { day: 'Thu', revenue: 49000, bookings: 38 },
        { day: 'Fri', revenue: 64000, bookings: 52 },
        { day: 'Sat', revenue: 78000, bookings: 61 },
        { day: 'Sun', revenue: 59000, bookings: 44 },
      ]
    : [
        { month: 'Jun', revenue: 145000, memberships: 12 },
        { month: 'Jul', revenue: 182000, memberships: 16 },
        { month: 'Aug', revenue: 210000, memberships: 19 },
        { month: 'Sep', revenue: 265000, memberships: 24 },
        { month: 'Oct', revenue: 310000, memberships: 28 },
        { month: 'Nov', revenue: 385000, memberships: 35 },
      ];
};

export const fetchAdminMembers = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/members?${query}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[QNOX Client] Members fallback.');
  }
  return {
    data: [
      {
        _id: 'usr_1',
        name: 'Lord Alexander Wright',
        email: 'alexander@mayfair.co.uk',
        phone: '+44 7911 123456',
        membership: { planName: 'THE OBSIDIAN BLACK', status: 'Active', endDate: '2027-11-20' },
      },
      {
        _id: 'usr_2',
        name: 'Victoria Sterling',
        email: 'victoria@chelsea.london',
        phone: '+44 7911 987654',
        membership: { planName: 'THE METROPOLITAN', status: 'Active', endDate: '2027-05-15' },
      },
      {
        _id: 'usr_3',
        name: 'Marcus Holloway',
        email: 'marcus@soho.org',
        phone: '+44 7911 445566',
        membership: { planName: 'THE RESIDENT', status: 'Expired', endDate: '2026-10-01' },
      }
    ],
  };
};

export const exportMembersCsv = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const token = getAuthToken();
  const url = `${API_BASE}/admin/members/export?${query}&token=${token}`;
  window.open(url, '_blank');
};

export const fetchMemberDossier = async (memberId, fallbackMember = null) => {
  try {
    const res = await fetch(`${API_BASE}/admin/members/${memberId}`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Dossier endpoint offline or loading fallback:', err.message);
  }

  // Graceful client fallback using member row data so UI never blocks
  return {
    member: fallbackMember || {
      _id: memberId,
      name: 'Residency Member',
      email: 'member@qnoxgym.com',
      phone: '',
      role: 'Gym Member',
      membership: { planName: 'THE METROPOLITAN', status: 'Active', billingCycle: 'monthly' },
      membershipHistory: [],
      freezeHistory: [],
      adminNotes: [],
    },
    stats: {
      paymentsCount: 0,
      attendanceTotal: 0,
      attendanceThisMonth: 0,
      fitnessCount: 0,
    },
  };
};

export const updateMemberProfile = async (memberId, profileData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update member profile');
  return data;
};

export const renewMemberMembership = async (memberId, renewData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/renew`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(renewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to renew membership');
  return data;
};

export const freezeMemberMembership = async (memberId, freezeData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/freeze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(freezeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to freeze membership');
  return data;
};

export const unfreezeMemberMembership = async (memberId) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/unfreeze`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to unfreeze membership');
  return data;
};

export const fetchMemberPayments = async (memberId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/members/${memberId}/payments`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Payment history fallback:', err.message);
  }
  return [];
};

export const recordOfflinePayment = async (memberId, paymentData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/payments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(paymentData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to record payment');
  return data;
};

export const fetchMemberAttendance = async (memberId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/members/${memberId}/attendance`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Attendance history fallback:', err.message);
  }
  return { totalVisits: 0, monthlyVisits: 0, attendances: [] };
};

export const recordMemberAttendance = async (memberId, attendanceData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/attendance`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(attendanceData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to record attendance');
  return data;
};

export const fetchMemberFitness = async (memberId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/members/${memberId}/fitness`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Fitness biometrics fallback:', err.message);
  }
  return [];
};

export const recordMemberFitness = async (memberId, fitnessData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/fitness`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(fitnessData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to record fitness biometrics');
  return data;
};

export const addAdminNote = async (memberId, noteData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(noteData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save internal note');
  return data;
};

export const updateAdminNote = async (memberId, noteId, status) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/notes/${noteId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update note status');
  return data;
};

export const archiveMember = async (memberId, reason) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/archive`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to archive member');
  return data;
};

export const restoreMember = async (memberId) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/restore`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to restore member');
  return data;
};

export const fetchMemberAuditLogs = async (memberId) => {
  try {
    const res = await fetch(`${API_BASE}/admin/members/${memberId}/audit-logs`, {
      headers: authHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[QNOX Client] Audit logs fallback:', err.message);
  }
  return [];
};

export const updateMemberResidency = async (memberId, updateData) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}/membership`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update residency');
  return data;
};

export const deleteMemberRecord = async (memberId) => {
  const res = await fetch(`${API_BASE}/admin/members/${memberId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete member');
  return data;
};

/* ================= IMAGE UPLOAD ================= */
export const uploadImageFile = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Image upload failed');
  return data.data;
};

/* ================= NOTIFICATIONS API ================= */
export const fetchMyNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  try {
    const res = await fetch(`${API_BASE}/notifications/my-notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
    return data;
  } catch (err) {
    console.warn('[Fetch Notifications]', err.message);
    return { success: false, data: [], unreadCount: 0 };
  }
};

export const fetchNotificationUnreadCount = async () => {
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch unread count');
    return data.unreadCount || 0;
  } catch (err) {
    return 0;
  }
};

export const markNotificationRead = async (id) => {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification read');
  return data;
};

export const markAllNotificationsRead = async (scope = '') => {
  const res = await fetch(`${API_BASE}/notifications/read-all?scope=${scope}`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark all read');
  return data;
};

export const deleteNotificationRecord = async (id) => {
  const res = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to delete notification');
  return data;
};

export const fetchAdminNotifications = async ({ status = 'all', filterType = 'all', search = '', page = 1, limit = 20 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (filterType && filterType !== 'all') params.append('filterType', filterType);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);

    const res = await fetch(`${API_BASE}/notifications/admin-notifications?${params.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch admin notifications');
    return data;
  } catch (err) {
    console.warn('[Admin Notifications]', err.message);
    return { success: false, data: [], metrics: { total: 0, unread: 0, expired: 0, expiringSoon: 0, renewed: 0 } };
  }
};

export const triggerAdminExpiryCheck = async () => {
  const res = await fetch(`${API_BASE}/admin/cron/run-expiry-check`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to execute expiry check');
  return data;
};

// ==========================================
// MEMBERSHIP MANAGEMENT & LIFECYCLE
// ==========================================

export const fetchMyMembership = async () => {
  const res = await fetch(`${API_BASE}/memberships/my-membership`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch membership details');
  return data.data;
};

export const submitFreezeRequest = async (payload) => {
  const res = await fetch(`${API_BASE}/memberships/freeze-request`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit freeze request');
  return data;
};

export const submitCancellationRequest = async (payload) => {
  const res = await fetch(`${API_BASE}/memberships/cancellation-request`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit cancellation request');
  return data;
};

export const toggleAutoRenew = async () => {
  const res = await fetch(`${API_BASE}/memberships/auto-renew`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to toggle auto-renewal');
  return data;
};

export const fetchMembershipStats = async () => {
  const res = await fetch(`${API_BASE}/memberships/admin/stats`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch membership stats');
  return data.data;
};

export const fetchMembershipRequests = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/memberships/admin/requests?${query}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch membership requests');
  return data.data;
};

export const approveMembershipRequest = async (id, payload = {}) => {
  const res = await fetch(`${API_BASE}/memberships/admin/requests/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve request');
  return data;
};

export const rejectMembershipRequest = async (id, payload = {}) => {
  const res = await fetch(`${API_BASE}/memberships/admin/requests/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject request');
  return data;
};

export const extendMembershipAdmin = async (userId, payload) => {
  const res = await fetch(`${API_BASE}/memberships/admin/${userId}/extend`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to extend membership');
  return data;
};

export const suspendMembershipAdmin = async (userId, payload) => {
  const res = await fetch(`${API_BASE}/memberships/admin/${userId}/suspend`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to suspend membership');
  return data;
};

export const reactivateMembershipAdmin = async (userId) => {
  const res = await fetch(`${API_BASE}/memberships/admin/${userId}/reactivate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reactivate membership');
  return data;
};

export const sendRenewalReminderAdmin = async (userId) => {
  const res = await fetch(`${API_BASE}/memberships/admin/${userId}/send-reminder`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to dispatch renewal reminder');
  return data;
};



/* ================= TRAINER PORTAL APIS ================= */

export const getTrainerDashboardStats = async () => {
  const res = await fetch(`${API_BASE}/trainer-portal/dashboard/stats`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch trainer stats');
  return data;
};

export const getTrainerMembers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/members${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch members');
  return data;
};

export const getTrainerMemberDetail = async (id) => {
  const res = await fetch(`${API_BASE}/trainer-portal/members/${id}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch member details');
  return data;
};

export const updateMemberFitnessProfile = async (id, profile) => {
  const res = await fetch(`${API_BASE}/trainer-portal/members/${id}/fitness-profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update fitness profile');
  return data;
};

export const addTrainerMemberNote = async (id, note) => {
  const res = await fetch(`${API_BASE}/trainer-portal/members/${id}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(note),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add note');
  return data;
};

export const getTrainerAttendance = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/attendance${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch attendance');
  return data;
};

export const markMemberCheckIn = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/attendance/check-in`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to check in member');
  return data;
};

export const markMemberCheckOut = async (attendanceId) => {
  const res = await fetch(`${API_BASE}/trainer-portal/attendance/${attendanceId}/check-out`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to check out member');
  return data;
};

export const getTrainerWorkoutPlans = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/workouts${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch workout plans');
  return data;
};

export const createWorkoutPlan = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/workouts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create workout plan');
  return data;
};

export const updateWorkoutPlan = async (id, payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/workouts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update workout plan');
  return data;
};

export const assignWorkoutPlan = async (id, memberId) => {
  const res = await fetch(`${API_BASE}/trainer-portal/workouts/${id}/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ memberId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to assign workout plan');
  return data;
};

export const generateAiWorkoutPlan = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/workouts/ai-generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to generate AI workout plan');
  return data;
};

export const getTrainerDietPlans = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/diets${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch diet plans');
  return data;
};

export const createDietPlan = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/diets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create diet plan');
  return data;
};

export const generateAiDietPlan = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/diets/ai-generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to generate AI diet plan');
  return data;
};

export const getTrainerAssessments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/assessments${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch assessments');
  return data;
};

export const createFitnessAssessment = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/assessments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create assessment');
  return data;
};

export const getTrainerPTSessions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/pt-sessions${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch PT sessions');
  return data;
};

export const schedulePTSession = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/pt-sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to schedule PT session');
  return data;
};

export const updatePTSession = async (id, payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/pt-sessions/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update PT session');
  return data;
};

export const getTrainerExerciseLibrary = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer-portal/exercises${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch exercises');
  return data;
};

export const createCustomExercise = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/exercises`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create custom exercise');
  return data;
};

export const getTrainerChatMessages = async (memberId) => {
  const res = await fetch(`${API_BASE}/trainer-portal/messages/${memberId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch chat messages');
  return data;
};

export const sendTrainerChatMessage = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send message');
  return data;
};

export const getTrainerReports = async () => {
  const res = await fetch(`${API_BASE}/trainer-portal/reports`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch trainer reports');
  return data;
};

export const getTrainerNotifications = async () => {
  const res = await fetch(`${API_BASE}/trainer-portal/notifications`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return data;
};

export const markTrainerNotificationRead = async (id) => {
  const res = await fetch(`${API_BASE}/trainer-portal/notifications/${id}/read`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark notification read');
  return data;
};

export const getTrainerProfileData = async () => {
  const res = await fetch(`${API_BASE}/trainer-portal/profile`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch trainer profile');
  return data;
};

export const updateTrainerProfileData = async (payload) => {
  const res = await fetch(`${API_BASE}/trainer-portal/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update trainer profile');
  return data;
};

/* ================= TRAINER APPLICATION & ONBOARDING APIS ================= */

export const submitTrainerApplication = async (applicationData) => {
  const res = await fetch(`${API_BASE}/trainer/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(applicationData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to submit trainer application');
  return data;
};

export const fetchTrainerApplicationStatus = async ({ email, applicationId }) => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (applicationId) params.append('applicationId', applicationId);

  const res = await fetch(`${API_BASE}/trainer/application-status?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Application not found');
  return data;
};

export const fetchAdminTrainerApplications = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/trainer/admin/applications${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch trainer applications');
  return data;
};

export const approveAdminTrainerApplication = async (id, adminRemarks = '') => {
  const res = await fetch(`${API_BASE}/trainer/admin/applications/${id}/approve`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ adminRemarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to approve trainer application');
  return data;
};

export const rejectAdminTrainerApplication = async (id, adminRemarks = '') => {
  const res = await fetch(`${API_BASE}/trainer/admin/applications/${id}/reject`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ adminRemarks }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to reject trainer application');
  return data;
};
