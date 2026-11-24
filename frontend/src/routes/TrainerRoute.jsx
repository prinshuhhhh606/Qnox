import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Dumbbell, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { loginUser } from '../services/api';

export default function TrainerRoute({ children }) {
  const { currentUser, setCurrentUser, loading, isTrainer } = useAuth();
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
          INITIALIZING MASTER TRAINER PORTAL...
        </span>
      </div>
    );
  }

  // If already authenticated as approved Trainer
  if (currentUser && isTrainer) {
    return children ? children : <Outlet />;
  }

  const handleTrainerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      if (res && res.user) {
        if (res.user.role !== 'Trainer') {
          setErrorMsg('Access denied: Account does not possess approved Master Trainer credentials.');
          return;
        }
        setCurrentUser(res.user);
        sessionStorage.setItem('qnox_view_mode', 'trainer');
        showToast({
          type: 'success',
          message: `Welcome Coach ${res.user.name}. Trainer Portal initialized.`,
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a880]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#141414] border border-[#c5a880]/40 text-[#c5a880] mb-1">
            <Dumbbell className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#c5a880] block font-bold">
            ACCREDITED COACH ACCESS
          </span>
          <h2 className="font-serif text-2xl text-white font-bold tracking-wide">
            Master Trainer Portal
          </h2>
          <p className="text-xs text-neutral-400 font-light max-w-xs mx-auto">
            Authorized access for approved master trainers, biometric assessments, and member coaching.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleTrainerLogin} className="space-y-4 text-xs font-mono">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              TRAINER EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@qnoxgym.com"
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#c5a880] to-[#b3936a] hover:from-[#dfc8a7] hover:to-[#c5a880] text-black font-semibold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <span>VERIFYING ACCREDITATION...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>ENTER TRAINER SUITE</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <a
            href="http://localhost:3000/join-as-trainer"
            className="text-[11px] text-[#c5a880] hover:underline"
          >
            New Trainer? Submit Accreditation Application &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
