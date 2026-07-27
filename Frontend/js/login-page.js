/**
 * Login Page Controller
 * Validates user credentials against MongoDB Atlas database via Express API.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to home if user is already logged in
  Auth.redirectIfLoggedIn();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      const result = await Auth.login(email, password);
      if (result.success) {
        window.location.href = 'index.html';
      } else {
        alert(result.message || 'Login failed. Please check credentials.');
      }
    });
  }
});
