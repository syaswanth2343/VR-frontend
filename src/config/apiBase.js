/**
 * Backend API root. On Railway (or any split deploy), the frontend host is NOT the API —
 * using "/api" here sends POST to the static site and often yields 405 Method Not Allowed.
 *
 * Set at build time: VITE_API_BASE=https://your-backend.up.railway.app/api
 * Or at runtime (before main bundle): window.__API_BASE__ in public/api-config.js
 */
function resolveApiBase() {
  if (typeof window !== 'undefined') {
    const w = window.__API_BASE__;
    if (w != null && String(w).trim() !== '') {
      return String(w).trim().replace(/\/$/, '');
    }
  }
  const env = import.meta.env.VITE_API_BASE;
  if (env != null && String(env).trim() !== '') {
    return String(env).trim().replace(/\/$/, '');
  }
  return '/api';
}

export const API_BASE_URL = resolveApiBase();
export { resolveApiBase };
