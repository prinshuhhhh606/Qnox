import React from 'react';

export default function InquiriesTab({ inquiries = [] }) {
  return (
    <div className="space-y-6">
      <h3 className="font-serif text-2xl text-white">Private Sanctuary Tour Walkthrough Requests</h3>
      <div className="border border-white/10 bg-[#090909] overflow-x-auto">
        <table className="qnox-admin-table">
          <thead>
            <tr>
              <th>GUEST NAME</th>
              <th>EMAIL & CONTACT</th>
              <th>SANCTUARY</th>
              <th>TIER INTEREST</th>
              <th>PRIMARY GOAL</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => (
              <tr key={inq._id}>
                <td className="font-semibold text-white">{inq.fullName}</td>
                <td>
                  <div>{inq.email}</div>
                  <div className="text-[11px] text-neutral-500">{inq.phone}</div>
                </td>
                <td className="text-[#c5a880]">{inq.preferredClub}</td>
                <td>{inq.membershipTier}</td>
                <td className="text-neutral-400 text-xs">{inq.primaryGoal || 'Performance'}</td>
                <td>
                  <span className="text-[9px] px-2 py-0.5 bg-amber-950/60 text-amber-400 uppercase font-bold">
                    {inq.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
