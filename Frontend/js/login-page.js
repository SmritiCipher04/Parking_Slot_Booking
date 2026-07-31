/**
 * Login Page Controller
 * Validates user credentials, handles Forgot Password modal, and calls reset API on MongoDB Atlas.
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

  // Forgot Password Modal Handlers
  const forgotLink = document.getElementById('forgot-password-link');
  const forgotModal = document.getElementById('forgot-modal');
  const forgotCloseBtn = document.getElementById('forgot-modal-close');
  const forgotCancelBtn = document.getElementById('forgot-modal-cancel');
  const forgotForm = document.getElementById('forgot-password-form');

  function openForgotModal(e) {
    if (e) e.preventDefault();
    if (forgotModal) forgotModal.classList.add('active');
  }

  function closeForgotModal() {
    if (forgotModal) forgotModal.classList.remove('active');
  }

  if (forgotLink) forgotLink.addEventListener('click', openForgotModal);
  if (forgotCloseBtn) forgotCloseBtn.addEventListener('click', closeForgotModal);
  if (forgotCancelBtn) forgotCancelBtn.addEventListener('click', closeForgotModal);

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('forgot-email').value.trim();
      const phone = document.getElementById('forgot-phone').value.trim();
      const newPassword = document.getElementById('forgot-new-password').value.trim();

      const res = await Storage.resetPassword({ email, phone, newPassword });

      if (res.success) {
        alert('Success! Your password has been reset. Please log in with your new password.');
        closeForgotModal();
        forgotForm.reset();
      } else {
        alert(res.message || 'Password reset failed.');
      }
    });
  }
});
