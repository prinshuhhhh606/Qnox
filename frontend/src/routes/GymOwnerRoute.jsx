import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, ArrowRight, ShieldAlert, CreditCard, LogOut, RefreshCw, Sparkles, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { loginUser, fetchMyOrganization, verifySaaSPayment } from '../services/api';

export default function GymOwnerRoute({ children }) {
  const { currentUser, setCurrentUser, logout, loading, isGymOwner, isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Organization subscription & onboarding stage validation state
  const [checkingOrg, setCheckingOrg] = useState(false);
  const [tenantOrg, setTenantOrg] = useState(null);
  const [onboardingStage, setOnboardingStage] = useState('ACTIVE_COMPLETED');
  const [subscriptionValid, setSubscriptionValid] = useState(true);

  useEffect(() => {
    if (currentUser && isGymOwner && !isAdmin) {
      setCheckingOrg(true);
      fetchMyOrganization()
        .then((data) => {
          if (data && data.organization) {
            setTenantOrg(data.organization);
            const stage = data.organization.onboardingStage || 'PAYMENT_PENDING';
            setOnboardingStage(stage);

            const status = data.organization.status;
            // Full dashboard access granted ONLY when stage is ACTIVE_COMPLETED and status is Active
            if (status === 'Active' && stage === 'ACTIVE_COMPLETED') {
              setSubscriptionValid(true);
            } else {
              setSubscriptionValid(false);
            }
          }
        })
        .catch((err) => {
          console.warn('[GymOwnerRoute] Org check:', err.message);
        })
        .finally(() => {
          setCheckingOrg(false);
        });
    }
  }, [currentUser, isGymOwner, isAdmin]);

  if (loading || checkingOrg) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center space-y-4 text-[#D4AF37]">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          VERIFYING ONBOARDING STAGE & ACCREDITATION GATEWAYS...
        </span>
      </div>
    );
  }

  // If authenticated as Gym Owner but has NOT completed all onboarding stages, render stage gate modal
  if (currentUser && isGymOwner && !isAdmin && !subscriptionValid && tenantOrg) {
    const isPaymentPending = onboardingStage === 'PAYMENT_PENDING';
    const isBranchSetupPending = onboardingStage === 'SUBSCRIPTION_ACTIVE';
    const isVerificationPending = onboardingStage === 'GYM_VERIFICATION' || onboardingStage === 'TERRITORY_REVIEW';
    const isRejected = onboardingStage === 'GYM_REJECTED';

    return (
      <div className="min-h-screen bg-[#080808] text-[#f5f5f5] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#111111] border border-[#262626] rounded-2xl p-8 space-y-6 text-center relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="inline-flex p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] mb-1">
            {isPaymentPending ? (
              <CreditCard className="w-8 h-8" />
            ) : isBranchSetupPending ? (
              <Building2 className="w-8 h-8" />
            ) : isVerificationPending ? (
              <Clock className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <div>
            <span className="px-3 py-1 bg-[#181818] border border-[#333] text-[#D4AF37] text-xs font-mono uppercase tracking-widest rounded-full">
              ONBOARDING STAGE: {onboardingStage.replace('_', ' ')}
            </span>
            <h2 className="text-2xl font-bold text-white mt-4 tracking-tight">
              {isPaymentPending && 'Subscription Activation Required'}
              {isBranchSetupPending && 'Initial Sanctuary Branch Setup Pending'}
              {isVerificationPending && 'Gateway 2 Branch Verification in Progress'}
              {isRejected && 'Branch Verification Needs Revision'}
              {!isPaymentPending && !isBranchSetupPending && !isVerificationPending && !isRejected && 'Account Under Verification'}
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-2 leading-relaxed">
              {isPaymentPending && 'Your gym owner account is provisioned. Please complete your SaaS plan subscription payment to unlock branch setup.'}
              {isBranchSetupPending && 'Your SaaS subscription is active! Please complete your initial gym branch address, GPS coordinates, and documents.'}
              {isVerificationPending && 'Your facility setup has been submitted. Super Admin is verifying your property deeds and territory geofence before live activation.'}
              {isRejected && 'Your gym branch submission was not approved during Gateway 2 review. Please update your facility details.'}
            </p>
          </div>

          <div className="p-4 bg-[#181818] border border-[#262626] rounded-xl text-left text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Organization:</span>
              <span className="text-white font-bold">{tenantOrg.name}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Owner Email:</span>
              <span className="text-white">{tenantOrg.ownerEmail || currentUser.email}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Onboarding Stage:</span>
              <span className="text-[#D4AF37] font-bold">{onboardingStage}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/gym-owner/onboard')}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15 transition-all"
            >
              <span>CONTINUE ONBOARDING WIZARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="px-4 py-3.5 rounded-xl border border-[#333] hover:border-[#555] text-neutral-400 hover:text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated as Gym Owner (with Active completed onboarding) or Super Admin
  if (currentUser && (isGymOwner || isAdmin)) {
    return children ? children : <Outlet />;
  }

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await loginUser({ email, password });
      if (res && res.user) {
        if (!['Gym Owner', 'Company Admin', 'Super Admin'].includes(res.user.role)) {
          setErrorMsg('Access denied: Account is not registered as a Partner Gym Owner.');
          return;
        }
        setCurrentUser(res.user);
        sessionStorage.setItem('qnox_view_mode', 'gym-owner');
        showToast({
          type: 'success',
          message: `Welcome, ${res.user.name}. Gym Owner Command initialized.`,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Architectural Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">
            GYM OWNER PORTAL
          </h2>
          <p className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            B2B Multi-Gym SaaS Command Suite
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs text-center font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleOwnerLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
              Owner Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourgym.com"
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-neutral-400 mb-1">
              Secret Key (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B38F24] hover:from-[#c49f30] hover:to-[#9e7d1d] text-black font-mono text-xs uppercase tracking-widest font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-6"
          >
            {submitting ? (
              <span>VERIFYING ACCREDITATION...</span>
            ) : (
              <>
                <span>ENTER COMMAND SUITE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#262626] text-center space-y-1">
          <p className="text-[11px] text-neutral-400 font-mono">
            Not registered yet?
          </p>
          <Link
            to="/gym-owner/register"
            className="text-xs text-[#D4AF37] hover:underline font-bold inline-block"
          >
            Apply for Gym Owner & Partner Registration &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
