import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Route Guards
import CustomerRoute from './CustomerRoute';
import TrainerRoute from './TrainerRoute';

// Public & Customer Pages
import Home from '../pages/Home';
import ClubsPage from '../pages/ClubsPage';
import SanctuariesPage from '../pages/SanctuariesPage';
import MembershipPage from '../pages/MembershipPage';
import TimetablePage from '../pages/TimetablePage';
import TrainersPage from '../pages/TrainersPage';
import PressPage from '../pages/PressPage';
import JoinAsTrainerPage from '../pages/JoinAsTrainerPage';
import ApplicationStatusPage from '../pages/ApplicationStatusPage';
import CustomerDashboardPage from '../pages/CustomerDashboardPage';
import TrainerDashboardPage from '../pages/TrainerDashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC WEBSITE ROUTES */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/sanctuaries" element={<SanctuariesPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/trainers" element={<TrainersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/join-as-trainer" element={<JoinAsTrainerPage />} />
        <Route path="/trainer/application-status" element={<ApplicationStatusPage />} />
      </Route>

      {/* 2. CUSTOMER RESIDENCY PORTAL */}
      <Route
        path="/customer"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<CustomerDashboardPage />} />
        <Route path="dashboard" element={<CustomerDashboardPage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<CustomerDashboardPage />} />
      </Route>

      {/* 3. TRAINER PORTAL (With Dedicated Master Trainer Access Gate) */}
      <Route
        path="/trainer"
        element={
          <TrainerRoute>
            <TrainerDashboardPage />
          </TrainerRoute>
        }
      >
        <Route index element={<TrainerDashboardPage />} />
        <Route path="dashboard" element={<TrainerDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
