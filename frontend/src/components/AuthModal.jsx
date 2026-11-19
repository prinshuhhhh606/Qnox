import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { loginUser, registerUser, requestPasswordReset } from '../services/api';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onShowToast }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

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
        if (onShowToast) onShowToast({ type: 'success', message: `Welcome, ${res.user.name}. Authenticated.` });
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 text-[10px] tracking-[0.3em] uppercase text-[#c5a880] font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SANCTUARY VERIFICATION</span>
          </div>
          <h2 className="font-serif text-3xl text-white">QNOX Membership Access</h2>
          <p className="text-xs text-neutral-400 font-light mt-1">
            Access your private dossier, active bookings & member privileges.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            type="button"
            className={`qnox-auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); setInfoMsg(''); }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            className={`qnox-auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMsg(''); setInfoMsg(''); }}
          >
            NEW MEMBER
          </button>
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
                placeholder="member@domain.com"
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
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">DEMO ADMIN ACCESS</span>
          <button
            type="button"
            onClick={handleFillDemoAdmin}
            className="text-[10px] tracking-widest uppercase text-[#c5a880] hover:text-white underline underline-offset-4 transition-colors"
          >
            FILL SUPER ADMIN LOGIN
          </button>
        </div>

      </div>
    </div>
  );
}
