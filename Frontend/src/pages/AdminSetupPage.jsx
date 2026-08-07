import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';

const AdminSetupPage = () => {
  const { KEYS } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/admin/setup-status');
        const data = await res.json();
        if (data.success && data.isConfigured) {
          setIsConfigured(true);
        }
      } catch (err) {
        console.warn('Error checking setup status:', err);
      }
    };

    checkSetupStatus();
  }, []);

  const handleSetupSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 5) {
      showToast('Password must be at least 5 characters long.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem(KEYS.ADMIN_TOKEN, data.token);
        localStorage.setItem(KEYS.CURRENT_ADMIN, JSON.stringify(data.admin));
        showToast('Admin setup completed successfully! Redirecting to Admin Dashboard.', 'success');
        navigate('/admin-dashboard');
      } else {
        showToast(data.message || 'Setup failed.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to backend server.', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container auth-container">
        <h2>⚙️ One-Time Admin Account Setup</h2>
        <p className="subtitle">Configure your initial system administrator credentials. This setup page can only be used once.</p>

        {isConfigured ? (
          <div id="setup-status-box" style={{ backgroundColor: 'var(--status-booked-bg)', border: '1px solid var(--status-booked-border)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <strong style={{ color: 'var(--status-booked-text)' }}>Notice:</strong> Admin setup has already been completed. This page is permanently disabled.
            <div style={{ marginTop: '10px' }}>
              <Link to="/admin-login" className="btn btn-sm">Go to Admin Login</Link>
            </div>
          </div>
        ) : (
          <form id="admin-setup-form" onSubmit={handleSetupSubmit}>
            <div className="form-group">
              <label htmlFor="setup-username">Create Admin Username</label>
              <input
                type="text"
                id="setup-username"
                placeholder="e.g. admin_master"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="setup-password">Create Admin Password</label>
              <PasswordInput
                id="setup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 5 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="setup-confirm-password">Confirm Admin Password</label>
              <PasswordInput
                id="setup-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>

            <button type="submit" id="setup-submit-btn" className="btn" style={{ width: '100%', backgroundColor: 'var(--text-primary)' }}>
              🔐 Save Credentials & Lock Setup
            </button>
          </form>
        )}

        <p className="small-note" style={{ marginTop: '20px' }}>Already set up? <Link to="/admin-login">Proceed to Admin Login</Link></p>
      </div>
      <Footer />
    </>
  );
};

export default AdminSetupPage;
