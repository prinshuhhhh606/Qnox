import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Check, Star, Shield, Crown, Sparkles, ArrowRight, HelpCircle, ChevronDown, ChevronUp, Lock, Zap, Clock } from 'lucide-react';
import { fetchMembershipPlans, startFreeTrial } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const defaultTiers = [
  {
    _id: 'plan_1',
    name: 'THE RESIDENT',
    code: 'RESIDENT',
    subtitle: 'Dedicated Single Sanctuary Access',
    description: 'Designed for high performers seeking absolute proximity and dedicated sanctuary access to their primary London neighborhood.',
    pricing: {
      monthly: 1200,
      quarterly: 4000,
      halfYearly: 7000,
      yearly: 12000,
    },
    benefits: [
      'Unlimited access to your chosen primary club',
      'Full access to 25m Natural Slate Pool & Thermal Spa',
      'Hypoxic altitude training room privileges',
      'Complimentary quarterly physiological health audit',
      '4 guest sanctuary day passes per quarter',
      'Bespoke towel & luxury organic grooming amenities',
    ],
    features: {
      accessType: 'Single Club',
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: false,
      valetParking: false,
      guestPassesPerQuarter: 4,
      priorityBookingDays: 7,
    },
    isPopular: false,
    tag: '',
  },
  {
    _id: 'plan_2',
    name: 'THE METROPOLITAN',
    code: 'METROPOLITAN',
    subtitle: 'London All-Sanctuary Access',
    description: 'Seamless athletic mobility. Unrestricted entry across Mayfair, Soho, Canary Wharf, Marylebone, and Chelsea clubs.',
    pricing: {
      monthly: 1800,
      quarterly: 4500,
      halfYearly: 7500,
      yearly: 12500,
    },
    benefits: [
      'Universal access to all 5 London QNOX sanctuaries',
      'Advance 10-day priority booking window for all masterclasses',
      'Full combat arena, reformer Pilates, and aquatics inclusion',
      'Bi-monthly 1-on-1 performance coaching review',
      '8 guest passes per quarter with full club privileges',
      'Exclusive member lounge & meeting suite access',
      'Complimentary overnight workout kit laundry service',
    ],
    features: {
      accessType: 'All 5 London Clubs',
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: false,
      guestPassesPerQuarter: 8,
      priorityBookingDays: 10,
    },
    isPopular: true,
    tag: 'MOST REQUESTED TIER',
  },
  {
    _id: 'plan_3',
    name: 'THE OBSIDIAN BLACK',
    code: 'OBSIDIAN',
    subtitle: 'Global Private Founder Tier (Strictly 150)',
    description: 'Strictly capped at 150 members globally. Unrivalled biometric personalization, private elevator access, and 24/7 concierge.',
    pricing: {
      monthly: 2500,
      quarterly: 5000,
      halfYearly: 8000,
      yearly: 13000,
    },
    benefits: [
      'Global all-access including upcoming NY & Dubai sanctuaries',
      '24/7 biometric private suite & penthouse training access',
      'Dedicated Senior Master Coach (4 private 1-on-1s / month)',
      'Unlimited Sub-Zero Cryotherapy & Hyperbaric oxygen pods',
      'Private valet parking & chauffeured transit within Mayfair',
      'Unlimited complimentary guest privileges with concierge host',
      'Direct WhatsApp hotline to Executive Concierge Desk',
    ],
    features: {
      accessType: 'Global All-Access + Penthouse',
      poolAccess: true,
      altitudeChamber: true,
      cryotherapy: true,
      valetParking: true,
      guestPassesPerQuarter: 99,
      priorityBookingDays: 30,
    },
    isPopular: false,
    tag: 'BY APPLICATION ONLY',
  },
];

