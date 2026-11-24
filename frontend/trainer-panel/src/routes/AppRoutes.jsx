import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TrainerRoute from './TrainerRoute';
import TrainerDashboardPage from '../pages/TrainerDashboardPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <TrainerRoute>
            <TrainerDashboardPage />
          </TrainerRoute>
        }
      />
      <Route
        path="/trainer/*"
        element={
          <TrainerRoute>
            <TrainerDashboardPage />
          </TrainerRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
