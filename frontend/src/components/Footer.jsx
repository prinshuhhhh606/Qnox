import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Shield, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';
import { subscribeNewsletter } from '../services/api';
import './Footer.css';

export default function Footer({ onOpenTourModal }) {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setStatusMsg('');

    try {
      const res = await subscribeNewsletter(email);
      setStatusMsg(res.message || 'Admitted to the QNOX Inner Circle.');
      setEmail('');
    } catch (err) {
      setStatusMsg('Welcome to the QNOX Inner Circle.');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#030303] text-white border-t border-white/10 pt-20 pb-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#c5a880]/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        
        {/* Top Newsletter & Brand Ethos Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10 items-end">
          
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10px] tracking-[0.35em] uppercase text-[#c5a880] font-semibold block">
              TRAINING FOR LIFE &bull; LONDON &bull; NEW YORK &bull; DUBAI
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-tight">
              An ecosystem crafted for physical mastery and architectural peace.
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm font-light max-w-xl">
              Receive private invitations to guest masterclasses, longevity research briefings, and early registration for new sanctuary openings.
            </p>
          </div>

          {/* Newsletter Form */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubscribe} className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 block font-medium">
                JOIN THE INNER CIRCLE
              </label>
              
              <div className="flex border border-white/20 focus-within:border-[#c5a880] transition-colors bg-[#0a0a0a]">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your private email..."
                  className="w-full bg-transparent px-4 py-3.5 text-xs text-white focus:outline-none placeholder-neutral-600 font-sans tracking-wider"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 bg-[#c5a880] hover:bg-white text-black transition-colors flex items-center justify-center shrink-0"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {statusMsg && (
                <p className="text-xs text-[#c5a880] flex items-center space-x-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{statusMsg}</span>
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 py-16 border-b border-white/10 text-xs">
          
          {/* Column 1: The Clubs */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#c5a880]">
              THE CLUBS
            </h4>
            <ul className="space-y-2.5 text-neutral-400 font-light">
              <li><a href="#clubs" className="hover:text-white transition-colors">Mayfair Sanctuary</a></li>
              <li><a href="#clubs" className="hover:text-white transition-colors">Soho Foundry</a></li>
              <li><a href="#clubs" className="hover:text-white transition-colors">Canary Wharf Horizon</a></li>
              <li><a href="#clubs" className="hover:text-white transition-colors">Marylebone Mews</a></li>
              <li><a href="#clubs" className="hover:text-white transition-colors">Chelsea Waterfront</a></li>
              <li><a href="#clubs" className="hover:text-white transition-colors text-[#c5a880]/80">Obsidian Tower (Private)</a></li>
            </ul>
          </div>

          {/* Column 2: Spaces */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#c5a880]">
              SANCTUARIES
            </h4>
            <ul className="space-y-2.5 text-neutral-400 font-light">
              <li><a href="#disciplines" className="hover:text-white transition-colors">The Aquatics (25m Slate)</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">Hypoxic 3000 Altitude</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">The Combat Ring & Rig</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">Allegro 2 Reformer</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">-110°C Cryo Lab</a></li>
              <li><a href="#disciplines" className="hover:text-white transition-colors">Contrast Plunge Pools</a></li>
            </ul>
          </div>

          {/* Column 3: Membership */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#c5a880]">
              MEMBERSHIP
            </h4>
            <ul className="space-y-2.5 text-neutral-400 font-light">
              <li><a href="#membership" className="hover:text-white transition-colors">The Resident Tier</a></li>
              <li><a href="#membership" className="hover:text-white transition-colors">The Metropolitan Pass</a></li>
              <li><a href="#membership" className="hover:text-white transition-colors">The Obsidian Black (150)</a></li>
              <li><a href="#timetable" className="hover:text-white transition-colors">Masterclass Timetable</a></li>
              <li><button onClick={() => onOpenTourModal()} className="hover:text-[#c5a880] transition-colors text-left">Schedule Private Tour</button></li>
              <li><button onClick={() => onOpenTourModal('Corporate Concierge')} className="hover:text-white transition-colors text-left">Corporate Accounts</button></li>
            </ul>
          </div>

          {/* Column 4: Practitioners & Journal */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#c5a880]">
              THE ARCHIVE
            </h4>
            <ul className="space-y-2.5 text-neutral-400 font-light">
              <li><a href="#trainers" className="hover:text-white transition-colors">Master Practitioners</a></li>
              <li><a href="#press" className="hover:text-white transition-colors">Press & Critical Reviews</a></li>
              <li><a href="#" className="hover:text-white transition-colors">The Longevity Journal</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Architectural Blueprints</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers at QNOX</a></li>
            </ul>
          </div>

          {/* Column 5: Concierge Desk */}
          <div className="space-y-4 col-span-2 sm:col-span-1">
            <h4 className="text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-[#c5a880]">
              CONCIERGE DESK
            </h4>
            <p className="text-neutral-400 text-xs font-light leading-relaxed">
              Mayfair Executive Suite<br />
              18 Grosvenor Street<br />
              London W1K 4QQ
            </p>
            <p className="text-neutral-400 text-xs font-mono">
              +44 (0) 20 7946 0992
            </p>
            <p className="text-[#c5a880] text-xs font-mono">
              concierge@qnoxgym.com
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.openAdminLogin) {
                    window.openAdminLogin();
                  }
                }}
                className="text-[10px] tracking-widest uppercase text-neutral-500 hover:text-[#c5a880] transition-colors underline underline-offset-4 flex items-center space-x-1"
              >
                <Shield className="w-3 h-3 text-[#c5a880]" />
                <span>EXECUTIVE ADMIN PORTAL</span>
              </button>
            </div>
          </div>

        </div>

        {/* Massive Authentic Third Space Typography Hallmark - Always Perfectly Horizontal */}
        <div className="qnox-watermark-container">
          <span className="qnox-watermark-title">
            QNOX GYM
          </span>
        </div>

        {/* Micro Footer: Status, Socials, Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-neutral-500 tracking-wider space-y-4 md:space-y-0 border-t border-white/5 pt-8">
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-neutral-400 font-medium uppercase tracking-widest text-[10px]">
              ALL 6 LONDON SANCTUARIES OPERATIONAL &bull; 100% NOMINAL
            </span>
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-6 text-neutral-400">
            <a href="#" className="hover:text-[#c5a880] transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-[#c5a880] transition-colors" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-[#c5a880] transition-colors" aria-label="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-[#c5a880] transition-colors" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
          </div>

          {/* Legal statement */}
          <div className="flex flex-wrap items-center justify-center space-x-4 text-[10px] uppercase text-neutral-600">
            <span>&copy; {new Date().getFullYear()} QNOX GYM LTD.</span>
            <span>&bull;</span>
            <a href="#" className="hover:text-neutral-400">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-neutral-400">Terms of Sanctuary</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-neutral-400">Cookie Protocol</a>
          </div>

        </div>

      </div>
    </footer>
  );
}
