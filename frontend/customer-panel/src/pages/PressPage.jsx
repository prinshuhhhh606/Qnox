import React, { useState } from 'react';
import { Quote, ArrowUpRight, Download, Mail, ExternalLink, Calendar, Newspaper, CheckCircle2 } from 'lucide-react';

const pressArticles = [
  {
    publication: 'BRITISH GQ',
    badge: 'COVER FEATURE',
    headline: 'Inside QNOX: The Ultra-Luxury Mayfair Club Redefining Modern Athleticism',
    date: 'OCTOBER 2026',
    thumbnail: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'QNOX GYM has bypassed standard commercial fitness tropes to build a subterranean cathedral of dark slate, hypoxic chambers, and Olympic rigor. London’s most discreet leaders have found their new sanctum.',
    author: 'Alexander Sterling, Luxury Lifestyle Editor',
    link: '#',
  },
  {
    publication: 'VOGUE UK',
    badge: 'WELLNESS ARCHITECTURE',
    headline: 'The Silence of Mayfair: Why London’s Elite Are Swapping Boutique Studios for QNOX',
    date: 'SEPTEMBER 2026',
    thumbnail: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'Between the ozone-filtered slate pool and natural cedar Allegro 2 reformer chambers, QNOX offers a rare oasis of complete acoustic solitude in the heart of the capital.',
    author: 'Clara Delacroix, Longevity & Architecture',
    link: '#',
  },
  {
    publication: 'FINANCIAL TIMES',
    badge: 'HOW TO SPEND IT',
    headline: 'Biohacking In Solitude: High-Altitude Training Meets Penthouse Luxury',
    date: 'AUGUST 2026',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'For London’s discerning founders and executives, QNOX represents an uncompromising investment in cellular adaptation, thermal recovery, and absolute privacy.',
    author: 'Edward Montgomery, FT Weekend',
    link: '#',
  },
  {
    publication: 'ARCHITECTURAL DIGEST',
    badge: 'DESIGN EXCELLENCE',
    headline: 'Brutalist Grandeur: How QNOX Transformed a London Basement Into a Sacred Temple',
    date: 'JULY 2026',
    thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'Monolithic charcoal granite, raw bronze fittings, and acoustic dampening panels that block the roar of city streets. A triumph of contemporary British spatial design.',
    author: 'Helena Berg, European Architecture Review',
    link: '#',
  },
  {
    publication: 'ROBB REPORT',
    badge: 'PRIVATE EDITIONS',
    headline: 'The Strictly Capped 150: Inside the Obsidian Black Founders Residency',
    date: 'JUNE 2026',
    thumbnail: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'Priced at ₹68,000 monthly, Obsidian Black includes 24/7 private elevator access, sub-zero cryotherapy pods, and chauffeured transit. A benchmark for private global health residencies.',
    author: 'Marcus Aurelius Vance, Private Wealth Editor',
    link: '#',
  },
  {
    publication: 'WALLPAPER* MAGAZINE',
    badge: 'SPATIAL CRAFT',
    headline: 'Acoustic Solitude: The Sound Engineering Behind QNOX Sanctuaries',
    date: 'MAY 2026',
    thumbnail: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1200&auto=format&fit=crop',
    excerpt: 'By combining tuned Helmholtz resonators with 432Hz ambient soundscapes, QNOX ensures heavy deadlifts and hydro-massage cannons coexist in harmonious silence.',
    author: 'Tobias Hanz, Acoustics & Craft',
    link: '#',
  },
];

const brandAnnouncements = [
  {
    date: '20 NOV 2026',
    category: 'GLOBAL EXPANSION',
    title: 'QNOX Announces 2027 Expansion into Manhattan & Dubai Financial Centre',
    detail: 'Following unprecedented demand in London, QNOX announces two new flagship sanctuaries in Tribeca (New York) and DIFC (Dubai). Existing Obsidian Black members receive reciprocal global access upon opening.',
  },
  {
    date: '04 OCT 2026',
    category: 'SPORTS SCIENCE PARTNERSHIP',
    title: 'Hypoxic 3000 Altitude Research Initiative with Loughborough University',
    detail: 'QNOX establishes an ongoing physiological research fellowship studying intermittent hypoxic conditioning and red blood cell adaptation in non-elite high performers.',
  },
  {
    date: '15 AUG 2026',
    category: 'FACILITIES INNOVATION',
    title: 'Launch of Sub-Zero Walk-in Electric Cryotherapy Lab at Canary Wharf',
    detail: 'Replacing traditional liquid nitrogen tanks with ultra-pure electric refrigeration at -110°C, providing the safest and most physiologically effective whole-body cold exposure in the UK.',
  },
];

