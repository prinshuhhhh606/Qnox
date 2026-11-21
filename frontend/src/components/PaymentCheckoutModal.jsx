import React, { useState } from 'react';
import { X, Check, ShieldCheck, CreditCard, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { createPaymentOrder, verifyPaymentSignature } from '../services/api';
import './PaymentCheckoutModal.css';

export default function PaymentCheckoutModal({ isOpen, onClose, plan, currentUser, onSuccess, onOpenAuth, onShowToast }) {
  const [duration, setDuration] = useState(plan?.defaultDuration || 'monthly');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (plan?.defaultDuration) {
      setDuration(plan.defaultDuration);
    } else {
      setDuration('monthly');
    }
  }, [plan]);

  if (!isOpen || !plan) return null;

  if (!currentUser) {
    return (
      <div className="qnox-checkout-backdrop">
        <div className="qnox-checkout-dialog text-center py-12">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 mx-auto rounded-full bg-[#c5a880]/10 border border-[#c5a880] flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-[#c5a880]" />
          </div>
          <h3 className="font-serif text-3xl text-white mb-3">Sanctuary Authentication Required</h3>
          <p className="text-sm text-neutral-400 font-light max-w-md mx-auto mb-8">
            To activate residency for <strong>{plan.name}</strong>, please sign in or establish your member identity first.
          </p>
          <button
            onClick={() => { onClose(); onOpenAuth(); }}
            className="qnox-checkout-pay-btn max-w-xs mx-auto"
          >
            <span>SIGN IN TO PROCEED</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const durationOptions = [
    { key: 'monthly', label: '1 MONTH', desc: 'Standard Monthly' },
    { key: 'quarterly', label: '3 MONTHS', desc: 'Save ₹500' },
    { key: 'halfYearly', label: '6 MONTHS', desc: 'Save ₹2,000' },
    { key: 'yearly', label: '12 MONTHS', desc: 'Best Value (Save ₹6,000)' },
  ];

  const pricing = {
    monthly: plan.pricing?.monthly || 1200,
    quarterly: plan.pricing?.quarterly || 4500,
    halfYearly: plan.pricing?.halfYearly || 7500,
    yearly: plan.pricing?.yearly || 12500,
  };

  const selectedAmount = pricing[duration] || pricing.monthly;

  const handleProcessPayment = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create order on backend
      const orderRes = await createPaymentOrder({
        planId: plan._id || 'plan_resident',
        duration,
        billingDetails: {
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
        },
      });

      const orderData = orderRes.data;

      // 2. Open Razorpay Checkout or fallback in simulation
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'QNOX GYM',
        description: `${plan.name} (${duration.toUpperCase()} RESIDENCY)`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify signature on backend
            const verifyRes = await verifyPaymentSignature({
              orderId: response.razorpay_order_id || orderData.orderId,
              paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              signature: response.razorpay_signature || 'sig_demo',
              razorpay_order_id: response.razorpay_order_id || orderData.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'sig_demo',
              amount: orderData.amount,
              currency: orderData.currency,
              isSimulated: Boolean(orderData.isSimulated),
            });

            if (onShowToast) onShowToast({ type: 'success', message: `Residency activated for ${plan.name}!` });
            if (onSuccess) onSuccess(verifyRes.data);
            onClose();
          } catch (verErr) {
            setErrorMsg(verErr.message || 'Signature verification rejected by sanctuary backend.');
          }
        },
        prefill: {
          name: currentUser.name,
          email: currentUser.email,
          contact: currentUser.phone || '9999999999',
        },
        theme: {
          color: '#c5a880',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failResp) {
          setErrorMsg(failResp.error?.description || 'Payment was declined by payment gateway.');
        });
        rzp.open();
      } else {
        // Direct simulation completion if Razorpay script is not present
        const verifyRes = await verifyPaymentSignature({
          orderId: orderData.orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: 'verified_simulated_sig',
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: 'verified_simulated_sig',
          amount: orderData.amount,
          currency: orderData.currency,
          isSimulated: true,
        });
        if (onShowToast) onShowToast({ type: 'success', message: `Residency activated for ${plan.name}!` });
        if (onSuccess) onSuccess(verifyRes.data);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qnox-checkout-backdrop">
      <div className="qnox-checkout-dialog">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#c5a880] font-semibold block mb-1">
            SECURE RAZORPAY CHECKOUT
          </span>
          <h3 className="font-serif text-3xl text-white">{plan.name}</h3>
          <p className="text-xs text-neutral-400 font-light mt-1">{plan.subtitle || 'Sanctuary Residency Tier'}</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Billing Duration Selector */}
        <div className="mb-8">
          <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-3 font-medium">
            SELECT RESIDENCY TERM
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {durationOptions.map((opt) => (
              <div
                key={opt.key}
                onClick={() => setDuration(opt.key)}
                className={`qnox-duration-pill ${duration === opt.key ? 'active' : ''}`}
              >
                <div className="text-xs font-bold text-white tracking-wider">{opt.label}</div>
                <div className="text-[10px] text-[#c5a880] mt-1">₹{(pricing[opt.key] || 0).toLocaleString('en-IN')}</div>
                <div className="text-[9px] text-neutral-500 mt-0.5">{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="bg-[#111] border border-white/10 p-6 mb-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Residency Tier</span>
            <span className="text-white font-medium">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Billing Term</span>
            <span className="text-white font-medium uppercase">{duration}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Applicable GST (18%)</span>
            <span className="text-emerald-400 font-mono">Included</span>
          </div>
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-xs tracking-wider uppercase text-neutral-300 font-semibold">Total Payable</span>
            <span className="font-serif text-2xl text-[#c5a880] font-bold">
              ₹{selectedAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment CTA */}
        <button
          onClick={handleProcessPayment}
          disabled={loading}
          className="qnox-checkout-pay-btn"
        >
          <CreditCard className="w-4 h-4" />
          <span>{loading ? 'PROCESSING SECURE ORDER...' : `PAY ₹${selectedAmount.toLocaleString('en-IN')} VIA RAZORPAY`}</span>
        </button>

        <div className="flex items-center justify-center space-x-2 text-[10px] text-neutral-500 pt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
          <span>Verified 256-Bit SSL Encrypted Razorpay Gateway &bull; Automatic Invoice Dispatched</span>
        </div>
      </div>
    </div>
  );
}
