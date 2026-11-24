import React from 'react';
import { X, Printer, Download, CheckCircle2, Shield } from 'lucide-react';
import './ReceiptModal.css';

export default function ReceiptModal({ isOpen, onClose, payment }) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qnox-receipt-backdrop">
      <div className="qnox-receipt-dialog">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-white border border-white/10 rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* Brand Invoice Header */}
        <div className="qnox-receipt-header flex items-start justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-[0.3em] text-white">Q N O X</h1>
            <p className="text-[9px] tracking-[0.45em] text-[#c5a880] uppercase mt-0.5">LUXURY SANCTUARY RECEIPT</p>
            <p className="text-xs text-neutral-400 mt-3 font-light leading-relaxed">
              18 Grosvenor Street, Mayfair, London W1K 4QQ<br />
              GSTIN / VAT: 27AABCQ1234F1Z5 &bull; +44 20 7946 0992
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] tracking-widest uppercase text-neutral-500 block">OFFICIAL TAX INVOICE</span>
            <span className="text-xl font-mono text-[#c5a880] font-bold block mt-1">{payment.invoiceNumber}</span>
            <span className="text-xs text-neutral-400 mt-1 block">
              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
            </span>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold tracking-widest uppercase mt-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>PAID & VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Member Dossier Details */}
        <div className="grid grid-cols-2 gap-6 bg-[#111] border border-white/10 p-5 mb-6 text-xs">
          <div>
            <span className="text-[9px] tracking-widest uppercase text-neutral-500 block mb-1">BILLED TO</span>
            <div className="text-white font-semibold text-sm">{payment.userName}</div>
            <div className="text-neutral-400 font-mono mt-0.5">{payment.userEmail}</div>
            <div className="text-neutral-500 text-[11px] mt-1">{payment.billingDetails?.phone || 'Sanctuary Resident'}</div>
          </div>
          <div>
            <span className="text-[9px] tracking-widest uppercase text-neutral-500 block mb-1">PAYMENT GATEWAY</span>
            <div className="text-white font-medium">Razorpay Verified Protocol</div>
            <div className="text-neutral-400 font-mono text-[11px] mt-0.5">Order ID: {payment.orderId}</div>
            <div className="text-neutral-400 font-mono text-[11px]">Pay ID: {payment.paymentId || 'pay_verified'}</div>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="qnox-receipt-table">
          <thead>
            <tr>
              <th>SANCTUARY DESCRIPTION</th>
              <th>TERM</th>
              <th>CURRENCY</th>
              <th className="text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="font-medium text-white">{payment.planName}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Full Sanctuary Access &bull; Ozone Slate Pools &bull; Masterclasses</div>
              </td>
              <td className="uppercase font-mono text-xs">{payment.duration}</td>
              <td className="font-mono text-xs">{payment.currency || 'INR'}</td>
              <td className="text-right font-mono text-sm text-white font-semibold">
                ₹{payment.amount?.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals & GST Summary */}
        <div className="flex justify-end mb-8 border-t border-white/10 pt-4">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="font-mono text-white">₹{Math.round(payment.amount / 1.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>GST (18% Integrated)</span>
              <span className="font-mono text-white">₹{Math.round(payment.amount - (payment.amount / 1.18)).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-[#c5a880] uppercase tracking-wider">Total Invoiced</span>
              <span className="font-serif text-xl text-[#c5a880]">₹{payment.amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <div className="text-[10px] text-neutral-500 tracking-wider">
            COMPUTER GENERATED DOCUMENT &bull; NO SIGNATURE REQUIRED
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors flex items-center space-x-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT INVOICE</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
