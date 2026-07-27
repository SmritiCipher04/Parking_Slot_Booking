/**
 * Storage Service - API Bridge to MongoDB Atlas
 * Connects frontend views to Node.js/Express backend connected to MongoDB Atlas.
 */

const Storage = (() => {
  const API_BASE = window.API_BASE_URL || '/api';

  const KEYS = {
    CURRENT_USER: 'excuseme_current_user',
    CURRENT_ADMIN: 'excuseme_current_admin'
  };

  // 1. User Registration -> POST /api/auth/register (MongoDB Atlas)
  const registerUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Registration API error:', err);
      return { success: false, message: 'Server error during registration.' };
    }
  };

  // 2. User Profile Update -> PUT /api/auth/profile (MongoDB Atlas)
  const updateUserProfile = async (email, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updatedFields })
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Update session
        const currentUser = JSON.parse(localStorage.getItem(KEYS.CURRENT_USER));
        if (currentUser) {
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({ ...currentUser, ...updatedFields }));
        }
      }
      return data;
    } catch (err) {
      console.error('Profile update error:', err);
      return { success: false, message: 'Server error updating profile.' };
    }
  };

  // 3. Get All Registered Users (Admin) -> GET /api/auth/users (MongoDB Atlas)
  const getUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get users error:', err);
      return [];
    }
  };

  // 4. Get Facilities -> GET /api/slots/facilities (MongoDB Atlas)
  const getFacilities = async () => {
    try {
      const res = await fetch(`${API_BASE}/slots/facilities`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get facilities error:', err);
      return [];
    }
  };

  // 5. Add Facility (Admin) -> POST /api/slots/facilities (MongoDB Atlas)
  const addFacility = async (facilityData) => {
    try {
      const res = await fetch(`${API_BASE}/slots/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facilityData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Add facility error:', err);
      return { success: false, message: 'Server error creating facility.' };
    }
  };

  // 6. Get Slots by Facility -> GET /api/slots?facilityId=... (MongoDB Atlas)
  const getSlotsByFacility = async (facilityId) => {
    try {
      const res = await fetch(`${API_BASE}/slots?facilityId=${encodeURIComponent(facilityId)}`);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get slots error:', err);
      return [];
    }
  };

  // 7. Get User Bookings -> GET /api/bookings?email=... (MongoDB Atlas)
  const getBookings = async (userEmail = null) => {
    try {
      const url = userEmail 
        ? `${API_BASE}/bookings?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE}/bookings?all=true`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get bookings error:', err);
      return [];
    }
  };

  // 8. Cancel Booking -> PUT /api/bookings/:id/cancel (MongoDB Atlas)
  const cancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'PUT'
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Cancel booking error:', err);
      return { success: false, message: 'Server error cancelling booking.' };
    }
  };

  // 9. Extend Booking -> PUT /api/bookings/:id/extend (MongoDB Atlas)
  const extendBooking = async (bookingId, extraHours) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingId)}/extend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraHours })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Extend booking error:', err);
      return { success: false, message: 'Server error extending booking.' };
    }
  };

  // 10. Get Transactions -> GET /api/transactions?email=... (MongoDB Atlas)
  const getTransactions = async (userEmail = null) => {
    try {
      const url = userEmail 
        ? `${API_BASE}/transactions?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE}/transactions?all=true`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Get transactions error:', err);
      return [];
    }
  };

  return {
    KEYS,
    registerUser,
    updateUserProfile,
    getUsers,
    getFacilities,
    addFacility,
    getSlotsByFacility,
    getBookings,
    cancelBooking,
    extendBooking,
    getTransactions
  };
})();

window.Storage = Storage;
