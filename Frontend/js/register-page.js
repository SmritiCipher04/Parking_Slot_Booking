/**
 * Register Page Controller
 * Validates registration fields and creates new User document in MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect to home if user is already logged in
  Auth.redirectIfLoggedIn();

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();

      if (password !== confirmPassword) {
        alert('Passwords do not match. Please ensure both password fields match.');
        return;
      }

      if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
      }

      const result = await Storage.registerUser({ name, email, phone, password });
      if (result.success) {
        alert('Account registered successfully in MongoDB Atlas! Please log in with your credentials.');
        window.location.href = 'login.html';
      } else {
        alert(result.message || 'Registration failed.');
      }
    });
  }
});
