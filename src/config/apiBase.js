/**
 * Backend API root. On Railway (or any split deploy), the frontend host is NOT the API —
 * using "/api" here sends POST to the static site and often yields 405 Method Not Allowed.
 *
 * Priority: window.__API_BASE__ → VITE_API_BASE → Railway name heuristic → "/api" (dev proxy).
 */
function inferRailwayBackendBase() {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (!host.endsWith('.up.railway.app')) return null;
  // e.g. vr-frontend-production.up.railway.app → vr-backend-production.up.railway.app
  const sub = host.replace(/\.up\.railway\.app$/i, '');
  if (!sub.includes('-frontend')) return null;
  const backendSub = sub.replace('-frontend', '-backend');
  if (backendSub === sub) return null;
  return `https://${backendSub}.up.railway.app/api`;
}

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
  const railway = inferRailwayBackendBase();
  if (railway) return railway;
  return '/api';
}

export const API_BASE_URL = resolveApiBase();
export { resolveApiBase };
