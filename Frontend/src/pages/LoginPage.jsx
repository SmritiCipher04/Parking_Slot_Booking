import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const { user, login, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password, rememberMe);
    if (result.success) {
      showToast('Logged in successfully!', 'success');
      navigate('/');
    } else {
      showToast(result.message || 'Invalid email or password.', 'error');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    const res = await resetPassword({
      email: forgotEmail,
      phone: forgotPhone,
      newPassword: forgotNewPassword
    });

    if (res.success) {
      alert('Success! Your password has been reset. Please log in with your new password.');
      setIsForgotModalOpen(false);
      setForgotEmail('');
      setForgotPhone('');
      setForgotNewPassword('');
    } else {
      alert(res.message || 'Password reset failed.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container auth-container">
        <h2 style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>Welcome Back</h2>
        <p className="subtitle">Access your account to book slots and manage reservations</p>

        <form id="login-form" onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <a
                href="#"
                id="forgot-password-link"
                style={{ fontSize: '12px', color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'none' }}
                onClick={(e) => {
                  e.preventDefault();
                  setIsForgotModalOpen(true);
                }}
              >
                Forgot Password?
              </a>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0 20px 0' }}>
            <input
              type="checkbox"
              id="remember-me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '15px',
                height: '15px',
                accentColor: 'var(--primary-blue)',
                cursor: 'pointer',
                margin: 0
              }}
            />
            <label
              htmlFor="remember-me"
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                margin: 0,
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 'normal',
                display: 'inline',
                lineHeight: 1,
                userSelect: 'none'
              }}
            >
              Remember me
            </label>
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>Sign In</button>
        </form>

        <p className="small-note">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>

      {/* Reset Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} maxWidth={440}>
        <h3>🔑 Reset Your Password</h3>
        <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>
          Verify your registered email and phone number to create a new password.
        </p>

        <form id="forgot-password-form" onSubmit={handleForgotSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Registered Email</label>
            <input
              type="email"
              id="forgot-email"
              placeholder="e.g. user@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="forgot-phone">Registered Phone Number</label>
            <input
              type="tel"
              id="forgot-phone"
              placeholder="e.g. 9876543210"
              value={forgotPhone}
              onChange={(e) => setForgotPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="forgot-new-password">New Password</label>
            <PasswordInput
              id="forgot-new-password"
              value={forgotNewPassword}
              onChange={(e) => setForgotNewPassword(e.target.value)}
              placeholder="At least 4 characters"
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsForgotModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn" id="forgot-submit-btn">
              Reset Password
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </>
  );
};

export default LoginPage;
