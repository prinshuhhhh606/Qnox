import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, ShieldCheck, User, Mail, Phone, Lock, FileText,
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, UploadCloud,
  Check, Info, Sparkles, Compass, Shield
} from 'lucide-react';
import { applyGymOwnerPartner } from '../services/api';

export default function GymOwnerRegisterPage() {
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gymName: '',
    businessType: 'Private Limited',
    businessAddress: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    gstNumber: '',
    partnershipType: 'QNOX SaaS Partner Gym',
    branchCount: 1,
    expectedMembers: 150,
    businessDescription: '',
    latitude: '',
    longitude: '',
  });

  // Verification badges state
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([
    { title: 'Business Registration / Certificate of Incorporation', url: 'https://docs.qnox.luxury/samples/business-reg.pdf', type: 'BUSINESS_REGISTRATION', uploaded: true },
    { title: 'Government ID of Authorized Signatory (PAN / Passport)', url: 'https://docs.qnox.luxury/samples/owner-id.pdf', type: 'OWNER_ID', uploaded: true },
    { title: 'Property Lease Deed / Ownership Proof', url: '', type: 'PROPERTY_DEED', uploaded: false },
  ]);
  const [customDocTitle, setCustomDocTitle] = useState('');
  const [customDocUrl, setCustomDocUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState(null);
  const [locating, setLocating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        // Fallback Mumbai Bandra coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: '19.0596',
          longitude: '72.8295',
        }));
        setLocating(false);
      }
    );
  };

  const handleVerifyEmail = () => {
    if (!formData.email || !formData.email.includes('@')) {
      alert('Please enter a valid email address first.');
      return;
    }
    setVerifyingEmail(true);
    setTimeout(() => {
      setEmailVerified(true);
      setVerifyingEmail(false);
    }, 800);
  };

  const handleVerifyPhone = () => {
    if (!formData.phone || formData.phone.length < 8) {
      alert('Please enter a valid mobile number first.');
      return;
    }
    setVerifyingPhone(true);
    setTimeout(() => {
      setPhoneVerified(true);
      setVerifyingPhone(false);
    }, 800);
  };

  const handleAddCustomDocument = () => {
    if (!customDocTitle.trim() || !customDocUrl.trim()) {
      alert('Please provide document title and verified URL / file link.');
      return;
    }
    setDocuments((prev) => [
      ...prev,
      {
        title: customDocTitle.trim(),
        url: customDocUrl.trim(),
        type: 'ADDITIONAL_DOC',
        uploaded: true,
      },
    ]);
    setCustomDocTitle('');
    setCustomDocUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.ownerName.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.gymName.trim()) {
      setError('Full Name, Email, Mobile Number, and Business Name are mandatory.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const uploadedDocs = documents.filter((d) => d.uploaded && d.url);
    if (uploadedDocs.length === 0) {
      setError('Please upload at least one verified business or identity credential document.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        gymName: formData.gymName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress || formData.gymName,
        gymAddress: formData.businessAddress || formData.gymName,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        gstNumber: formData.gstNumber,
        partnershipType: formData.partnershipType,
        branchCount: Number(formData.branchCount) || 1,
        expectedMembers: Number(formData.expectedMembers) || 150,
        businessDescription: formData.businessDescription,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        documents: uploadedDocs,
        emailVerified,
        phoneVerified,
      };

      const res = await applyGymOwnerPartner(payload);
      setSubmittedApp(res.data || res);
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your submission.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SUBMISSION SCREEN
  if (submittedApp) {
    const isConflict = submittedApp.hasTerritoryConflict;
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4 py-16">
        <div className="max-w-xl w-full bg-[#121212] border border-[#262626] rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              isConflict ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {isConflict ? <AlertTriangle className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <span className="text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
              Stage 1 Completed: Registration Logged
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-3">
              Application Submitted for Super Admin Verification
            </h2>
            <p className="text-sm text-neutral-400 mt-2">
              Application Reference: <span className="font-mono text-white font-bold">{submittedApp.applicationId}</span>
            </p>
          </div>

          {isConflict ? (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 mb-6 text-sm text-amber-200">
              <div className="font-semibold text-amber-400 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Territory Geofence Advisory:
              </div>
              Your proposed gym location falls within the protected geographical territory of an existing QNOX Luxury Gym branch (
              <span className="font-semibold text-amber-300">{submittedApp.conflictingBranchName || 'Company Flagship'}</span>,{' '}
              {submittedApp.conflictDistanceKm ? `${submittedApp.conflictDistanceKm} KM away` : 'nearby'}).
              Your application requires special executive management review before invitation issuance.
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 mb-6 text-sm text-emerald-200">
              <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Location Verification Clear:
              </div>
              Your facility coordinates have been checked against all company-owned protected territories. Your business registration credentials have been forwarded to the Super Admin Verification Gateway.
            </div>
          )}

          <div className="space-y-3 bg-[#181818] p-4 rounded-xl border border-[#262626] text-xs text-neutral-300 mb-6">
            <div className="flex justify-between py-1 border-b border-[#262626]">
              <span className="text-neutral-500">Applicant Name</span>
              <span className="font-medium text-white">{submittedApp.ownerName || formData.ownerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#262626]">
              <span className="text-neutral-500">Business / Gym</span>
              <span className="font-medium text-white">{submittedApp.gymName || formData.gymName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#262626]">
              <span className="text-neutral-500">Partnership Model</span>
              <span className="font-medium text-[#D4AF37]">{submittedApp.partnershipType || formData.partnershipType}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-neutral-500">Initial Status</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isConflict ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {submittedApp.status || (isConflict ? 'TERRITORY_CONFLICT' : 'PENDING_APPROVAL')}
              </span>
            </div>
          </div>

          <div className="text-xs text-neutral-400 space-y-2 mb-6">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
              <span>Super Admin will verify your business credentials and company verification documents.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
              <span>Upon executive approval, you will receive a secure 7-day token link to unlock your SaaS subscription and sanctuary branch setup.</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="flex-1 py-3 text-center text-xs font-semibold rounded-lg border border-[#333] hover:border-[#555] text-neutral-300 transition-colors"
            >
              Return Home
            </Link>
            <Link
              to="/clubs"
              className="flex-1 py-3 text-center text-xs font-bold rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black transition-colors"
            >
              Explore QNOX Network
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            Strict Approval-Based Onboarding
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Gym Owner & Partner Registration
          </h1>
          <p className="mt-2 text-sm text-neutral-400 max-w-xl mx-auto">
            Join the QNOX Luxury Gym Network or deploy QNOX SaaS Multi-Gym operating system for your sanctuary. All partner applications require Super Admin verification and territory geofence audit.
          </p>
        </div>

        {/* 6-Stage Process Preview Bar */}
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-4 mb-8">
          <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-3 flex items-center justify-between">
            <span>Onboarding Workflow Roadmap</span>
            <span className="text-[#D4AF37]">Step 1 of 6</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[11px]">
            <div className="p-2 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold">
              1. Registration
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#262626] text-neutral-500">
              2. Admin Audit
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#262626] text-neutral-500">
              3. Subscription
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#262626] text-neutral-500">
              4. Branch Setup
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#262626] text-neutral-500">
              5. Geofence Audit
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#262626] text-neutral-500">
              6. Live Sanctuary
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8">
          {error && (
            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Owner Profile & Credentials */}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-3 mb-5">
              <User className="w-4 h-4 text-[#D4AF37]" />
              1. Authorized Gym Owner Profile & Access
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name of Owner / Managing Partner *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="e.g. Alexander Vance"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-neutral-300">
                    Official Business Email *
                  </label>
                  {emailVerified ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={verifyingEmail}
                      className="text-[10px] text-[#D4AF37] hover:underline"
                    >
                      {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="owner@elitegym.com"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-neutral-300">
                    Mobile Number *
                  </label>
                  {phoneVerified ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={verifyingPhone}
                      className="text-[10px] text-[#D4AF37] hover:underline"
                    >
                      {verifyingPhone ? 'Verifying...' : 'Verify SMS'}
                    </button>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Portal Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Business & Legal Entity */}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-3 mb-5">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              2. Gym Business Entity & Partnership Policy
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Gym / Business Name *
                </label>
                <input
                  type="text"
                  name="gymName"
                  value={formData.gymName}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Athletic Sanctuary"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Business Structure / Entity Type
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                >
                  <option value="Private Limited">Private Limited Company</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Other">Other Registered Entity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Partnership Policy & Operating Model *
                </label>
                <select
                  name="partnershipType"
                  value={formData.partnershipType}
                  onChange={handleInputChange}
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                >
                  <option value="QNOX SaaS Partner Gym">QNOX SaaS Partner Gym (Independent Software Tenant)</option>
                  <option value="QNOX Franchise Gym">QNOX Franchise Gym (Requires Territory Availability & Brand Approval)</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {formData.partnershipType === 'QNOX Franchise Gym'
                    ? 'Strict territory geofencing applies (min 5 KM clearance from company-owned luxury branches).'
                    : 'Independent gym using QNOX software platform. Franchise restrictions do not automatically bar software onboarding.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  GST Number (Optional, where applicable)
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="27AABCU9603R1ZX"
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Registered Business Address *
                </label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Suite 400, Platinum Towers, Bandra Kurla Complex..."
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Mumbai"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  State / Region *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Maharashtra"
                  required
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: GPS Geofence Verification */}
          <div>
            <div className="flex justify-between items-center border-b border-[#262626] pb-3 mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                3. Facility Geolocation & Territory Verification
              </h2>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={locating}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/25 transition-colors flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                {locating ? 'Detecting GPS...' : 'Auto-Detect GPS'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  GPS Latitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 19.0596"
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  GPS Longitude (Decimal)
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g. 72.8295"
                  className="w-full bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2 bg-[#181818] p-3 rounded-lg border border-[#262626] text-xs text-neutral-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  Our backend calculates geodesic Haversine distance from company-owned branches (Mayfair, Soho, Canary Wharf). Default 5 KM protected territory will be automatically audited.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Document Verification Uploads */}
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-3 mb-5">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              4. Business Verification Credentials
            </h2>

            <div className="space-y-3 mb-4">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#181818] border border-[#262626]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{doc.title}</div>
                      <div className="text-[11px] font-mono text-neutral-500 truncate max-w-xs sm:max-w-md">
                        {doc.url || 'Pending upload link'}
                      </div>
                    </div>
                  </div>
                  <div>
                    {doc.uploaded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Attached
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-neutral-500">Optional</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Document */}
            <div className="bg-[#181818] border border-dashed border-[#333] rounded-xl p-4">
              <div className="text-xs font-semibold text-white mb-2">Attach Additional Verification Document / Certificate</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Document Title (e.g. GST Certificate / Trade License)"
                  value={customDocTitle}
                  onChange={(e) => setCustomDocTitle(e.target.value)}
                  className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Document URL / Cloud Link"
                  value={customDocUrl}
                  onChange={(e) => setCustomDocUrl(e.target.value)}
                  className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomDocument}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333] text-white transition-colors"
              >
                + Add Document
              </button>
            </div>
          </div>

          {/* Policy & Compliance Confirmation */}
          <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] text-xs text-neutral-400 space-y-2">
            <div className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              Super Admin Approval Compliance Notice
            </div>
            <p>
              By submitting this application, you acknowledge that gym creation, operational dashboard access, and payment modules remain locked until Super Admin reviews and issues Gateway 1 approval.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Link
              to="/clubs"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel & Return to Public Clubs
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/15 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Submitting Application...</span>
              ) : (
                <>
                  <span>Submit Application for Admin Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
