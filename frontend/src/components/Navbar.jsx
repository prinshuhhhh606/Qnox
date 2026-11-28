import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, ArrowUpRight, User, Shield, LogOut, Bell,
  ChevronDown, Building2, UserCheck, Sparkles, Newspaper, Dumbbell
} from 'lucide-react';
import { fetchNotificationUnreadCount } from '../services/api';
import './Navbar.css';

export default function Navbar({
  onOpenTourModal,
  currentUser,
  onOpenAuth,
  onOpenMemberPortal,
  onOpenAdmin,
  onLogout,
  onOpenGymOwnerRegister
}) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Desktop Dropdown States
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);

  // Mobile Collapsible States
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [mobileOwnerOpen, setMobileOwnerOpen] = useState(false);

  // Refs for click outside detection
  const moreDropdownRef = useRef(null);
  const ownerDropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUnread();
      const interval = setInterval(loadUnread, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [currentUser]);

  // Close dropdowns on route changes
  useEffect(() => {
    setMoreDropdownOpen(false);
    setOwnerDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target)) {
        setMoreDropdownOpen(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target)) {
        setOwnerDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMoreDropdownOpen(false);
        setOwnerDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loadUnread = async () => {
    try {
      const count = await fetchNotificationUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      // Non-blocking
    }
  };

  // Center primary navigation links
  const centerLinks = [
    { label: 'Clubs', path: '/clubs' },
    { label: 'Sanctuaries', path: '/sanctuaries' },
    { label: 'Membership', path: '/membership' },
    { label: 'Timetable', path: '/timetable' },
    { label: 'Trainers', path: '/trainers' },
  ];

  // Secondary "More" links
  const moreLinks = [
    { label: 'Join as Trainer', path: '/join-as-trainer', icon: Dumbbell, desc: 'Apply to join our elite master coach roster' },
    { label: 'Press', path: '/press', icon: Newspaper, desc: 'Global architecture, awards & editorials' },
  ];

  const isAdmin = currentUser && ['Admin', 'Super Admin'].includes(currentUser.role);
  const isTrainer = currentUser?.role === 'Trainer';
  const isGymOwner = currentUser && ['Gym Owner', 'Company Admin'].includes(currentUser.role);

  const isMoreActive = location.pathname === '/join-as-trainer' || location.pathname === '/press';

  return (
    <>
      {/* Top VIP Announcement Bar (Third Space Luxury Editorial Style) */}
      <div className="qnox-vip-ticker">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c5a880] animate-pulse"></span>
        <span>PRIVATE ACCESS: MAYFAIR & OBSIDIAN TOWER SLOTS NOW RESERVING &bull; 2026/2027 SANCTUARY RESIDENCY</span>
        <button
          onClick={() => onOpenTourModal && onOpenTourModal('QNOX Mayfair Sanctuary')}
          className="hidden sm:inline-flex items-center text-[#c5a880] hover:text-white underline underline-offset-4 ml-2 transition-colors cursor-pointer font-medium"
        >
          REQUEST TOUR <ArrowUpRight className="w-3 h-3 ml-0.5" />
        </button>
      </div>

      {/* Main Luxury Floating Glass Navbar */}
      <header
        className={`qnox-navbar ${scrolled ? 'scrolled' : 'unscrolled'}`}
        style={{ top: scrolled ? 0 : '33px' }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">

          {/* ==================================================== */}
          {/* LEFT: QNOX Luxury Gym Logo                          */}
          {/* ==================================================== */}
          <Link to="/" className="qnox-brand-container group focus:outline-none" aria-label="QNOX Luxury Gym Home">
            <span className="qnox-brand-mark text-xl sm:text-2xl">
              QNOX
            </span>
            <span className="qnox-brand-sub">
              LUXURY GYM
            </span>
          </Link>

          {/* ==================================================== */}
          {/* CENTER: Clubs, Sanctuaries, Membership, Timetable,   */}
          {/* Trainers, More (with Dropdown)                       */}
          {/* ==================================================== */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-shrink-0" aria-label="Primary Navigation">
            {centerLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `qnox-nav-link text-[11px] xl:text-[12px] tracking-[0.16em] uppercase pb-1 border-b-2 transition-all font-medium ${
                    isActive
                      ? 'text-[#c5a880] border-[#c5a880] font-semibold'
                      : 'border-transparent text-neutral-300 hover:text-white hover:border-[#c5a880]/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* "More" Dropdown Menu */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setMoreDropdownOpen(!moreDropdownOpen);
                  setOwnerDropdownOpen(false);
                }}
                className={`qnox-nav-link text-[11px] xl:text-[12px] tracking-[0.16em] uppercase pb-1 border-b-2 transition-all font-medium flex items-center space-x-1 cursor-pointer ${
                  moreDropdownOpen || isMoreActive
                    ? 'text-[#c5a880] border-[#c5a880] font-semibold'
                    : 'border-transparent text-neutral-300 hover:text-white hover:border-[#c5a880]/50'
                }`}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? 'rotate-180 text-[#c5a880]' : 'text-neutral-400'
                  }`}
                />
              </button>

              {/* More Dropdown Panel */}
              {moreDropdownOpen && (
                <div className="qnox-dropdown-menu absolute left-0 mt-3 w-64 bg-[#0a0a0a]/95 border border-[#c5a880]/30 backdrop-blur-2xl shadow-2xl p-2 z-50">
                  <div className="text-[9px] font-mono tracking-widest text-[#c5a880] uppercase px-3 py-1.5 border-b border-white/5 font-semibold">
                    DISCOVER & EXPAND
                  </div>
                  <div className="py-1">
                    {moreLinks.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.path}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-start space-x-3 px-3 py-2.5 transition-colors rounded ${
                            isActive
                              ? 'bg-[#c5a880]/15 text-[#c5a880]'
                              : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                          }`
                        }
                      >
                        <item.icon className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-serif font-medium tracking-wide">{item.label}</div>
                          <div className="text-[10px] text-neutral-500 font-mono leading-tight mt-0.5">{item.desc}</div>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ==================================================== */}
          {/* RIGHT: 1. FOR GYM OWNERS (Dropdown)               */}
          {/*        2. SIGN IN (Direct Link)                      */}
          {/* ==================================================== */}
          <div className="hidden sm:flex items-center space-x-3 flex-shrink-0">
            
            {/* Authenticated State Badges (if logged in) */}
            {currentUser ? (
              <div className="flex items-center space-x-2 flex-shrink-0">
                {isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="px-3 py-1.5 bg-[#121212] border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-all text-[11px] font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#c5a880] flex-shrink-0" />
                    <span>ADMIN SUITE</span>
                  </button>
                )}

                {isTrainer && (
                  <button
                    onClick={() => {
                      window.location.hash = '#trainer';
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-[#121212] border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-all text-[11px] font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#c5a880] flex-shrink-0" />
                    <span>COACH PORTAL</span>
                  </button>
                )}

                {isGymOwner && (
                  <a
                    href="/gym-owner"
                    className="px-3 py-1.5 bg-[#121212] border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black transition-all text-[11px] font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_15px_rgba(197,168,128,0.2)]"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#c5a880] flex-shrink-0" />
                    <span>GYM COMMAND</span>
                  </a>
                )}

                {/* Notifications Bell */}
                <button
                  onClick={isAdmin ? onOpenAdmin : onOpenMemberPortal}
                  className="relative p-2 border border-white/20 hover:border-[#c5a880] text-neutral-300 hover:text-white transition-colors"
                  title="Notifications & Alerts"
                >
                  <Bell className="w-3.5 h-3.5 text-[#c5a880]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[8px] font-bold bg-rose-600 text-white rounded-full animate-pulse shadow">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Name */}
                <button
                  onClick={isGymOwner ? () => { window.location.href = '/gym-owner'; } : (isAdmin ? onOpenAdmin : onOpenMemberPortal)}
                  className="px-3.5 py-1.5 bg-transparent border border-white/20 hover:border-white text-white text-[11px] font-mono font-medium tracking-wider uppercase flex items-center space-x-1.5 transition-colors whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5 text-[#c5a880]" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Non-Logged In State (Follows EXACT requested structure) */
              <div className="flex items-center space-x-3 flex-shrink-0">
                
                {/* 1. FOR GYM OWNERS (Dropdown with downward chevron) */}
                <div className="relative" ref={ownerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerDropdownOpen(!ownerDropdownOpen);
                      setMoreDropdownOpen(false);
                    }}
                    className="qnox-owner-signup-btn px-4 py-2 border border-[#c5a880]/70 bg-[#c5a880]/10 hover:bg-[#c5a880] hover:text-black text-[#c5a880] text-[11px] font-mono tracking-wider uppercase font-semibold flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(197,168,128,0.12)] cursor-pointer"
                    aria-expanded={ownerDropdownOpen}
                    aria-haspopup="true"
                  >
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="tracking-[0.12em]">FOR GYM OWNERS</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        ownerDropdownOpen ? 'rotate-180 text-black' : 'text-[#c5a880]'
                      }`}
                    />
                  </button>

                  {/* Gym Owner Signup Dropdown Options */}
                  {ownerDropdownOpen && (
                    <div className="qnox-dropdown-menu absolute right-0 mt-3 w-72 bg-[#0a0a0a]/95 border border-[#c5a880]/40 backdrop-blur-2xl shadow-2xl p-2 z-50">
                      <div className="text-[9px] font-mono tracking-widest text-[#c5a880] uppercase px-3 py-1.5 border-b border-white/5 font-semibold">
                        B2B PARTNERSHIP PORTAL
                      </div>
                      <div className="py-1 space-y-1">
                        {/* Option 1: Register as Gym Owner */}
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerDropdownOpen(false);
                            if (onOpenGymOwnerRegister) onOpenGymOwnerRegister();
                          }}
                          className="w-full text-left flex items-start space-x-3 px-3 py-2.5 hover:bg-white/[0.04] text-neutral-300 hover:text-white rounded transition-colors group cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-serif font-medium tracking-wide text-white group-hover:text-[#c5a880] transition-colors">
                              Register as Gym Owner
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono leading-tight mt-0.5">
                              Submit facility dossier for Super Admin pre-approval
                            </div>
                          </div>
                        </button>

                        {/* Option 2: Gym Owner Login */}
                        <button
                          type="button"
                          onClick={() => {
                            setOwnerDropdownOpen(false);
                            if (onOpenAuth) onOpenAuth('owner');
                          }}
                          className="w-full text-left flex items-start space-x-3 px-3 py-2.5 hover:bg-white/[0.04] text-neutral-300 hover:text-white rounded transition-colors group cursor-pointer border-t border-white/5"
                        >
                          <Shield className="w-4 h-4 text-[#c5a880] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="text-xs font-serif font-medium tracking-wide text-white group-hover:text-[#c5a880] transition-colors">
                              Gym Owner Login
                            </div>
                            <div className="text-[10px] text-neutral-500 font-mono leading-tight mt-0.5">
                              Access your multi-branch sanctuary command center
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. SIGN IN (Separate, Directly Accessible, No Dropdown) */}
                <button
                  type="button"
                  onClick={() => onOpenAuth && onOpenAuth('member')}
                  className="qnox-customer-signin-btn px-4 py-2 border border-white/20 hover:border-white text-neutral-200 hover:text-white text-[11px] font-mono tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5"
                  title="Member Access"
                >
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="tracking-[0.12em]">SIGN IN</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-[#c5a880] transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* MOBILE DRAWER NAVIGATION                             */}
      {/* ==================================================== */}
      <div
        className={`fixed inset-0 z-40 bg-[#070707]/98 backdrop-blur-2xl transition-all duration-300 lg:hidden flex flex-col justify-between p-6 sm:p-10 overflow-y-auto ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: '33px' }}
      >
        <div className="space-y-6">
          {/* Drawer Header Brand */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xl font-serif text-white tracking-[0.25em] font-light">QNOX</span>
              <span className="text-[8px] font-mono text-[#c5a880] uppercase tracking-widest block">LUXURY GYM</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white border border-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="flex flex-col space-y-4">
            {centerLinks.map((link, idx) => (
              <NavLink
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `text-xl font-serif tracking-[0.15em] uppercase transition-colors flex items-center justify-between group py-1 border-b border-white/5 ${
                    isActive ? 'text-[#c5a880] font-bold' : 'text-neutral-300 hover:text-[#c5a880]'
                  }`
                }
              >
                <span>{link.label}</span>
                <span className="text-[10px] font-mono tracking-widest text-neutral-600 group-hover:text-[#c5a880]">
                  0{idx + 1}
                </span>
              </NavLink>
            ))}

            {/* Collapsible Mobile: MORE */}
            <div className="border-b border-white/5 py-2">
              <button
                type="button"
                onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                className="w-full text-xl font-serif tracking-[0.15em] uppercase transition-colors flex items-center justify-between text-neutral-300 hover:text-[#c5a880]"
              >
                <span>MORE</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileMoreOpen ? 'rotate-180 text-[#c5a880]' : ''}`} />
              </button>

              {mobileMoreOpen && (
                <div className="mt-3 pl-4 space-y-3 font-mono text-xs border-l border-[#c5a880]/30 py-1">
                  {moreLinks.map((m) => (
                    <NavLink
                      key={m.label}
                      to={m.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-neutral-400 hover:text-[#c5a880] uppercase tracking-wider py-1"
                    >
                      {m.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible Mobile: FOR GYM OWNERS */}
            <div className="border-b border-white/5 py-2">
              <button
                type="button"
                onClick={() => setMobileOwnerOpen(!mobileOwnerOpen)}
                className="w-full text-lg font-serif tracking-[0.12em] uppercase transition-colors flex items-center justify-between text-[#c5a880]"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>FOR GYM OWNERS</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileOwnerOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {mobileOwnerOpen && (
                <div className="mt-3 pl-4 space-y-2.5 font-mono text-xs border-l border-[#c5a880]/30 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenGymOwnerRegister) onOpenGymOwnerRegister();
                    }}
                    className="block text-left text-neutral-300 hover:text-white uppercase tracking-wider py-1"
                  >
                    &bull; Register as Gym Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenAuth) onOpenAuth('owner');
                    }}
                    className="block text-left text-neutral-300 hover:text-white uppercase tracking-wider py-1"
                  >
                    &bull; Gym Owner Login
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Mobile Action Buttons Footer */}
        <div className="border-t border-white/10 pt-6 space-y-3 font-mono">
          {currentUser ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdmin) onOpenAdmin();
                  else onOpenMemberPortal();
                }}
                className="w-full py-3 bg-[#c5a880] text-black text-center text-xs font-bold tracking-[0.2em] uppercase hover:bg-white transition-colors"
              >
                {isAdmin ? 'EXECUTIVE ADMIN SUITE' : isGymOwner ? 'GYM COMMAND PORTAL' : 'MY MEMBER PORTAL'}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 border border-rose-500/30 text-rose-300 text-center text-xs font-bold tracking-[0.15em] uppercase hover:bg-rose-950/20 transition-colors"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('member');
                }}
                className="w-full py-3.5 border border-white/30 hover:border-white text-white text-center text-xs font-bold tracking-[0.2em] uppercase transition-colors"
              >
                SIGN IN
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTourModal && onOpenTourModal();
                }}
                className="w-full py-3.5 bg-[#c5a880] text-black text-center text-xs font-bold tracking-[0.2em] uppercase hover:bg-white transition-colors"
              >
                SCHEDULE PRIVATE TOUR
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
