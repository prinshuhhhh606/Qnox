import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Building2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { loginUser } from '../services/api';

export default function GymOwnerRoute({ children }) {
  const { currentUser, setCurrentUser, loading, isGymOwner, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center space-y-4 text-[#c5a880]">
        <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          INITIALIZING GYM SANCTUARY COMMAND PORTAL...
        </span>
      </div>
    );
  }

  // If already authenticated as Gym Owner or Super Admin
  if (currentUser && (isGymOwner || isAdmin)) {
    return children ? children : <Outlet />;
  }

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      if (res && res.user) {
        if (!['Gym Owner', 'Company Admin', 'Super Admin'].includes(res.user.role)) {
          setErrorMsg('Access denied: Account is not registered as a Partner Gym Owner.');
          return;
        }
        setCurrentUser(res.user);
        sessionStorage.setItem('qnox_view_mode', 'gym-owner');
        showToast({
          type: 'success',
          message: `Welcome, ${res.user.name}. Gym Owner Command initialized.`,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f5] flex items-center justify-center p-4 selection:bg-[#c5a880] selection:text-black">
      <div className="w-full max-w-md bg-[#090909] border border-[#c5a880]/30 shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Architectural Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c5a880] to-transparent" />
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/20 text-[#c5a880] mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif text-[#f5f5f5] tracking-wide">
            GYM OWNER PORTAL
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            B2B Multi-Gym SaaS Command Suite
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-center font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleOwnerLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
              Owner Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourgym.com"
              className="w-full bg-[#111111] border border-neutral-800 px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
              Secret Key (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#111111] border border-neutral-800 px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#c5a880] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#c5a880] hover:bg-[#d8be98] text-black font-mono text-xs uppercase tracking-widest font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <span>VERIFYING ACCREDITATION...</span>
            ) : (
              <>
                <span>ENTER COMMAND SUITE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-900 text-center">
          <p className="text-[11px] text-neutral-500 font-mono">
            Not yet onboarded? Register your gym on the Navbar under "FOR GYM OWNERS".
          </p>
        </div>
      </div>
    </div>
  );
}
