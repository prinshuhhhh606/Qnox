import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { loginUser } from '../services/api';

export default function AdminRoute({ children }) {
  const { currentUser, setCurrentUser, loading, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('admin@qnoxgym.com');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center space-y-4 text-[#c5a880]">
        <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          INITIALIZING EXECUTIVE COMMAND SUITE...
        </span>
      </div>
    );
  }

  // If already authenticated as Admin, render Admin Suite immediately
  if (currentUser && isAdmin) {
    return children ? children : <Outlet />;
  }

  // If not authenticated as Admin, display dedicated Executive Gate
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      if (res && res.user) {
        if (!['Admin', 'Super Admin'].includes(res.user.role)) {
          setErrorMsg('Access denied: This account does not possess Executive Admin accreditation.');
          return;
        }
        setCurrentUser(res.user);
        sessionStorage.setItem('qnox_view_mode', 'admin');
        showToast({
          type: 'success',
          message: `Authenticated as ${res.user.name}. Welcome to Executive Suite.`,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillSuperAdmin = () => {
    setEmail('admin@qnoxgym.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex items-center justify-center p-4 selection:bg-[#c5a880] selection:text-black">
      <div className="w-full max-w-md bg-[#090909] border border-[#c5a880]/30 shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Subtle Luxury Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a880]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#141414] border border-[#c5a880]/40 text-[#c5a880] mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#c5a880] block font-bold">
            EXECUTIVE CONCIERGE ACCESS
          </span>
          <h2 className="font-serif text-2xl text-white font-bold tracking-wide">
            Admin Command Suite
          </h2>
          <p className="text-xs text-neutral-400 font-light max-w-xs mx-auto">
            Authorized management credentials required to access surveillance, financial audits, and dossiers.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              ADMINISTRATIVE EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qnoxgym.com"
              className="w-full bg-[#121212] border border-white/10 p-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] transition"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              SECURITY KEY / PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#121212] border border-white/10 p-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] transition"
            />
          </div>

          {/* Quick-Fill Super Admin Badge */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleFillSuperAdmin}
              className="w-full py-2 px-3 bg-[#c5a880]/10 hover:bg-[#c5a880]/20 border border-[#c5a880]/30 text-[#c5a880] text-[11px] font-mono flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Master Super Admin Credentials</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#c5a880] to-[#b3936a] hover:from-[#dfc8a7] hover:to-[#c5a880] text-black font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <span>VERIFYING CONCIERGE KEY...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>AUTHORIZE EXECUTIVE ENTRY</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <span className="text-[9px] text-neutral-600 uppercase font-mono tracking-widest">
            QNOX GYM EXECUTIVE GOVERNANCE PROTOCOL v2.4
          </span>
        </div>
      </div>
    </div>
  );
}
