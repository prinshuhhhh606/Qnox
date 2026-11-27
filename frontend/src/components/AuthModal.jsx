import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Lock, Mail, User, Phone, ArrowRight, ShieldCheck, Dumbbell, Sparkles, Building2 } from 'lucide-react';
import { loginUser, registerUser, requestPasswordReset } from '../services/api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onShowToast, onOpenGymOwnerRegister, initialMode = 'login', initialRole = 'member' }) {
  const [authRole, setAuthRole] = useState(initialRole); // 'member' | 'trainer' | 'owner'
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (initialRole) {
      setAuthRole(initialRole);
      if (initialRole !== 'member') {
        setMode('login');
      }
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (mode === 'login') {
        const res = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        // Enforce role separation if logging in as Trainer
        if (authRole === 'trainer' && !['Trainer', 'Admin', 'Super Admin'].includes(res.user.role)) {
          throw new Error('This account is registered as a Gym Customer. Please use Customer Login.');
        }

        // Enforce role separation if logging in as Gym Owner
        if (authRole === 'owner' && !['Gym Owner', 'Company Admin', 'Super Admin'].includes(res.user.role)) {
          throw new Error('This account is not registered as a Partner Gym Owner.');
        }

        if (authRole === 'member' && res.user.role === 'Trainer') {
          if (onShowToast) {
            onShowToast({
              type: 'info',
              message: 'Trainer account recognized. Opening Coach Command Portal.',
            });
          }
        } else if (authRole === 'member' && ['Gym Owner', 'Company Admin'].includes(res.user.role)) {
          if (onShowToast) {
            onShowToast({
              type: 'info',
              message: 'Gym Owner account recognized. Opening Gym Command Dashboard.',
            });
          }
        } else if (onShowToast) {
          onShowToast({ type: 'success', message: `Welcome, ${res.user.name}. Authenticated.` });
        }

        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'register') {
        const res = await registerUser(formData);
        if (onShowToast) onShowToast({ type: 'success', message: 'Sanctuary account created successfully.' });
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'forgot') {
        const res = await requestPasswordReset(formData.email);
        setInfoMsg(res.message || 'Password reset link sent to your email.');
        if (onShowToast) onShowToast({ type: 'info', message: 'Password reset dispatch sent.' });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoTrainer = () => {
    setFormData({
      ...formData,
      email: 'trainer@qnoxgym.com',
      password: 'Trainer@QNOX2026!',
    });
    setAuthRole('trainer');
    setMode('login');
  };

  const handleFillDemoAdmin = () => {
    setFormData({
      ...formData,
      email: 'admin@qnoxgym.com',
      password: 'Admin@QNOX2026!',
    });
    setMode('login');
  };

  return (
    <div className="qnox-auth-backdrop">
      <div className="qnox-auth-dialog">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 text-[10px] tracking-[0.3em] uppercase text-[#c5a880] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SANCTUARY VERIFICATION</span>
          </div>
          <h2 className="font-serif text-3xl text-white">
            {authRole === 'trainer'
              ? 'Coach Command Login'
              : authRole === 'owner'
              ? 'Gym Owner Command Login'
              : 'QNOX Membership Access'}
          </h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            {authRole === 'trainer'
              ? 'Authorized access for approved master practitioners & trainers.'
              : authRole === 'owner'
              ? 'Authorized portal for approved B2B partner gym owners and managers.'
              : 'Access your private dossier, active bookings & member privileges.'}
          </p>
        </div>

        {/* Portal Role Selector (Customer / Member vs Trainer vs Gym Owner) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.03] border border-white/10 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => {
              setAuthRole('member');
              setErrorMsg('');
            }}
            className={`py-2 px-2 rounded text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              authRole === 'member'
                ? 'bg-[#c5a880] text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Member</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthRole('trainer');
              setMode('login'); // Trainers cannot register through member modal
              setErrorMsg('');
            }}
            className={`py-2 px-2 rounded text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              authRole === 'trainer'
                ? 'bg-[#c5a880] text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3 h-3" />
            <span>Trainer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthRole('owner');
              setMode('login'); // Gym owners register via pre-approval invitation
              setErrorMsg('');
            }}
            className={`py-2 px-2 rounded text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 ${
              authRole === 'owner'
                ? 'bg-[#c5a880] text-black shadow-md font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Gym Owner</span>
          </button>
        </div>

        {/* Informative notice for Trainers wanting to register */}
        {authRole === 'trainer' && (
          <div className="mb-6 p-3 bg-[#c5a880]/10 border border-[#c5a880]/30 rounded text-xs text-neutral-300 flex items-center justify-between">
            <div>
              <span className="text-[#c5a880] font-semibold block">Not registered yet?</span>
              <span className="text-[11px] text-neutral-400">Trainers must apply via the dedicated portal first.</span>
            </div>
            <Link
              to="/join-as-trainer"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#c5a880] hover:bg-[#d8bf9b] text-black font-semibold text-[10px] uppercase tracking-wider rounded"
            >
              Join as Trainer
            </Link>
          </div>
        )}

        {/* Informative notice for Gym Owners wanting to register */}
        {authRole === 'owner' && (
          <div className="mb-6 p-3 bg-[#c5a880]/10 border border-[#c5a880]/30 rounded text-xs text-neutral-300 flex items-center justify-between">
            <div>
              <span className="text-[#c5a880] font-semibold block">Need Partnership Approval?</span>
              <span className="text-[11px] text-neutral-400">Gym Owners require Super Admin pre-approval before onboarding.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenGymOwnerRegister) onOpenGymOwnerRegister();
              }}
              className="px-3 py-1.5 bg-[#c5a880] hover:bg-white text-black font-semibold text-[10px] uppercase tracking-wider rounded"
            >
              Apply as Owner
            </button>
          </div>
        )}

        {/* Tabs (Only show New Member tab if role is Member) */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            type="button"
            className={`qnox-auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
          >
            {authRole === 'trainer'
              ? 'TRAINER SIGN IN'
              : authRole === 'owner'
              ? 'GYM OWNER SIGN IN'
              : 'SIGN IN'}
          </button>
          {authRole === 'member' && (
            <button
              type="button"
              className={`qnox-auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrorMsg(''); setInfoMsg(''); }}
            >
              NEW MEMBER
            </button>
          )}
          <button
            type="button"
            className={`qnox-auth-tab-btn ${mode === 'forgot' ? 'active' : ''}`}
            onClick={() => { setMode('forgot'); setErrorMsg(''); setInfoMsg(''); }}
          >
            RECOVERY
          </button>
        </div>

        {/* Alert banners */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs">
            {infoMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1.5 font-medium">
                LEGAL FULL NAME *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Lord Alexander Wright"
                  className="qnox-auth-input pl-10"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1.5 font-medium">
              EMAIL ADDRESS *
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={authRole === 'owner' ? 'owner@gymbrand.com' : authRole === 'trainer' ? 'trainer@qnoxgym.com' : 'member@domain.com'}
                className="qnox-auth-input pl-10"
              />
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1.5 font-medium">
                TELEPHONE (MOBILE)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+44 7911 123456"
                  className="qnox-auth-input pl-10"
                />
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1.5 font-medium">
                PASSWORD *
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="qnox-auth-input pl-10 font-mono"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="qnox-auth-submit-btn"
            >
              <span>{loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ENTER SANCTUARY' : mode === 'register' ? 'CREATE MEMBERSHIP' : 'TRANSMIT RECOVERY LINK'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Reviewer Demo Fill Pill */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleFillDemoTrainer}
            className="text-[10px] tracking-widest uppercase text-[#c5a880] hover:text-white underline underline-offset-4 transition-colors"
          >
            FILL DEMO TRAINER
          </button>
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-white underline underline-offset-4 transition-colors"
          >
            FILL SUPER ADMIN
          </button>
        </div>

      </div>
    </div>
  );
}
