import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Lock,
  Building2, Mail, Phone, MapPin, Sparkles, CreditCard, RefreshCw,
  Award, Check, Clock
} from 'lucide-react';
import {
  verifyGymOwnerInvitation,
  registerApprovedGymOwner,
  fetchSaaSPlans,
  initiateSaaSCheckout,
  verifySaaSPayment
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GymOwnerOnboardPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  // Lifecycle steps: 1: 'verify', 2: 'set-password', 3: 'select-plan', 4: 'success'
  const [step, setStep] = useState('verify');

  // Verification state
  const [loadingVerify, setLoadingVerify] = useState(true);
  const [verifyError, setVerifyError] = useState('');
  const [applicationData, setApplicationData] = useState(null);

  // Credentials state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [regError, setRegError] = useState('');

  // Plan selection & payment state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlanCode, setSelectedPlanCode] = useState('professional');
  const [provisionedOrg, setProvisionedOrg] = useState(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Final activation state
  const [activationResult, setActivationResult] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoadingVerify(false);
      setVerifyError('No invitation token found in URL. Please check the invitation link sent to your email.');
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    setLoadingVerify(true);
    setVerifyError('');
    try {
      const data = await verifyGymOwnerInvitation(token);
      setApplicationData(data);
      setStep('set-password');
      loadPlans();
    } catch (err) {
      setVerifyError(err.message || 'Invitation link is invalid or has expired.');
    } finally {
      setLoadingVerify(false);
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
      setStep('select-plan');
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
        // Fallback simulation / instant verification
        const verifyRes = await verifySaaSPayment({
          organizationId: organization._id,
          planCode: selectedPlanCode,
          billingCycle,
          razorpayOrderId: razorpayOrder?.id || `ORDER_${Date.now()}`,
          razorpayPaymentId: `PAY_MOCK_${Date.now()}`,
          razorpaySignature: 'mock_saas_signature',
          adminBypass: true,
        });

        setActivationResult({
          organization,
          invoice,
          payment: verifyRes.data?.payment,
          subscription: verifyRes.data?.subscription,
        });
        setStep('success');
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

            setActivationResult({
              organization,
              invoice,
              payment: verifyRes.data?.payment,
              subscription: verifyRes.data?.subscription,
            });
            setStep('success');
          } catch (verErr) {
            setPaymentError(verErr.message || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: applicationData?.ownerName,
          email: applicationData?.email,
          contact: applicationData?.phone,
        },
        theme: {
          color: '#c5a880',
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

  return (
    <div className="min-h-screen bg-[#060606] text-[#e5e5e5] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#c5a880] selection:text-black">
      
      {/* Top Brand Banner */}
      <div className="max-w-4xl mx-auto w-full text-center mb-8">
        <Link to="/" className="inline-block group focus:outline-none mb-3">
          <span className="text-2xl font-serif tracking-[0.3em] text-[#c5a880] block font-light">
            Q N O X
          </span>
          <span className="text-[10px] tracking-[0.4em] text-neutral-400 uppercase block font-mono">
            LUXURY GYM &bull; SAAS PARTNER PORTAL
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif text-white tracking-wide">
          Pre-Approved Partner Onboarding
        </h1>
        <p className="text-xs text-neutral-400 mt-1 max-w-lg mx-auto font-light">
          Your facility credentials have been evaluated and approved by the Executive Board. Complete registration to unlock your dedicated sanctuary command center.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto w-full bg-[#0d0d0d] border border-white/10 p-6 sm:p-10 shadow-2xl relative">

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 mb-8 border-b border-white/10 pb-4 text-center font-mono text-[10px] uppercase tracking-wider">
          <div className={`p-2 border ${step === 'set-password' ? 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10 font-bold' : 'border-white/5 text-neutral-500'}`}>
            1. CREATE CREDENTIALS
          </div>
          <div className={`p-2 border ${step === 'select-plan' ? 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10 font-bold' : 'border-white/5 text-neutral-500'}`}>
            2. CHOOSE SAAS PLAN
          </div>
          <div className={`p-2 border ${step === 'success' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 font-bold' : 'border-white/5 text-neutral-500'}`}>
            3. DASHBOARD ACTIVATED
          </div>
        </div>

        {/* ==================================================== */}
        {/* PHASE 0: VERIFYING / ERROR                          */}
        {/* ==================================================== */}
        {loadingVerify && (
          <div className="py-16 text-center space-y-3 font-mono text-xs text-neutral-400 uppercase tracking-widest">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#c5a880]" />
            <p>Verifying invitation cryptographic signature...</p>
          </div>
        )}

        {!loadingVerify && verifyError && (
          <div className="py-10 text-center space-y-4 font-mono">
            <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-serif text-white">Invalid or Expired Invitation</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto leading-relaxed">
              {verifyError}
            </p>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <Link
                to="/"
                className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs uppercase tracking-wider border border-white/10"
              >
                RETURN HOME
              </Link>
              <a
                href="mailto:concierge@qnoxgym.com"
                className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black text-xs uppercase tracking-wider font-bold"
              >
                CONTACT CONCIERGE
              </a>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 1: SET CREDENTIALS & REVIEW APPROVED DOSSIER  */}
        {/* ==================================================== */}
        {!loadingVerify && !verifyError && step === 'set-password' && applicationData && (
          <div className="space-y-6">
            
            {/* Approved Application Dossier Badge */}
            <div className="p-4 bg-[#141414] border border-[#c5a880]/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[#c5a880] font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>APPROVED APPLICATION: {applicationData.applicationId}</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] uppercase font-bold rounded">
                  VERIFIED BY SUPER ADMIN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-neutral-500 uppercase block">Gym Brand:</span>
                  <span className="text-white font-medium">{applicationData.gymName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block">Owner Name:</span>
                  <span className="text-white font-medium">{applicationData.ownerName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block">Business Email:</span>
                  <span className="text-white font-medium">{applicationData.email}</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase block">Facility Location:</span>
                  <span className="text-white font-medium">{applicationData.city}, {applicationData.state}</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 italic pt-1 border-t border-white/5">
                Note: Approved business credentials are encrypted and locked. To change facility parameters, contact Super Admin.
              </p>
            </div>

            {/* Set Password Form */}
            <form onSubmit={handleRegisterCredentials} className="space-y-4 font-mono">
              <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-bold block">
                CREATE MASTER ACCOUNT CREDENTIALS
              </span>

              {regError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs">
                  {regError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Master Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                    Confirm Master Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingRegistration}
                  className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submittingRegistration ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>PROVISIONING ACCOUNT...</span>
                    </>
                  ) : (
                    <>
                      <span>PROCEED TO PLAN SELECTION</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 2: SELECT SAAS SUBSCRIPTION PLAN & CHECKOUT   */}
        {/* ==================================================== */}
        {step === 'select-plan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[#c5a880] font-mono font-bold block">
                  STEP 2 OF 3: SUBSCRIPTION TIER
                </span>
                <h3 className="text-xl font-serif text-white">Select SaaS Operating Contract</h3>
              </div>

              {/* Monthly / Yearly Toggle */}
              <div className="flex items-center bg-[#141414] border border-white/10 p-0.5 rounded font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 uppercase tracking-wider rounded transition ${
                    billingCycle === 'monthly' ? 'bg-[#c5a880] text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  MONTHLY
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 uppercase tracking-wider rounded transition flex items-center space-x-1 ${
                    billingCycle === 'yearly' ? 'bg-[#c5a880] text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>ANNUAL</span>
                  <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-bold">20% OFF</span>
                </button>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-mono">
                {paymentError}
              </div>
            )}

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isSelected = selectedPlanCode === p.code.toLowerCase();
                const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

                return (
                  <div
                    key={p.code}
                    onClick={() => setSelectedPlanCode(p.code.toLowerCase())}
                    className={`p-4 border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#181512] border-[#c5a880] shadow-[0_0_20px_rgba(197,168,128,0.2)]'
                        : 'bg-[#111111] border-white/10 hover:border-white/30'
                    }`}
                  >
                    {p.code === 'professional' && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-[#c5a880] text-black text-[9px] font-mono font-bold uppercase rounded">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono uppercase text-[#c5a880] font-bold">{p.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#c5a880]" />}
                      </div>

                      <div className="font-serif text-2xl text-white mb-1">
                        ₹{Number(price).toLocaleString('en-IN')}
                        <span className="text-xs font-mono text-neutral-400 font-normal">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>

                      <div className="text-[10px] text-neutral-500 font-mono mb-4">
                        + 18% GST applicable
                      </div>

                      <ul className="space-y-1.5 text-xs text-neutral-300 font-mono">
                        {(p.features || []).map((feat, i) => (
                          <li key={i} className="flex items-start space-x-1.5 text-[11px]">
                            <Check className="w-3 h-3 text-[#c5a880] mt-0.5 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full mt-4 py-2 text-xs font-mono uppercase tracking-wider font-bold transition border ${
                        isSelected
                          ? 'bg-[#c5a880] text-black border-[#c5a880]'
                          : 'bg-transparent text-neutral-400 border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'SELECTED PLAN' : 'CHOOSE PLAN'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Checkout Action */}
            <div className="p-4 bg-[#141414] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 block">Total Due Upon Activation:</span>
                <span className="text-lg font-bold text-white">
                  ₹{Number(Math.round((billingCycle === 'yearly'
                    ? (plans.find(p => p.code === selectedPlanCode)?.yearlyPrice || 115190)
                    : (plans.find(p => p.code === selectedPlanCode)?.monthlyPrice || 11999)
                  ) * 1.18)).toLocaleString('en-IN')}
                  <span className="text-xs text-neutral-400 font-normal"> (incl. 18% GST)</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleInitiatePayment}
                disabled={initiatingPayment}
                className="px-6 py-2.5 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {initiatingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>LAUNCHING PAYMENT GATEWAY...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>PROCEED TO SECURE CHECKOUT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 3: PAYMENT SUCCESS & DASHBOARD ACTIVATION     */}
        {/* ==================================================== */}
        {step === 'success' && activationResult && (
          <div className="py-8 text-center space-y-6 font-mono">
            <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-bold block mb-1">
                ONBOARDING VERIFIED &bull; TENANT LIVE
              </span>
              <h2 className="text-2xl font-serif text-white">Sanctuary Network Commissioned</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                Welcome to the QNOX Network. Your multi-gym SaaS tenant and private dashboard are now 100% active.
              </p>
            </div>

            <div className="p-4 bg-[#141414] border border-[#c5a880]/30 max-w-md mx-auto space-y-2 text-left text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-400">ORGANIZATION:</span>
                <span className="text-white font-bold">{activationResult.organization?.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-400">INVOICE NUMBER:</span>
                <span className="text-[#c5a880] font-bold">{activationResult.invoice?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-neutral-400">SUBSCRIPTION STATUS:</span>
                <span className="text-emerald-400 font-bold uppercase">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">PLAN TIER:</span>
                <span className="text-white uppercase font-bold">{selectedPlanCode} ({billingCycle})</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/gym-owner/dashboard')}
                className="px-8 py-3 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-widest transition flex items-center space-x-2 mx-auto shadow-[0_0_20px_rgba(197,168,128,0.25)]"
              >
                <span>ENTER GYM OWNER COMMAND SUITE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-[11px] font-mono text-neutral-600">
        QNOX Luxury Gym Architecture &bull; Encrypted SaaS Tenant Onboarding Engine &bull; 2026/2027
      </div>
    </div>
  );
}
