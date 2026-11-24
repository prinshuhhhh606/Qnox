import React from 'react';
import { Download, Send } from 'lucide-react';

export default function NewsletterTab({
  subscribers = [],
  campaignForm,
  setCampaignForm,
  sendingCampaign,
  handleSendCampaign,
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-2xl text-white">The Inner Circle Subscribers ({subscribers.length})</h3>
          <p className="text-xs text-neutral-400 font-light">Discreet luxury editorial subscribers.</p>
        </div>
        <a
          href="/api/newsletter/export-csv"
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT SUBSCRIBERS CSV</span>
        </a>
      </div>

      {/* Campaign Sender */}
      <div className="bg-[#090909] border border-white/10 p-6 sm:p-8">
        <h4 className="font-serif text-xl text-white mb-2">Dispatch New Editorial Campaign</h4>
        <p className="text-xs text-neutral-400 mb-6">Transmits branded luxury email to all verified Inner Circle subscribers.</p>

        <form onSubmit={handleSendCampaign} className="space-y-4">
          <div>
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
              SUBJECT LINE
            </label>
            <input
              type="text"
              required
              value={campaignForm.subject}
              onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
              placeholder="e.g. The Longevity Protocol: Oxygen & Sub-Zero Therapy"
              className="qnox-modal-form-input"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">
              CONTENT HTML BODY
            </label>
            <textarea
              rows={4}
              required
              value={campaignForm.contentHtml}
              onChange={(e) => setCampaignForm({ ...campaignForm, contentHtml: e.target.value })}
              placeholder="<p>Dear Member, we are pleased to announce...</p>"
              className="qnox-modal-form-input font-mono text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={sendingCampaign}
            className="px-6 py-3 bg-[#c5a880] text-black text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingCampaign ? 'TRANSMITTING CAMPAIGN...' : 'SEND EDITORIAL DISPATCH'}</span>
          </button>
        </form>
      </div>

      {/* Subscriber List Table */}
      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
        <table className="qnox-admin-table">
          <thead>
            <tr>
              <th>SUBSCRIBER EMAIL</th>
              <th>TIER INTEREST</th>
              <th>STATUS</th>
              <th>JOINED DATE</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s._id}>
                <td className="font-mono text-white">{s.email}</td>
                <td>{s.tierInterest}</td>
                <td>
                  <span
                    className={`text-[9px] px-2 py-0.5 uppercase font-bold ${
                      s.isActive ? 'bg-emerald-950/60 text-emerald-400' : 'bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    {s.isActive ? 'ACTIVE' : 'UNSUBSCRIBED'}
                  </span>
                </td>
                <td className="font-mono text-xs">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-GB') : 'Recent'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
