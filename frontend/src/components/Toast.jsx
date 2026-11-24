import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="qnox-toast-container">
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        return (
          <div key={toast.id} className={`qnox-toast ${type}`}>
            <div className="shrink-0 mt-0.5">
              {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {type === 'info' && <Info className="w-5 h-5 text-[#c5a880]" />}
            </div>
            <div className="flex-1">
              <div className="qnox-toast-title">
                {toast.title || (type === 'success' ? 'SUCCESS' : type === 'error' ? 'ALERT' : 'NOTICE')}
              </div>
              <div className="qnox-toast-msg">
                {typeof toast.message === 'object' && toast.message !== null
                  ? (toast.message.message || JSON.stringify(toast.message))
                  : String(toast.message || '')}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-500 hover:text-white transition-colors p-1"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
