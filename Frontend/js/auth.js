/**
 * Auth Service - MongoDB Atlas Session Controller
 * Manages user sessions, admin authorization, and backend authentication endpoints.
 */

const Auth = (() => {
  const API_BASE = window.API_BASE_URL || '/api';

  const KEYS = {
    CURRENT_USER: 'excuseme_current_user',
    CURRENT_ADMIN: 'excuseme_current_admin'
  };

  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem(KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  };

  const setCurrentUser = (user) => {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  };

  const clearCurrentUser = () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  };

  const getCurrentAdmin = () => {
    try {
      const admin = localStorage.getItem(KEYS.CURRENT_ADMIN);
      return admin ? JSON.parse(admin) : null;
    } catch (e) {
      return null;
    }
  };

  const setCurrentAdmin = (admin) => {
    localStorage.setItem(KEYS.CURRENT_ADMIN, JSON.stringify(admin));
  };

  const clearCurrentAdmin = () => {
    localStorage.removeItem(KEYS.CURRENT_ADMIN);
  };

  // Gate access to regular user pages
  const requireAuth = () => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  };

  // Gate access to admin pages
  const requireAdminAuth = () => {
    const admin = getCurrentAdmin();
    if (!admin) {
      window.location.href = 'admin-login.html';
      return null;
    }
    return admin;
  };

  // Redirect logged-in users away from login/register
  const redirectIfLoggedIn = () => {
    const user = getCurrentUser();
    if (user) {
      window.location.href = 'index.html';
    }
  };

  // Login via Express Backend -> MongoDB Atlas
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
      }
      return data;
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Server connection error during login.' };
    }
  };

  // Admin Login via Express Backend -> MongoDB Atlas
  const adminLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentAdmin(data.user);
      }
      return data;
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, message: 'Server connection error during admin login.' };
    }
  };

  const logout = () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  };

  const adminLogout = () => {
    clearCurrentAdmin();
    window.location.href = 'admin-login.html';
  };

  return {
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    getCurrentAdmin,
    setCurrentAdmin,
    clearCurrentAdmin,
    requireAuth,
    requireAdminAuth,
    redirectIfLoggedIn,
    login,
    adminLogin,
    logout,
    adminLogout
  };
})();

window.Auth = Auth;
