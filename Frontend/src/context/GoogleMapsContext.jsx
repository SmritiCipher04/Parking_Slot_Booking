/**
 * GoogleMapsContext
 * Calls useJsApiLoader EXACTLY ONCE at the top level of the app.
 * Exposes { isLoaded, loadError } to any component that needs the map.
 * Prevents "Loader must not be called again with different options" crash.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// IMPORTANT: This array must be defined OUTSIDE the component (stable reference).
// Defining it inside would cause a new array reference on every render,
// which triggers the "Loader must not be called again with different options" error.
const GOOGLE_MAP_LIBRARIES = ['places'];

const GoogleMapsContext = createContext({
  isLoaded: false,
  loadError: undefined,
});

export const GoogleMapsProvider = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API || '';

  // Suppress Google's blocking error overlay when API key is invalid/missing
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn('[GoogleMapsProvider] gm_authFailure caught — suppressing error overlay.');
      suppressGoogleErrorOverlay();
    };

    // Poll and remove error overlay for 3 seconds after mount
    const interval = setInterval(suppressGoogleErrorOverlay, 400);
    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
    preventGoogleFontsLoading: false,
  });

  if (loadError) {
    console.error('[GoogleMapsProvider] Maps failed to load:', loadError.message);
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

/**
 * useGoogleMaps — consume the shared Maps loader state.
 * Returns { isLoaded: boolean, loadError: Error | undefined }
 */
export const useGoogleMaps = () => useContext(GoogleMapsContext);

// ─── Helpers ────────────────────────────────────────────────────────────────

function suppressGoogleErrorOverlay() {
  if (typeof document === 'undefined') return;
  const selectors = [
    '.gm-err-container',
    '.gm-err-content',
    '.gm-err-title',
    '.gm-err-message',
    'div[style*="z-index: 1000000"]',
    'div[style*="z-index: 1000001"]',
  ];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.innerText && el.innerText.includes("can't load Google Maps correctly")) {
        el.style.display = 'none';
        el.remove();
      }
    });
  });
}

export default GoogleMapsContext;
