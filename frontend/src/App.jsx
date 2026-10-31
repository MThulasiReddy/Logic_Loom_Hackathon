import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveFraudDetectionPage from './pages/LiveFraudDetectionPage';
import UserPaymentPage from './pages/UserPaymentPage';
import AdminReviewPage from './pages/AdminReviewPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import FraudAnalyticsPage from './pages/FraudAnalyticsPage';
import ModelInfoPage from './pages/ModelInfoPage';

// Protected Route helper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-sentinel-darkest flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // For hackathon convenience, if not logged in, user can still view dashboard or is redirected to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Main App Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="sandbox" element={<LiveFraudDetectionPage />} />
            <Route path="pay" element={<UserPaymentPage />} />
            <Route path="admin/review" element={<AdminReviewPage />} />
            <Route path="transactions" element={<TransactionHistoryPage />} />
            <Route path="analytics" element={<FraudAnalyticsPage />} />
            <Route path="model-info" element={<ModelInfoPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
