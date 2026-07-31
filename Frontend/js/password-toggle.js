/**
 * Password Visibility Toggle Script
 * Enables eye button (👁️ / 🙈) visibility toggle across all password fields.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
});

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');

  toggleButtons.forEach(btn => {
    // Prevent duplicate binding
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const targetId = btn.getAttribute('data-target');
      let input = null;

      if (targetId) {
        input = document.getElementById(targetId);
      } else {
        const wrapper = btn.closest('.password-wrapper') || btn.parentElement;
        if (wrapper) {
          input = wrapper.querySelector('input[type="password"], input[type="text"]');
        }
      }

      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.setAttribute('title', 'Hide password');
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.setAttribute('title', 'Show password');
      }
    });
  });
}

window.initPasswordToggles = initPasswordToggles;
