/**
 * Frontend Configuration
 * Establishes API base URL dynamically based on environment host.
 */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin.replace(/:[0-9]+$/, '')}:5000/api`
  : '/api';

window.API_BASE_URL = API_BASE_URL;
