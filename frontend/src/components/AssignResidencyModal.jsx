import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Crown,
  Check,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { updateMemberResidency, fetchMembershipPlans } from '../services/api';
import './AssignResidencyModal.css';

const BILLING_CYCLES = [
  { id: 'monthly', label: 'Monthly', months: 1, suffix: '/ mo' },
  { id: 'quarterly', label: 'Quarterly', months: 3, suffix: '/ quarter' },
  { id: 'halfYearly', label: 'Half-Yearly', months: 6, suffix: '/ 6 mos' },
  { id: 'yearly', label: 'Annual Resident', months: 12, suffix: '/ year' },
];

export default function AssignResidencyModal({
  isOpen,
  member,
  plans: propPlans = [],
  onClose,
  onSuccess,
}) {
  const [plans, setPlans] = useState(propPlans);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [customAmount, setCustomAmount] = useState(0);
  const [recordPayment, setRecordPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch plans if not passed
  useEffect(() => {
    if (propPlans && propPlans.length > 0) {
      setPlans(propPlans);
    } else {
      fetchMembershipPlans(true).then((data) => {
        if (data && data.length > 0) setPlans(data);
      });
    }
  }, [propPlans]);

  // Initialize modal state when opened
  useEffect(() => {
    if (!isOpen || !member) return;

    setError('');
    setSuccessMsg('');

    const currentPlanName = member.membership?.planName;
    const matchingPlan = plans.find((p) => p.name === currentPlanName);

    if (matchingPlan) {
      setSelectedPlanId(matchingPlan._id || matchingPlan.name);
    } else if (plans.length > 0) {
      setSelectedPlanId(plans[0]._id || plans[0].name);
    }

    const currentCycle = member.membership?.billingCycle;
    setBillingCycle(['monthly', 'quarterly', 'halfYearly', 'yearly'].includes(currentCycle) ? currentCycle : 'monthly');

    // Smart default start date: if currently active and has future endDate, can default to that or today
    const today = new Date().toISOString().split('T')[0];
    const isCurrentlyActive = member.membership?.status === 'Active' && member.membership?.endDate;
    if (isCurrentlyActive && new Date(member.membership.endDate) > new Date()) {
      setStartDate(new Date(member.membership.endDate).toISOString().split('T')[0]);
    } else {
      setStartDate(today);
    }

    setRecordPayment(false);
    setPaymentMethod('Cash');
    setPaymentStatus('Paid');
    setReferenceNumber('');
    setNotes('');
  }, [isOpen, member, plans]);

  // Selected plan object
  const selectedPlan = useMemo(() => {
    return plans.find((p) => p._id === selectedPlanId || p.name === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  // Update amount when plan or billing cycle changes
  useEffect(() => {
    if (!selectedPlan) return;
    const price = selectedPlan.pricing?.[billingCycle] || selectedPlan.pricing?.monthly || 0;
    setCustomAmount(price);
  }, [selectedPlan, billingCycle]);

  // Calculate Expiry Date live
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    const cycleObj = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[0];
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + cycleObj.months);
    return d.toISOString().split('T')[0];
  }, [startDate, billingCycle]);

  // Determine context
  const context = useMemo(() => {
    if (!member?.membership?.planName || member.membership?.planName === 'None') {
      return {
        label: 'NEW RESIDENCY COMMISSION',
        buttonText: 'Commission Residency',
        badgeClass: 'border-[#c5a880] text-[#c5a880] bg-[#c5a880]/10',
        actionType: 'New Plan',
      };
    }
    if (selectedPlan?.name === member.membership?.planName) {
      return {
        label: 'RESIDENCY RENEWAL & EXTENSION',
        buttonText: 'Authorize Residency Renewal',
        badgeClass: 'border-emerald-500 text-emerald-400 bg-emerald-950/20',
        actionType: 'Renewal',
      };
    }
    return {
      label: 'TIER UPGRADE / CHANGE',
      buttonText: 'Authorize Tier Upgrade',
      badgeClass: 'border-purple-400 text-purple-300 bg-purple-950/20',
      actionType: 'Upgrade',
    };
  }, [member, selectedPlan]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError('Please select a membership plan.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const cycleObj = BILLING_CYCLES.find((c) => c.id === billingCycle) || BILLING_CYCLES[0];

      const payload = {
        planId: selectedPlan._id,
        planName: selectedPlan.name,
        billingCycle,
        status: 'Active',
        durationMonths: cycleObj.months,
        startDate,
        endDate: calculatedEndDate,
        actionType: context.actionType,
        notes: notes.trim() || `Residency commissioned by Executive Concierge.`,
        amount: Number(customAmount) || 0,
        recordPayment,
        paymentMethod: recordPayment ? paymentMethod : undefined,
        paymentStatus: recordPayment ? paymentStatus : undefined,
        referenceNumber: recordPayment ? referenceNumber : undefined,
      };

      await updateMemberResidency(member._id, payload);

      setSuccessMsg(`Residency plan successfully assigned until ${new Date(calculatedEndDate).toLocaleDateString('en-GB')}.`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to assign residency plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="qnox-assign-modal-overlay" onClick={onClose}>
      <div className="qnox-assign-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qnox-assign-modal-header">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-neutral-900 border border-[#c5a880]/30 overflow-hidden flex items-center justify-center flex-shrink-0">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-base text-[#c5a880]">
                  {member.name?.charAt(0) || 'M'}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-white">{member.name}</h3>
                {member.memberId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-neutral-400">
                    {member.memberId}
                  </span>
                )}
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${context.badgeClass}`}>
                  {context.label}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Current Tier:{' '}
                <span className="text-neutral-200 font-medium">
                  {member.membership?.planName || 'None (Prospect)'}
                </span>{' '}
                • Status:{' '}
                <span
                  className={`capitalize ${
                    member.membership?.status === 'Active'
                      ? 'text-emerald-400'
                      : member.membership?.status === 'Frozen'
                      ? 'text-sky-400'
                      : 'text-neutral-500'
                  }`}
                >
                  {member.membership?.status || 'No Plan'}
                </span>{' '}
                {member.membership?.endDate && (
                  <span>(Expires {new Date(member.membership.endDate).toLocaleDateString('en-GB')})</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 border border-white/10 hover:border-[#c5a880] flex items-center justify-center text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="px-6 py-2.5 bg-rose-950/70 border-b border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-950/70 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="qnox-assign-modal-body space-y-6">
            {/* 1. PLAN SELECTION CARDS */}
            <div>
              <div className="qnox-section-eyebrow">
                <Crown className="w-3.5 h-3.5" />
                <span>1. Select Residency Tier</span>
              </div>

              <div className="qnox-plan-grid">
                {plans.map((p) => {
                  const isSelected = selectedPlan?._id === p._id || selectedPlan?.name === p.name;
                  const price = p.pricing?.[billingCycle] || p.pricing?.monthly || 0;

                  return (
                    <div
                      key={p._id || p.name}
                      onClick={() => setSelectedPlanId(p._id || p.name)}
                      className={`qnox-plan-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div>
                        <div className="qnox-plan-card-header">
                          <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                            {p.code || 'TIER'}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-[#c5a880] bg-[#c5a880] text-black'
                                : 'border-white/20'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="qnox-plan-name">{p.name}</div>
                        {p.subtitle && (
                          <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                            {p.subtitle}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-white/5 mt-3">
                        <div className="flex items-baseline">
                          <span className="qnox-plan-price">
                            ₹{Number(price).toLocaleString('en-IN')}
                          </span>
                          <span className="qnox-plan-cycle">
                            {BILLING_CYCLES.find((c) => c.id === billingCycle)?.suffix}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. DURATION / BILLING CYCLE */}
            <div>
              <div className="qnox-section-eyebrow">
                <Calendar className="w-3.5 h-3.5" />
                <span>2. Membership Duration & Billing Cycle</span>
              </div>

              <div className="qnox-cycle-group">
                {BILLING_CYCLES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBillingCycle(c.id)}
                    className={`qnox-cycle-btn ${billingCycle === c.id ? 'active' : ''}`}
                  >
                    <div>{c.label}</div>
                    <div className="text-[10px] font-normal opacity-75 mt-0.5">
                      {c.months} {c.months === 1 ? 'Month' : 'Months'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. DATES & RECONCILIATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                  Commencement Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="qnox-residency-input"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setStartDate(new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-neutral-400 hover:text-white underline"
                  >
                    Today
                  </button>
                  {member.membership?.endDate && (
                    <button
                      type="button"
                      onClick={() =>
                        setStartDate(new Date(member.membership.endDate).toISOString().split('T')[0])
                      }
                      className="text-[10px] text-[#c5a880] hover:underline"
                    >
                      From Current Expiry ({new Date(member.membership.endDate).toLocaleDateString('en-GB')})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                  Calculated Validity Expiry
                </label>
                <div className="qnox-residency-input font-mono text-sm flex items-center justify-between text-[#c5a880]">
                  <span>
                    {calculatedEndDate
                      ? new Date(calculatedEndDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-sans uppercase">
                    Auto-Computed
                  </span>
                </div>
              </div>
            </div>

            {/* 4. FINANCIAL PAYMENT RECONCILIATION (OPTIONAL) */}
            <div className="p-4 bg-[#0a0a0a] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordPayment}
                    onChange={(e) => setRecordPayment(e.target.checked)}
                    className="rounded bg-black border-white/20 text-[#c5a880] focus:ring-0"
                  />
                  <span className="font-medium">Record Official Ledger Payment for this Assignment</span>
                </label>
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                  Financial Ledger
                </span>
              </div>

              {recordPayment && (
                <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="qnox-residency-input text-xs"
                    >
                      <option value="Cash">Cash at Sanctuary Desk</option>
                      <option value="UPI">UPI / QR Code Transfer</option>
                      <option value="Card">Card Terminal (POS)</option>
                      <option value="Bank Transfer">Bank Wire / IMPS</option>
                      <option value="Other">Executive Override</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="qnox-residency-input text-xs"
                    >
                      <option value="Paid">Paid / Confirmed</option>
                      <option value="Pending">Payment Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Amount (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="qnox-residency-input font-mono text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] uppercase text-neutral-400 mb-1">
                      Reference / Transaction / UTR No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. POS-MAYFAIR-8921 or UPI-UTR-202611"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className="qnox-residency-input text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. ADMINISTRATIVE NOTE */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                Administrative Dossier Note
              </label>
              <input
                type="text"
                placeholder="e.g. Private Founder Residency authorized at Mayfair Sanctuary."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="qnox-residency-input text-xs"
              />
            </div>

            {/* 6. EXECUTIVE SUMMARY */}
            <div className="qnox-summary-box">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#c5a880]">
                  Executive Commissioning Summary
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  REF: {member.memberId || 'MEM-ONLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="qnox-summary-label">Residency Tier</div>
                  <div className="qnox-summary-value text-[#c5a880] mt-0.5">
                    {selectedPlan?.name || 'None'}
                  </div>
                </div>

                <div>
                  <div className="qnox-summary-label">Billing Cycle</div>
                  <div className="qnox-summary-value capitalize mt-0.5">
                    {BILLING_CYCLES.find((c) => c.id === billingCycle)?.label}
                  </div>
                </div>

                <div>
                  <div className="qnox-summary-label">Validity Period</div>
                  <div className="qnox-summary-value font-mono text-xs mt-0.5">
                    {startDate ? new Date(startDate).toLocaleDateString('en-GB') : '—'} →{' '}
                    {calculatedEndDate ? new Date(calculatedEndDate).toLocaleDateString('en-GB') : '—'}
                  </div>
                </div>

                <div>
                  <div className="qnox-summary-label">Financial Due</div>
                  <div className="qnox-summary-value text-white font-mono text-sm mt-0.5">
                    ₹{Number(customAmount).toLocaleString('en-IN')}
                    {recordPayment && (
                      <span className="text-[10px] ml-1.5 text-emerald-400 font-sans font-normal">
                        ({paymentStatus})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="qnox-assign-modal-footer">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-neutral-400 hover:text-white text-xs uppercase tracking-wider transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedPlan}
              className="px-6 py-2.5 bg-[#c5a880] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-white transition disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{context.buttonText}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
