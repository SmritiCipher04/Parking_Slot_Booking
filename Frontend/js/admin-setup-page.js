/**
 * Admin Setup Page Controller
 * Checks if admin is already configured. Allows one-time setup and locks permanently upon creation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const setupForm = document.getElementById('admin-setup-form');
  const statusBox = document.getElementById('setup-status-box');
  const submitBtn = document.getElementById('setup-submit-btn');

  // Check setup status via GET /api/admin/setup-status
  try {
    const res = await fetch(`${window.API_BASE_URL || '/api'}/admin/setup-status`);
    const data = await res.json();

    if (data.isConfigured) {
      if (statusBox) statusBox.style.display = 'block';
      if (setupForm) setupForm.style.display = 'none';
      return;
    }
  } catch (err) {
    console.warn('Error checking setup status:', err);
  }

  if (setupForm) {
    setupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('setup-username').value.trim();
      const password = document.getElementById('setup-password').value.trim();
      const confirmPassword = document.getElementById('setup-confirm-password').value.trim();

      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      if (password.length < 5) {
        alert('Password must be at least 5 characters long.');
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;

        const res = await fetch(`${window.API_BASE_URL || '/api'}/admin/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          localStorage.setItem('excuseme_admin_token', data.token);
          localStorage.setItem('excuseme_current_admin', JSON.stringify(data.admin));
          alert('Admin setup completed successfully! Redirecting to Admin Dashboard.');
          window.location.href = 'admin-dashboard.html';
        } else {
          alert(data.message || 'Setup failed.');
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (err) {
        console.error('Setup error:', err);
        alert('Error connecting to backend server.');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
