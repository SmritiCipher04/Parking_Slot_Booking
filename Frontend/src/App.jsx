import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import MapErrorBoundary from './components/MapErrorBoundary';
import './styles/style.css';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SlotsPage from './pages/SlotsPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import HistoryPage from './pages/HistoryPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import ExcuseMePlusPage from './pages/ExcuseMePlusPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';
import BecomePartnerPage from './pages/BecomePartnerPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';

function App() {
  return (
    <ToastProvider>
      <GoogleMapsProvider>
        <AuthProvider>
          <Router>
            <MapErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/slots" element={<SlotsPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/confirmation" element={<ConfirmationPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/excuseme-plus" element={<ExcuseMePlusPage />} />
                <Route path="/my-subscriptions" element={<MySubscriptionsPage />} />
                <Route path="/become-partner" element={<BecomePartnerPage />} />
                <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/admin-setup" element={<AdminSetupPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
              </Routes>
            </MapErrorBoundary>
          </Router>
        </AuthProvider>
      </GoogleMapsProvider>
    </ToastProvider>
  );
}

export default App;

