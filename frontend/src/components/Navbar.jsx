import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, User, Shield, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ onOpenTourModal, currentUser, onOpenAuth, onOpenMemberPortal, onOpenAdmin, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'CLUBS', href: '#clubs' },
    { label: 'SANCTUARIES', href: '#disciplines' },
    { label: 'MEMBERSHIP', href: '#membership' },
    { label: 'TIMETABLE', href: '#timetable' },
    { label: 'TRAINERS', href: '#trainers' },
    { label: 'PRESS', href: '#press' },
  ];

  const isAdmin = currentUser && ['Admin', 'Super Admin'].includes(currentUser.role);

  return (
    <>
      {/* Top VIP Announcement Bar (Third Space Editorial Style) */}
      <div className="qnox-vip-ticker">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880] animate-pulse"></span>
        <span>PRIVATE ACCESS: MAYFAIR & OBSIDIAN TOWER SLOTS NOW RESERVING &bull; 2026/2027 SANCTUARY RESIDENCY</span>
        <button 
          onClick={() => onOpenTourModal('QNOX Mayfair Sanctuary')}
          className="hidden sm:inline-flex items-center text-[#c5a880] hover:text-white underline underline-offset-4 ml-2 transition-colors cursor-pointer"
        >
          REQUEST TOUR <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Main Floating Glass Navbar */}
      <header
        className={`qnox-navbar ${scrolled ? 'scrolled' : 'unscrolled'}`}
        style={{ top: scrolled ? 0 : '33px' }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand Mark - Unbreakable single-line luxury mark */}
          <a href="#" className="qnox-brand-container group focus:outline-none">
            <span className="qnox-brand-mark text-xl sm:text-2xl">
              QNOX
            </span>
            <span className="qnox-brand-sub">
              LUXURY GYM
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-3.5 xl:space-x-6 2xl:space-x-7 flex-shrink">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="qnox-nav-link whitespace-nowrap text-[10px] xl:text-[11px]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 bg-[#121212] border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-all text-[11px] font-semibold tracking-wider uppercase flex items-center space-x-1.5 whitespace-nowrap flex-shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-[#c5a880] flex-shrink-0" />
                <span>ADMIN SUITE</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  onClick={onOpenMemberPortal}
                  className="px-3.5 py-2 bg-transparent border border-white/20 hover:border-white text-white text-[11px] font-semibold tracking-wider uppercase flex items-center space-x-1.5 transition-colors whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5 text-[#c5a880] flex-shrink-0" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 border border-white/10 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-2 border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white text-[11px] font-medium tracking-wider uppercase transition-colors whitespace-nowrap flex-shrink-0"
              >
                SIGN IN
              </button>
            )}

            <button
              onClick={() => onOpenTourModal()}
              className="qnox-nav-btn whitespace-nowrap flex-shrink-0"
            >
              <span>BOOK A TOUR</span>
              <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-[#c5a880] transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Full-Screen Luxury Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 bg-[#050505] z-50 flex flex-col justify-between p-8 md:p-12 transition-all duration-700 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-[-100%]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex flex-col flex-shrink-0">
            <span className="font-serif text-2xl font-bold tracking-[0.32em] text-white whitespace-nowrap">QNOX</span>
            <span className="text-[9px] tracking-[0.38em] text-[#c5a880] font-sans uppercase whitespace-nowrap -mt-0.5">LUXURY SANCTUARY</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white hover:text-[#c5a880] transition-colors border border-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col space-y-6 my-auto">
          {navLinks.map((link, idx) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-serif text-neutral-300 hover:text-[#c5a880] tracking-[0.15em] transition-colors flex items-center justify-between group"
            >
              <span>{link.label}</span>
              <span className="text-xs font-sans tracking-widest text-neutral-600 group-hover:text-[#c5a880]">0{idx + 1}</span>
            </a>
          ))}
          {isAdmin && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
              className="text-left text-xl font-serif text-[#c5a880] tracking-wider"
            >
              ADMIN DASHBOARD
            </button>
          )}
        </nav>

        <div className="border-t border-white/10 pt-6 space-y-3">
          {currentUser ? (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenMemberPortal(); }}
              className="w-full py-3.5 bg-white text-black text-center text-xs font-bold tracking-[0.25em] uppercase"
            >
              MY MEMBER PORTAL
            </button>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
              className="w-full py-3.5 border border-[#c5a880] text-[#c5a880] text-center text-xs font-bold tracking-[0.25em] uppercase"
            >
              SIGN IN / REGISTER
            </button>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTourModal();
            }}
            className="w-full py-3.5 bg-[#c5a880] text-black text-center text-xs font-bold tracking-[0.25em] uppercase hover:bg-white transition-colors"
          >
            SCHEDULE PRIVATE TOUR
          </button>
        </div>
      </div>
    </>
  );
}