const faqs = [
  {
    question: 'How does the QNOX membership admission process work?',
    answer: 'To preserve atmospheric solitude and prevent overcrowding, admissions are strictly limited by sanctuary capacity. Once you select your residency tier and complete your payment or application dossier, our Senior Concierge initiates biometric credentialing and welcomes you for a private physiological induction.',
  },
  {
    question: 'Can I use other London sanctuaries with my membership?',
    answer: 'The Metropolitan and Obsidian Black tiers include universal, unrestricted access across all 5 London clubs (Mayfair, Soho, Canary Wharf, Marylebone, and Chelsea). The Resident tier grants unlimited access to your chosen single home club with discounted guest privileges at secondary clubs.',
  },
  {
    question: 'What is the policy for membership renewal and freezing?',
    answer: 'Residencies operate on your chosen billing duration (monthly, quarterly, half-yearly, or yearly). You receive automated notifications at 7 days, 3 days, and 1 day prior to expiry. If you renew prior to expiry, your remaining days are preserved and extended seamlessly. Members may also freeze their membership for up to 60 days per calendar year for medical or international travel reasons via the Member Portal or Concierge Desk.',
  },
  {
    question: 'Are personal training sessions included?',
    answer: 'All memberships include an initial comprehensive physiological health audit and movement screen. The Obsidian Black tier includes 4 complimentary private 1-on-1 coaching sessions per month with a dedicated Senior Master Coach. Members can reserve additional 1-on-1 master coaching directly through their Member Portal.',
  },
  {
    question: 'How do guest passes and priority booking work?',
    answer: 'Guest passes are allocated quarterly in your Member Portal. You can invite guests for full club and hydrotherapy access. The Metropolitan tier enjoys a 10-day advance booking window for all masterclasses, while Obsidian Black enjoys an unrestricted 30-day window.',
  },
];

