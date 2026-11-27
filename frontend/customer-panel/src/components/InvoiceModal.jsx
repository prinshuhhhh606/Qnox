import React from 'react';
import { X, Printer, ShieldCheck, Download, Building2, Calendar, FileText } from 'lucide-react';

export default function InvoiceModal({ invoice, isOpen, onClose }) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const pricing = invoice.pricing || {
    baseAmount: 0,
    discountAmount: 0,
    taxPercent: 18,
    taxAmount: 0,
    totalPayable: 0,
    currency: 'INR',
  };

  const subscription = invoice.subscriptionDetails || {};
  const customer = invoice.customerDetails || {};
  const company = invoice.companyDetails || {
    name: 'QNOX LUXURY SANCTUARY NETWORKS PVT LTD',
    address: 'The Mayfair Sanctuary, 14 Berkeley Street, Mayfair, London W1J 8DX',
    email: 'concierge@qnoxgym.com',
    taxId: 'GB 924 8192 10 / GSTIN: 27AABCQ9281M1Z5',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-[#c5a880]/40 shadow-2xl text-[#f5f5f5] p-6 sm:p-8 my-8 print:border-none print:bg-white print:text-black print:m-0 print:p-4">
        
        {/* Action Controls (Hidden on Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 print:hidden mb-6">
          <div className="flex items-center space-x-2 text-[#c5a880]">
            <FileText className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold">TAX INVOICE & PROFORMA</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#c5a880]/10 hover:bg-[#c5a880]/20 border border-[#c5a880]/30 text-[#c5a880] text-xs font-mono uppercase tracking-widest flex items-center space-x-2 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-800 pb-6">
            <div>
              <h1 className="text-2xl font-serif tracking-widest text-[#c5a880] print:text-black">
                QNOX
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mt-0.5 print:text-neutral-600">
                {company.name}
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs print:text-neutral-600">
                {company.address}
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-1 print:text-neutral-600">
                Tax ID: {company.taxId}
              </p>
            </div>

            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className={`inline-block px-3 py-1 text-xs font-mono uppercase tracking-wider font-bold mb-2 ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 print:text-green-700'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/60 print:text-amber-700'
              }`}>
                {invoice.status || 'UNPAID'}
              </span>
              <p className="text-sm font-mono font-bold text-[#f5f5f5] print:text-black">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-0.5 print:text-neutral-600">
                Date: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#111111] p-4 border border-neutral-900 print:bg-neutral-50 print:border-neutral-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-1">
                BILLED TO (PARTNER GYM)
              </span>
              <p className="text-sm font-semibold text-[#f5f5f5] print:text-black">
                {customer.businessName || 'Gym Business'}
              </p>
              <p className="text-neutral-300 mt-1 print:text-neutral-700">Attn: {customer.ownerName}</p>
              <p className="text-neutral-400 font-mono mt-0.5 print:text-neutral-600">{customer.email}</p>
              {customer.phone && <p className="text-neutral-400 font-mono mt-0.5 print:text-neutral-600">{customer.phone}</p>}
              {customer.address && <p className="text-neutral-400 mt-0.5 print:text-neutral-600">{customer.address}</p>}
            </div>

            <div className="bg-[#111111] p-4 border border-neutral-900 print:bg-neutral-50 print:border-neutral-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block mb-1">
                SUBSCRIPTION CYCLE
              </span>
              <p className="text-sm font-semibold text-[#c5a880] uppercase print:text-black">
                {subscription.planName || 'QNOX SaaS'} ({subscription.billingCycle || 'Monthly'})
              </p>
              <p className="text-neutral-400 font-mono mt-1 print:text-neutral-600">
                Start: {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-neutral-400 font-mono mt-0.5 print:text-neutral-600">
                Valid Until: {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
              </p>
              {invoice.paymentDetails?.paymentId && (
                <p className="text-[11px] text-emerald-400 font-mono mt-1 print:text-green-700">
                  Ref: {invoice.paymentDetails.paymentId}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="border border-neutral-800 print:border-neutral-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141414] font-mono uppercase text-neutral-400 text-[10px] tracking-wider border-b border-neutral-800 print:bg-neutral-100 print:text-black">
                <tr>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Cycle</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 print:divide-neutral-200">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-neutral-200 print:text-black">
                      {subscription.planName || 'QNOX Multi-Gym Platform Subscription'}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Cloud management, branch provisioning, member/trainer rosters, telemetry.
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono uppercase text-neutral-400 print:text-black">
                    {subscription.billingCycle}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-neutral-200 print:text-black">
                    ₹{pricing.baseAmount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-[#0e0e0e] border-t border-neutral-800 space-y-1.5 text-xs font-mono print:bg-white print:border-neutral-200">
              <div className="flex justify-between text-neutral-400">
                <span>Base Subtotal:</span>
                <span>₹{pricing.baseAmount?.toLocaleString('en-IN')}</span>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Yearly Discount (20%):</span>
                  <span>-₹{pricing.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-400">
                <span>Applicable GST / Tax ({pricing.taxPercent || 18}%):</span>
                <span>₹{pricing.taxAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#c5a880] pt-2 border-t border-neutral-800 print:text-black print:border-neutral-300">
                <span>TOTAL PAYABLE:</span>
                <span>₹{pricing.totalPayable?.toLocaleString('en-IN')} {pricing.currency || 'INR'}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-neutral-500 font-mono">
              Thank you for partnering with QNOX Sanctuary Networks. This is a computer-generated tax invoice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
