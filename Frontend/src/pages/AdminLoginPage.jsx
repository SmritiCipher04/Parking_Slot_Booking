import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';

const AdminLoginPage = () => {
  const { admin, adminLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    if (admin) {
      navigate('/admin-dashboard');
      return;
    }

    const checkSetupStatus = async () => {
      try {
        const res = await fetch('/api/admin/setup-status');
        const data = await res.json();
        if (data.success && !data.isConfigured) {
          setIsConfigured(false);
        }
      } catch (err) {
        console.warn('Error checking setup status:', err);
      }
    };

    checkSetupStatus();
  }, [admin, navigate]);

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    const res = await adminLogin(username, password);
    if (res.success) {
      showToast('Admin Access Granted! Welcome to the Admin Control Dashboard.', 'success');
      navigate('/admin-dashboard');
    } else {
      showToast(res.message || 'Invalid admin credentials.', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container auth-container">
        <h2>🛡️ Admin Portal Login</h2>
        <p className="subtitle">Authenticate with your self-created admin username and password.</p>

        {!isConfigured && (
          <div id="unconfigured-notice" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-focus)', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            <strong>Initial Setup Required:</strong> No admin account has been created yet.
            <div style={{ marginTop: '10px' }}>
              <Link to="/admin-setup" className="btn btn-sm">⚙️ Perform One-Time Admin Setup</Link>
            </div>
          </div>
        )}

        <form id="admin-login-form" onSubmit={handleAdminLoginSubmit}>
          <div className="form-group">
            <label htmlFor="admin-email">Admin Username</label>
            <input
              type="text"
              id="admin-email"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <PasswordInput
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%', backgroundColor: 'var(--text-primary)' }}>
            🔑 Login to Admin Control Panel
          </button>
        </form>

        <p className="small-note" style={{ marginTop: '20px' }}>Return to regular <Link to="/login">User Portal Login</Link></p>
      </div>
      <Footer />
    </>
  );
};

export default AdminLoginPage;
