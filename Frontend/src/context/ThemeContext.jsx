/**
 * ThemeContext
 * Manages light / dark theme for the entire app.
 * Persists the user's choice in localStorage so it survives page reloads.
 * Applies/removes the "dark-theme" class on <body> — CSS variables do the rest.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Restore saved preference on mount
    try {
      return localStorage.getItem('excuseme_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Sync <body> class whenever isDark changes
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    try {
      localStorage.setItem('excuseme_theme', isDark ? 'dark' : 'light');
    } catch { /* ignore */ }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
