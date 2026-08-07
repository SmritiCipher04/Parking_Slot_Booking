import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import GoogleLoginButton from '../components/GoogleLoginButton';

import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const { user, registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please check both password fields.', 'error');
      return;
    }

    if (password.length < 4) {
      showToast('Password must be at least 4 characters long.', 'error');
      return;
    }

    const result = await registerUser({ name, email, phone, password });
    if (result.success) {
      showToast('Account registered successfully! Please log in.', 'success');
      navigate('/login');
    } else {
      showToast(result.message || 'Registration failed.', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container auth-container">
        <h2>Create Your Account</h2>
        <p className="subtitle">Register to reserve parking slots across top locations</p>

        <form id="register-form" onSubmit={handleRegisterSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 4 chars)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }}>Register Account</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></div>
          <span style={{ padding: '0 12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></div>
        </div>

        <GoogleLoginButton />

        <p className="small-note">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
      <Footer />
    </>
  );
};

export default RegisterPage;
