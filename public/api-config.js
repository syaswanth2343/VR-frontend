// Loaded before the app (see index.html). Use when VITE_API_BASE was not set at build time.
// Full API prefix: origin + "/api", no trailing slash after "api", e.g.:
// window.__API_BASE__ = 'https://vr-backend-production.up.railway.app/api';
window.__API_BASE__ = window.__API_BASE__ || '';
