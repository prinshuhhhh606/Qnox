import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, CheckCircle, Clock, XCircle, AlertCircle, Shield,
  ArrowRight, FileText, User, Calendar, MapPin, Award, RefreshCw
} from 'lucide-react';
import { fetchTrainerApplicationStatus } from '../services/api';

export default function ApplicationStatusPage() {
  const [searchParams] = useSearchParams();
  const initialAppId = searchParams.get('appId') || '';
  const initialEmail = searchParams.get('email') || '';

  const [applicationId, setApplicationId] = useState(initialAppId);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialAppId || initialEmail) {
      handleSearch(initialAppId, initialEmail);
    }
  }, [initialAppId, initialEmail]);

  const handleSearch = async (appIdToSearch = applicationId, emailToSearch = email) => {
    if (!appIdToSearch && !emailToSearch) {
      setError('Please provide your Application ID or registered Email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetchTrainerApplicationStatus({
        applicationId: appIdToSearch ? appIdToSearch.trim() : undefined,
        email: emailToSearch ? emailToSearch.trim() : undefined,
      });

      if (res.success && res.data) {
        setApplication(res.data);
      }
    } catch (err) {
      setApplication(null);
      setError(err.message || 'No application record found with provided credentials.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <Clock className="w-3.5 h-3.5 animate-spin" /> Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed] pt-32 pb-24 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c5a880]/10 border border-[#c5a880]/30 text-[#c5a880] text-xs uppercase tracking-widest font-semibold">
            <Shield className="w-3.5 h-3.5" /> Accreditation Status
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-white tracking-wide">
            Track Trainer Application Status
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 max-w-lg mx-auto">
            Check the live review progress of your application using your Application ID or registered email.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-[#0b0b0b] border border-[#c5a880]/20 rounded-2xl p-6 md:p-8 shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Application ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. QNX-TRN-7849"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Registered Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. trainer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c5a880] hover:bg-[#d8bf9b] text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Records...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Check Status
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Result Card */}
        {application && (
          <div className="bg-[#0b0b0b] border border-[#c5a880]/30 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-neutral-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">APPLICATION DOSSIER</span>
                <h3 className="text-xl font-serif text-white">{application.applicantName}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{application.email}</p>
              </div>
              <div className="text-right sm:text-right">
                {getStatusBadge(application.currentStatus)}
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  ID: {application.applicationId}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#121212] border border-neutral-800">
                <span className="text-[10px] uppercase text-neutral-500 block mb-1">Submitted On</span>
                <span className="text-neutral-200 font-medium">
                  {new Date(application.submissionDate).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#121212] border border-neutral-800">
                <span className="text-[10px] uppercase text-neutral-500 block mb-1">Experience</span>
                <span className="text-neutral-200 font-medium">
                  {application.experienceYears} Years
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#121212] border border-neutral-800">
                <span className="text-[10px] uppercase text-neutral-500 block mb-1">Gym Base</span>
                <span className="text-neutral-200 font-medium truncate block">
                  {application.gymName || 'Independent'}
                </span>
              </div>
            </div>

            {/* Specializations */}
            {application.specializations?.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-2">
                  Specializations
                </span>
                <div className="flex flex-wrap gap-2">
                  {application.specializations.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#181818] border border-neutral-800 text-[11px] text-[#c5a880]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Remarks / Next Steps */}
            <div className="p-4 rounded-xl bg-[#141414] border border-neutral-800 space-y-2">
              <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-[#c5a880]">
                {application.currentStatus === 'Approved'
                  ? 'Access Status & Next Steps'
                  : application.currentStatus === 'Rejected'
                  ? 'Administrative Decision'
                  : 'Review In Progress'}
              </h4>

              {application.currentStatus === 'Approved' ? (
                <div className="space-y-2 text-xs text-neutral-300">
                  <p className="text-emerald-400 font-medium">
                    ✓ Your credentials have been verified and approved by the Sanctuary Administration.
                  </p>
                  <p className="text-neutral-400">
                    Your trainer account is active. You can now log in via the Sanctuary portal using your registered email and password to access the Master Coach Command Center.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/"
                      onClick={() => {
                        window.location.hash = '#trainer';
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#c5a880] text-black font-semibold text-xs uppercase tracking-wider hover:bg-[#d8bf9b]"
                    >
                      Sign In to Coach Portal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : application.currentStatus === 'Rejected' ? (
                <div className="space-y-2 text-xs text-neutral-300">
                  <p className="text-red-400 font-medium">Application not approved at this time.</p>
                  {application.adminRemarks && (
                    <p className="text-neutral-400 italic">
                      Admin Remarks: "{application.adminRemarks}"
                    </p>
                  )}
                  <p className="text-neutral-500 text-[11px]">
                    You may re-apply after 30 days with updated certifications and experience documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-neutral-400">
                  <p>
                    Your application is currently in queue. Administrative verification typically requires 24 to 48 hours.
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    You do not yet have access to the Coach Dashboard until an administrator approves your verified documents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
