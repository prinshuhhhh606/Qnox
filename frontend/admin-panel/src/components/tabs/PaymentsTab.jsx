import React from 'react';

export default function PaymentsTab({
  payments = [],
  setSelectedReceipt,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-white">Financial Audit & Tax Invoices</h3>
          <p className="text-xs text-neutral-400 font-light">All verified Razorpay transactions with instant receipt print & refund dispatch.</p>
        </div>
      </div>

      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
        <table className="qnox-admin-table">
          <thead>
            <tr>
              <th>INVOICE #</th>
              <th>MEMBER</th>
              <th>PLAN & TERM</th>
              <th>AMOUNT (INR)</th>
              <th>STATUS</th>
              <th>DATE</th>
              <th className="text-right">COMMAND</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td className="font-mono text-[#c5a880] font-bold">{p.invoiceNumber}</td>
                <td>
                  <div className="text-white font-medium">{p.userName}</div>
                  <div className="text-neutral-500 text-[11px]">{p.userEmail}</div>
                </td>
                <td>{p.planName} ({p.duration})</td>
                <td className="font-mono text-white font-semibold">₹{p.amount?.toLocaleString('en-IN')}</td>
                <td>
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                      p.status === 'Completed' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="font-mono text-xs">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB') : '—'}
                </td>
                <td className="text-right space-x-2">
                  <button
                    onClick={() => setSelectedReceipt(p)}
                    className="px-3 py-1 text-xs border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black uppercase transition"
                  >
                    INVOICE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
