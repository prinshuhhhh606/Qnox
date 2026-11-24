import React from 'react';
import { X, Check } from 'lucide-react';

export default function RequestActionModal({
  selectedRequestAction,
  onClose,
  approvalNotes,
  setApprovalNotes,
  refundAmount,
  setRefundAmount,
  rejectionReason,
  setRejectionReason,
  handleApproveRequest,
  handleRejectRequest,
}) {
  if (!selectedRequestAction) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e0e0e] border border-white/20 w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-[#c5a880] font-bold uppercase block">
              {selectedRequestAction.action === 'approve' ? 'APPROVE REQUEST' : 'REJECT REQUEST'}
            </span>
            <h4 className="font-serif text-lg text-white font-semibold">
              {selectedRequestAction.request.userName} &bull; {selectedRequestAction.request.type}
            </h4>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedRequestAction.action === 'approve' ? (
          <form onSubmit={handleApproveRequest} className="space-y-4">
            <p className="text-xs text-neutral-300 font-light leading-relaxed">
              {selectedRequestAction.request.type === 'Freeze'
                ? `Approving will pause this member's residency for ${selectedRequestAction.request.freezeDays || 30} days. Their active remaining days will be safeguarded and restored upon unfreezing.`
                : 'Approving will terminate active residency privileges immediately.'}
            </p>

            {selectedRequestAction.request.type === 'Cancellation' && (
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                  REFUND AMOUNT (₹, IF AUTHORIZED)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  min="0"
                  className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                ADMINISTRATIVE CONCIERGE NOTES
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                placeholder="Internal reference notes..."
                className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-[#c5a880] outline-none resize-none font-light"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>CONFIRM APPROVAL</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRejectRequest} className="space-y-4">
            <p className="text-xs text-rose-300 font-light leading-relaxed">
              Provide an official reason for rejection. This reason will be dispatched to the member via personalized notification.
            </p>

            <div>
              <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
                REJECTION REASON
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={3}
                placeholder="e.g. Minimum commitment tenure not completed, freeze allowance exceeded..."
                className="w-full bg-[#141414] border border-white/10 p-2.5 text-xs text-white focus:border-rose-400 outline-none resize-none font-light"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 text-xs text-neutral-400 hover:text-white uppercase tracking-wider transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>CONFIRM REJECTION</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
