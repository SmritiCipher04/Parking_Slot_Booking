import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for ExcuseME Parking Slot Booking React SPA
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
