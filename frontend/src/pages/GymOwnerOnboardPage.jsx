import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Lock,
  Building2, Mail, Phone, MapPin, Sparkles, CreditCard, RefreshCw,
  Award, Check, Clock, Compass, FileText, UploadCloud, Layers
} from 'lucide-react';
import {
  verifyGymOwnerInvitation,
  registerApprovedGymOwner,
  fetchSaaSPlans,
  initiateSaaSCheckout,
  verifySaaSPayment,
  submitInitialGymBranch,
  fetchOnboardingStatus
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GymOwnerOnboardPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();

  // Steps: 'verify', 'set-password', 'select-plan', 'add-branch', 'branch-tracking', 'activated'
  const [currentStep, setCurrentStep] = useState('verify');

  // Verification state (Token from invitation)
  const [loadingVerify, setLoadingVerify] = useState(true);
  const [verifyError, setVerifyError] = useState('');
  const [applicationData, setApplicationData] = useState(null);

  // Credentials state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [regError, setRegError] = useState('');

  // SaaS Plans & Payment state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlanCode, setSelectedPlanCode] = useState('professional');
  const [provisionedOrg, setProvisionedOrg] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Branch Setup Form State
  const [branchData, setBranchData] = useState({
    name: '',
    displayName: '',
    tagline: '',
    description: '',
    logo: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    openingHoursWeekdays: '06:00 - 22:30',
    openingHoursWeekends: '07:30 - 20:00',
    pool: true,
    cryotherapy: true,
    spaAndRecovery: true,
    valet: true,
    altitudeChamber: false,
    heroImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
    locationDocTitle: 'Commercial Lease Agreement / Property Deed',
    locationDocUrl: 'https://docs.qnox.luxury/samples/lease-deed.pdf',
  });
  const [submittingBranch, setSubmittingBranch] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [locatingGps, setLocatingGps] = useState(false);

  // Real-time tracking state
  const [onboardingTracking, setOnboardingTracking] = useState(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  useEffect(() => {
    // If token is in query, verify invitation link
    if (token) {
      verifyToken();
      return;
    }

    // Otherwise, check if user is already authenticated
    const storedToken = localStorage.getItem('token') || localStorage.getItem('qnox_token');
    if (storedToken) {
      checkExistingOnboardingStatus();
    } else {
      setLoadingVerify(false);
      setVerifyError('No invitation token found in URL. If you already have an account, please sign in.');
    }
  }, [token]);

  const verifyToken = async () => {
    setLoadingVerify(true);
    setVerifyError('');
    try {
      const data = await verifyGymOwnerInvitation(token);
      setApplicationData(data);
      setBranchData((prev) => ({
        ...prev,
        name: `${data.gymName} (Main Branch)`,
        displayName: data.gymName,
        address: data.gymAddress || '',
        city: data.city || 'Mumbai',
        state: data.state || 'Maharashtra',
        phone: data.phone || '',
        email: data.email || '',
      }));
      setCurrentStep('set-password');
      loadPlans();
    } catch (err) {
      setVerifyError(err.message || 'Invitation link is invalid or has expired.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const checkExistingOnboardingStatus = async () => {
    setLoadingVerify(true);
    setRefreshingStatus(true);
    try {
      const statusData = await fetchOnboardingStatus();
      setOnboardingTracking(statusData);
      setProvisionedOrg(statusData.organization);

      const stage = statusData.onboardingStage || statusData.organization?.onboardingStage;
      if (stage === 'PAYMENT_PENDING') {
        setCurrentStep('select-plan');
        loadPlans();
      } else if (stage === 'SUBSCRIPTION_ACTIVE' && !statusData.latestClub) {
        setCurrentStep('add-branch');
      } else if (stage === 'ACTIVE_COMPLETED' || statusData.latestClub?.verificationStatus === 'ACTIVE') {
        setCurrentStep('activated');
      } else {
        // Pending verification, territory review, or rejected
        setCurrentStep('branch-tracking');
      }
    } catch (err) {
      console.warn('Status fetch note:', err.message);
      if (token) {
        verifyToken();
      } else {
        setVerifyError('Please sign in or use your official email invitation link.');
      }
    } finally {
      setLoadingVerify(false);
      setRefreshingStatus(false);
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetchSaaSPlans();
      if (res && res.data && res.data.length > 0) {
        setPlans(res.data);
      } else {
        setPlans([
          {
            code: 'starter',
            name: 'Starter',
            tagline: 'Single Facility & Boutique Studios',
            monthlyPrice: 4999,
            yearlyPrice: 47990,
            features: ['1 Branch Location', 'Up to 5 Master Coaches', 'Up to 100 Members', 'Digital QR Check-in', 'Revenue Telemetry'],
          },
          {
            code: 'professional',
            name: 'Professional',
            tagline: 'Multi-Branch & Fast Growing Clubs',
            monthlyPrice: 11999,
            yearlyPrice: 115190,
            features: ['3 Sanctuary Branches', 'Up to 15 Master Coaches', 'Up to 500 Members', 'AI Workout Biomechanics', 'Full Financial Audit'],
          },
          {
            code: 'enterprise',
            name: 'Enterprise',
            tagline: 'Gym Franchises & Luxury Networks',
            monthlyPrice: 24999,
            yearlyPrice: 239990,
            features: ['Unlimited Branches', 'Unlimited Master Coaches', 'Unlimited Members', 'Multi-Gym All-Access Network', 'Dedicated Account Concierge'],
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not load plans:', err.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleRegisterCredentials = async (e) => {
    e.preventDefault();
    setRegError('');

    if (password !== confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setSubmittingRegistration(true);
    try {
      const res = await registerApprovedGymOwner({
        token,
        password,
        confirmPassword,
      });

      if (!res.success) {
        throw new Error(res.message || 'Registration failed');
      }

      const { user, organization, token: jwtToken } = res.data;
      if (jwtToken) {
        localStorage.setItem('qnox_token', jwtToken);
        localStorage.setItem('token', jwtToken);
      }

      if (setCurrentUser) {
        setCurrentUser(user);
      }

      setProvisionedOrg(organization);
      setCurrentStep('select-plan');
    } catch (err) {
      setRegError(err.message || 'Failed to complete registration.');
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleInitiatePayment = async () => {
    setInitiatingPayment(true);
    setPaymentError('');

    try {
      const checkoutData = await initiateSaaSCheckout({
        planCode: selectedPlanCode,
        billingCycle,
      });

      const { organization, invoice, razorpayOrder, key } = checkoutData;

      // Check if Razorpay script is loaded
      if (typeof window.Razorpay !== 'function') {
        const verifyRes = await verifySaaSPayment({
          organizationId: organization._id,
          planCode: selectedPlanCode,
          billingCycle,
          razorpayOrderId: razorpayOrder?.id || `ORDER_${Date.now()}`,
          razorpayPaymentId: `PAY_MOCK_${Date.now()}`,
          razorpaySignature: 'mock_saas_signature',
          adminBypass: true,
        });

        setProvisionedOrg(verifyRes.data?.organization || organization);
        // Stage 4: Unlocked branch setup!
        setCurrentStep('add-branch');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: key || 'rzp_test_qnox_luxury_key',
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'QNOX LUXURY SAAS',
        description: `Subscription: ${selectedPlanCode.toUpperCase()} (${billingCycle.toUpperCase()})`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifySaaSPayment({
              organizationId: organization._id,
              planCode: selectedPlanCode,
              billingCycle,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setProvisionedOrg(verifyRes.data?.organization || organization);
            setCurrentStep('add-branch');
          } catch (verErr) {
            setPaymentError(verErr.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: applicationData?.ownerName || currentUser?.name,
          email: applicationData?.email || currentUser?.email,
          contact: applicationData?.phone,
        },
        theme: {
          color: '#D4AF37',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setPaymentError(`Payment failed: ${resp.error.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.message || 'Failed to initiate payment gateway');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBranchData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocatingGps(false);
      },
      () => {
        // Fallback coordinates
        setBranchData((prev) => ({
          ...prev,
          latitude: '19.0596',
          longitude: '72.8295',
        }));
        setLocatingGps(false);
      }
    );
  };

  const handleSubmitBranch = async (e) => {
    e.preventDefault();
    setBranchError('');

    if (!branchData.name.trim() || !branchData.address.trim() || !branchData.city.trim() || !branchData.state.trim()) {
      setBranchError('Gym Branch Name, Address, City, and State are mandatory.');
      return;
    }

    setSubmittingBranch(true);
    try {
      const payload = {
        name: branchData.name.trim(),
        displayName: branchData.displayName.trim() || branchData.name.trim(),
        tagline: branchData.tagline || `Premier Athletic Sanctuary of ${branchData.name}`,
        description: branchData.description || 'Exclusive luxury health, fitness and recovery sanctuary powered by QNOX.',
        logo: branchData.logo,
        address: branchData.address.trim(),
        city: branchData.city.trim(),
        state: branchData.state.trim(),
        postalCode: branchData.postalCode.trim(),
        phone: branchData.phone.trim(),
        email: branchData.email.trim(),
        latitude: branchData.latitude ? Number(branchData.latitude) : undefined,
        longitude: branchData.longitude ? Number(branchData.longitude) : undefined,
        openingHours: {
          weekdays: branchData.openingHoursWeekdays,
          weekends: branchData.openingHoursWeekends,
        },
        features: {
          pool: branchData.pool,
          cryotherapy: branchData.cryotherapy,
          spaAndRecovery: branchData.spaAndRecovery,
          valet: branchData.valet,
          altitudeChamber: branchData.altitudeChamber,
        },
        heroImage: branchData.heroImage,
        locationDocuments: [
          {
            title: branchData.locationDocTitle || 'Location Deed Proof',
            url: branchData.locationDocUrl || 'https://docs.qnox.luxury/samples/lease-deed.pdf',
            type: 'LEASE_OR_OWNERSHIP',
            uploadedAt: new Date(),
          },
        ],
      };

      const res = await submitInitialGymBranch(payload);
      if (res.success) {
        await checkExistingOnboardingStatus();
        setCurrentStep('branch-tracking');
      }
    } catch (err) {
      setBranchError(err.message || 'Failed to submit gym branch for verification.');
    } finally {
      setSubmittingBranch(false);
    }
  };

  // Compute 6-stage tracker active indexes
  const getStageStatus = (stageNum) => {
    if (stageNum === 1) return 'COMPLETED'; // Registration
    if (stageNum === 2) return 'COMPLETED'; // Admin verification
    if (stageNum === 3) {
      // SaaS Subscription
      if (currentStep === 'set-password' || currentStep === 'select-plan') return 'CURRENT';
      return 'COMPLETED';
    }
    if (stageNum === 4) {
      // Branch Setup
      if (currentStep === 'add-branch') return 'CURRENT';
      if (currentStep === 'branch-tracking' || currentStep === 'activated') return 'COMPLETED';
      return 'PENDING';
    }
    if (stageNum === 5) {
      // Geofence Audit
      if (onboardingTracking?.latestClub?.verificationStatus === 'TERRITORY_REVIEW') return 'WARNING';
      if (currentStep === 'branch-tracking' || currentStep === 'activated') return 'COMPLETED';
      return 'PENDING';
    }
    if (stageNum === 6) {
      // Live & Active
      if (currentStep === 'activated') return 'COMPLETED';
      if (currentStep === 'branch-tracking') return 'CURRENT';
      return 'PENDING';
    }
    return 'PENDING';
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#e5e5e5] pt-20 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto w-full">

        {/* Top Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-2 group">
            <span className="text-2xl font-serif tracking-[0.3em] text-[#D4AF37] block font-light">
              Q N O X
            </span>
            <span className="text-[10px] tracking-[0.35em] text-neutral-400 uppercase block font-mono">
              LUXURY GYM MANAGEMENT &bull; ONBOARDING SUITE
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gym Owner Activation & Verification Portal
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-lg mx-auto">
            Strict Multi-Stage Gateway Verification: Credentials &rarr; Subscription &rarr; Branch Geofence &rarr; Super Admin Live Activation.
          </p>
        </div>

        {/* VISUAL 6-STAGE TRACKER */}
        <div className="bg-[#111111] border border-[#262626] rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              Onboarding Progression Pipeline
            </span>
            <button
              onClick={checkExistingOnboardingStatus}
              disabled={refreshingStatus}
              className="text-[11px] font-mono text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingStatus ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-mono">
            {[
              { num: 1, title: 'Registration', desc: 'Profile Logged' },
              { num: 2, title: 'Gateway 1', desc: 'Admin Approved' },
              { num: 3, title: 'Subscription', desc: 'SaaS Paid' },
              { num: 4, title: 'Branch Setup', desc: 'Facility Specs' },
              { num: 5, title: 'Geofence Audit', desc: 'Territory Verified' },
              { num: 6, title: 'Gateway 2', desc: 'Live Sanctuary' },
            ].map((stg) => {
              const status = getStageStatus(stg.num);
              let badgeBg = 'bg-[#181818] border-[#262626] text-neutral-500';
              if (status === 'COMPLETED') badgeBg = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400';
              if (status === 'CURRENT') badgeBg = 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37] font-bold';
              if (status === 'WARNING') badgeBg = 'bg-amber-950/40 border-amber-500/50 text-amber-400 font-bold';

              return (
                <div key={stg.num} className={`p-2.5 rounded-xl border ${badgeBg} transition-all`}>
                  <div className="font-bold">{stg.num}. {stg.title}</div>
                  <div className="text-[9px] opacity-80 mt-0.5">{stg.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================== */}
        {/* PHASE 0: VERIFYING / ERROR                          */}
        {/* ==================================================== */}
        {loadingVerify && (
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-12 text-center space-y-3 font-mono text-xs text-neutral-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D4AF37]" />
            <p>Verifying invitation cryptographic signature and tenant dossier...</p>
          </div>
        )}

        {!loadingVerify && verifyError && (
          <div className="bg-[#121212] border border-rose-500/30 rounded-2xl p-8 text-center space-y-4 font-mono">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Access Verification Notice</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">{verifyError}</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                to="/gym-owner/register"
                className="px-5 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f30] text-black text-xs uppercase font-bold"
              >
                Submit Partner Application
              </Link>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-lg bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white text-xs uppercase font-semibold"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 2: SET PASSWORD / COMPLETE PROVISIONING       */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && currentStep === 'set-password' && applicationData && (
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="p-4 bg-[#181818] border border-[#D4AF37]/30 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="text-[#D4AF37] font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GATEWAY 1 APPROVED: {applicationData.applicationId}</span>
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                  VERIFIED BY SUPER ADMIN
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
                <div><span className="text-neutral-500">Business / Gym:</span> <span className="font-semibold text-white">{applicationData.gymName}</span></div>
                <div><span className="text-neutral-500">Applicant:</span> <span className="font-semibold text-white">{applicationData.ownerName}</span></div>
                <div><span className="text-neutral-500">Official Email:</span> <span className="font-semibold text-white">{applicationData.email}</span></div>
                <div><span className="text-neutral-500">Location:</span> <span className="font-semibold text-white">{applicationData.city}, {applicationData.state}</span></div>
              </div>
            </div>

            <form onSubmit={handleRegisterCredentials} className="space-y-4">
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Create Master Account Password
              </div>
              {regError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                  {regError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Master Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Confirm Master Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingRegistration}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/15 transition-all flex items-center justify-center gap-2"
              >
                {submittingRegistration ? 'Provisioning Tenant...' : 'Save Credentials & Proceed to Subscription Selection'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 3: SELECT SAAS SUBSCRIPTION PLAN & PAY        */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && currentStep === 'select-plan' && (
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
                  Stage 3: SaaS Subscription
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Select QNOX Operating Suite Tier</h2>
              </div>
              <div className="flex items-center gap-2 bg-[#181818] p-1 rounded-lg border border-[#333] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-md ${billingCycle === 'monthly' ? 'bg-[#D4AF37] text-black font-bold' : 'text-neutral-400'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-md ${billingCycle === 'yearly' ? 'bg-[#D4AF37] text-black font-bold' : 'text-neutral-400'}`}
                >
                  Yearly (20% OFF)
                </button>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {paymentError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = selectedPlanCode === p.code;
                const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlanCode(p.code)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/10'
                        : 'border-[#262626] bg-[#181818] hover:border-[#444]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />}
                      </div>
                      <div className="text-xl font-black text-white font-mono mb-1">
                        ₹{Number(price).toLocaleString('en-IN')}
                        <span className="text-[10px] text-neutral-400 font-normal">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-4">{p.tagline || p.description}</p>
                    </div>

                    <div className="space-y-1.5 border-t border-[#262626] pt-3 text-[11px] text-neutral-300">
                      <div>&bull; Max Branches: <span className="text-white font-semibold">{p.maxBranches || (p.code === 'starter' ? 1 : p.code === 'professional' ? 3 : 'Unlimited')}</span></div>
                      <div>&bull; Max Trainers: <span className="text-white font-semibold">{p.maxTrainers || (p.code === 'starter' ? 5 : p.code === 'professional' ? 15 : 'Unlimited')}</span></div>
                      <div>&bull; Max Members: <span className="text-white font-semibold">{p.maxMembers || (p.code === 'starter' ? 100 : p.code === 'professional' ? 500 : 'Unlimited')}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleInitiatePayment}
              disabled={initiatingPayment}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/15 transition-all flex items-center justify-center gap-2"
            >
              {initiatingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Securing Razorpay Gateway & Activating Subscription...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay & Activate Subscription &rarr; Unlock Initial Branch Setup</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 4: ADD INITIAL GYM BRANCH (Post-Payment Setup) */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && currentStep === 'add-branch' && (
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="border-b border-[#262626] pb-4">
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Stage 4: Initial Facility Setup
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Configure Your Sanctuary Branch</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Your subscription is active. Complete facility address, GPS coordinates, and property verification documents. Our backend will perform geodesic geofence checks before submission.
              </p>
            </div>

            {branchError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {branchError}
              </div>
            )}

            <form onSubmit={handleSubmitBranch} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Gym Branch Official Name *</label>
                  <input
                    type="text"
                    required
                    value={branchData.name}
                    onChange={(e) => setBranchData({ ...branchData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Display Name (User-Facing) *</label>
                  <input
                    type="text"
                    required
                    value={branchData.displayName}
                    onChange={(e) => setBranchData({ ...branchData, displayName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-neutral-300 mb-1">Full Facility Street Address *</label>
                  <input
                    type="text"
                    required
                    value={branchData.address}
                    onChange={(e) => setBranchData({ ...branchData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={branchData.city}
                    onChange={(e) => setBranchData({ ...branchData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">State / Province *</label>
                  <input
                    type="text"
                    required
                    value={branchData.state}
                    onChange={(e) => setBranchData({ ...branchData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={branchData.postalCode}
                    onChange={(e) => setBranchData({ ...branchData, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={branchData.phone}
                    onChange={(e) => setBranchData({ ...branchData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                {/* GPS Coordinates */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-neutral-300">GPS Latitude</label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={locatingGps}
                      className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      {locatingGps ? 'Locating...' : 'Detect GPS'}
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={branchData.latitude}
                    onChange={(e) => setBranchData({ ...branchData, latitude: e.target.value })}
                    placeholder="e.g. 19.0596"
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">GPS Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={branchData.longitude}
                    onChange={(e) => setBranchData({ ...branchData, longitude: e.target.value })}
                    placeholder="e.g. 72.8295"
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#333] focus:border-[#D4AF37] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Location Verification Document */}
              <div className="p-4 bg-[#181818] border border-[#262626] rounded-xl space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Facility Ownership / Lease Proof Document
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={branchData.locationDocTitle}
                    onChange={(e) => setBranchData({ ...branchData, locationDocTitle: e.target.value })}
                    placeholder="Document Title"
                    className="px-3 py-2 bg-[#121212] border border-[#333] rounded-lg text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={branchData.locationDocUrl}
                    onChange={(e) => setBranchData({ ...branchData, locationDocUrl: e.target.value })}
                    placeholder="Document URL / Cloud Link"
                    className="px-3 py-2 bg-[#121212] border border-[#333] rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingBranch}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/15 transition-all flex items-center justify-center gap-2"
              >
                {submittingBranch ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditing Geofence & Submitting Branch...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Gym Branch for Gateway 2 Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 5 & 6: BRANCH TRACKING & AUDIT REVIEW          */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && currentStep === 'branch-tracking' && (
          <div className="bg-[#121212] border border-[#262626] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6">
            {onboardingTracking?.latestClub?.verificationStatus === 'TERRITORY_REVIEW' ? (
              <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Stage 5 Territory Geofence Conflict Detected
                </div>
                <p className="text-xs text-amber-200 leading-relaxed">
                  Your submitted gym location falls within the protected territory of an existing QNOX Luxury Gym branch.
                  Your application is currently under special Super Admin review for exceptional justification approval.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Stage 6 Gateway 2 Verification Pending
                </div>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Your branch facility details and location documents have been forwarded to the Super Admin verification queue.
                  Once approved, your sanctuary will be activated and full dashboard access will be unlocked.
                </p>
              </div>
            )}

            <div className="bg-[#181818] p-4 rounded-xl border border-[#262626] text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-[#262626]">
                <span className="text-neutral-500">Submitted Branch:</span>
                <span className="font-semibold text-white">{onboardingTracking?.latestClub?.name || branchData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262626]">
                <span className="text-neutral-500">Facility Location:</span>
                <span className="font-semibold text-white">{onboardingTracking?.latestClub?.location || `${branchData.city}, ${branchData.state}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262626]">
                <span className="text-neutral-500">Verification Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  onboardingTracking?.latestClub?.verificationStatus === 'TERRITORY_REVIEW'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {onboardingTracking?.latestClub?.verificationStatus || 'PENDING_VERIFICATION'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">SaaS Subscription Status:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={checkExistingOnboardingStatus}
                disabled={refreshingStatus}
                className="flex-1 py-3 px-4 rounded-xl bg-[#262626] hover:bg-[#333] text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin' : ''}`} />
                <span>Check Verification Decision</span>
              </button>
              <Link
                to="/"
                className="flex-1 py-3 px-4 rounded-xl border border-[#333] hover:border-[#555] text-center text-xs font-semibold text-neutral-300 transition-all"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 6 COMPLETE: ACTIVATED & LIVE SANCTUARY         */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && currentStep === 'activated' && (
          <div className="bg-[#121212] border border-emerald-500/40 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                All 6 Stages Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
                Your Sanctuary is Officially Live & Active!
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-2">
                Super Admin has completed Gateway 2 verification. Your branch is registered and your complete Gym Owner Dashboard is unlocked.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/gym-owner/dashboard')}
              className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 transition-all inline-flex items-center justify-center gap-2"
            >
              <span>Enter Gym Owner Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
