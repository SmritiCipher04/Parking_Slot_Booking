/**
 * Password Visibility Toggle Script
 * Enables Eye Open & Eye Closed icon visibility toggle across all password fields.
 */

const EYE_OPEN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_CLOSED_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
});

function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password-btn');

  toggleButtons.forEach(btn => {
    // Set initial icon if empty or emoji
    if (!btn.querySelector('svg')) {
      btn.innerHTML = EYE_OPEN_SVG;
    }

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
        btn.innerHTML = EYE_CLOSED_SVG;
        btn.setAttribute('title', 'Hide password');
      } else {
        input.type = 'password';
        btn.innerHTML = EYE_OPEN_SVG;
        btn.setAttribute('title', 'Show password');
      }
    });
  });
}

window.initPasswordToggles = initPasswordToggles;
