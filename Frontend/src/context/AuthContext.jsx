import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const KEYS = {
  USER_TOKEN: 'excuseme_user_token',
  ADMIN_TOKEN: 'excuseme_admin_token',
  CURRENT_USER: 'excuseme_current_user',
  CURRENT_ADMIN: 'excuseme_current_admin',
  REMEMBER_ME: 'excuseme_remember_me'
};

const getStoredData = (key) => {
  try {
    const local = localStorage.getItem(key);
    if (local) return local;
    const session = sessionStorage.getItem(key);
    if (session) return session;
    return null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = getStoredData(KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [admin, setAdmin] = useState(() => {
    try {
      const stored = getStoredData(KEYS.CURRENT_ADMIN);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userToken, setUserToken] = useState(() => getStoredData(KEYS.USER_TOKEN) || '');
  const [adminToken, setAdminToken] = useState(() => getStoredData(KEYS.ADMIN_TOKEN) || '');

  const getApiBase = () => '/api';

  // Sync user profile (including permanent profilePicture) from MongoDB Atlas whenever userToken exists
  useEffect(() => {
    if (userToken) {
      fetch(`${getApiBase()}/users/profile`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(prev => {
              const newUser = { ...prev, ...data.user };
              const isRemembered = localStorage.getItem(KEYS.REMEMBER_ME) !== 'false';
              const storage = isRemembered ? localStorage : sessionStorage;
              storage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
              return newUser;
            });
          }
        })
        .catch(err => console.warn('[AuthContext] Error syncing profile from Atlas:', err));
    }
  }, [userToken]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': userToken ? `Bearer ${userToken}` : ''
  });

  const getAdminAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': adminToken ? `Bearer ${adminToken}` : ''
  });

  const saveUserSession = (userObj, token, rememberMe = true) => {
    setUser(userObj);
    setUserToken(token);

    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    storage.setItem(KEYS.USER_TOKEN, token);
    storage.setItem(KEYS.CURRENT_USER, JSON.stringify(userObj));
    storage.setItem(KEYS.REMEMBER_ME, rememberMe ? 'true' : 'false');

    // Clean up other storage mechanism
    otherStorage.removeItem(KEYS.USER_TOKEN);
    otherStorage.removeItem(KEYS.CURRENT_USER);
    otherStorage.removeItem(KEYS.REMEMBER_ME);
  };

  const login = async (email, password, rememberMe = true) => {
    try {
      const res = await fetch(`${getApiBase()}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.token && data.user) {
        saveUserSession(data.user, data.token, rememberMe);
      }
      return data;
    } catch (err) {
      console.error('Login API error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  const loginWithUser = (userObj, token, rememberMe = true) => {
    saveUserSession(userObj, token, rememberMe);
  };

  const adminLogin = async (username, password) => {
    try {
      const res = await fetch(`${getApiBase()}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token && data.admin) {
        setAdminToken(data.token);
        setAdmin(data.admin);
        localStorage.setItem(KEYS.ADMIN_TOKEN, data.token);
        localStorage.setItem(KEYS.CURRENT_ADMIN, JSON.stringify(data.admin));
      }
      return data;
    } catch (err) {
      console.error('Admin Login API error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  const registerUser = async (userData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await res.json();
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  };

  const updateUserProfile = async (email, updatedFields) => {
    try {
      const res = await fetch(`${getApiBase()}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();

      if (data.success && data.user) {
        const isRemembered = localStorage.getItem(KEYS.REMEMBER_ME) !== 'false';
        saveUserSession({ ...user, ...data.user }, userToken, isRemembered);
      }
      return data;
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const resetPassword = async (resetData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const res = await fetch(`${getApiBase()}/users/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const logout = () => {
    setUser(null);
    setUserToken('');
    localStorage.removeItem(KEYS.USER_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem(KEYS.REMEMBER_ME);
    sessionStorage.removeItem(KEYS.USER_TOKEN);
    sessionStorage.removeItem(KEYS.CURRENT_USER);
    sessionStorage.removeItem(KEYS.REMEMBER_ME);
  };

  const adminLogout = () => {
    setAdmin(null);
    setAdminToken('');
    localStorage.removeItem(KEYS.ADMIN_TOKEN);
    localStorage.removeItem(KEYS.CURRENT_ADMIN);
    sessionStorage.removeItem(KEYS.ADMIN_TOKEN);
    sessionStorage.removeItem(KEYS.CURRENT_ADMIN);
  };

  const updateUserState = (updatedUserData) => {
    setUser(prev => {
      const newUser = { ...prev, ...updatedUserData };
      const isRemembered = localStorage.getItem(KEYS.REMEMBER_ME) !== 'false';
      const storage = isRemembered ? localStorage : sessionStorage;
      storage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      admin,
      userToken,
      adminToken,
      login,
      loginWithUser,
      updateUserState,
      adminLogin,
      registerUser,
      updateUserProfile,
      resetPassword,
      changePassword,
      logout,
      adminLogout,
      getAuthHeaders,
      getAdminAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
