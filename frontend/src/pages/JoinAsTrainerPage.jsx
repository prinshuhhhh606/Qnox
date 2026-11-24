import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, ArrowLeft, Upload, Shield, Award,
  Dumbbell, Sparkles, AlertCircle, FileText, Lock, User,
  Mail, Phone, Calendar, Briefcase, MapPin, Building, Instagram, Linkedin, RefreshCw
} from 'lucide-react';
import { submitTrainerApplication } from '../services/api';

export default function JoinAsTrainerPage({ onShowToast, onOpenTrainerLogin }) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const handleTrainerLogin = () => {
    if (onOpenTrainerLogin) {
      onOpenTrainerLogin();
    } else if (outletCtx.onOpenAuth) {
      outletCtx.onOpenAuth('trainer');
    } else {
      navigate('/trainer');
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dateOfBirth: '',
    profilePhoto: '',

    // Step 2: Professional
    experienceYears: '',
    specializations: ['Personal Training', 'Weight Training'],
    qualifications: '',
    certifications: '',
    bio: '',

    // Step 3: Gym
    gymName: '',
    gymAddress: '',
    city: '',
    state: '',
    pincode: '',
    gymContactNumber: '',
    gymType: 'Independent Trainer',

    // Step 4: Documents & Social
    certificationDocument: '',
    identityProofDocument: '',
    experienceCertificateDocument: '',
    linkedinProfile: '',
    instagramProfile: '',
    confirmedAccuracy: false,
  });

  const specializationOptions = [
    'Weight Training',
    'Personal Training',
    'Yoga',
    'Cardio',
    'CrossFit',
    'Weight Loss',
    'Muscle Building',
    'Nutrition Coaching',
  ];

  const handleToggleSpecialization = (spec) => {
    setFormData((prev) => {
      const exists = prev.specializations.includes(spec);
      if (exists) {
        return { ...prev, specializations: prev.specializations.filter((s) => s !== spec) };
      } else {
        return { ...prev, specializations: [...prev.specializations, spec] };
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Mock document and image file upload to Data URL / public CDN URL
  const handleFileUpload = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [field]: reader.result,
        }));
        if (onShowToast) onShowToast({ type: 'success', message: `${file.name} uploaded successfully.` });
      };
      reader.readAsDataURL(file);
    }
  };

  // Step Validation
  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        alert('Please provide your full name');
        return false;
      }
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please provide a valid email address');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.length < 8) {
        alert('Please provide a valid mobile number');
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Password and confirm password do not match');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
        alert('Please specify your trainer experience in years');
        return false;
      }
      if (formData.specializations.length === 0) {
        alert('Please select at least one professional specialization');
        return false;
      }
      if (!formData.qualifications.trim()) {
        alert('Please enter your professional qualifications');
        return false;
      }
      if (!formData.bio.trim()) {
        alert('Please provide a short professional bio');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.city.trim()) {
        alert('Please specify your operational city');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.confirmedAccuracy) {
        alert('Please confirm the accuracy declaration before submitting');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      const res = await submitTrainerApplication(formData);
      if (res.success) {
        setSubmittedData(res.data);
        if (onShowToast) {
          onShowToast({
            type: 'success',
            title: 'Application Dispatched',
            message: `Your Trainer Application ID is ${res.data.applicationId}`,
          });
        }
      }
    } catch (err) {
      alert(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submittedData) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#ededed] py-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-[#0b0b0b] border border-[#c5a880]/30 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-[#c5a880]/10 border border-[#c5a880] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#c5a880]" />
          </div>

          <span className="text-xs uppercase tracking-[0.25em] text-[#c5a880] font-semibold">
            APPLICATION SUBMITTED SUCCESSFULLY
          </span>
          <h1 className="text-3xl font-serif text-white mt-2 mb-4">
            Welcome to the Sanctuary Candidate Queue
          </h1>

          <div className="bg-[#121212] border border-neutral-800 rounded-xl p-5 my-6 max-w-md mx-auto">
            <div className="text-xs uppercase tracking-wider text-neutral-400">Your Official Application ID</div>
            <div className="text-2xl font-mono text-[#c5a880] font-bold tracking-widest mt-1">
              {submittedData.applicationId}
            </div>
            <div className="text-[11px] text-neutral-500 mt-2">
              Save this ID to track your accreditation status.
            </div>
          </div>

          <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Your trainer application has been submitted successfully. Our admin team will review your credentials,
            experience certifications, and background. You will receive an email upon verification.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/trainer/application-status?appId=${submittedData.applicationId}`}
              className="px-6 py-3 bg-[#c5a880] text-black font-semibold text-xs uppercase tracking-wider rounded-lg hover:bg-[#d8bf9b] transition"
            >
              Track Application Status
            </Link>
            <Link
              to="/"
              className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold text-xs uppercase tracking-wider rounded-lg hover:text-white transition"
            >
              Return to Sanctuary
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] pt-24 pb-20">
      {/* Cinematic Hero Section - Matching Sanctuary Pages */}
      <section className="relative py-20 md:py-28 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg"
            alt="Join QNOX Trainer Network"
            className="w-full h-full object-cover opacity-60 scale-105 transform transition duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-black/40" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
          <div className="max-w-3xl">
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#c5a880] font-bold block mb-4">
              MASTER PRACTITIONERS &bull; RECRUITMENT NETWORK
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1] mb-6">
              Turn Your Fitness Passion Into a Profession.
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed mb-8">
              Join our professional fitness network, manage members, create workout plans, and grow your training career alongside London’s leading athletic architects.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#apply-form"
                className="px-8 py-3.5 bg-gradient-to-r from-[#c5a880] to-[#9b7e52] text-black font-semibold text-xs uppercase tracking-widest rounded-lg hover:opacity-95 shadow-lg shadow-[#c5a880]/20 transition flex items-center gap-2"
              >
                Apply as Trainer <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleTrainerLogin}
                className="px-8 py-3.5 bg-[#c5a880]/20 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black font-semibold text-xs uppercase tracking-widest rounded-lg shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Dumbbell className="w-4 h-4" />
                <span>Trainer Login</span>
              </button>
              <Link
                to="/trainer/application-status"
                className="px-8 py-3.5 bg-[#121212] border border-white/20 text-neutral-300 font-semibold text-xs uppercase tracking-widest rounded-lg hover:border-[#c5a880] hover:text-white transition"
              >
                Check Application Status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Multi-Step Form Section */}
      <section id="apply-form" className="py-16 md:py-24 px-4 max-w-4xl mx-auto">
        <div className="bg-[#0b0b0b] border border-[#c5a880]/20 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md">
          {/* Progress Indicator */}
          <div className="mb-10 pb-8 border-b border-neutral-800">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { s: 1, label: 'Personal' },
                { s: 2, label: 'Professional' },
                { s: 3, label: 'Gym Info' },
                { s: 4, label: 'Verification' },
              ].map((item) => (
                <div key={item.s} className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step === item.s
                        ? 'bg-[#c5a880] text-black shadow-lg shadow-[#c5a880]/40 scale-105'
                        : step > item.s
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                    }`}
                  >
                    {step > item.s ? <CheckCircle className="w-4 h-4" /> : item.s}
                  </div>
                  <span
                    className={`mt-2 text-[11px] uppercase tracking-wider font-medium ${
                      step === item.s ? 'text-[#c5a880]' : 'text-neutral-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#c5a880] to-[#9b7e52] h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-3 mb-4">
                  <h3 className="font-serif text-xl text-white">Step 1: Personal Information</h3>
                  <p className="text-xs text-neutral-400 mt-1">Provide your verified contact & identification details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Marcus Vance"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="trainer@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+44 7911 123456"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload('profilePhoto', e)}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-[#c5a880] hover:file:bg-[#252525]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Professional Information */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-3 mb-4">
                  <h3 className="font-serif text-xl text-white">Step 2: Professional Information</h3>
                  <p className="text-xs text-neutral-400 mt-1">Specify your coaching background, specializations, and credentials.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Trainer Experience (Years) *
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      max="40"
                      placeholder="e.g. 6"
                      value={formData.experienceYears}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">
                      Professional Specialization (Select all that apply) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {specializationOptions.map((spec) => {
                        const selected = formData.specializations.includes(spec);
                        return (
                          <button
                            type="button"
                            key={spec}
                            onClick={() => handleToggleSpecialization(spec)}
                            className={`p-2.5 rounded-lg text-xs font-medium border text-left transition ${
                              selected
                                ? 'bg-[#c5a880]/15 border-[#c5a880] text-[#c5a880]'
                                : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            {spec}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Professional Qualifications *
                    </label>
                    <input
                      type="text"
                      name="qualifications"
                      placeholder="e.g. BSc Sports Science, NASM-CPT, CSCS"
                      value={formData.qualifications}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Certifications & Accreditations
                    </label>
                    <input
                      type="text"
                      name="certifications"
                      placeholder="e.g. Olympic Weightlifting Level 2, Precision Nutrition"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Short Professional Bio *
                    </label>
                    <textarea
                      rows={3}
                      name="bio"
                      placeholder="Detail your training philosophy, coaching methodology, and client achievements..."
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Gym Information */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-3 mb-4">
                  <h3 className="font-serif text-xl text-white">Step 3: Gym & Sanctuary Base</h3>
                  <p className="text-xs text-neutral-400 mt-1">Tell us where you currently operate or train clients.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Gym / Studio Name</label>
                    <input
                      type="text"
                      name="gymName"
                      placeholder="e.g. Independent / Mayfair Private Studio"
                      value={formData.gymName}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Gym Type</label>
                    <select
                      name="gymType"
                      value={formData.gymType}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="Commercial Gym">Commercial Gym</option>
                      <option value="Personal Studio">Personal Studio</option>
                      <option value="Fitness Center">Fitness Center</option>
                      <option value="Independent Trainer">Independent Trainer</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Gym Address</label>
                    <input
                      type="text"
                      name="gymAddress"
                      placeholder="Street address or location"
                      value={formData.gymAddress}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">City *</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. London"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">State / Region</label>
                    <input
                      type="text"
                      name="state"
                      placeholder="e.g. Greater London"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Pincode / Postal Code</label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="e.g. W1K 4QQ"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">Gym Contact Number</label>
                    <input
                      type="text"
                      name="gymContactNumber"
                      placeholder="+44 20 7946 0000"
                      value={formData.gymContactNumber}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Documents & Verification */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-3 mb-4">
                  <h3 className="font-serif text-xl text-white">Step 4: Documents & Verification</h3>
                  <p className="text-xs text-neutral-400 mt-1">Upload verified documentation for admin review.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Upload Fitness Certification (PDF/Image)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('certificationDocument', e)}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-[#c5a880] hover:file:bg-[#252525]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Upload Identity Proof (Passport/National ID)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('identityProofDocument', e)}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-[#c5a880] hover:file:bg-[#252525]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Upload Experience Certificate (Optional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('experienceCertificateDocument', e)}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#1a1a1a] file:text-[#c5a880] hover:file:bg-[#252525]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      LinkedIn Profile (Optional)
                    </label>
                    <input
                      type="url"
                      name="linkedinProfile"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedinProfile}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                      Instagram Profile / Fitness Portfolio (Optional)
                    </label>
                    <input
                      type="text"
                      name="instagramProfile"
                      placeholder="@yourhandle"
                      value={formData.instagramProfile}
                      onChange={handleInputChange}
                      className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#141414] border border-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        name="confirmedAccuracy"
                        checked={formData.confirmedAccuracy}
                        onChange={handleInputChange}
                        className="mt-0.5 accent-[#c5a880]"
                        required
                      />
                      <span className="text-xs text-neutral-300">
                        I confirm that all information and documentation provided is authentic, correct, and subject to
                        sanctuary administrative review and compliance checks.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 bg-[#c5a880] text-black rounded-lg text-xs uppercase tracking-wider font-semibold hover:bg-[#d8bf9b] transition flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#c5a880] to-[#9b7e52] text-black rounded-lg text-xs uppercase tracking-widest font-bold hover:opacity-95 transition flex items-center gap-2 shadow-lg shadow-[#c5a880]/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
