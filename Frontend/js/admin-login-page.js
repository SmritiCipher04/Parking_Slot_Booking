/**
 * Admin Login Page Controller
 * Validates admin credentials against MongoDB Atlas via Express API.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value.trim();

      const res = await Auth.adminLogin(email, password);
      if (res.success) {
        alert('Admin Access Granted! Welcome to the Admin Control Dashboard.');
        window.location.href = 'admin-dashboard.html';
      } else {
        alert(res.message || 'Invalid admin credentials.');
      }
    });
  }
});