export default function PressPage({ onOpenTourModal }) {
  const [pressInquirySubmitted, setPressInquirySubmitted] = useState(false);
  const [mediaKitDownloaded, setMediaKitDownloaded] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Hero Header */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10 text-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Press & Journal"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-black/30" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
          <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block">
            THE EDITORIAL JOURNAL &bull; CRITICAL ACCLAIM
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1]">
            QNOX In The Spotlight.
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">
            Editorial reviews, design accolades, and architectural dispatches documenting the evolution of London’s most uncompromising luxury fitness sanctuary.
          </p>
        </div>
      </section>

      {/* Featured Press Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="border-b border-white/10 pb-6 mb-12 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
              SELECTED PUBLICATIONS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white">Media Coverage & Reviews</h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            GQ &bull; VOGUE &bull; FINANCIAL TIMES &bull; AD &bull; ROBB REPORT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {pressArticles.map((article, idx) => (
            <div
              key={idx}
              className="group bg-[#090909] border border-white/10 hover:border-[#c5a880]/60 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={article.thumbnail}
                    alt={article.headline}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/85 px-2.5 py-1 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-[#c5a880] font-bold">
                    {article.badge}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/85 px-2.5 py-1 text-[9px] font-mono uppercase text-neutral-400">
                    {article.date}
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6 sm:p-7 space-y-4">
                  <span className="text-xs font-mono tracking-[0.25em] uppercase text-[#c5a880] font-bold block">
                    {article.publication}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-medium leading-snug group-hover:text-[#c5a880] transition-colors">
                    {article.headline}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    &quot;{article.excerpt}&quot;
                  </p>
                </div>
              </div>

              {/* Author & Read Action */}
              <div className="p-6 sm:p-7 pt-0 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-neutral-500 truncate max-w-[160px]">
                  {article.author}
                </span>
                <button
                  onClick={() => onOpenTourModal()}
                  className="text-[#c5a880] hover:text-white uppercase tracking-wider flex items-center space-x-1 transition"
                >
                  <span>READ ESSAY</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Dispatches & Announcements */}
        <div className="mb-24">
          <div className="border-b border-white/10 pb-6 mb-8">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#c5a880] uppercase block mb-1">
              OFFICIAL ARCHIVE
            </span>
            <h3 className="font-serif text-3xl text-white">Brand Announcements & Releases</h3>
          </div>

          <div className="space-y-4">
            {brandAnnouncements.map((ann, idx) => (
              <div
                key={idx}
                className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/30 transition"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-[9px] px-2 py-0.5 bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880] font-bold uppercase">
                      {ann.category}
                    </span>
                    <span className="text-neutral-500">{ann.date}</span>
                  </div>
                  <h4 className="font-serif text-xl sm:text-2xl text-white font-medium">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    {ann.detail}
                  </p>
                </div>

                <button
                  onClick={() => onOpenTourModal()}
                  className="px-5 py-2.5 border border-white/20 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition shrink-0 self-start md:self-center"
                >
                  PRESS DETAILS
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Media Kit & Journalist Inquiry Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Media Kit Download Box */}
          <div className="lg:col-span-5 bg-[#090909] border border-white/10 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block mb-2">
                OFFICIAL PRESS ASSETS
              </span>
              <h4 className="font-serif text-2xl text-white font-normal mb-3">
                Download QNOX Media Kit
              </h4>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Includes high-resolution architectural photography of Mayfair, Soho and Canary Wharf sanctuaries, executive founder bios, brand vector marks, and factual fact-sheet.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setMediaKitDownloaded(true)}
                className="w-full py-3.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{mediaKitDownloaded ? 'MEDIA KIT PREPARED &bull; ZIP' : 'DOWNLOAD MEDIA KIT (68MB)'}</span>
              </button>
              {mediaKitDownloaded && (
                <span className="text-[10px] font-mono text-emerald-400 block text-center">
                  Press package link transmitted to your browser.
                </span>
              )}
            </div>
          </div>

          {/* Media Enquiry Contact Form */}
          <div className="lg:col-span-7 bg-[#090909] border border-white/10 p-8 sm:p-10 space-y-6">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#c5a880] block mb-2">
                EDITORIAL RELATIONS
              </span>
              <h4 className="font-serif text-2xl text-white font-normal mb-1">
                Media & Interview Enquiries
              </h4>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                For filming permissions, executive interview requests, or private walkthrough access for accredited publications.
              </p>
            </div>

            {pressInquirySubmitted ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-6 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <h5 className="font-serif text-lg text-white">Editorial Dispatch Confirmed</h5>
                <p className="text-xs text-neutral-400">
                  Our Senior Communications Officer will respond to your publication within 4 business hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPressInquirySubmitted(true);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Journalist / Editor Name"
                    className="bg-[#121212] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none placeholder-neutral-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Publication / Media House"
                    className="bg-[#121212] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none placeholder-neutral-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Editorial Work Email"
                    className="bg-[#121212] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none placeholder-neutral-500"
                  />
                  <input
                    type="tel"
                    placeholder="Direct Phone / WhatsApp"
                    className="bg-[#121212] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none placeholder-neutral-500"
                  />
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Enquiry synopsis or publication coverage angle..."
                  className="w-full bg-[#121212] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none placeholder-neutral-500"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition"
                >
                  TRANSMIT EDITORIAL INQUIRY
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
