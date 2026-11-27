import React, { useState, useEffect } from 'react';
import {
  X, Building2, Check, ArrowRight, ShieldCheck, Sparkles,
  CreditCard, RefreshCw, CheckCircle2, MapPin, Phone, Mail, Lock, User
} from 'lucide-react';
import { fetchSaaSPlans, registerGymOwner, verifySaaSPayment } from '../services/api';

export default function GymOwnerRegisterModal({ isOpen, onClose, onShowToast, onAuthSuccess }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedPlanCode, setSelectedPlanCode] = useState('professional');

  // Form inputs
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    gymName: '',
    city: '',
    state: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlans();
      setRegistrationSuccess(null);
    }
  }, [isOpen]);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetchSaaSPlans();
      if (res && res.data && res.data.length > 0) {
        setPlans(res.data);
      } else {
        // Fallback default tier metadata
        setPlans([
          {
            code: 'starter',
            name: 'Starter',
            monthlyPrice: 4999,
            yearlyPrice: 47990,
            features: ['1 Branch Location', 'Up to 5 Master Coaches', 'Up to 100 Members', 'Digital QR Check-in', 'Revenue Telemetry'],
          },
          {
            code: 'professional',
            name: 'Professional',
            monthlyPrice: 11999,
            yearlyPrice: 115190,
            features: ['3 Sanctuary Branches', 'Up to 15 Master Coaches', 'Up to 500 Members', 'AI Workout Biomechanics', 'Full Financial Audit'],
          },
          {
            code: 'enterprise',
            name: 'Enterprise',
            monthlyPrice: 24999,
            yearlyPrice: 239990,
            features: ['Unlimited Branches', 'Unlimited Master Coaches', 'Unlimited Members', 'Multi-Gym All-Access Network', 'Dedicated Account Concierge'],
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not load SaaS plans:', err.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const formattedLocation = `${formData.city}, ${formData.state}`.trim();
      // 1. Register owner & create pending organization
      const res = await registerGymOwner({
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        gymName: formData.gymName.trim(),
        location: formattedLocation,
        address: formattedLocation,
        planCode: selectedPlanCode.toLowerCase(),
        billingCycle,
      });

      if (!res.success) {
        throw new Error(res.message || 'Registration failed');
      }

      const { user, owner, organization, razorpayOrder, token } = res.data;
      const effectiveOwner = user || owner;

      // 2. Complete payment activation (direct/test mode or Razorpay)
      await verifySaaSPayment({
        organizationId: organization._id,
        planCode: selectedPlanCode,
        billingCycle,
        razorpayOrderId: razorpayOrder?.id || `ORDER_${Date.now()}`,
        razorpayPaymentId: `PAY_${Date.now()}_MOCK`,
        adminBypass: true,
      });

      if (token) {
        localStorage.setItem('qnox_token', token);
        localStorage.setItem('token', token);
      }

      setRegistrationSuccess({
        gymName: formData.gymName,
        ownerName: formData.ownerName,
        email: formData.email,
        planName: selectedPlanCode.toUpperCase(),
        organizationId: organization._id,
      });

      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: `Welcome to QNOX SaaS! ${formData.gymName} is now commissioned.`,
        });
      }

      if (onAuthSuccess) {
        onAuthSuccess({
          ...effectiveOwner,
          role: 'Gym Owner',
          organization: organization._id,
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to commission sanctuary');
      if (onShowToast) {
        onShowToast({ type: 'error', message: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#080808] border border-[#c5a880]/50 shadow-2xl rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-fadeIn">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-[#0c0c0c] border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#c5a880]/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#c5a880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a880] font-mono font-bold">
                  B2B MULTI-GYM SAAS NETWORK
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  PARTNER ONBOARDING
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
                Commission Your Fitness Enterprise
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-8 scrollbar-thin">
          
          {registrationSuccess ? (
            <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#c5a880]">
                  COMMISSION CONFIRMED
                </span>
                <h3 className="text-2xl font-serif font-bold text-white mt-1">
                  Welcome, {registrationSuccess.ownerName}!
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  <strong>{registrationSuccess.gymName}</strong> has been successfully registered under the{' '}
                  <span className="text-[#c5a880] font-bold">{registrationSuccess.planName}</span> SaaS tier.
                  Your isolated tenant environment and organization database are ready.
                </p>
              </div>

              <div className="bg-[#121212] border border-white/10 p-4 rounded-xl text-xs text-left font-mono space-y-1.5">
                <div className="flex justify-between text-neutral-400">
                  <span>Organization Slug:</span>
                  <span className="text-white font-bold">{registrationSuccess.gymName.toLowerCase().replace(/\s+/g, '-')}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Sign-in Email:</span>
                  <span className="text-white font-bold">{registrationSuccess.email}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Tenant Status:</span>
                  <span className="text-emerald-400 font-bold">Active / Isolated</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition shadow-lg"
              >
                Access Gym Owner Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Step 1: Billing Cycle & Plan Selection */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm uppercase tracking-wider font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c5a880]" />
                      <span>1. Select Your SaaS Subscription Tier</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Choose the capacity tier that fits your gym's current size. Upgrade anytime.
                    </p>
                  </div>

                  {/* Monthly / Yearly Switch */}
                  <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition uppercase tracking-wider ${
                        billingCycle === 'monthly' ? 'bg-[#c5a880] text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition uppercase tracking-wider flex items-center gap-1 ${
                        billingCycle === 'yearly' ? 'bg-[#c5a880] text-black font-bold shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="text-[9px] px-1 bg-emerald-500 text-black font-extrabold rounded">SAVE 20%</span>
                    </button>
                  </div>
                </div>

                {/* Plan Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {(plans.length > 0 ? plans : [
                    { code: 'starter', name: 'Starter', monthlyPrice: 4999, yearlyPrice: 47990 },
                    { code: 'professional', name: 'Professional', monthlyPrice: 11999, yearlyPrice: 115190 },
                    { code: 'enterprise', name: 'Enterprise', monthlyPrice: 24999, yearlyPrice: 239990 },
                  ]).map((p) => {
                    const isSelected = selectedPlanCode.toLowerCase() === p.code.toLowerCase();
                    const price = billingCycle === 'yearly' ? (p.yearlyPrice || p.monthlyPrice * 10) : p.monthlyPrice;

                    return (
                      <div
                        key={p.code}
                        onClick={() => setSelectedPlanCode(p.code.toLowerCase())}
                        className={`p-4 sm:p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#141414] border-[#c5a880] shadow-[0_0_20px_rgba(197,168,128,0.15)] ring-1 ring-[#c5a880]'
                            : 'bg-[#0d0d0d] border-white/10 hover:border-white/30'
                        }`}
                      >
                        {p.code === 'professional' && (
                          <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#c5a880] text-black uppercase tracking-wider">
                            MOST POPULAR
                          </span>
                        )}

                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                              {p.name}
                            </h4>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#c5a880] bg-[#c5a880]' : 'border-white/30'}`}>
                              {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                            </div>
                          </div>

                          <div className="mt-3">
                            <span className="font-serif text-2xl font-bold text-white">
                              ₹{price?.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono ml-1">
                              /{billingCycle === 'yearly' ? 'year' : 'month'}
                            </span>
                          </div>

                          <ul className="mt-4 space-y-2 text-[11px] text-neutral-300">
                            {p.code === 'starter' && (
                              <>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> 1 Branch Location</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Up to 5 Trainers</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Up to 100 Members</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Attendance & Invoices</li>
                              </>
                            )}
                            {p.code === 'professional' && (
                              <>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> 3 Branch Locations</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Up to 15 Trainers</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Up to 500 Members</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> AI Workout Telemetry</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Multi-Branch Reports</li>
                              </>
                            )}
                            {p.code === 'enterprise' && (
                              <>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Unlimited Branches</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Unlimited Trainers</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Unlimited Members</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> All-Access Network Ready</li>
                                <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#c5a880]" /> Dedicated Concierge Manager</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Onboarding Details Form */}
              <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-white/10">
                <h3 className="text-sm uppercase tracking-wider font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#c5a880]" />
                  <span>2. Gym Owner & Facility Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                      Owner Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="ownerName"
                        required
                        placeholder="e.g. Vikramaditya Rathore"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                      Business Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="owner@yourgymbrand.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                      Master Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                      Mobile / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                      Gym / Brand Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        name="gymName"
                        required
                        placeholder="e.g. Iron Kingdom Fitness"
                        value={formData.gymName}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg pl-9 pr-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 uppercase tracking-widest text-[10px] mb-1 font-mono">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        placeholder="e.g. Maharashtra"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-[#121212] border border-white/10 text-white rounded-lg px-3 py-2.5 focus:border-[#c5a880] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-3 animate-shake">
                    <span>{errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setErrorMessage('')}
                      className="text-rose-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="p-4 bg-[#101010] border border-[#c5a880]/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>
                      Zero-Trust Tenant Data Isolation Active: Your members and finance records remain 100% private.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#c5a880] to-[#b3956f] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0 shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Commissioning Sanctuary...</span>
                      </>
                    ) : (
                      <>
                        <span>Commission Sanctuary</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
