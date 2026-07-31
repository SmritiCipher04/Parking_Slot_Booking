/**
 * Storage Service - REST API Client with JWT Auth
 * Connects frontend controllers to Node.js / Express backend with MongoDB Atlas.
 * EXCLUDES ALL PASSWORDS FROM RESPONSES.
 */

const Storage = (() => {
  const API_BASE = window.API_BASE_URL || '/api';

  // 1. Register User -> POST /api/users/register (bcrypt hash)
  const registerUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.error('Registration API error:', err);
      return { success: false, message: 'Server connection error.' };
    }
  };

  // 2. Update User Profile -> PUT /api/users/profile (JWT Protected)
  const updateUserProfile = async (email, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
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
      return { success: false, message: 'Server error.' };
    }
  };

  // 3. Admin: Get Registered Users -> GET /api/admin/users (Excludes passwords)
  const getUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: Auth.getAdminAuthHeaders()
      });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get users error:', err);
      return [];
    }
  };

  // 4. Get Locations -> GET /api/locations
  const getFacilities = async () => {
    try {
      const res = await fetch(`${API_BASE}/locations`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get locations error:', err);
      return [];
    }
  };

  // 5. Admin: Create Location -> POST /api/admin/locations
  const addFacility = async (locationData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/locations`, {
        method: 'POST',
        headers: Auth.getAdminAuthHeaders(),
        body: JSON.stringify(locationData)
      });
      return await res.json();
    } catch (err) {
      console.error('Add location error:', err);
      return { success: false, message: 'Server error creating location.' };
    }
  };

  // 6. Get Slots by Location -> GET /api/locations/:id/slots
  const getSlotsByFacility = async (locationId) => {
    try {
      const res = await fetch(`${API_BASE}/locations/${encodeURIComponent(locationId)}/slots`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get slots error:', err);
      return [];
    }
  };

  // 7. Get User Bookings -> GET /api/bookings (User) or GET /api/admin/bookings (Admin)
  const getBookings = async (userEmail = null) => {
    try {
      const isAdmin = !!Auth.getAdminToken();
      const url = isAdmin ? `${API_BASE}/admin/bookings` : `${API_BASE}/bookings`;
      const headers = isAdmin ? Auth.getAdminAuthHeaders() : Auth.getAuthHeaders();

      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get bookings error:', err);
      return [];
    }
  };

  // 8. Cancel Booking -> PUT /api/bookings/:id/cancel
  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('Cancel booking error:', err);
      return { success: false, message: 'Server error cancelling booking.' };
    }
  };

  // 9. Extend Booking -> PUT /api/bookings/:id/extend
  const extendBooking = async (bookingId, extraHours) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}/extend`, {
        method: 'PUT',
        headers: Auth.getAuthHeaders(),
        body: JSON.stringify({ extraHours })
      });
      return await res.json();
    } catch (err) {
      console.error('Extend booking error:', err);
      return { success: false, message: 'Server error extending booking.' };
    }
  };

  // 10. Get Transactions -> GET /api/transactions (User) or GET /api/admin/transactions (Admin)
  const getTransactions = async (userEmail = null) => {
    try {
      const isAdmin = !!Auth.getAdminToken();
      const url = isAdmin ? `${API_BASE}/admin/transactions` : `${API_BASE}/transactions`;
      const headers = isAdmin ? Auth.getAdminAuthHeaders() : Auth.getAuthHeaders();

      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get transactions error:', err);
      return [];
    }
  };

  // 11. Admin: Dashboard Stats -> GET /api/admin/dashboard-stats
  const getAdminDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/dashboard-stats`, {
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
