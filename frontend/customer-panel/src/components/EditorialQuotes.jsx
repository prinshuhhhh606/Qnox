import React from 'react';
import { Quote } from 'lucide-react';
import './EditorialQuotes.css';

const pressReviews = [
  {
    publication: 'BRITISH GQ',
    quote: 'QNOX GYM has redefined what luxury fitness means in London. The balance of brutalist architecture and Olympic-standard sports science makes it the undisputed benchmark.',
    author: 'Luxury & Lifestyle Editor'
  },
  {
    publication: 'VOGUE UK',
    quote: 'The ozone-filtered slate pool and natural cedar reformer rooms offer a rare oasis of complete acoustic silence in the heart of Mayfair.',
    author: 'Wellness & Longevity Review'
  },
  {
    publication: 'FINANCIAL TIMES',
    quote: 'For London’s discerning leaders, QNOX represents an investment in biohacking, recovery, and quiet privacy that standard commercial gyms cannot conceive.',
    author: 'How to Spend It'
  }
];

export default function EditorialQuotes() {
  return (
    <section id="press" className="py-24 bg-[#050505] border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        
        <div className="text-center mb-16">
          <span className="text-[11px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-2">
            CRITICAL ACCLAIM & EDITORIAL REVIEWS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal">
            The Journal & Press
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pressReviews.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#090909] border border-white/10 p-8 sm:p-10 flex flex-col justify-between hover:border-[#c5a880]/40 transition-colors"
            >
              <div>
                <Quote className="w-8 h-8 text-[#c5a880]/40 mb-6" />
                <p className="font-serif text-lg sm:text-xl text-neutral-200 leading-relaxed italic mb-8">
                  "{item.quote}"
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <span className="text-xs font-sans tracking-[0.25em] uppercase text-[#c5a880] font-bold block mb-1">
                  {item.publication}
                </span>
                <span className="text-[11px] text-neutral-500 tracking-wider uppercase">
                  {item.author}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Global Brand Manifesto Ticker */}
        <div className="mt-20 py-8 border-y border-white/10 overflow-hidden relative">
          <div className="flex space-x-12 animate-marquee whitespace-nowrap text-xs sm:text-sm font-sans tracking-[0.35em] uppercase text-neutral-400">
            <span>MAYFAIR SANCTUARY</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>TRAINING FOR LIFE</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>SOHO FOUNDRY</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>HYPOXIC 3000M</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>CANARY WHARF HORIZON</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>25M SLATE POOL</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>OBSIDIAN TOWER FLAGSHIP</span>
            <span className="text-[#c5a880]">&bull;</span>
            <span>ARCHITECTURAL SOLITUDE</span>
          </div>
        </div>

      </div>
    </section>
  );
}
