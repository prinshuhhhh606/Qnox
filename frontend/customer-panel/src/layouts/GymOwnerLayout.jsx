import React from 'react';
import { Outlet } from 'react-router-dom';

export default function GymOwnerLayout() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5]">
      <Outlet />
    </div>
  );
}
