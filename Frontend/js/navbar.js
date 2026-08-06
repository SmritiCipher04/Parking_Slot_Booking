/**
 * Navbar Component Controller
 * Renders and manages sticky white navbar, top-left hamburger dropdown menu, active page state, and role gating.
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = Auth.getCurrentUser();
  const currentAdmin = Auth.getCurrentAdmin();
  const headerContainer = document.querySelector('header');

  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="navbar">
        <div class="nav-left">
          <!-- Top-Left Hamburger Menu Button -->
          <button class="hamburger-btn" id="hamburger-toggle" title="Menu">
            <span>☰</span>
          </button>

          <!-- Slide-down Dropdown Menu from Hamburger Icon -->
          <div class="dropdown-menu" id="hamburger-dropdown">
            ${currentUser ? `
              <div class="dropdown-header">
                <div class="user-name">👤 ${currentUser.name}</div>
                <div class="user-email">${currentUser.email}</div>
              </div>
              <a href="profile.html" class="dropdown-item">👤 User Info / Profile</a>
              <a href="history.html" class="dropdown-item">📋 My Bookings</a>
              <a href="transactions.html" class="dropdown-item">💳 Transaction History</a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-danger" id="logout-menu-btn">🚪 Logout</button>
            ` : currentAdmin ? `
              <div class="dropdown-header">
                <div class="user-name">Admin: ${currentAdmin.username}</div>
                <div class="user-email">System Control Panel</div>
              </div>
              <a href="admin-dashboard.html" class="dropdown-item">📊 Admin Control Dashboard</a>
              <a href="index.html" class="dropdown-item">🚗 User Portal Home</a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item text-danger" id="logout-menu-btn">🚪 Admin Logout</button>
            ` : `
              <div class="dropdown-header">
                <div class="user-name">Welcome Guest</div>
                <div class="user-email">Please log in to continue</div>
              </div>
              <a href="login.html" class="dropdown-item">🔑 User Login</a>
              <a href="register.html" class="dropdown-item">📝 User Register</a>
              <div class="dropdown-divider"></div>
              <a href="admin-login.html" class="dropdown-item">🛡️ Admin Portal Login</a>
            `}
          </div>
        </div>

        <!-- Centered Brand Title -->
        <div class="nav-center">
          <a href="index.html" class="brand-logo">
            <h1>ExcuseME</h1>
          </a>
        </div>

        <!-- Nav Right Navigation Links -->
        <div class="nav-right">
          <a href="index.html" class="nav-link ${window.location.pathname.includes('index.html') ? 'active' : ''}">Home</a>
          <a href="slots.html" class="nav-link ${window.location.pathname.includes('slots.html') ? 'active' : ''}">Find Slots</a>
          <a href="history.html" class="nav-link ${window.location.pathname.includes('history.html') ? 'active' : ''}">My Bookings</a>
          ${currentUser ? `
            <div class="user-badge">
              <span>👤</span> ${currentUser.name.split(' ')[0]}
            </div>
          ` : `
            <a href="login.html" class="nav-link">Login</a>
          `}
        </div>
      </div>
    `;

    // Dropdown toggle handler
    const hamburgerBtn = document.getElementById('hamburger-toggle');
    const dropdownMenu = document.getElementById('hamburger-dropdown');
    const logoutBtn = document.getElementById('logout-menu-btn');

    if (hamburgerBtn && dropdownMenu) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          dropdownMenu.classList.remove('show');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (currentAdmin) {
          Auth.logoutAdmin();
        } else {
          Auth.logout();
        }
      });
    }
  }
});
