import React, { useState } from 'react';
import {
  X, Building2, Check, ArrowRight, ShieldCheck, Sparkles,
  MapPin, Phone, Mail, User, Clock, CheckCircle2, AlertCircle,
  Compass, Navigation, ShieldAlert
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
    partnershipType: 'QNOX Franchise Gym',
    latitude: '',
    longitude: '',
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applicationResult, setApplicationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by this browser.');
      return;
    }
    setDetectingGps(true);
    setGpsStatus('Triangulating GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lon = Math.round(pos.coords.longitude * 10000) / 10000;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
        setDetectingGps(false);
        setGpsStatus(`GPS Verified: ${lat}, ${lon} (Accuracy ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setDetectingGps(false);
        setGpsStatus(`GPS Notice: ${err.message}. System will resolve coordinates from city.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
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
        partnershipType: formData.partnershipType,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
      });

      setApplicationResult(res.data);

      if (onShowToast) {
        if (res.hasTerritoryConflict) {
          onShowToast({
            type: 'warning',
            message: `Territory Notice: Application requires special management review due to nearby company branch.`,
          });
        } else {
          onShowToast({
            type: 'success',
            message: `Application ${res.data?.applicationId || ''} submitted for Super Admin review.`,
          });
        }
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

  const isConflict = applicationResult?.hasTerritoryConflict || applicationResult?.status === 'TERRITORY_CONFLICT';

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
            <span>QNOX LUXURY SAAS &bull; B2B PARTNERSHIP & TERRITORY PIPELINE</span>
          </div>
          <h2 className="text-2xl font-serif text-white tracking-wide">
            Request Gym Owner Approval
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Submit your facility dossier. All independent partners require Super Admin pre-approval and GPS geofence auditing before account activation.
          </p>
        </div>

        {/* Result Screen (Territory Conflict or Normal Approval Pending) */}
        {applicationResult ? (
          <div className="py-6 text-center space-y-5 font-mono">
            {isConflict ? (
              <div className="w-16 h-16 rounded-full bg-amber-950/70 border border-amber-500/60 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                <ShieldAlert className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            )}

            <div>
              <span className={`text-[10px] tracking-widest uppercase block mb-1 font-bold ${isConflict ? 'text-amber-400' : 'text-[#c5a880]'}`}>
                {isConflict ? 'TERRITORY GEOFENCE AUDIT &bull; SPECIAL MANAGEMENT REVIEW' : 'APPLICATION LODGED &bull; AUDIT IN PROGRESS'}
              </span>
              <h3 className="text-xl font-serif text-white">
                {isConflict ? 'Territory Protection Review Required' : 'Application Successfully Submitted'}
              </h3>
            </div>

            {/* Territory Conflict Notice Alert */}
            {isConflict && (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 text-left max-w-lg mx-auto space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>PROTECTED TERRITORY RESTRICTION</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Your gym location falls within the protected territory of an existing QNOX Luxury Gym branch (<strong>{applicationResult.conflictingBranchName || 'Company Branch'}</strong>, {applicationResult.conflictDistanceKm ? `${applicationResult.conflictDistanceKm} KM away` : 'protected radius'}). Your application requires special management review.
                </p>
                <p className="text-[10px] text-neutral-400 italic">
                  * Automatic onboarding is restricted to preserve company branch territory exclusivity. Super Admin executive authorization is required.
                </p>
              </div>
            )}

            <div className="p-4 bg-[#121212] border border-[#c5a880]/30 max-w-md mx-auto space-y-2 text-left">
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">APPLICATION REF:</span>
                <span className="text-[#c5a880] font-bold text-sm">{applicationResult.applicationId}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">PARTNERSHIP POLICY:</span>
                <span className="text-white font-medium">{applicationResult.partnershipType || formData.partnershipType}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">GYM / BRAND:</span>
                <span className="text-white font-medium">{applicationResult.gymName}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                <span className="text-neutral-400">APPLICANT:</span>
                <span className="text-white">{applicationResult.ownerName}</span>
              </div>
              {applicationResult.latitude && applicationResult.longitude && (
                <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                  <span className="text-neutral-400">GPS COORDINATES:</span>
                  <span className="text-neutral-300">{applicationResult.latitude}, {applicationResult.longitude}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">AUDIT STATUS:</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                  isConflict
                    ? 'bg-amber-950/70 text-amber-400 border-amber-500/50'
                    : 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40'
                }`}>
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
                {isConflict
                  ? 'Our Super Admin Board will review your location coordinates, territory viability, and commercial terms. If an exceptional override is granted, you will receive an invitation link at '
                  : 'Our Executive Board will audit your facility credentials. Once approved, you will receive a secure registration link via email at '}
                <strong>{applicationResult.email}</strong> to complete registration and SaaS subscription activation.
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

            {/* Section 0: Partnership Policy Selection */}
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono font-bold block border-b border-white/5 pb-1">
                0. SELECT ONBOARDING POLICY
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 border cursor-pointer transition flex flex-col justify-between ${
                    formData.partnershipType === 'QNOX Franchise Gym'
                      ? 'border-[#c5a880] bg-[#c5a880]/10 text-white'
                      : 'border-white/10 bg-[#121212] text-neutral-400 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-white flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>QNOX Franchise Gym</span>
                    </span>
                    <input
                      type="radio"
                      name="partnershipType"
                      value="QNOX Franchise Gym"
                      checked={formData.partnershipType === 'QNOX Franchise Gym'}
                      onChange={handleInputChange}
                      className="accent-[#c5a880]"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
                    Official QNOX Brand Partner. Subject to exclusive 5 KM territory protection around company branches.
                  </p>
                </label>

                <label
                  className={`p-3 border cursor-pointer transition flex flex-col justify-between ${
                    formData.partnershipType === 'QNOX SaaS Partner Gym'
                      ? 'border-[#c5a880] bg-[#c5a880]/10 text-white'
                      : 'border-white/10 bg-[#121212] text-neutral-400 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-white flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-neutral-300" />
                      <span>QNOX SaaS Partner Gym</span>
                    </span>
                    <input
                      type="radio"
                      name="partnershipType"
                      value="QNOX SaaS Partner Gym"
                      checked={formData.partnershipType === 'QNOX SaaS Partner Gym'}
                      onChange={handleInputChange}
                      className="accent-[#c5a880]"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 leading-relaxed">
                    Independent gym software customer. Uses QNOX SaaS tools; not subject to franchise territory restrictions.
                  </p>
                </label>
              </div>
            </div>

            {/* Section 1: Applicant Information */}
            <div className="space-y-3 pt-2">
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

                {/* Section 2b: GPS Geolocation & Geofencing Field */}
                <div className="sm:col-span-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-mono uppercase text-neutral-400 flex items-center space-x-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#c5a880]" />
                      <span>GPS Coordinates & Geofencing (Optional / Auto-Audited)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={detectingGps}
                      className="text-[10px] font-mono text-[#c5a880] hover:text-white uppercase flex items-center space-x-1 cursor-pointer transition"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{detectingGps ? 'DETECTING...' : 'DETECT MY GPS LOCATION'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      placeholder="Latitude (e.g. 19.0760)"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      placeholder="Longitude (e.g. 72.8777)"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880] font-mono"
                    />
                  </div>
                  {gpsStatus && (
                    <p className="text-[10px] font-mono text-[#c5a880] mt-1">{gpsStatus}</p>
                  )}
                  <p className="text-[9px] font-mono text-neutral-500 mt-1">
                    * If left blank, the system automatically geocodes your city and facility address against QNOX company branches.
                  </p>
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
                Territory validation executed automatically upon submission.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <span>VALIDATING TERRITORY & TRANSMITTING...</span>
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
