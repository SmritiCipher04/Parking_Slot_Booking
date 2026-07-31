/**
 * Frontend Configuration
 * Dynamically resolves Express API Server URL (http://localhost:5000/api) across local file:// and http:// environments.
 */

const API_BASE_URL = (
  window.location.origin.includes('localhost') || 
  window.location.origin.includes('127.0.0.1')
) 
  ? `${window.location.origin.replace(/:[0-9]+$/, '')}:5000/api`
  : 'http://localhost:5000/api';

window.API_BASE_URL = API_BASE_URL;
