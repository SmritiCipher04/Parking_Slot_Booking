/**
 * Profile Page Controller
 * Handles user profile updates and Change Password requests to MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const nameInput = document.getElementById('prof-name');
  const emailInput = document.getElementById('prof-email');
  const phoneInput = document.getElementById('prof-phone');
  const profileForm = document.getElementById('profile-form');
  const changePasswordForm = document.getElementById('change-password-form');
  const logoutBtn = document.getElementById('logout-btn');

  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const updatedName = nameInput.value.trim();
      const updatedPhone = phoneInput.value.trim();

      const res = await Storage.updateUserProfile(user.email, {
        name: updatedName,
        phone: updatedPhone
      });

      if (res.success) {
        alert('Profile details updated successfully in MongoDB Atlas!');
        window.location.reload();
      } else {
        alert(res.message || 'Profile update failed.');
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById('current-password').value.trim();
      const newPassword = document.getElementById('new-password').value.trim();

      const res = await Storage.changePassword({ currentPassword, newPassword });

      if (res.success) {
        alert('Password changed successfully in MongoDB Atlas!');
        changePasswordForm.reset();
      } else {
        alert(res.message || 'Password change failed.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
    });
  }
});