export default function MembershipPage(props) {
  const outletCtx = useOutletContext() || {};
  const navigate = useNavigate();
  const { currentUser, login } = useAuth();
  const { showToast } = useNotifications();

  const onOpenTourModal = props.onOpenTourModal || outletCtx.onOpenTourModal;
  const onOpenAuth = props.onOpenAuth || outletCtx.onOpenAuth;
  const onSelectPlanForCheckout = props.onSelectPlanForCheckout || outletCtx.onSelectPlanForCheckout;
  const [plans, setPlans] = useState(defaultTiers);
  const [duration, setDuration] = useState('monthly'); // 'monthly' | 'quarterly' | 'halfYearly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);
  const [trialLoading, setTrialLoading] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchMembershipPlans();
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (err) {
        console.warn('Using default membership tiers');
      }
    };
    loadPlans();
  }, []);

  // Determine trial eligibility
  const userTrial = currentUser?.trial;
  const isPaidMember = currentUser?.membership?.status === 'Active';
  const hasActiveTrial = userTrial?.status === 'Active' && userTrial?.endDate && new Date(userTrial.endDate) > new Date();
  const hasExpiredTrial = userTrial?.status === 'Expired' || (userTrial?.endDate && new Date(userTrial.endDate) <= new Date());
  const hasUsedTrial = userTrial?.hasUsedTrial || hasActiveTrial || hasExpiredTrial;
  const isTrialEligible = !isPaidMember && !hasUsedTrial;

  const handleStartTrial = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('member');
      showToast({ type: 'info', message: 'Please register or log in to activate your 3-Day Free Trial.' });
      return;
    }

    if (isPaidMember) {
      showToast({ type: 'info', message: 'You already hold an active residency membership.' });
      return;
    }

    if (hasUsedTrial) {
      showToast({ type: 'warning', message: 'You have already utilized your one-time 3-Day Free Trial.' });
      return;
    }

    setTrialLoading(true);
    try {
      const res = await startFreeTrial();
      showToast({ type: 'success', message: res.message || '3-Day Free Trial activated! Welcome to QNOX.' });
      // Redirect to customer dashboard
      navigate('/customer/dashboard');
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Failed to start free trial' });
    } finally {
      setTrialLoading(false);
    }
  };

  const durationOptions = [
    { key: 'monthly', label: 'MONTHLY', discount: null },
    { key: 'quarterly', label: 'QUARTERLY (3 MO)', discount: 'SAVE 6%' },
    { key: 'halfYearly', label: 'HALF-YEARLY (6 MO)', discount: 'SAVE 10%' },
    { key: 'yearly', label: 'YEARLY (12 MO)', discount: 'SAVE 15%' },
  ];

  const getTierPrice = (tier) => {
    if (tier.pricing && tier.pricing[duration]) {
      return `₹${tier.pricing[duration].toLocaleString('en-IN')}`;
    }
    return '₹1,200';
  };

  const getPeriodLabel = () => {
    if (duration === 'monthly') return 'per month';
    if (duration === 'quarterly') return 'per quarter (3 months)';
    if (duration === 'halfYearly') return 'per 6 months';
    if (duration === 'yearly') return 'per year (12 months)';
    return 'per billing cycle';
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10 text-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Membership Sanctuary"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
          <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block">
            SANCTUARY RESIDENCY &bull; STRICTLY CAPPED ADMISSIONS
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1]">
            Choose Your Membership.
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">
            An investment in uncompromising physical mastery, acoustic solitude, and world-class sports science. Select your residency duration and secure your sanctuary identity.
          </p>

          {/* 3-Day Free Trial VIP Callout Banner */}
          <div className="pt-4 max-w-xl mx-auto">
            {isTrialEligible && (
              <div className="p-6 bg-gradient-to-r from-[#121212] via-[#1a1713] to-[#121212] border border-[#c5a880]/50 rounded-sm shadow-2xl space-y-4">
                <div className="flex items-center justify-center space-x-2 text-[#c5a880]">
                  <Sparkles className="w-4 h-4 animate-spin text-[#c5a880]" />
                  <span className="text-xs font-mono tracking-widest uppercase font-bold">
                    EXCLUSIVE FIRST-TIME ADMISSION
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white font-normal">
                  Experience QNOX With a 3-Day Free Trial
                </h3>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  Enjoy unrestricted 72-hour sanctuary access, slate pool, thermal spa, and masterclass sessions without upfront payment.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleStartTrial}
                    disabled={trialLoading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#c5a880] hover:bg-white text-black font-mono text-xs font-bold uppercase tracking-widest transition duration-300 flex items-center justify-center space-x-2.5 mx-auto disabled:opacity-50"
                  >
                    {trialLoading ? (
                      <span>ACTIVATING VIP PASS...</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>START 3-DAY FREE TRIAL</span>
                      </>
                    )}
                  </button>
                  <span className="block text-[10px] text-neutral-400 font-mono mt-2">
                    72 Hours Complimentary Access &bull; No Credit Card Required &bull; Instant Activation
                  </span>
                </div>
              </div>
            )}

            {hasActiveTrial && (
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/60 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">
                      3-DAY FREE TRIAL ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-light">
                    Your 72-hour sanctuary privileges are currently running.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/customer/dashboard')}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-white text-black text-xs font-mono font-bold uppercase tracking-wider transition whitespace-nowrap"
                >
                  VIEW RESIDENCY DASHBOARD
                </button>
              </div>
            )}

            {hasExpiredTrial && !isPaidMember && (
              <div className="p-5 bg-amber-950/40 border border-amber-500/60 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold tracking-wider uppercase">
                      FREE TRIAL EXPIRED
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-light">
                    Your 3-day trial has concluded. Select an official residency tier below to maintain membership access.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest px-3 py-1 bg-amber-900/50 border border-amber-600">
                  UPGRADE BELOW
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Duration Selector Tabs */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="flex flex-col items-center mb-12">
          <span className="text-[10px] font-mono tracking-widest text-[#c5a880] uppercase mb-3">
            SELECT BILLING CYCLE
          </span>
          <div className="inline-flex p-1.5 bg-[#0a0a0a] border border-white/10 rounded-none flex-wrap justify-center gap-1">
            {durationOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDuration(opt.key)}
                className={`px-5 py-2.5 text-xs font-mono uppercase tracking-wider transition ${
                  duration === opt.key
                    ? 'bg-[#c5a880] text-black font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {opt.discount && (
                  <span className="ml-2 text-[9px] px-1.5 py-0.2 bg-black/40 text-[#050505] font-bold rounded">
                    {opt.discount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          {plans.map((tier) => {
            const isHighlight = tier.isPopular || tier.code === 'METROPOLITAN';
            return (
              <div
                key={tier.code || tier.name}
                className={`relative flex flex-col justify-between p-8 sm:p-10 transition-all duration-300 bg-[#090909] group hover:-translate-y-1.5 ${
                  isHighlight
                    ? 'border-2 border-[#c5a880] shadow-[0_0_30px_rgba(197,168,128,0.15)] hover:shadow-[0_0_45px_rgba(197,168,128,0.35)]'
                    : 'border border-white/10 hover:border-[#c5a880] hover:shadow-[0_0_35px_rgba(197,168,128,0.25)]'
                }`}
              >
                {/* Popular Tag Ribbon */}
                {isHighlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c5a880] text-black px-4 py-1 text-[9px] font-mono font-bold tracking-[0.25em] uppercase shadow-lg">
                    {tier.tag || 'RECOMMENDED MEMBERSHIP'}
                  </div>
                )}

                <div>
                  <span className="text-[10px] tracking-[0.25em] font-mono uppercase text-[#c5a880] block mb-2">
                    {tier.subtitle}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-4">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed mb-8">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="pb-8 mb-8 border-b border-white/10">
                    <div className="font-serif text-4xl sm:text-5xl text-white font-light mb-1">
                      {getTierPrice(tier)}
                    </div>
                    <span className="text-[11px] font-mono uppercase text-neutral-500 tracking-wider">
                      {getPeriodLabel()}
                    </span>
                  </div>

                  {/* Benefits Checklist */}
                  <div className="space-y-3 mb-8">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block">
                      PRIVILEGES INCLUDED
                    </span>
                    {tier.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs text-neutral-300 font-light">
                        <Check className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-6 border-t border-white/5 space-y-2">
                  <button
                    onClick={() => onSelectPlanForCheckout(tier, duration)}
                    className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${
                      isHighlight
                        ? 'bg-[#c5a880] hover:bg-white text-black shadow-lg'
                        : 'border border-white/20 group-hover:border-[#c5a880] group-hover:text-[#c5a880] hover:bg-[#c5a880] hover:!text-black text-white'
                    }`}
                  >
                    <span>JOIN NOW &bull; SELECT PLAN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenTourModal('', tier.name)}
                    className="w-full py-2 text-[10px] text-neutral-500 hover:text-neutral-300 uppercase tracking-widest font-mono text-center transition"
                  >
                    Request Walkthrough First
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Membership Privileges Comparison Table */}
        <div className="mb-24">
          <div className="border-b border-white/10 pb-6 mb-8 text-center sm:text-left">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
              SPECIFICATIONS MATRIX
            </span>
            <h3 className="font-serif text-3xl text-white">Compare Residency Privileges</h3>
          </div>

          <div className="border border-white/10 bg-[#090909] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0f0f0f] text-[10px] font-mono uppercase tracking-widest text-[#c5a880]">
                  <th className="p-4 sm:p-5">PRIVILEGE SPECIFICATION</th>
                  <th className="p-4 sm:p-5">THE RESIDENT</th>
                  <th className="p-4 sm:p-5 text-[#c5a880]">THE METROPOLITAN</th>
                  <th className="p-4 sm:p-5">THE OBSIDIAN BLACK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-neutral-300">
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Club Access Scope</td>
                  <td className="p-4 sm:p-5 text-neutral-400">Single Primary Club</td>
                  <td className="p-4 sm:p-5 text-[#c5a880] font-semibold">All 5 London Sanctuaries</td>
                  <td className="p-4 sm:p-5 text-white font-bold">Global + Private Penthouse</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">25m Natural Slate Pool</td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Hypoxic 3000 Altitude Suites</td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Sub-Zero Cryotherapy (-110°C)</td>
                  <td className="p-4 sm:p-5 text-neutral-600">&bull; Pay per session</td>
                  <td className="p-4 sm:p-5 text-[#c5a880]"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                  <td className="p-4 sm:p-5 text-white font-bold">Unlimited Cryo + HBOT</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Advance Class Booking Window</td>
                  <td className="p-4 sm:p-5 text-neutral-400">7 Days</td>
                  <td className="p-4 sm:p-5 text-[#c5a880]">10 Days Priority</td>
                  <td className="p-4 sm:p-5 text-white font-bold">30 Days Unrestricted</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Quarterly Guest Passes</td>
                  <td className="p-4 sm:p-5 text-neutral-400">4 Passes</td>
                  <td className="p-4 sm:p-5 text-[#c5a880]">8 Passes</td>
                  <td className="p-4 sm:p-5 text-white font-bold">Unlimited with Concierge</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-sans font-medium text-white">Chauffeured Valet Service</td>
                  <td className="p-4 sm:p-5 text-neutral-600">&times;</td>
                  <td className="p-4 sm:p-5 text-neutral-600">&times;</td>
                  <td className="p-4 sm:p-5"><Check className="w-4 h-4 text-[#c5a880]" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Membership FAQs */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
              CONCIERGE INQUIRIES
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-white">Frequently Asked Questions</h3>
          </div>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-6">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-serif text-lg text-white font-medium pr-4">
                    {faq.question}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#c5a880] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="mt-4 text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terms & Privacy Assurance */}
        <div className="border border-white/10 bg-[#080808] p-8 sm:p-10 text-xs text-neutral-500 font-light leading-relaxed space-y-3">
          <h5 className="font-mono text-neutral-300 text-xs uppercase tracking-widest font-semibold">
            TERMS & PRIVACY ASSURANCE
          </h5>
          <p>
            All memberships at QNOX GYM are subject to admission approval and active biometric credentialing. Membership renewal dates are calculated strictly in accordance with your chosen billing duration. Advance reminders are sent via secure transmission at 7 days, 3 days, and 1 day prior to term expiry. Pre-expiry renewals extend seamlessly from your current expiry date with no loss of remaining days.
          </p>
          <p>
            Payments are securely encrypted via Razorpay with 256-bit SSL encryption. Cancellations and freezes may be requested via your Member Portal up to 14 days before billing commencement.
          </p>
        </div>
      </section>
    </div>
  );
}
