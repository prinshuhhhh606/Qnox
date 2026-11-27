import React, { useState } from 'react';
import {
  X, Building2, Check, ArrowRight, ShieldCheck, Sparkles,
  MapPin, Phone, Mail, User, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { applyGymOwner } from '../services/api';

export default function GymOwnerRegisterModal({ isOpen, onClose, onShowToast }) {
  // Form inputs for pre-approval application
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    gymName: '',
    gymAddress: '',
    city: '',
    state: '',
    country: 'India',
    branchCount: 1,
    expectedMembers: 100,
    businessDescription: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [applicationResult, setApplicationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      if (!formData.ownerName || !formData.email || !formData.phone || !formData.gymName || !formData.gymAddress || !formData.city || !formData.state) {
        throw new Error('Please fill all mandatory fields: Owner Name, Email, Phone, Gym Name, Address, City, State.');
      }

      const res = await applyGymOwner({
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gymName: formData.gymName.trim(),
        gymAddress: formData.gymAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || 'India',
        branchCount: Math.max(1, Number(formData.branchCount) || 1),
        expectedMembers: Math.max(1, Number(formData.expectedMembers) || 100),
        businessDescription: formData.businessDescription.trim(),
      });

      setApplicationResult(res.data);

      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: `Application ${res.data?.applicationId || ''} submitted for Super Admin review.`,
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit application');
      if (onShowToast) {
        onShowToast({ type: 'error', message: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setApplicationResult(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#c5a880]/30 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2 text-[10px] tracking-[0.25em] text-[#c5a880] font-bold uppercase mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>QNOX LUXURY SAAS &bull; B2B PARTNERSHIP PIPELINE</span>
          </div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Request Gym Owner Approval
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Submit your gym facility dossier. All independent partners require Super Admin pre-approval before account provisioning and SaaS subscription activation.
          </p>
        </div>

        {/* Success Screen */}
        {applicationResult ? (
          <div className="py-6 text-center space-y-5 font-mono">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] text-[#c5a880] tracking-widest uppercase block mb-1">
                APPLICATION LODGED &bull; AUDIT IN PROGRESS
              </span>
              <h3 className="text-xl font-serif text-white">Application Successfully Submitted</h3>
            </div>

            <div className="p-4 bg-[#121212] border border-[#c5a880]/30 max-w-md mx-auto space-y-2 text-left">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">APPLICATION REF:</span>
                <span className="text-[#c5a880] font-bold text-sm">{applicationResult.applicationId}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">GYM / BRAND:</span>
                <span className="text-white font-medium">{applicationResult.gymName}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">APPLICANT:</span>
                <span className="text-white">{applicationResult.ownerName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">AUDIT STATUS:</span>
                <span className="px-2 py-0.5 text-[9px] bg-amber-950/70 text-amber-400 border border-amber-500/40 font-bold uppercase rounded">
                  {applicationResult.status || 'PENDING_APPROVAL'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/10 text-xs text-neutral-300 max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center space-x-1.5 text-amber-400 text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>WHAT HAPPENS NEXT?</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400">
                Our Executive Board and Concierge will audit your facility credentials. Once approved, you will receive a secure registration link via email (<strong>{applicationResult.email}</strong>) to create your login password and choose your SaaS subscription tier.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition"
            >
              CLOSE & RETURN TO HOME
            </button>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Section 1: Applicant Information */}
            <div className="space-y-3">
              <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono font-bold block border-b border-white/5 pb-1">
                1. APPLICANT & EXECUTIVE DETAILS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Owner Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      name="ownerName"
                      required
                      placeholder="e.g. Vikramaditya Singhania"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. owner@apexfitness.in"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Mobile / WhatsApp Contact *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Gym & Facility Details */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono font-bold block border-b border-white/5 pb-1">
                2. GYM / BRAND & FACILITY DETAILS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Gym / Brand Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      name="gymName"
                      required
                      placeholder="e.g. Apex Luxury Athletics & Sanctuary"
                      value={formData.gymName}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Full Facility Street Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      name="gymAddress"
                      required
                      placeholder="e.g. Suite 400, Platinum Heights, Linking Road"
                      value={formData.gymAddress}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    placeholder="India"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                      Branches
                    </label>
                    <input
                      type="number"
                      name="branchCount"
                      min={1}
                      value={formData.branchCount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                      Members
                    </label>
                    <input
                      type="number"
                      name="expectedMembers"
                      min={10}
                      step={10}
                      value={formData.expectedMembers}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                    Business / Equipment Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    name="businessDescription"
                    placeholder="Briefly describe your gym amenities, premium equipment, steam/sauna facilities, or aesthetic ethos..."
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 font-mono">
                Pre-approval audit typically takes 24-48 hours.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>TRANSMITTING DOSSIER...</span>
                ) : (
                  <>
                    <span>SUBMIT PARTNERSHIP APPLICATION</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
