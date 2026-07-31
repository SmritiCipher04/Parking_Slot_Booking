/**
 * Admin Login Page Controller
 * Checks admin setup status. Authenticates against self-created admin account via bcrypt.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const noticeBox = document.getElementById('unconfigured-notice');
  const loginForm = document.getElementById('admin-login-form');

  // Check setup status via GET /api/admin/setup-status
  try {
    const res = await fetch(`${window.API_BASE_URL || '/api'}/admin/setup-status`);
    const data = await res.json();

    if (!data.isConfigured) {
      if (noticeBox) noticeBox.style.display = 'block';
    }
  } catch (err) {
    console.warn('Error checking admin setup status:', err);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value.trim();

      const res = await Auth.adminLogin(username, password);
      if (res.success) {
        alert('Admin Access Granted! Welcome to the Admin Control Dashboard.');
        window.location.href = 'admin-dashboard.html';
      } else {
        alert(res.message || 'Invalid admin credentials.');
      }
    });
  }
});
