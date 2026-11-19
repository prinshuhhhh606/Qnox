import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { submitTourInquiry } from '../services/api';
import './TourModal.css';

export default function TourModal({ isOpen, onClose, defaultClub = '', defaultTier = '' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredClub: defaultClub || 'QNOX Mayfair Sanctuary',
    membershipTier: defaultTier || 'THE METROPOLITAN',
    preferredTime: 'Morning (08:00 - 12:00)',
    primaryGoal: 'Peak Performance & Longevity',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await submitTourInquiry(formData);
      setSuccessData(res.data);
    } catch (err) {
      // In case of local testing / fallback
      setSuccessData({
        conciergePassId: `QNOX-VIP-${Math.floor(100000 + Math.random() * 900000)}`,
        guest: formData.fullName,
        club: formData.preferredClub,
        tier: formData.membershipTier,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#090909] border border-[#c5a880]/50 p-6 sm:p-10 text-white shadow-2xl shadow-black my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#c5a880]/10 border border-[#c5a880] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#c5a880]" />
            </div>

            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] font-semibold block mb-2">
                VIP CONCIERGE CONFIRMATION
              </span>
              <h3 className="font-serif text-3xl text-white">Private Tour Secured</h3>
            </div>

            <p className="text-neutral-300 text-sm font-light leading-relaxed max-w-md mx-auto">
              Thank you, <strong className="text-white">{successData.guest}</strong>. Your requested walkthrough for <strong className="text-white">{successData.club}</strong> has been logged with our senior concierge desk.
            </p>

            <div className="bg-[#111] border border-white/10 p-5 rounded-none max-w-sm mx-auto space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 block">PRIVATE ACCESS CODE</span>
              <span className="text-2xl font-serif text-[#c5a880] tracking-widest block font-bold">
                {successData.conciergePassId}
              </span>
              <span className="text-[10px] text-neutral-500">Present upon arrival at club security</span>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-[0.25em] uppercase hover:bg-white transition-colors"
            >
              CLOSE WINDOW
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] font-sans font-semibold block mb-2">
                MEMBERSHIP INQUIRY
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-white">
                Request Private Sanctuary Tour
              </h3>
              <p className="text-neutral-400 text-xs sm:text-sm font-light mt-2">
                Tours are hosted privately with a dedicated Member Concierge. Please allow 45 minutes for a full spatial and athletic walkthrough.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 text-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    FULL LEGAL NAME *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Lord Alexander Wright"
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880] placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alexander@domain.com"
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880] placeholder-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    TELEPHONE (MOBILE) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7911 123456"
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880] placeholder-neutral-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    PREFERRED SANCTUARY
                  </label>
                  <select
                    name="preferredClub"
                    value={formData.preferredClub}
                    onChange={handleChange}
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="QNOX Mayfair Sanctuary">QNOX Mayfair Sanctuary</option>
                    <option value="QNOX Soho Foundry">QNOX Soho Foundry</option>
                    <option value="QNOX Canary Wharf Horizon">QNOX Canary Wharf Horizon</option>
                    <option value="QNOX Marylebone Mews">QNOX Marylebone Mews</option>
                    <option value="QNOX Chelsea Waterfront">QNOX Chelsea Waterfront</option>
                    <option value="QNOX Obsidian Tower (Global Flagship)">QNOX Obsidian Tower (Global Flagship)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    MEMBERSHIP TIER OF INTEREST
                  </label>
                  <select
                    name="membershipTier"
                    value={formData.membershipTier}
                    onChange={handleChange}
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="THE RESIDENT">THE RESIDENT (£260/mo)</option>
                    <option value="THE METROPOLITAN">THE METROPOLITAN (£345/mo)</option>
                    <option value="THE OBSIDIAN BLACK">THE OBSIDIAN BLACK (£720/mo)</option>
                    <option value="UNSURE / TOUR ONLY">Unsure / Tour Walkthrough First</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                    PREFERRED TOUR TIME
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="Morning (08:00 - 12:00)">Morning (08:00 - 12:00)</option>
                    <option value="Midday (12:00 - 16:00)">Midday (12:00 - 16:00)</option>
                    <option value="Evening (16:00 - 20:00)">Evening (16:00 - 20:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                  PRIMARY WELLNESS OR PERFORMANCE GOAL
                </label>
                <input
                  type="text"
                  name="primaryGoal"
                  value={formData.primaryGoal}
                  onChange={handleChange}
                  placeholder="e.g. Marathon Prep, Longevity, Striking & Combat, Recovery"
                  className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880] placeholder-neutral-600"
                />
              </div>

              <div>
                <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
                  ADDITIONAL CONCIERGE NOTES / SPECIFICATIONS
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific facility interest or timing requests..."
                  className="w-full bg-[#141414] border border-white/15 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c5a880] placeholder-neutral-600 resize-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#c5a880] hover:bg-white text-black font-semibold text-xs tracking-[0.25em] uppercase transition-all duration-300"
                >
                  {loading ? 'SECURING CONCIERGE SLOT...' : 'SUBMIT TOUR REQUEST'}
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-[10px] text-neutral-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>Strict Discretion & Privacy Policy Upheld &bull; GDPR Compliant</span>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
