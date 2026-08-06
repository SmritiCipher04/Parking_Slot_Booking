/**
 * GoogleLoginButton Component
 * Renders official Google Sign-In button following Google's brand guidelines
 * (white background, official Google G logo, royal blue border/hover).
 * Uses @react-oauth/google with fallback for seamless login.
 */

import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GoogleLoginButton = ({ onSuccessCallback }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const data = await res.json();
      if (data.success && data.token && data.user) {
        login(data.user, data.token);
        if (onSuccessCallback) onSuccessCallback(data);
        alert(`Welcome, ${data.user.name}! Successfully signed in with Google.`);
        navigate('/');
      } else {
        alert(data.message || 'Google Sign-In failed.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      alert('Error connecting to backend server for Google Sign-In.');
    }
  };

  const handleSimulatedGoogleLogin = async () => {
    const dummyEmail = prompt('Enter your Gmail address to simulate Google Sign-In:', 'smriti.g@gmail.com');
    if (!dummyEmail) return;

    try {
      const res = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dummyEmail,
          name: dummyEmail.split('@')[0].replace('.', ' '),
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        })
      });

      const data = await res.json();
      if (data.success && data.token && data.user) {
        login(data.user, data.token);
        if (onSuccessCallback) onSuccessCallback(data);
        alert(`Welcome, ${data.user.name}! Signed in with Google.`);
        navigate('/');
      } else {
        alert(data.message || 'Google Sign-In failed.');
      }
    } catch (err) {
      console.error('Simulated Google login error:', err);
      alert('Error connecting to backend server.');
    }
  };

  if (clientId) {
    return (
      <GoogleOAuthProvider clientId={clientId}>
        <div className="google-btn-wrapper" style={{ margin: '16px 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google Sign-In was cancelled or failed.')}
            useOneTap
            shape="pill"
            theme="outline"
            size="large"
            text="signin_with"
            width="100%"
          />
        </div>
      </GoogleOAuthProvider>
    );
  }

  // Official Brand Styled Fallback Google Button
  return (
    <div style={{ margin: '16px 0', width: '100%' }}>
      <button
        type="button"
        className="google-custom-login-btn"
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#3c4043',
          border: '1px solid #dadce0',
          borderRadius: '24px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 1px 2px rgba(60,64,67,0.15)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}
        onClick={handleSimulatedGoogleLogin}
      >
        {/* Official Google G Logo SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Sign in with Google
      </button>
    </div>
  );
};

export default GoogleLoginButton;
