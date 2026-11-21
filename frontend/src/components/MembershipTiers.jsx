import React from 'react';
import { Check, Star, Shield, Crown, Sparkles, ArrowRight } from 'lucide-react';
import './MembershipTiers.css';

const defaultTiers = [
  {
    name: 'THE RESIDENT',
    code: 'RESIDENT',
    subtitle: 'Dedicated Single Sanctuary Access',
    price: '₹1,200',
    period: 'per month',
    pricing: { monthly: 1200, quarterly: 4000, halfYearly: 7000, yearly: 12000 },
    description: 'Designed for high performers seeking absolute proximity and dedicated sanctuary access to their primary London neighbourhood.',
    features: [
      'Unlimited access to your chosen primary club',
      'Full access to 25m Natural Slate Pool & Thermal Spa',
      'Hypoxic altitude training room privileges',
      'Complimentary quarterly physiological health audit',
      '4 guest sanctuary day passes per quarter',
      'Bespoke towel & luxury organic grooming amenities'
    ],
    highlight: false,
    ctaText: 'APPLY FOR RESIDENCY',
  },
  {
    name: 'THE METROPOLITAN',
    code: 'METROPOLITAN',
    subtitle: 'London All-Sanctuary Access',
    price: '₹1,800',
    period: 'per month',
    pricing: { monthly: 1800, quarterly: 4500, halfYearly: 7500, yearly: 12500 },
    description: 'Seamless athletic mobility. Unrestricted entry across Mayfair, Soho, Canary Wharf, Marylebone, and Chelsea clubs.',
    features: [
      'Universal access to all 5 London QNOX sanctuaries',
      'Advance 10-day priority booking window for all masterclasses',
      'Full combat arena, reformer Pilates, and aquatics inclusion',
      'Bi-monthly 1-on-1 performance coaching review',
      '8 guest passes per quarter with full club privileges',
      'Exclusive member lounge & meeting suite access',
      'Complimentary overnight workout kit laundry service'
    ],
    highlight: true,
    tag: 'MOST REQUESTED TIER',
    ctaText: 'REQUEST METROPOLITAN PASS',
  },
  {
    name: 'THE OBSIDIAN BLACK',
    code: 'OBSIDIAN',
    subtitle: 'Global Private Founder Tier (Strictly 150)',
    price: '₹2,500',
    period: 'per month',
    pricing: { monthly: 2500, quarterly: 5000, halfYearly: 8000, yearly: 13000 },
    description: 'Strictly capped at 150 members globally. Unrivalled biometric personalization, private elevator access, and 24/7 concierge.',
    features: [
      'Global all-access including upcoming NY & Dubai sanctuaries',
      '24/7 biometric private suite & penthouse training access',
      'Dedicated Senior Master Coach (4 private 1-on-1s / month)',
      'Unlimited Sub-Zero Cryotherapy & Hyperbaric oxygen pods',
      'Private valet parking & chauffeured transit within Mayfair',
      'Unlimited complimentary guest privileges with concierge host',
      'Direct WhatsApp hotline to Executive Concierge Desk'
    ],
    highlight: false,
    tag: 'BY APPLICATION ONLY',
    ctaText: 'SUBMIT FOUNDER DOSSIER',
  }
];

export default function MembershipTiers({ plans = [], onOpenTourModal, onSelectPlanForCheckout }) {
  const displayTiers = plans && plans.length > 0 ? plans : defaultTiers;

  return (
    <section id="membership" className="qnox-membership-section">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-3">
            MEMBERSHIP PRIVILEGES
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-white mb-6">
            Invest in Your Highest Potential
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed">
            Membership at QNOX is intentionally selective to protect tranquility, space, and access to state-of-the-art conditioning equipment.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {displayTiers.map((tier) => {
            const isHighlight = tier.highlight || tier.isPopular;
            const displayPrice = tier.pricing?.monthly
              ? `₹${tier.pricing.monthly.toLocaleString('en-IN')}`
              : (tier.price || '₹1,200');

            return (
              <div
                key={tier.name}
                className={`qnox-tier-card ${isHighlight ? 'highlight' : ''}`}
              >
                {tier.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#c5a880] text-black text-[9px] font-sans font-bold tracking-[0.25em] uppercase shadow-md">
                    {tier.tag}
                  </div>
                )}

                <div>
                  <div className="border-b border-white/10 pb-6 mb-6">
                    <h3 className="font-serif text-2xl text-white tracking-wide mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-[#c5a880] tracking-widest uppercase font-medium">
                      {tier.subtitle}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline space-x-2 mb-6">
                    <span className="font-serif text-4xl sm:text-5xl font-light text-white">{displayPrice}</span>
                    <span className="text-xs text-neutral-400 tracking-wider uppercase">per month</span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed mb-8">
                    {tier.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-10">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 font-semibold">
                      INCLUDED SANCTUARY PRIVILEGES
                    </p>
                    <ul className="space-y-3">
                      {(tier.benefits || tier.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-neutral-300">
                          <Check className="w-4 h-4 text-[#c5a880] mt-0.5 shrink-0" />
                          <span className="font-light leading-snug">{typeof feat === 'string' ? feat : 'Complimentary sanctuary amenity'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <button
                    onClick={() => {
                      if (onSelectPlanForCheckout) {
                        onSelectPlanForCheckout(tier, 'monthly');
                      } else {
                        onOpenTourModal(tier.name);
                      }
                    }}
                    className={`qnox-tier-btn ${isHighlight ? 'primary' : 'secondary'}`}
                  >
                    <span>{tier.ctaText || 'JOIN THIS RESIDENCY'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Corporate & Private Residency Inquiry Note */}
        <div className="mt-16 p-8 border border-white/10 bg-[#090909] flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
          <div>
            <h4 className="font-serif text-xl text-white mb-1">Corporate & Diplomatic Partnership</h4>
            <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-xl">
              We curate custom bespoke wellness programs, private squad allocations, and executive retreats for premier enterprises and family offices.
            </p>
          </div>
          <button
            onClick={() => onOpenTourModal('Corporate Concierge')}
            className="px-6 py-3 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs tracking-[0.2em] uppercase font-semibold transition-colors whitespace-nowrap"
          >
            CONTACT CORPORATE DESK
          </button>
        </div>

      </div>
    </section>
  );
}
