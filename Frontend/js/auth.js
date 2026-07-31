/**
 * Auth Service - JWT & Session Controller
 * Manages user & admin JWT tokens, login verification via bcrypt, authorization headers, and logout.
 */

const Auth = (() => {
  const API_BASE = window.API_BASE_URL || '/api';

  const KEYS = {
    USER_TOKEN: 'excuseme_user_token',
    ADMIN_TOKEN: 'excuseme_admin_token',
    CURRENT_USER: 'excuseme_current_user',
    CURRENT_ADMIN: 'excuseme_current_admin'
  };

  const getUserToken = () => localStorage.getItem(KEYS.USER_TOKEN);
  const getAdminToken = () => localStorage.getItem(KEYS.ADMIN_TOKEN);

  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem(KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  };

  const getCurrentAdmin = () => {
    try {
      const admin = localStorage.getItem(KEYS.CURRENT_ADMIN);
      return admin ? JSON.parse(admin) : null;
    } catch (e) {
      return null;
    }
  };

  // Helper for authenticated user API calls
  const getAuthHeaders = () => {
    const token = getUserToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  // Helper for authenticated admin API calls
  const getAdminAuthHeaders = () => {
    const token = getAdminToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const requireAuth = () => {
    const user = getCurrentUser();
    const token = getUserToken();
    if (!user || !token) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  };

  const requireAdminAuth = () => {
    const admin = getCurrentAdmin();
    const token = getAdminToken();
    if (!admin || !token) {
      window.location.href = 'admin-login.html';
      return null;
    }
    return admin;
  };

  const redirectIfLoggedIn = () => {
    const user = getCurrentUser();
    if (user && getUserToken()) {
      window.location.href = 'index.html';
    }
  };

  // User Login via POST /api/users/login (bcrypt compare)
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem(KEYS.USER_TOKEN, data.token);
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(data.user));
      }
      return data;
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  // Admin Login via POST /api/admin/login (bcrypt compare)
  const adminLogin = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token && data.admin) {
        localStorage.setItem(KEYS.ADMIN_TOKEN, data.token);
        localStorage.setItem(KEYS.CURRENT_ADMIN, JSON.stringify(data.admin));
      }
      return data;
    } catch (err) {
      console.error('Admin login error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(KEYS.USER_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_USER);
    window.location.href = 'login.html';
  };

  const adminLogout = () => {
    localStorage.removeItem(KEYS.ADMIN_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_ADMIN);
    window.location.href = 'admin-login.html';
  };

  return {
    KEYS,
    getUserToken,
    getAdminToken,
    getCurrentUser,
    getCurrentAdmin,
    getAuthHeaders,
    getAdminAuthHeaders,
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
