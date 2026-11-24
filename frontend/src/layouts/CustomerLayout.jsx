import React from 'react';
import { Outlet } from 'react-router-dom';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5]">
      <Outlet />
    </div>
  );
}
