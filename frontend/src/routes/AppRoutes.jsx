import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import TrainerLayout from '../layouts/TrainerLayout';
import AdminLayout from '../layouts/AdminLayout';
import GymOwnerLayout from '../layouts/GymOwnerLayout';

// Route Guards
import CustomerRoute from './CustomerRoute';
import TrainerRoute from './TrainerRoute';
import AdminRoute from './AdminRoute';
import GymOwnerRoute from './GymOwnerRoute';

// Public Pages
import Home from '../pages/Home';
import ClubsPage from '../pages/ClubsPage';
import SanctuariesPage from '../pages/SanctuariesPage';
import MembershipPage from '../pages/MembershipPage';
import TimetablePage from '../pages/TimetablePage';
import TrainersPage from '../pages/TrainersPage';
import PressPage from '../pages/PressPage';
import JoinAsTrainerPage from '../pages/JoinAsTrainerPage';
import ApplicationStatusPage from '../pages/ApplicationStatusPage';

// Module Pages
import CustomerDashboardPage from '../modules/customer/pages/CustomerDashboardPage';
import TrainerDashboardPage from '../modules/trainer/pages/TrainerDashboardPage';
import AdminDashboardPage from '../modules/admin/pages/AdminDashboardPage';
import GymOwnerDashboardPage from '../pages/GymOwnerDashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
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

      {/* 2. CUSTOMER PANEL (Protected) */}
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

      {/* 3. TRAINER PANEL (Protected & Approved Only) */}
      <Route
        path="/trainer"
        element={
          <TrainerRoute>
            <TrainerLayout />
          </TrainerRoute>
        }
      >
        <Route index element={<TrainerDashboardPage />} />
        <Route path="dashboard" element={<TrainerDashboardPage />} />
      </Route>

      {/* 4. ADMIN PANEL (Protected & Role RBAC) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      {/* 5. GYM OWNER PANEL (Protected SaaS Partner Suite) */}
      <Route
        path="/gym-owner"
        element={
          <GymOwnerRoute>
            <GymOwnerLayout />
          </GymOwnerRoute>
        }
      >
        <Route index element={<GymOwnerDashboardPage />} />
        <Route path="dashboard" element={<GymOwnerDashboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
