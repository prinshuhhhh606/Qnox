import React from 'react';
import { Users, Crown, DollarSign, Calendar, MessageSquare } from 'lucide-react';

export default function OverviewTab({
  stats = {},
  chartData = [],
  analyticsPeriod = 'monthly',
  setAnalyticsPeriod,
  recentActivities = {},
}) {
  const maxChartVal = Math.max(...chartData.map((d) => d.revenue || 0), 1000);

  return (
    <div className="space-y-10">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="qnox-stat-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold">TOTAL MEMBERS</span>
            <Users className="w-4 h-4 text-[#c5a880]" />
          </div>
          <div className="font-serif text-3xl text-white font-bold">{stats.totalMembers || 0}</div>
          <p className="text-[10px] text-emerald-400 mt-1">&uarr; +18% this month</p>
        </div>

        <div className="qnox-stat-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold">ACTIVE PLANS</span>
            <Crown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-serif text-3xl text-white font-bold">{stats.activeMemberships || 0}</div>
          <p className="text-[10px] text-neutral-500 mt-1">High retention rate (92%)</p>
        </div>

        <div className="qnox-stat-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold">TOTAL REVENUE</span>
            <DollarSign className="w-4 h-4 text-[#c5a880]" />
          </div>
          <div className="font-serif text-3xl text-white font-bold">
            ₹{stats.totalRevenue >= 100000 ? `${(stats.totalRevenue / 100000).toFixed(1)}L` : stats.totalRevenue || 0}
          </div>
          <p className="text-[10px] text-emerald-400 mt-1">Via Razorpay Gateway</p>
        </div>

        <div className="qnox-stat-card">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold">CLASS BOOKINGS</span>
            <Calendar className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-serif text-3xl text-white font-bold">{stats.totalBookings || 0}</div>
          <p className="text-[10px] text-neutral-500 mt-1">Across 6 Sanctuaries</p>
        </div>

        <div className="qnox-stat-card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[10px] tracking-widest uppercase font-semibold">TOUR REQUESTS</span>
            <MessageSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-serif text-3xl text-white font-bold">{stats.pendingInquiries || 0}</div>
          <p className="text-[10px] text-amber-400 mt-1">Awaiting concierge call</p>
        </div>
      </div>

      {/* Revenue Analytics Interactive Chart */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#c5a880] font-semibold block mb-1">
              EXECUTIVE FINANCIAL PERFORMANCE
            </span>
            <h3 className="font-serif text-2xl text-white">Revenue & Membership Trajectory</h3>
          </div>

          <div className="flex items-center space-x-2 bg-[#121212] p-1 border border-white/10">
            <button
              onClick={() => setAnalyticsPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                analyticsPeriod === 'monthly' ? 'bg-[#c5a880] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setAnalyticsPeriod('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                analyticsPeriod === 'weekly' ? 'bg-[#c5a880] text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              THIS WEEK
            </button>
          </div>
        </div>

        {/* Bar Graph Visual */}
        <div className="h-64 flex items-end justify-between gap-4 pt-10 px-4 border-b border-white/10">
          {chartData.map((item, idx) => {
            const label = item.month || item.day;
            const rev = item.revenue || 0;
            const heightPercent = Math.max(12, Math.round((rev / maxChartVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] text-[#c5a880] font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                  ₹{(rev / 1000).toFixed(0)}k
                </span>
                <div
                  className="w-full max-w-[42px] bg-[#c5a880] rounded-none qnox-chart-bar"
                  style={{ height: `${heightPercent}%`, backgroundColor: '#c5a880' }}
                />
                <span className="text-xs text-neutral-400 font-mono mt-3 uppercase">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0a0a0a] border border-white/10 p-6">
          <h4 className="font-serif text-lg text-white mb-4">Latest Razorpay Payments</h4>
          <div className="space-y-3">
            {recentActivities.payments?.map((p) => (
              <div key={p._id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                <div>
                  <div className="text-white font-medium">{p.userName}</div>
                  <div className="text-neutral-500 font-mono text-[11px]">{p.planName} &bull; {p.duration}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#c5a880] font-mono font-bold">₹{p.amount?.toLocaleString('en-IN')}</div>
                  <div className="text-emerald-400 text-[10px] uppercase font-bold">{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-6">
          <h4 className="font-serif text-lg text-white mb-4">Recent Tour Inquiries</h4>
          <div className="space-y-3">
            {recentActivities.inquiries?.map((inq) => (
              <div key={inq._id} className="flex items-center justify-between text-xs border-b border-white/5 pb-2.5">
                <div>
                  <div className="text-white font-medium">{inq.fullName}</div>
                  <div className="text-neutral-500 text-[11px]">{inq.preferredClub} &bull; {inq.phone}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-amber-950/60 text-amber-400 uppercase font-bold">
                  {inq.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
