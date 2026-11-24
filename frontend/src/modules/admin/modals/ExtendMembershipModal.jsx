import React from 'react';
import { X, Sparkles } from 'lucide-react';

export default function ExtendMembershipModal({
  isOpen,
  onClose,
  extendTargetUser,
  extendDays,
  setExtendDays,
  extendReason,
  setExtendReason,
  processingExtend,
  handleConfirmExtend,
}) {
  if (!isOpen || !extendTargetUser) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0e0e0e] border border-white/20 w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] tracking-[0.25em] text-sky-400 font-bold uppercase block">
              MEMBERSHIP VALIDITY
            </span>
            <h4 className="font-serif text-lg text-white font-semibold">Extend Residency Validity</h4>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-[#141414] border border-white/5 space-y-1 text-xs font-mono">
          <div className="text-white font-bold">{extendTargetUser.name}</div>
          <div className="text-neutral-400 text-[11px]">{extendTargetUser.email}</div>
          <div className="text-[#c5a880] text-[11px]">
            Current Expiry:{' '}
            {extendTargetUser.membership?.endDate
              ? new Date(extendTargetUser.membership.endDate).toLocaleDateString('en-GB')
              : 'No active end date'}
          </div>
        </div>

        <form onSubmit={handleConfirmExtend} className="space-y-4">
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
              DAYS TO EXTEND
            </label>
            <select
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className="w-full bg-[#141414] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-[#c5a880] outline-none font-mono"
            >
              <option value={7}>+7 Days (1 Week Extension)</option>
              <option value={15}>+15 Days (Half-Month)</option>
              <option value={30}>+30 Days (Standard 1 Month)</option>
              <option value={60}>+60 Days (2 Months Courtesy)</option>
              <option value={90}>+90 Days (Quarterly Extension)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-1.5 font-mono">
              EXTENSION REASON / AUDIT NOTE
            </label>
            <textarea
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              required
              rows={3}
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
              disabled={processingExtend}
              className="px-5 py-2 bg-[#c5a880] hover:bg-white text-black text-xs font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {processingExtend ? (
                <span>EXTENDING...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>APPLY EXTENSION</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
