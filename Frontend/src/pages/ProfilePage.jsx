import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import UserAvatar from '../components/UserAvatar';

const ProfilePage = () => {
  const { user, updateUserProfile, updateUserState, changePassword, logout, getAuthHeaders } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Profile Picture State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Self-Service Deletion State
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert('Invalid file type. Please select a JPEG, PNG, or WebP image.');
      e.target.value = '';
      return;
    }

    // Validate 2MB max file size
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please choose a smaller image.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPicture = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const headers = getAuthHeaders ? getAuthHeaders() : {
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      };
      delete headers['Content-Type'];

      const res = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (data.success && data.user) {
        updateUserState(data.user);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert(data.message || 'Failed to upload profile picture.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading profile picture to server.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Remove profile picture and revert to default avatar?')) return;

    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      };

      const res = await fetch('/api/users/profile-picture', {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (data.success && data.user) {
        updateUserState(data.user);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert(data.message || 'Failed to remove picture.');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const res = await updateUserProfile(email, { name, phone });
    if (res.success) {
      alert('Profile details updated successfully!');
    } else {
      alert(res.message || 'Profile update failed.');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    const res = await changePassword({ currentPassword, newPassword });
    if (res.success) {
      alert('Password changed successfully in MongoDB Atlas!');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      alert(res.message || 'Password change failed.');
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const handleImmediateAccountDeletion = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      alert('Please enter your password to confirm account deletion.');
      return;
    }

    const doubleCheck = window.confirm(
      'PERMANENT ACCOUNT DELETION CONFIRMATION\n\n' +
      'Are you absolutely sure you want to delete your account?\n' +
      'Your account will be deleted IMMEDIATELY and you will be logged out.\n\n' +
      'Click OK to proceed with immediate deletion.'
    );
    if (!doubleCheck) return;

    setDeletionLoading(true);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      };

      const res = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: confirmPassword })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        logout();
        navigate('/login');
      } else {
        alert(data.message || 'Account deletion failed. Please check your password.');
      }
    } catch (err) {
      alert('Error during account deletion request.');
    } finally {
      setDeletionLoading(false);
    }
  };

  const isGoogleUser = user && user.authProvider === 'google';

  return (
    <>
      <Navbar />
      <div className="container main-content" style={{ maxWidth: '600px' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>

          {/* User Profile Header Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px' }}>

            {/* Interactive Circular Avatar with Camera Overlay */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary-blue)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                />
              ) : (
                <UserAvatar user={user} size={88} />
              )}

              <button
                type="button"
                title="Click to change profile picture"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-blue)',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  padding: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)' }}>{user ? user.name : 'User Profile'}</h2>
              <p className="subtitle" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{user ? user.email : ''}</p>
            </div>
          </div>

          {/* Minimal Profile Picture Action Control */}
          <div style={{
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '28px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Profile Picture
            </h3>

            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                Upload a custom image (.jpg, .png, .webp max 2MB)
              </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {selectedFile ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={handleUploadPicture}
                        disabled={uploading}
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                      >
                        {uploading ? 'Saving...' : 'Save'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      Choose New Photo
                    </button>

                    {user && user.profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemovePicture}
                        style={{
                          fontSize: '12px',
                          color: '#dc2626',
                          background: 'none',
                          border: 'none',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                )}
              </div>
          </div>

          <form id="profile-form" onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="prof-name">Full Name</label>
              <input
                type="text"
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-email">Email Address (Read-Only)</label>
              <input
                type="email"
                id="prof-email"
                value={email}
                readOnly
                style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="prof-phone">Phone Number</label>
              <input
                type="tel"
                id="prof-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={!isGoogleUser}
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginBottom: '24px' }}>
              Save Profile Changes
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          {/* ===== SETTINGS / APPEARANCE SECTION ===== */}
          <h3 style={{ marginBottom: '4px' }}>Appearance</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '14px' }}>Customise how ExcuseME looks for you.</p>

          <div className="theme-toggle-row">
            <div className="theme-toggle-label">
              <span style={{ fontSize: '22px', lineHeight: 1 }}>{isDark ? '🌙' : '☀️'}</span>
              <div>
                <div className="theme-toggle-label-text">{isDark ? 'Dark Mode' : 'Light Mode'}</div>
                <div className="theme-toggle-label-sub">{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</div>
              </div>
            </div>
            <label className="theme-switch" aria-label="Toggle dark mode">
              <input
                type="checkbox"
                id="theme-toggle"
                checked={isDark}
                onChange={toggleTheme}
              />
              <span className="theme-switch-slider"></span>
            </label>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          <h3>Change Password</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>Update your password stored in MongoDB Atlas.</p>

          <form id="change-password-form" onSubmit={handleChangePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <PasswordInput
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 chars)"
              />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
              Update Password
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          {/* ===== IMMEDIATE SELF-SERVICE ACCOUNT DELETION SECTION ===== */}
          <h3 style={{ color: '#dc2626' }}>Delete My Account</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>
            Permanently delete your account immediately. No admin approval is required.
          </p>

          {!showDeletionModal ? (
            <button
              id="delete-account-btn"
              type="button"
              className="btn"
              style={{ width: '100%', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
              onClick={() => setShowDeletionModal(true)}
            >
              Delete My Account Immediately
            </button>
          ) : (
            <div style={{
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #fca5a5',
              backgroundColor: '#fff5f5',
            }}>
              <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '14px', fontWeight: 600 }}>
                Warning: This will immediately delete your account. You will be logged out and cannot undo this action.
              </p>
              <form id="immediate-deletion-form" onSubmit={handleImmediateAccountDeletion}>
                <div className="form-group">
                  <label htmlFor="confirm-del-password" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Enter Password to Confirm Deletion
                  </label>
                  <PasswordInput
                    id="confirm-del-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => { setShowDeletionModal(false); setConfirmPassword(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-immediate-deletion-btn"
                    type="submit"
                    className="btn"
                    style={{ flex: 1, backgroundColor: '#dc2626' }}
                    disabled={deletionLoading}
                  >
                    {deletionLoading ? 'Deleting...' : 'Confirm & Delete Now'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          <button id="logout-btn" type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogoutClick}>
            Logout of Account
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfilePage;
