/**
 * Storage Service - REST API Client with JWT Auth
 * Connects frontend controllers to Node.js / Express backend with MongoDB Atlas.
 * EXCLUDES ALL PASSWORDS FROM RESPONSES.
 */

const Storage = (() => {
  const getApiBase = () => window.API_BASE_URL || 'http://localhost:5000/api';

  const KEYS = Auth.KEYS;

  // 1. Register User -> POST /api/users/register (bcrypt hash)
  const registerUser = async (userData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.error('Registration API error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  // 2. Reset Password -> POST /api/users/reset-password (Forgot Password)
  const resetPassword = async (resetData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      return await res.json();
    } catch (err) {
      console.error('Reset password API error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  // 3. Change Password -> PUT /api/users/change-password (Profile page)
  const changePassword = async (passwordData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/change-password`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });
      return await res.json();
    } catch (err) {
      console.error('Change password API error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  // 4. Update User Profile -> PUT /api/users/profile (JWT Protected)
  const updateUserProfile = async (email, updatedFields) => {
    try {
      const res = await fetch(`${getApiBase()}/users/profile`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();

      if (data.success && data.user) {
        const currentUser = Auth.getCurrentUser();
        if (currentUser) {
          Auth.setCurrentUser({ ...currentUser, ...data.user });
        }
      }
      return data;
    } catch (err) {
      console.error('Profile update error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  // 5. Admin: Get Registered Users -> GET /api/admin/users (Excludes passwords)
  const getUsers = async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/users`, {
        headers: Auth.getAdminAuthHeaders()
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get users error:', err);
      return [];
    }
  };

  // 6. Get Locations -> GET /api/locations
  const getFacilities = async () => {
    try {
      const res = await fetch(`${getApiBase()}/locations`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get locations error:', err);
      return [];
    }
  };

  // 7. Admin: Create Location -> POST /api/admin/locations
  const addFacility = async (locationData) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/locations`, {
        method: 'POST',
        headers: Auth.getAdminAuthHeaders(),
        body: JSON.stringify(locationData)
      });
      return await res.json();
    } catch (err) {
      console.error('Add location error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  // 8. Get Slots by Location -> GET /api/locations/:id/slots
  const getSlotsByFacility = async (locationId) => {
    try {
      const res = await fetch(`${getApiBase()}/locations/${encodeURIComponent(locationId)}/slots`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get slots error:', err);
      return [];
    }
  };

  // 9. Get User Bookings -> GET /api/bookings (User) or GET /api/admin/bookings (Admin)
  const getBookings = async (userEmail = null) => {
    try {
      const isAdmin = !!Auth.getAdminToken();
      const url = isAdmin ? `${getApiBase()}/admin/bookings` : `${getApiBase()}/bookings`;
      const headers = isAdmin ? Auth.getAdminAuthHeaders() : Auth.getAuthHeaders();

      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get bookings error:', err);
      return [];
    }
  };

  // 10. Cancel Booking -> PUT /api/bookings/:id/cancel
  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${getApiBase()}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('Cancel booking error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  // 11. Extend Booking -> PUT /api/bookings/:id/extend
  const extendBooking = async (bookingId, extraHours) => {
    try {
      const res = await fetch(`${getApiBase()}/bookings/${encodeURIComponent(bookingId)}/extend`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify({ extraHours })
      });
      return await res.json();
    } catch (err) {
      console.error('Extend booking error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  // 12. Get Transactions -> GET /api/transactions (User) or GET /api/admin/transactions (Admin)
  const getTransactions = async (userEmail = null) => {
    try {
      const isAdmin = !!Auth.getAdminToken();
      const url = isAdmin ? `${getApiBase()}/admin/transactions` : `${getApiBase()}/transactions`;
      const headers = isAdmin ? Auth.getAdminAuthHeaders() : Auth.getAuthHeaders();

      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get transactions error:', err);
      return [];
    }
  };

  // 13. Admin: Dashboard Stats -> GET /api/admin/dashboard-stats
  const getAdminDashboardStats = async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/dashboard-stats`, {
        headers: Auth.getAdminAuthHeaders()
      });
      const data = await res.json();
      return data.success ? data.stats : null;
    } catch (err) {
      console.error('Get dashboard stats error:', err);
      return null;
    }
  };

  return {
    KEYS: Auth.KEYS,
    registerUser,
    resetPassword,
    changePassword,
    updateUserProfile,
    getUsers,
    getFacilities,
    addFacility,
    getSlotsByFacility,
    getBookings,
    cancelBooking,
    extendBooking,
    getTransactions,
    getAdminDashboardStats
  };
})();

window.Storage = Storage;
